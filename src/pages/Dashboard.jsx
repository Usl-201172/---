import { useState } from 'react'
import { fmtMoney, fmtRelative, formatOrdersSummary, shareText, payLabel } from '../utils'
import { IconBack, IconShare } from '../components/icons'

function fmtTime(ts) {
  if (!ts) return ''
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'בוקר טוב'
  if (h < 18) return 'צהריים טובים'
  return 'ערב טוב'
}

const todayStr = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

function OrderRow({ order, onOpen }) {
  const paid = order.paid ?? false
  const pay = order.paymentMethod
  const itemCount = (order.items || []).length
  return (
    <div className="list-row rise" onClick={() => onOpen(order.id)}>
      <div className={`list-avatar ${pay === 'bit' ? 'blue' : pay === 'paybox' ? 'violet' : 'amber'}`}>
        {pay === 'bit' ? '📱' : pay === 'paybox' ? '💳' : pay === 'unpaid' ? '⏳' : '💵'}
      </div>
      <div className="list-main">
        <div className="list-title">{order.customerName || 'בלי שם'}</div>
        <div className="list-sub">{fmtTime(order.createdAt)}</div>
        <div className="list-badges">
          {paid ? (
            <span className="badge badge-green">התשלום נלקח</span>
          ) : order.paymentMethod === 'unpaid' ? (
            <span className="badge badge-gray">לא שולם</span>
          ) : (
            <span className="badge badge-red">חוב</span>
          )}
          <span className="badge">{itemCount} יח</span>
        </div>
      </div>
      <div className="list-end">
        <div className="list-price">{fmtMoney(order.total)}</div>
      </div>
    </div>
  )
}

function PaidOrdersView({ orders, onBack, onOpen }) {
  const paid = orders
    .filter((o) => o.paid ?? false)
    .sort((a, b) => {
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
      const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
      return db - da
    })

  return (
    <>
      <div style={{ padding: '0 14px', marginBottom: 12 }} className="row">
        <button className="btn btn-ghost" onClick={onBack}>
          <IconBack /> חזרה
        </button>
        <div style={{ fontWeight: 800, fontSize: 17, marginRight: 8 }}>כל ההזמנות שאושרו ({paid.length})</div>
      </div>
      {paid.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="empty-icon">📋</span>
            <div className="empty-title">אין הזמנות שאושרו</div>
          </div>
        </div>
      ) : (
        <div className="list">
          {paid.map((o) => (
            <div key={o.id} className="list-row rise" onClick={() => onOpen(o.id)}>
              <div className={`list-avatar ${o.paymentMethod === 'bit' ? 'blue' : o.paymentMethod === 'paybox' ? 'violet' : 'amber'}`}>
                {o.paymentMethod === 'bit' ? '📱' : o.paymentMethod === 'paybox' ? '💳' : '💵'}
              </div>
              <div className="list-main">
                <div className="list-title">{o.customerName || 'בלי שם'}</div>
                <div className="list-sub">אושרה {fmtRelative(o.createdAt)}</div>
              </div>
              <div className="list-end">
                <div className="list-price">{fmtMoney(o.total)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function UnpaidOrdersView({ orders, onBack, onOpen }) {
  const unpaid = orders
    .filter((o) => !(o.paid ?? false) && o.paymentMethod !== 'unpaid')
    .sort((a, b) => {
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
      const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
      return db - da
    })

  const shareAll = () => {
    if (unpaid.length === 0) return
    shareText(formatOrdersSummary(unpaid), 'סיכום הזמנות ממתינות')
  }

  return (
    <>
      <div style={{ padding: '0 14px', marginBottom: 12 }} className="row">
        <button className="btn btn-ghost" onClick={onBack}>
          <IconBack /> חזרה
        </button>
        <div style={{ fontWeight: 800, fontSize: 17, marginRight: 8, flex: 1 }}>הזמנות ממתינות ({unpaid.length})</div>
        {unpaid.length > 0 && (
          <button className="btn btn-primary" onClick={shareAll}>
            <IconShare /> שתף הכל
          </button>
        )}
      </div>
      {unpaid.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="empty-icon">✅</span>
            <div className="empty-title">אין הזמנות ממתינות</div>
            <div className="empty-sub">כל ההזמנות אושרו</div>
          </div>
        </div>
      ) : (
        <div className="list">
          {unpaid.map((o) => (
            <div key={o.id} className="list-row rise" onClick={() => onOpen(o.id)}>
              <div className={`list-avatar ${o.paymentMethod === 'bit' ? 'blue' : 'violet'}`}>
                {o.paymentMethod === 'bit' ? '📱' : '💳'}
              </div>
              <div className="list-main">
                <div className="list-title">{o.customerName || 'בלי שם'}</div>
                <div className="list-sub">{fmtRelative(o.createdAt)} · {payLabel(o.paymentMethod)}</div>
              </div>
              <div className="list-end">
                <div className="list-price">{fmtMoney(o.total)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function Dashboard({ orders, products, onOpen, onLock }) {
  const [showPaid, setShowPaid] = useState(false)
  const [showUnpaid, setShowUnpaid] = useState(false)

  if (showPaid) {
    return <PaidOrdersView orders={orders} onBack={() => setShowPaid(false)} onOpen={onOpen} />
  }
  if (showUnpaid) {
    return <UnpaidOrdersView orders={orders} onBack={() => setShowUnpaid(false)} onOpen={onOpen} />
  }

  const allPaid = orders.filter((o) => o.paid ?? false)
  const totalRevenue = allPaid.reduce((s, o) => s + (Number(o.total) || 0), 0)
  const allUnpaid = orders.filter((o) => !(o.paid ?? false))

  const lowStock = products
    .filter((p) => p.active && p.trackStock && Number(p.stock) <= 2)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 4)

  const recent = orders.slice(0, 6)

  return (
    <>
      <section className="hero">
        <div className="hero-top">
          <div>
            <div className="hero-greet">{greeting()}! 🌿</div>
            <div className="hero-date">{todayStr}</div>
          </div>
          <button className="hero-lock" onClick={onLock} title="התנתקות">🚪</button>
        </div>
      </section>

      <div className="stats-grid rise rise-1">
        <div className="stat-card primary">
          <div className="stat-card-label">הכנסות</div>
          <div className="stat-card-value">{fmtMoney(totalRevenue)}</div>
          <div className="stat-card-sub">כולל הזמנות ששולמו</div>
        </div>
        <div className="stat-card" onClick={() => setShowPaid(true)} style={{ cursor: 'pointer' }}>
          <div className="stat-card-label">שולמו</div>
          <div className="stat-card-value">{allPaid.length}</div>
          <div className="stat-card-sub">הזמנות</div>
        </div>
        <div className="stat-card" onClick={() => setShowUnpaid(true)} style={{ cursor: 'pointer' }}>
          <div className="stat-card-label">ממתינות</div>
          <div className="stat-card-value">{allUnpaid.length}</div>
          <div className="stat-card-sub">ללא תשלום</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">מלאי נמוך</div>
          <div className="stat-card-value">{lowStock.length}</div>
          <div className="stat-card-sub">מוצרים</div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card rise rise-2">
          <div className="card-header">
            <div className="card-title">⚠️ מלאי נמוך</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {lowStock.map((p) => (
              <span key={p.id} className="badge badge-amber">
                {p.name} · {p.stock} ק"ג
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="section-title with-bar rise rise-2">
        <span className="bar" />
        <span>הזמנות אחרונות</span>
        <button className="section-link" onClick={() => onOpen('__all__')}>
          לכל ההזמנות
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="card rise rise-3">
          <div className="empty">
            <span className="empty-icon">🧺</span>
            <div className="empty-title">עדיין אין הזמנות</div>
            <div className="empty-sub">תתחיל בלהזין את ההזמנה הראשונה</div>
          </div>
        </div>
      ) : (
        <div className="list rise rise-3">
          {recent.map((o) => (
            <OrderRow key={o.id} order={o} onOpen={onOpen} />
          ))}
        </div>
      )}
    </>
  )
}
