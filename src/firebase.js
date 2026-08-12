import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

export const app = isConfigured ? initializeApp(firebaseConfig) : null
export const db = app ? getFirestore(app) : null
export const auth = app ? getAuth(app) : null

export function register(email, password) {
  if (!auth) return Promise.reject(new Error('Firebase not configured'))
  return createUserWithEmailAndPassword(auth, email, password)
}

export function login(email, password) {
  if (!auth) return Promise.reject(new Error('Firebase not configured'))
  return signInWithEmailAndPassword(auth, email, password)
}

export function logOut() {
  if (!auth) return Promise.resolve()
  return signOut(auth)
}

export function onAuth(cb) {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, (user) => cb(user))
}

const productsCol = () => collection(db, 'products')
const ordersCol = () => collection(db, 'orders')
const purchasesCol = () => collection(db, 'purchases')
const bundlesCol = () => collection(db, 'bundles')
const discountRulesCol = () => collection(db, 'discountRules')

export function watchProducts(cb) {
  const q = query(productsCol(), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  )
}

export function watchOrders(cb) {
  const q = query(ordersCol(), orderBy('createdAt', 'desc'), limit(500))
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  )
}

export async function addProduct(data) {
  return addDoc(productsCol(), { ...data, active: true, createdAt: serverTimestamp() })
}

export async function updateProduct(id, data) {
  return updateDoc(doc(productsCol(), id), data)
}

// מסנכרן שינויי מוצר (מחיר, שם, משקל, מעקב מלאי...) לתוך כל ההזמנות הלא מאושרות שמכילות אותו
export async function syncProductInOrders(productId, data) {
  const snap = await getDocs(ordersCol())
  const tasks = []
  for (const d of snap.docs) {
    const order = { id: d.id, ...d.data() }
    if (order.paid ?? false) continue // רק הזמנות שהתשלום עבורן לא התקבל
    const items = order.items || []
    let changed = false
    const newItems = items.map((it) => {
      if (it.isBundle || it.isCustom || it.productId !== productId) return it
      changed = true
      const tiers = data.tiers || []
      // בוחרים את המחיר לפי הכמות שהוזמנה (או לפי הטיר הקודם, או הראשון)
      const selectedTier =
        tiers.find((t) => t.qty === it.qty) ||
        tiers.find((t) => t.qty === it.selectedTier?.qty) ||
        tiers[0] ||
        null
      return {
        ...it,
        name: data.name ?? it.name,
        // פריט במבצע נשאר במחיר המבצע
        unitPrice: it.discounted ? it.unitPrice : selectedTier?.price ?? it.unitPrice,
        selectedTier,
        tiers,
        tracksStock: data.trackStock !== false,
        unitWeight: data.unitWeight ?? null,
      }
    })
    if (!changed) continue
    const total =
      Math.round(
        newItems.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0) * 100,
      ) / 100
    tasks.push(updateDoc(doc(ordersCol(), order.id), { items: newItems, total }))
  }
  await Promise.all(tasks)
}

export async function deleteProduct(id) {
  return deleteDoc(doc(productsCol(), id))
}

function itemStockDelta(items) {
  const map = {}
  for (const it of items || []) {
    if (it.productId && typeof it.qty === 'number' && it.tracksStock) {
      map[it.productId] = (map[it.productId] || 0) + it.qty
    }
  }
  return map
}

function bundleItemsStockDelta(items) {
  const map = {}
  for (const it of items || []) {
    if (it.isBundle && it.bundleId && typeof it.qty === 'number') {
      const bundle = bundlesCache[it.bundleId]
      if (!bundle) continue
      for (const bi of bundle.items || []) {
        if (bi.productId) {
          map[bi.productId] = (map[bi.productId] || 0) + it.qty * bi.qty
        }
      }
    }
  }
  return map
}

const bundlesCache = {}

export function updateBundlesCache(bundles) {
  for (const b of bundles) {
    bundlesCache[b.id] = b
  }
}

function sanitize(v) {
  if (v === undefined) return null
  if (typeof v === 'number' && Number.isNaN(v)) return 0
  if (Array.isArray(v)) return v.map(sanitize)
  if (v && typeof v === 'object') {
    const out = {}
    for (const [k, val] of Object.entries(v)) {
      if (val !== undefined) out[k] = sanitize(val)
    }
    return out
  }
  return v
}

export async function saveOrder(order, existing = null) {
  const oldProductMap = itemStockDelta(existing?.items)
  const newProductMap = itemStockDelta(order.items)
  const oldBundleMap = bundleItemsStockDelta(existing?.items)
  const newBundleMap = bundleItemsStockDelta(order.items)

  const productIds = new Set([...Object.keys(oldProductMap), ...Object.keys(newProductMap), ...Object.keys(oldBundleMap), ...Object.keys(newBundleMap)])
  const payload = sanitize({
    customerName: order.customerName,
    items: order.items,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paid: order.paid,
    notes: order.notes || '',
  })

  const newId = await runTransaction(db, async (tx) => {
    const targets = []
    for (const id of productIds) {
      const delta = (newProductMap[id] || 0) - (oldProductMap[id] || 0) + (newBundleMap[id] || 0) - (oldBundleMap[id] || 0)
      if (delta === 0) continue
      targets.push({ id, delta })
    }

    const stocks = {}
    for (const { id } of targets) {
      const snap = await tx.get(doc(productsCol(), id))
      stocks[id] = snap.exists() ? snap.data().stock : null
    }

    for (const { id, delta } of targets) {
      if (stocks[id] === null) continue
      const newStock = (typeof stocks[id] === 'number' ? stocks[id] : 0) - delta
      tx.update(doc(productsCol(), id), { stock: Math.max(0, newStock) })
    }

    if (existing) {
      tx.update(doc(ordersCol(), existing.id), payload)
      return existing.id
    } else {
      const ref = doc(ordersCol())
      tx.set(ref, { ...payload, createdAt: serverTimestamp() })
      return ref.id
    }
  })
  return newId
}

export function patchOrder(id, data) {
  return updateDoc(doc(ordersCol(), id), data)
}

export function watchPurchases(cb) {
  const q = query(purchasesCol(), orderBy('createdAt', 'desc'), limit(200))
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  )
}

export function watchBundles(cb) {
  const q = query(bundlesCol(), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  )
}

export async function addBundle(data) {
  return addDoc(bundlesCol(), { ...data, active: true, createdAt: serverTimestamp() })
}

export async function updateBundle(id, data) {
  return updateDoc(doc(bundlesCol(), id), data)
}

export async function deleteBundle(id) {
  return deleteDoc(doc(bundlesCol(), id))
}

export async function addPurchase(data) {
  return addDoc(purchasesCol(), { ...data, createdAt: serverTimestamp() })
}

export async function deletePurchase(id) {
  return deleteDoc(doc(purchasesCol(), id))
}

export async function deleteOrder(order) {
  const productMap = itemStockDelta(order.items)
  const bundleMap = bundleItemsStockDelta(order.items)
  const allIds = new Set([...Object.keys(productMap), ...Object.keys(bundleMap)])
  await runTransaction(db, async (tx) => {
    const targets = []
    for (const id of allIds) {
      const qty = (productMap[id] || 0) + (bundleMap[id] || 0)
      if (qty === 0) continue
      targets.push({ id, qty })
    }

    const stocks = {}
    for (const { id } of targets) {
      const snap = await tx.get(doc(productsCol(), id))
      stocks[id] = snap.exists() ? snap.data().stock : null
    }

    for (const { id, qty } of targets) {
      if (stocks[id] === null) continue
      const newStock = (typeof stocks[id] === 'number' ? stocks[id] : 0) + qty
      tx.update(doc(productsCol(), id), { stock: newStock })
    }

    tx.delete(doc(ordersCol(), order.id))
  })
}

export function watchDiscountRules(cb) {
  const q = query(discountRulesCol(), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  )
}

// ---------- הגדרות חנות / חשבון ----------

export const settingsDocRef = () => doc(db, 'settings', 'shop')

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateShareCode(len = 6) {
  let out = ''
  const arr = new Uint32Array(len)
  crypto.getRandomValues(arr)
  for (let i = 0; i < len; i++) out += CODE_CHARS[arr[i] % CODE_CHARS.length]
  return out
}

export function watchSettings(cb) {
  return onSnapshot(settingsDocRef(), (d) => cb(d.exists() ? { id: d.id, ...d.data() } : null))
}

// יוצר מסמך הגדרות בפעם הראשונה שהבעלים נכנס
export async function createDefaultSettings(uid) {
  const snap = await getDoc(settingsDocRef())
  if (snap.exists()) return snap.data()
  const data = {
    shopName: 'החנות שלי',
    ownerName: '',
    shareCode: generateShareCode(),
    ownerUid: uid,
    members: [uid],
    createdAt: serverTimestamp(),
  }
  await setDoc(settingsDocRef(), data)
  return data
}

export function saveSettings(data) {
  return setDoc(settingsDocRef(), sanitize(data), { merge: true })
}

export async function changePassword(current, next) {
  const user = auth.currentUser
  if (!user) throw new Error('לא מחובר')
  const cred = EmailAuthProvider.credential(user.email, current)
  await reauthenticateWithCredential(user, cred)
  await updatePassword(user, next)
}

// מצרף את המשתמש המחובר לחנות לפי הקוד האישי
export async function joinStoreWithCode(code) {
  const user = auth.currentUser
  if (!user) throw new Error('לא מחובר')
  const snap = await getDoc(settingsDocRef())
  if (!snap.exists()) throw new Error('לא נמצאה חנות משותפת')
  const data = snap.data()
  const expected = String(data.shareCode || '').trim().toUpperCase()
  const entered = String(code || '').trim().toUpperCase()
  if (!expected || entered !== expected) throw new Error('הקוד שגוי')
  const members = Array.isArray(data.members) ? data.members : [data.ownerUid].filter(Boolean)
  if (data.ownerUid === user.uid || members.includes(user.uid)) {
    throw new Error('אתה כבר נוכח בחנות זו')
  }
  members.push(user.uid)
  await setDoc(settingsDocRef(), { members }, { merge: true })
  return data
}

export function isStoreMember(store, uid) {
  if (!store || !uid) return false
  return store.ownerUid === uid || (Array.isArray(store.members) && store.members.includes(uid))
}

export async function addDiscountRule(data) {
  return addDoc(discountRulesCol(), { ...data, active: true, createdAt: serverTimestamp() })
}

export async function updateDiscountRule(id, data) {
  return updateDoc(doc(discountRulesCol(), id), data)
}

export async function deleteDiscountRule(id) {
  return deleteDoc(doc(discountRulesCol(), id))
}
