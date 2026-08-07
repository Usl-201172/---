import { fmtMoney, fmtQty, isToday } from '../utils'

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
  return (
    <div className="list-row rise" onClick={() => onOpen(order.id)}>
      <div className={`list-avatar ${order.paymentMethod === 'bit' ? 'blue' : order.paymentMethod === 'paybox' ? 'violet' : 'amber'}`}>
        {order.paymentMethod === 'bit' ? '📱' : order.paymentMethod === 'paybox' ? '💳' : '💵'}
      </div>
      <div className="list-main">
        <div className="list-title">{order.customerName || 'בלי שם'}</div>
        <div className="list-sub">{fmtTime(order.createdAt)}</div>
        <div className="list-badges">
          {order.paid ? <span className="badge badge-green">שולם</span> : <span className="badge badge-red">חוב</span>}
          {order.arrived ? <span className="badge badge-gray">הגיע</span> : null}
        </div>
      </div>
      <div className="list-end">
        <div className="list-price">{fmtMoney(order.total)}</div>
      </div>
    </div>
  )
}

export default function Dashboard({ orders, products, onOpen, onLock }) {
  const todayOrders = orders.filter((o) => isToday(o.createdAt))
  const todayPaidOrders = todayOrders.filter((o) => o.paid)
  const todayRevenue = todayPaidOrders.reduce((s, o) => s + (Number(o.total) || 0), 0)
  const unpaidTotal = todayOrders.filter((o) => !o.paid).reduce((s, o) => s + (Number(o.total) || 0), 0)
  const debts = orders.filter((o) => !o.paid)
  const totalDebt = debts.reduce((s, o) => s + (Number(o.total) || 0), 0)

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
        <div className="hero-revenue-label">הכנסות היום</div>
        <div className="hero-revenue">{fmtMoney(todayRevenue)}</div>
        <div className="hero-chips">
          <div className="hero-chip">
            <span className="hero-chip-num">{todayPaidOrders.length}</span>
            <span className="hero-chip-label">שולמו היום</span>
          </div>
          <div className="hero-chip">
            <span className="hero-chip-num">{fmtMoney(unpaidTotal)}</span>
            <span className="hero-chip-label">ממתינים לתשלום</span>
          </div>
        </div>
      </section>

      {lowStock.length > 0 && (
        <div className="card rise rise-1" style={{ background: 'var(--accent-softer)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <div className="card-header" style={{ marginBottom: 6 }}>
            <div className="card-title" style={{ color: '#b45309' }}>⚠️ מלאי נמוך</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {lowStock.map((p) => (
              <span key={p.id} className="badge badge-amber">
                {p.name} · {fmtQty({ qty: p.stock })} {p.unit === 'weight' ? 'ק"ג' : 'יח'}
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
