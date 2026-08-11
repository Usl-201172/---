import { fmtMoney, isToday } from '../utils'

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
        {order.paymentMethod === 'bit' ? '📱' : order.paymentMethod === 'paybox' ? '💳' : order.paymentMethod === 'unpaid' ? '⏳' : '💵'}
      </div>
      <div className="list-main">
        <div className="list-title">{order.customerName || 'בלי שם'}</div>
        <div className="list-sub">{fmtTime(order.createdAt)}</div>
        <div className="list-badges">
          {order.paid ? <span className="badge badge-green">התשלום נלקח</span> : <span className="badge badge-red">חוב</span>}
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
  const unpaidToday = todayOrders.filter((o) => !o.paid)

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
          <div className="stat-card-label">הכנסות היום</div>
          <div className="stat-card-value">{fmtMoney(todayRevenue)}</div>
          <div className="stat-card-sub">today</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">שולמו</div>
          <div className="stat-card-value">{todayPaidOrders.length}</div>
          <div className="stat-card-sub">הזמנות</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">ממתינות</div>
          <div className="stat-card-value">{unpaidToday.length}</div>
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
