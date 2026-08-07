import { useState } from 'react'
import { patchOrder, deleteOrder } from '../firebase'
import { fmtMoney, fmtQty, fmtDateTime, payLabel } from '../utils'
import { IconBack, IconEdit, IconTrash, IconCheck, IconTruck } from '../components/icons'

function ToggleCard({ order }) {
  return (
    <div className="card rise rise-1">
      <div className="switch-row">
        <span className="switch-label">
          <IconCheck /> שולם ({payLabel(order.paymentMethod)})
        </span>
        <label className="switch">
          <input
            type="checkbox"
            checked={order.paid}
            onChange={(e) => patchOrder(order.id, { paid: e.target.checked })}
          />
          <span className="slider" />
        </label>
      </div>
      <div className="switch-row">
        <span className="switch-label">
          <IconTruck /> הסחורה הגיעה
        </span>
        <label className="switch">
          <input
            type="checkbox"
            checked={order.arrived}
            onChange={(e) => patchOrder(order.id, { arrived: e.target.checked })}
          />
          <span className="slider" />
        </label>
      </div>
    </div>
  )
}

export default function OrderDetail({ order, onBack, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!window.confirm('למחוק את ההזמנה הזו? המלאי יוחזר.')) return
    setDeleting(true)
    try {
      await deleteOrder(order)
      onDelete()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="detail-hero">
        <button className="back-btn" onClick={onBack}>
          <IconBack /> חזרה
        </button>
        <div className="detail-hero-name">🛒 {order.customerName || 'בלי שם'}</div>
        <div className="detail-hero-total">{fmtMoney(order.total)}</div>
        <div className="detail-hero-meta">
          <span className="badge">{fmtDateTime(order.createdAt)}</span>
          <span className="badge">
            {order.paymentMethod === 'bit' ? '📱' : order.paymentMethod === 'paybox' ? '💳' : '💵'} {payLabel(order.paymentMethod)}
          </span>
          {order.paid ? <span className="badge">✓ שולם</span> : <span className="badge">חוב</span>}
          {order.arrived ? <span className="badge">הגיע</span> : null}
        </div>
      </div>

      <ToggleCard order={order} />

      <div className="card rise rise-2">
        <div className="card-header">
          <div className="card-title">פריטי ההזמנה</div>
        </div>
        {order.items?.map((it, i) => {
          const lineTotal = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0)
          return (
            <div className="order-item" key={i}>
              <div className="order-item-qty">
                {fmtQty(it)} {it.unit === 'weight' ? 'ק"ג' : 'יח'}
              </div>
              <div className="order-item-name">{it.name}</div>
              <div className="order-item-price">{fmtMoney(lineTotal)}</div>
            </div>
          )
        })}
        <div className="total-row grand">
          <span>סה"כ</span>
          <span>{fmtMoney(order.total)}</span>
        </div>
      </div>

      {order.notes && (
        <div className="card rise rise-3">
          <div className="card-title" style={{ marginBottom: 6 }}>הערות</div>
          <div className="muted">{order.notes}</div>
        </div>
      )}

      <div style={{ padding: '0 14px', marginBottom: 12 }} className="row">
        <button className="btn btn-ghost grow" onClick={onEdit}>
          <IconEdit /> ערוך
        </button>
        <button className="btn btn-danger grow" onClick={confirmDelete} disabled={deleting}>
          <IconTrash /> {deleting ? 'מוחק...' : 'מחק'}
        </button>
      </div>
    </>
  )
}
