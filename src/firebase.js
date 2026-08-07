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
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

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

export function signIn() {
  if (!auth) return Promise.resolve()
  return signInAnonymously(auth).catch(() => {})
}

export function onAuth(cb) {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, (user) => cb(Boolean(user)))
}

const productsCol = () => collection(db, 'products')
const ordersCol = () => collection(db, 'orders')

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

export async function saveOrder(order, existing = null) {
  const oldMap = itemStockDelta(existing?.items)
  const newMap = itemStockDelta(order.items)

  const productIds = new Set([...Object.keys(oldMap), ...Object.keys(newMap)])
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
      const delta = (newMap[id] || 0) - (oldMap[id] || 0)
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

export async function deleteOrder(order) {
  const map = itemStockDelta(order.items)
  await runTransaction(db, async (tx) => {
    for (const [id, qty] of Object.entries(map)) {
      const snap = await tx.get(doc(productsCol(), id))
      if (!snap.exists()) continue
      const product = snap.data()
      const newStock = (typeof product.stock === 'number' ? product.stock : 0) + qty
      tx.update(snap.ref, { stock: newStock })
    }
    tx.delete(doc(ordersCol(), order.id))
  })
}
