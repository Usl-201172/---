import { useState } from 'react'
import { register, login } from '../firebase'

export default function Gate() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('הזן אימייל וסיסמה')
      return
    }

    if (mode === 'register' && password !== confirm) {
      setError('הסיסמאות לא תואמות')
      return
    }

    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }

    setBusy(true)
    try {
      if (mode === 'register') {
        await register(email.trim(), password)
      } else {
        await login(email.trim(), password)
      }
    } catch (err) {
      const code = err?.code
      if (code === 'auth/email-already-in-use') setError('האימייל כבר רשום')
      else if (code === 'auth/invalid-email') setError('אימייל לא תקין')
      else if (code === 'auth/weak-password') setError('הסיסמה חלשה מדי')
      else if (code === 'auth/user-not-found') setError('לא נמצא משתמש עם האימייל הזה')
      else if (code === 'auth/wrong-password') setError('סיסמה שגויה')
      else if (code === 'auth/invalid-credential') setError('פרטי כניסה שגויים')
      else if (code === 'auth/too-many-requests') setError('יותר מדי ניסיונות, נסה שוב מאוחר יותר')
      else setError('שגיאה, נסה שוב')
      setBusy(false)
    }
  }

  return (
    <div className="gate-bg">
      <form onSubmit={submit} className="gate-card">
        <div className="gate-logo">🧺</div>
        <div className="gate-title">החנות שלי</div>
        <div className="gate-sub">פירות וירקות — {mode === 'login' ? 'כניסה למערכת' : 'יצירת חשבון חדש'}</div>

        <div className="field">
          <label className="label">אימייל</label>
          <input
            className="input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>

        <div className="field">
          <label className="label">סיסמה</label>
          <input
            className="input"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="לפחות 6 תווים"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {mode === 'register' && (
          <div className="field">
            <label className="label">אישור סיסמה</label>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="הכנס סיסמה שוב"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        )}

        {error && <div className="banner" style={{ margin: 0, marginBottom: 12 }}>{error}</div>}

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'טוען...' : mode === 'login' ? 'כניסה' : 'הרשמה'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button
            type="button"
            className="section-link"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          >
            {mode === 'login' ? 'אין לך חשבון? הרשם כאן' : 'כבר יש לך חשבון? התחבר'}
          </button>
        </div>
      </form>
    </div>
  )
}
