import { useState } from 'react'
import { GATE } from '../gate'

export default function Gate({ onUnlock }) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setTimeout(() => {
      const ok =
        email.trim().toLowerCase() === GATE.email.toLowerCase() &&
        phone.trim() === GATE.phone &&
        code.trim() === GATE.code
      if (ok) {
        localStorage.setItem('gate_ok', '1')
        onUnlock()
      } else {
        setError('אחד מהפרטים לא נכון, נסה שוב')
        setBusy(false)
      }
    }, 250)
  }

  return (
    <div className="gate-bg">
      <form onSubmit={submit} className="gate-card">
        <div className="gate-logo">🧺</div>
        <div className="gate-title">החנות שלי</div>
        <div className="gate-sub">פירות וירקות — כניסה לניהול</div>

        <div className="field">
          <label className="label">שלב 1 — אימייל</label>
          <input
            className="input"
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="האימייל שלך"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>

        <div className="field">
          <label className="label">שלב 2 — מספר טלפון</label>
          <input
            className="input"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="המספר שלך"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label">שלב 3 — קוד אישי</label>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="הקוד האישי"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        {error && <div className="banner" style={{ margin: 0, marginBottom: 12 }}>{error}</div>}

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'בודק...' : 'כניסה'}
        </button>
      </form>
    </div>
  )
}
