import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('=').map((s) => s.trim())),
)

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})

const step = (name) => console.log(`\n[1/2] ${name}`)

step('התחברות אנונימית (Anonymous Auth)')
try {
  const user = await signInAnonymously(getAuth(app))
  console.log('OK - התחברות עובדת:', user.user.uid)
} catch (e) {
  console.log('FAIL -', e.code || e.message)
  console.log('פתרון: Firebase Console -> Authentication -> Sign-in method -> Anonymous -> Enable')
}

step('גישה ל-Firestore (מסד הנתונים)')
try {
  const db = getFirestore(app)
  const q = collection(db, '__check__')
  await getDocs(q)
  console.log('OK - Firestore עובד (בסיס נתונים קיים)')
} catch (e) {
  console.log('FAIL -', e.code || e.message)
  console.log('פתרון: Firebase Console -> Firestore Database -> Create database (Production, Europe-west1)')
}
