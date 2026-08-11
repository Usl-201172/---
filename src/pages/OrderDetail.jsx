import { useState } from 'react'
import { patchOrder, deleteOrder } from '../firebase'
import { fmtMoney, fmtQty, fmtDateTime, payLabel } from '../utils'
import { IconBack, IconEdit, IconTrash } from '../components/icons'

export default function OrderDetail({ order, onBack, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  const togglePaid = () => patchOrder(order.id, { paid: !order.paid })

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

  const payIcon = order.paymentMethod === 'bit' ? '📱' : order.paymentMethod === 'paybox' ? '💳' : order.paymentMethod === 'unpaid' ? '⏳' : '💵'

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
          {order.paymentMethod !== 'unpaid' && (
            <span className="badge">
              {payIcon} {payLabel(order.paymentMethod)}
            </span>
          )}
          <button
            className={`badge ${order.paid ? 'badge-green' : 'badge-red'}`}
            onClick={togglePaid}
            style={{ border: 'none', cursor: 'pointer' }}
            title="לחץ לשינוי סטטוס"
          >
            {order.paid ? '✓ התשלום נלקח' : 'חוב'}
          </button>
        </div>
      </div>

      <div className="card rise rise-2">
        <div className="card-header">
          <div className="card-title">פריטי ההזמנה</div>
        </div>
        {order.items?.map((it, i) => {
          const lineTotal = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0)
          return (
            <div className="order-item" key={i}>
              <div className="order-item-qty">
                {fmtQty(it)} יח
              </div>
              <div className="order-item-name">
                {it.name}
                <span className="small muted" style={{ display: 'block' }}>
                  {fmtMoney(it.unitPrice)} ליחידה
                </span>
              </div>
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
