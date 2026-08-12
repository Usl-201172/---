import { useState } from 'react'
import { saveSettings, changePassword, generateShareCode, joinStoreWithCode, logOut } from '../firebase'
import { shareText } from '../utils'
import { IconBack } from '../components/icons'

function PassField({ label, value, onChange, visible, onToggle, placeholder, autoComplete }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ paddingInlineEnd: 44 }}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? 'הסתר סיסמה' : 'הראה סיסמה'}
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
          {visible ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  )
}

export default function Account({ settings, uid, onSettings, onBack }) {
  const [shopName, setShopName] = useState(settings?.shopName || '')
  const [ownerName, setOwnerName] = useState(settings?.ownerName || '')
  const [shareCode, setShareCode] = useState(settings?.shareCode || '')
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoMsg, setInfoMsg] = useState('')
  const [infoErr, setInfoErr] = useState('')

  const [curPass, setCurPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [savingPass, setSavingPass] = useState(false)
  const [passMsg, setPassMsg] = useState('')
  const [passErr, setPassErr] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [leaving, setLeaving] = useState(false)

  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinMsg, setJoinMsg] = useState('')
  const [joinErr, setJoinErr] = useState('')

  const isOwner = settings?.ownerUid === uid
  const memberCount = settings?.members?.length || 1

  const saveInfo = async () => {
    setInfoErr('')
    setInfoMsg('')
    if (!shopName.trim()) return setInfoErr('צריך להזין שם חנות')
    const code = shareCode.trim().toUpperCase()
    if (!code) return setInfoErr('צריך להזין קוד שיתוף')
    setSavingInfo(true)
    try {
      await saveSettings({ shopName: shopName.trim(), ownerName: ownerName.trim(), shareCode: code })
      onSettings({ ...settings, shopName: shopName.trim(), ownerName: ownerName.trim(), shareCode: code })
      setInfoMsg('נשמר ✓')
    } catch {
      setInfoErr('שגיאה בשמירה, נסה שוב')
    }
    setSavingInfo(false)
  }

  const savePass = async () => {
    setPassErr('')
    setPassMsg('')
    if (!curPass) return setPassErr('הזן סיסמה נוכחית')
    if (newPass.length < 6) return setPassErr('הסיסמה החדשה חייבת להיות לפחות 6 תווים')
    if (newPass !== confirmPass) return setPassErr('הסיסמאות לא תואמות')
    setSavingPass(true)
    try {
      await changePassword(curPass, newPass)
      setPassMsg('הסיסמה שונתה ✓')
      setCurPass('')
      setNewPass('')
      setConfirmPass('')
    } catch (e) {
      const code = e?.code
      setPassErr(
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'הסיסמה הנוכחית שגויה'
          : 'שגיאה בשינוי הסיסמה, נסה שוב',
      )
    }
    setSavingPass(false)
  }

  const shareStore = () => {
    shareText(
      `הצטרף לחנות "${shopName}" עם הקוד: ${shareCode} — ${window.location.origin}`,
    )
  }

  const rollCode = async () => {
    setInfoErr('')
    setInfoMsg('')
    const newCode = generateShareCode()
    setShareCode(newCode)
    try {
      await saveSettings({ shareCode: newCode })
      onSettings({ ...settings, shareCode: newCode })
      setInfoMsg('קוד שיתוף חדש נשמר ✓')
    } catch {
      setInfoErr('שגיאה בשמירת הקוד, נסה שוב')
    }
  }

  const joinStore = async () => {
    setJoinErr('')
    setJoinMsg('')
    if (!joinCode.trim()) return setJoinErr('הזן את קוד השיתוף שקיבלת')
    setJoining(true)
    try {
      await joinStoreWithCode(joinCode)
      setJoinMsg('הצטרפת לחנות ✓')
      setJoinCode('')
    } catch (e) {
      setJoinErr(e?.message || 'שגיאה בהצטרפות, נסה שוב')
    }
    setJoining(false)
  }

  const copyShare = async () => {
    const text = `הצטרף לחנות "${shopName}" עם הקוד: ${shareCode} — ${window.location.origin}`
    try {
      await navigator.clipboard.writeText(text)
      setInfoMsg('קישור + קוד הועתקו ✓')
    } catch {
      setInfoErr('לא ניתן להעתיק בדפדפן הזה')
    }
  }

  const logout = async () => {
    if (!window.confirm('בטוח שברצונך להתנתק?')) return
    setLeaving(true)
    await logOut()
  }

  return (
    <>
      <div style={{ padding: '0 14px', marginBottom: 12 }} className="row">
        <button className="btn btn-ghost" onClick={onBack}>
          <IconBack /> חזרה
        </button>
        <div style={{ fontWeight: 800, fontSize: 17, marginRight: 8, flex: 1 }}>החשבון שלי</div>
      </div>

      <div className="card rise rise-1">
        <div className="card-title" style={{ marginBottom: 12 }}>🏪 פרטי החנות</div>
        <div className="field">
          <label className="label">שם החנות</label>
          <input className="input" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="למשל: החנות שלי" />
        </div>
        <div className="field">
          <label className="label">שם פרטי</label>
          <input className="input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="השם שלך" />
        </div>
        {infoErr && <div className="banner" style={{ marginBottom: 10 }}>{infoErr}</div>}
        {infoMsg && <div className="banner" style={{ marginBottom: 10, background: 'var(--success-softer, #dcfce7)', color: 'var(--success, #16a34a)' }}>{infoMsg}</div>}
        <button className="btn btn-primary btn-block" onClick={saveInfo} disabled={savingInfo}>
          {savingInfo ? 'שומר...' : 'שמור'}
        </button>
      </div>

      <div className="card rise rise-2">
        <div className="card-title" style={{ marginBottom: 4 }}>🔑 קוד שיתוף אישי</div>
        <div className="muted small" style={{ marginBottom: 12 }}>
          שלח את הקוד הזה למי שאתה רוצה שינהל איתך את החנות. הוא ייכנס דרך "הצטרפות לחנות משותפת".
        </div>
        <div className="row" style={{ gap: 6, marginBottom: 10 }}>
          <input
            className="input"
            value={shareCode}
            onChange={(e) => setShareCode(e.target.value.toUpperCase())}
            placeholder="הקוד שלך"
            style={{ flex: 1, textAlign: 'center', fontWeight: 900, letterSpacing: 4, direction: 'ltr', fontFamily: 'monospace' }}
            maxLength={10}
          />
          <button className="btn btn-outline" onClick={rollCode} title="צור קוד אקראי (נשמר אוטומטית)">
            🎲
          </button>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn-ghost grow" onClick={saveInfo}>
            שמור קוד
          </button>
          <button className="btn btn-outline grow" onClick={copyShare}>
            📋 העתק
          </button>
          <button className="btn btn-primary grow" onClick={shareStore}>
            שתף בוואטסאפ
          </button>
        </div>
        <div className="muted small" style={{ marginTop: 10 }}>
          {isOwner ? `אתה הבעלים · ` : ''}מחוברים לחנות: {memberCount}
        </div>
      </div>

      <div className="card rise rise-3">
        <div className="card-title" style={{ marginBottom: 12 }}>🔒 שינוי סיסמה</div>
        <PassField
          label="סיסמה נוכחית"
          value={curPass}
          onChange={setCurPass}
          visible={showCur}
          onToggle={() => setShowCur(!showCur)}
          autoComplete="current-password"
        />
        <PassField
          label="סיסמה חדשה"
          value={newPass}
          onChange={setNewPass}
          visible={showNew}
          onToggle={() => setShowNew(!showNew)}
          autoComplete="new-password"
          placeholder="לפחות 6 תווים"
        />
        <PassField
          label="אישור סיסמה חדשה"
          value={confirmPass}
          onChange={setConfirmPass}
          visible={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
          autoComplete="new-password"
        />
        {passErr && <div className="banner" style={{ marginBottom: 10 }}>{passErr}</div>}
        {passMsg && <div className="banner" style={{ marginBottom: 10, background: 'var(--success-softer, #dcfce7)', color: 'var(--success, #16a34a)' }}>{passMsg}</div>}
        <button className="btn btn-outline btn-block" onClick={savePass} disabled={savingPass}>
          {savingPass ? 'משנה...' : 'שנה סיסמה'}
        </button>
      </div>

      <div className="card rise rise-4">
        <div className="card-title" style={{ marginBottom: 4 }}>🤝 הצטרפות לחנות משותפת</div>
        <div className="muted small" style={{ marginBottom: 12 }}>
          יש לך קוד שיתוף של חנות אחרת? הזן אותו כאן כדי להצטרף אליה ולנהל אותה יחד עם הבעלים.
        </div>
        <div className="row" style={{ gap: 6 }}>
          <input
            className="input"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="קוד שיתוף"
            style={{ flex: 1, textAlign: 'center', fontWeight: 900, letterSpacing: 3, direction: 'ltr', fontFamily: 'monospace' }}
            maxLength={10}
          />
          <button className="btn btn-primary" onClick={joinStore} disabled={joining}>
            {joining ? 'מצטרף...' : 'הצטרף'}
          </button>
        </div>
        {joinErr && <div className="banner" style={{ marginTop: 10 }}>{joinErr}</div>}
        {joinMsg && <div className="banner" style={{ marginTop: 10, background: 'var(--success-softer, #dcfce7)', color: 'var(--success, #16a34a)' }}>{joinMsg}</div>}
      </div>

      {isOwner ? (
        <div className="card rise rise-5">
          <div className="muted small" style={{ textAlign: 'center', padding: '10px 0' }}>
            אתה מנהל את החנות — אין אפשרות להתנתק מהחשבון הזה
          </div>
        </div>
      ) : (
        <div className="card rise rise-5">
          <button className="btn btn-danger btn-block" onClick={logout} disabled={leaving}>
            🚪 {leaving ? 'מתנתק...' : 'התנתקות'}
          </button>
        </div>
      )}
    </>
  )
}
