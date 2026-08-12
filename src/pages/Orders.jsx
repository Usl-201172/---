import { useMemo, useState } from 'react'
import { fmtMoney, fmtDateTime, payLabel } from '../utils'

function OrderRow({ order, onOpen, query }) {
  const pay = order.paymentMethod
  const paid = order.paid ?? false

  let matchedQty = 0
  if (query) {
    const q = query.trim().toLowerCase()
    for (const it of (order.items || [])) {
      if ((it.name || '').toLowerCase().includes(q)) {
        matchedQty += Number(it.qty) || 0
      }
    }
  }

  return (
    <div className="list-row rise" onClick={() => onOpen(order.id)}>
      <div className={`list-avatar ${pay === 'bit' ? 'blue' : pay === 'paybox' ? 'violet' : 'amber'}`}>
        {pay === 'bit' ? '📱' : pay === 'paybox' ? '💳' : pay === 'unpaid' ? '⏳' : '💵'}
      </div>
      <div className="list-main">
        <div className="list-title">{order.customerName || 'בלי שם'}</div>
        <div className="list-sub">{fmtDateTime(order.createdAt)} · {payLabel(pay)}</div>
        <div className="list-badges">
          {paid ? (
            <span className="badge badge-green">התשלום נלקח</span>
          ) : order.paymentMethod === 'unpaid' ? (
            <span className="badge badge-gray">לא שולם</span>
          ) : (
            <span className="badge badge-red">חוב</span>
          )}
          {query && matchedQty > 0 && (
            <span className="badge badge-violet">{matchedQty} × {query.trim()}</span>
          )}
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
]

export default function Orders({ orders, products, bundles, onOpen }) {
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
    if (q.trim()) {
      const query = q.trim()
      const matchingProductIds = new Set()
      const matchingBundleIds = new Set()

      for (const p of (products || [])) {
        if (p.name && p.name.includes(query)) {
          matchingProductIds.add(p.id)
        }
      }

      for (const b of (bundles || [])) {
        if (b.name && b.name.includes(query)) {
          matchingBundleIds.add(b.id)
        }
        for (const bi of (b.items || [])) {
          if (bi.productId && matchingProductIds.has(bi.productId)) {
            matchingBundleIds.add(b.id)
          }
        }
      }

      list = list.filter((o) => {
        if ((o.customerName || '').includes(query)) return true
        for (const it of (o.items || [])) {
          if (it.name && it.name.includes(query)) return true
          if (it.productId && matchingProductIds.has(it.productId)) return true
          if (it.bundleId && matchingBundleIds.has(it.bundleId)) return true
        }
        return false
      })
    }
    return list
  }, [orders, products, bundles, tab, q])

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
        <input className="input" placeholder="🔍 חיפוש לפי שם לקוח או מוצר..." value={q} onChange={(e) => setQ(e.target.value)} />
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
            <OrderRow key={o.id} order={o} onOpen={onOpen} query={q} />
          ))}
        </div>
      )}
    </>
  )
}
