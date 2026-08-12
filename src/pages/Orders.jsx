import { useMemo, useState } from 'react'
import { fmtMoney, fmtDateTime, payLabel, formatOrdersSummary, formatQuantitiesSummary, shareText } from '../utils'
import { IconShare } from '../components/icons'

function OrderRow({ order, onOpen, query, selecting, isChecked, onToggleSelect }) {
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
    <div
      className="list-row rise"
      onClick={() => (selecting ? onToggleSelect(order.id) : onOpen(order.id))}
      style={selecting && isChecked ? { background: 'var(--primary-bg, #eef2ff)', borderColor: 'var(--primary, #4f6ef7)' } : undefined}
    >
      {selecting && (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: isChecked ? '2px solid var(--primary, #4f6ef7)' : '2px solid #ccc',
            background: isChecked ? 'var(--primary, #4f6ef7)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginInlineEnd: 10,
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          {isChecked && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>✓</span>}
        </div>
      )}
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
  { key: 'approved', label: 'אושרו' },
]

export default function Orders({ orders, products, bundles, onOpen }) {
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(new Set())

  const filtered = useMemo(() => {
    const now = new Date()
    let list
    if (tab === 'approved') {
      // אושרו — רק הזמנות שהתשלום נלקח
      list = orders.filter((o) => o.paid ?? false)
    } else {
      // הכל / היום — בלי הזמנות שכבר אושרו, הן עברו לטאב "אושרו"
      list = orders.filter((o) => !(o.paid ?? false))
      if (tab === 'today')
        list = list.filter((o) => {
          const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt)
          return (
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          )
        })
    }
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

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((o) => o.id)))
  }

  const shareSelected = () => {
    const toShare = filtered.filter((o) => selected.has(o.id))
    if (toShare.length === 0) return
    shareText(formatOrdersSummary(toShare))
    setSelecting(false)
    setSelected(new Set())
  }

  const shareQuantities = () => {
    const toShare = filtered.filter((o) => selected.has(o.id))
    if (toShare.length === 0) return
    shareText(formatQuantitiesSummary(toShare))
    setSelecting(false)
    setSelected(new Set())
  }

  const shareAll = () => {
    if (filtered.length === 0) return
    shareText(formatOrdersSummary(filtered))
  }

  return (
    <>
      <div className="seg">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'active' : ''}
            onClick={() => { setTab(t.key); setSelecting(false); setSelected(new Set()) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 14px', marginBottom: 12 }}>
        <input
          className="input"
          placeholder="🔍 חיפוש לפי שם לקוח או מוצר..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setSelecting(false); setSelected(new Set()) }}
        />
      </div>

      <div style={{ padding: '0 14px', marginBottom: 12 }} className="row">
        <div style={{ fontWeight: 800, fontSize: 17, marginRight: 8, flex: 1 }}>הזמנות ({filtered.length})</div>
        {filtered.length > 0 && !selecting && (
          <>
            <button className="btn btn-outline" onClick={() => setSelecting(true)}>
              בחר
            </button>
            <button className="btn btn-primary" onClick={shareAll} style={{ marginInlineStart: 6 }}>
              <IconShare /> שתף הכל
            </button>
          </>
        )}
        {selecting && (
          <>
            <button className="btn btn-outline" onClick={selectAll}>
              {selected.size === filtered.length ? 'בטל הכל' : 'בחר הכל'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setSelecting(false); setSelected(new Set()) }}>
              ביטול
            </button>
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="empty-icon">📋</span>
            <div className="empty-title">אין הזמנות</div>
            <div className="empty-sub">{tab === 'approved' ? 'אין הזמנות שהתשלום עבורן נלקח' : 'אין הזמנות בקטגוריה הזו'}</div>
          </div>
        </div>
      ) : (
        <div className="list">
          {filtered.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              onOpen={onOpen}
              query={q}
              selecting={selecting}
              isChecked={selected.has(o.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}
      {selecting && selected.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          display: 'flex',
          gap: 10,
          whiteSpace: 'nowrap',
        }}>
          <button className="btn btn-outline" onClick={shareQuantities} style={{
            padding: '14px 22px',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 800,
            background: '#fff',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            📦 הוצאת כמויות
          </button>
          <button className="btn btn-primary" onClick={shareSelected} style={{
            padding: '14px 28px',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 800,
            boxShadow: '0 6px 20px rgba(79, 110, 247, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <IconShare /> שתף ({selected.size})
          </button>
        </div>
      )}
    </>
  )
}
