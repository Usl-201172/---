import { useState } from 'react'
import { joinStoreWithCode } from '../firebase'

export default function JoinStore() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e?.preventDefault?.()
    setError('')
    if (!code.trim()) return setError('הזן את קוד השיתוף שקיבלת')
    setBusy(true)
    try {
      await joinStoreWithCode(code)
      // אחרי ההצטרפות הגדרות החנות מתעדכנות אוטומטית והמסך הזה יוחלף בנתוני החנות
    } catch (err) {
      setError(err?.message || 'שגיאה בהצטרפות, נסה שוב')
    }
    setBusy(false)
  }

  return (
    <div className="gate-bg">
      <form onSubmit={submit} className="gate-card">
        <div className="gate-logo">🤝</div>
        <div className="gate-title">אין חנות לחשבון הזה</div>
        <div className="gate-sub" style={{ marginBottom: 16 }}>
          החשבון הזה עדיין לא מחובר לאף חנות. הזן את קוד השיתוף שקיבלת מהבעלים כדי להצטרף לחנות משותפת.
        </div>

        <div className="field">
          <label className="label">קוד שיתוף</label>
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="לדוגמה: ABC123"
            autoCapitalize="characters"
            autoFocus
            style={{ textAlign: 'center', fontWeight: 900, letterSpacing: 4, direction: 'ltr', fontFamily: 'monospace' }}
          />
        </div>

        {error && <div className="banner" style={{ margin: 0, marginBottom: 12 }}>{error}</div>}

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'מצטרף...' : 'הצטרף לחנות'}
        </button>
      </form>
    </div>
  )
}
