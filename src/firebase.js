import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'

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

export async function saveOrder(order, existing = null) {
  const oldProductMap = itemStockDelta(existing?.items)
  const newProductMap = itemStockDelta(order.items)
  const oldBundleMap = bundleItemsStockDelta(existing?.items)
  const newBundleMap = bundleItemsStockDelta(order.items)

  const productIds = new Set([...Object.keys(oldProductMap), ...Object.keys(newProductMap), ...Object.keys(oldBundleMap), ...Object.keys(newBundleMap)])
  const payload = {
    customerName: order.customerName,
    items: order.items,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paid: order.paid,
    arrived: order.arrived,
    notes: order.notes || '',
  }

  const newId = await runTransaction(db, async (tx) => {
    for (const id of productIds) {
      const delta = (newProductMap[id] || 0) - (oldProductMap[id] || 0) + (newBundleMap[id] || 0) - (oldBundleMap[id] || 0)
      if (delta === 0) continue
      const snap = await tx.get(doc(productsCol(), id))
      if (!snap.exists()) continue
      const product = snap.data()
      const newStock = (typeof product.stock === 'number' ? product.stock : 0) - delta
      tx.update(snap.ref, { stock: Math.max(0, newStock) })
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
    for (const id of allIds) {
      const qty = (productMap[id] || 0) + (bundleMap[id] || 0)
      if (qty === 0) continue
      const snap = await tx.get(doc(productsCol(), id))
      if (!snap.exists()) continue
      const product = snap.data()
      const newStock = (typeof product.stock === 'number' ? product.stock : 0) + qty
      tx.update(snap.ref, { stock: newStock })
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

export async function addDiscountRule(data) {
  return addDoc(discountRulesCol(), { ...data, active: true, createdAt: serverTimestamp() })
}

export async function updateDiscountRule(id, data) {
  return updateDoc(doc(discountRulesCol(), id), data)
}

export async function deleteDiscountRule(id) {
  return deleteDoc(doc(discountRulesCol(), id))
}
