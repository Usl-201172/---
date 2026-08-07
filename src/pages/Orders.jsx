import { useMemo, useState } from 'react'
import { fmtMoney, fmtDateTime, payLabel } from '../utils'

function OrderRow({ order, onOpen }) {
  const pay = order.paymentMethod
  return (
    <div className="list-row rise" onClick={() => onOpen(order.id)}>
      <div className={`list-avatar ${pay === 'bit' ? 'blue' : pay === 'paybox' ? 'violet' : 'amber'}`}>
        {pay === 'bit' ? '📱' : pay === 'paybox' ? '💳' : '💵'}
      </div>
      <div className="list-main">
        <div className="list-title">{order.customerName || 'בלי שם'}</div>
        <div className="list-sub">{fmtDateTime(order.createdAt)} · {payLabel(pay)}</div>
        <div className="list-badges">
          {order.paid ? (
            <span className="badge badge-green">שולם</span>
          ) : (
            <span className="badge badge-red">חוב</span>
          )}
          {order.arrived && <span className="badge badge-gray">הגיע</span>}
        </div>
      </div>
      <div className="list-end">
        <div className="list-price">{fmtMoney(order.total)}</div>
      </div>
    </div>
  )
}

const TABS = [
  { key: 'all', label: 'הכל' },
  { key: 'today', label: 'היום' },
  { key: 'unarrived', label: 'לא הגיעו' },
]

export default function Orders({ orders, onOpen }) {
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const now = new Date()
    let list = orders
    if (tab === 'today')
      list = orders.filter((o) => {
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt)
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        )
      })
    if (tab === 'unarrived') list = list.filter((o) => !o.arrived)
    if (q.trim()) list = list.filter((o) => (o.customerName || '').includes(q.trim()))
    return list
  }, [orders, tab, q])

  return (
    <>
      <div className="seg">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 14px', marginBottom: 12 }}>
        <input className="input" placeholder="🔍 חיפוש לפי שם לקוח..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="empty-icon">📋</span>
            <div className="empty-title">אין הזמנות</div>
            <div className="empty-sub">אין הזמנות בקטגוריה הזו</div>
          </div>
        </div>
      ) : (
        <div className="list">
          {filtered.map((o) => (
            <OrderRow key={o.id} order={o} onOpen={onOpen} />
          ))}
        </div>
      )}
    </>
  )
}
