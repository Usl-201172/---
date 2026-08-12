import { useEffect, useState } from 'react'
import { register, login, logOut, joinStoreWithCode } from '../firebase'

export default function Gate() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const err = sessionStorage.getItem('joinError')
    if (err) {
      setError(err)
      sessionStorage.removeItem('joinError')
    }
  }, [])

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

    if (mode === 'join' && !code.trim()) {
      setError('הזן את קוד השיתוף שקיבלת')
      return
    }

    setBusy(true)
    try {
      if (mode === 'register') {
        await register(email.trim(), password)
      } else if (mode === 'join') {
        try {
          await register(email.trim(), password)
        } catch (err) {
          // אם כבר יש חשבון — מתחברים אליו ומצטרפים עם הקוד
          if (err?.code === 'auth/email-already-in-use') {
            await login(email.trim(), password)
          } else {
            throw err
          }
        }
        try {
          await joinStoreWithCode(code)
        } catch (err) {
          sessionStorage.setItem('joinError', err?.message || 'הקוד שגוי או שהחנות לא קיימת')
          await logOut()
          setBusy(false)
          return
        }
      } else {
        await login(email.trim(), password)
      }
    } catch (err) {
      const c = err?.code
      if (c === 'auth/email-already-in-use') setError('האימייל כבר רשום')
      else if (c === 'auth/invalid-email') setError('אימייל לא תקין')
      else if (c === 'auth/weak-password') setError('הסיסמה חלשה מדי')
      else if (c === 'auth/user-not-found') setError('לא נמצא משתמש עם האימייל הזה')
      else if (c === 'auth/wrong-password') setError('סיסמה שגויה')
      else if (c === 'auth/invalid-credential') setError('פרטי כניסה שגויים')
      else if (c === 'auth/too-many-requests') setError('יותר מדי ניסיונות, נסה שוב מאוחר יותר')
      else setError('שגיאה, נסה שוב')
      setBusy(false)
    }
  }

  return (
    <div className="gate-bg">
      <form onSubmit={submit} className="gate-card">
        <div className="gate-logo">🧺</div>
        <div className="gate-title">החנות שלי</div>
        <div className="gate-sub">פירות וירקות — {mode === 'login' ? 'כניסה למערכת' : mode === 'register' ? 'יצירת חשבון חדש' : 'הצטרפות לחנות משותפת'}</div>

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
          <div style={{ position: 'relative' }}>
            <input
              className="input"
              type={showPass ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="לפחות 6 תווים"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingInlineEnd: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute',
                top: '50%',
                insetInlineEnd: 10,
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                color: 'var(--muted)',
                padding: 4,
              }}
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {mode === 'register' && (
          <div className="field">
            <label className="label">אישור סיסמה</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="הכנס סיסמה שוב"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={{ paddingInlineEnd: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  insetInlineEnd: 10,
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: 'var(--muted)',
                  padding: 4,
                }}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="field">
            <label className="label">קוד שיתוף</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="לדוגמה: ABC123"
              autoCapitalize="characters"
              style={{ textAlign: 'center', fontWeight: 900, letterSpacing: 4, direction: 'ltr', fontFamily: 'monospace' }}
            />
          </div>
        )}

        {error && <div className="banner" style={{ margin: 0, marginBottom: 12 }}>{error}</div>}

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'טוען...' : mode === 'login' ? 'כניסה' : mode === 'register' ? 'הרשמה' : 'הצטרף לחנות'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mode !== 'login' && (
            <button type="button" className="section-link" onClick={() => { setMode('login'); setError('') }}>
              כבר יש לך חשבון? התחבר
            </button>
          )}
          {mode !== 'register' && (
            <button type="button" className="section-link" onClick={() => { setMode('register'); setError('') }}>
              הרשם לחנות חדשה
            </button>
          )}
          {mode !== 'join' && (
            <button type="button" className="section-link" onClick={() => { setMode('join'); setError('') }}>
              יש לי קוד — הצטרף לחנות משותפת
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
