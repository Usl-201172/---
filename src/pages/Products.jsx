import { useState } from 'react'
import { addProduct, updateProduct, deleteProduct } from '../firebase'
import { fmtMoney } from '../utils'
import { IconPlus, IconTrash, IconEdit } from '../components/icons'

function emptyProduct() {
  return {
    name: '',
    price: '',
    unitWeight: '',
    trackStock: true,
    stock: 0,
  }
}

function ProductModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(
    product
      ? { ...product, price: product.price ?? '', unitWeight: product.unitWeight ?? '', stock: product.stock ?? 0 }
      : emptyProduct(),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const num = (key) => (e) => setForm({ ...form, [key]: e.target.value === '' ? '' : Number(e.target.value) })

  const submit = async () => {
    if (!form.name.trim()) return setError('צריך להזין שם מוצר')
    if (form.price === '' || Number(form.price) < 0) return setError('צריך להזין מחיר')
    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        price: Number(form.price),
        unitWeight: form.unitWeight === '' ? null : Number(form.unitWeight),
        trackStock: form.trackStock,
        stock: Number(form.stock || 0),
      }
      if (product) await updateProduct(product.id, data)
      else await addProduct(data)
      onSaved()
    } catch {
      setError('שגיאה בשמירה, נסה שוב')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-grabber" />
        <div className="modal-title">{product ? 'עריכת מוצר' : 'מוצר חדש'}</div>

        <div className="field">
          <label className="label">שם המוצר</label>
          <input className="input" value={form.name} onChange={set('name')} placeholder="למשל: עגבניות" autoFocus />
        </div>

        <div className="input-row">
          <div className="field">
            <label className="label">מחיר ליחידה (₪)</label>
            <input className="input" type="number" inputMode="decimal" step="0.01" value={form.price} onChange={num('price')} placeholder="0.00" />
          </div>
          <div className="field">
            <label className="label">משקל ליחידה (ק"ג)</label>
            <input className="input" type="number" inputMode="decimal" step="0.01" value={form.unitWeight} onChange={num('unitWeight')} placeholder="למשל: 5" />
          </div>
        </div>

        <div className="switch-row">
          <span className="switch-label">ניהול מלאי למוצר הזה</span>
          <label className="switch">
            <input type="checkbox" checked={form.trackStock} onChange={(e) => setForm({ ...form, trackStock: e.target.checked })} />
            <span className="slider" />
          </label>
        </div>

        {form.trackStock && (
          <div className="field">
            <label className="label">כמות במלאי (יחידות)</label>
            <input className="input" type="number" inputMode="decimal" step="0.01" value={form.stock} onChange={num('stock')} />
          </div>
        )}

        {error && <div className="banner" style={{ margin: 0, marginBottom: 10 }}>{error}</div>}

        <div className="row">
          <button className="btn btn-primary grow" onClick={submit} disabled={saving}>
            {saving ? 'שומר...' : 'שמור'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  )
}

export default function Products({ products }) {
  const [modal, setModal] = useState(null)

  const active = products.filter((p) => p.active)

  const confirmDelete = (p) => {
    if (window.confirm(`למחוק את "${p.name}"?`)) deleteProduct(p.id)
  }

  return (
    <>
      {active.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="empty-icon">🥕</span>
            <div className="empty-title">אין מוצרים עדיין</div>
            <div className="empty-sub">הוסף את המוצר הראשון כדי להתחיל</div>
            <button className="btn btn-primary mt" onClick={() => setModal({})}>
              <IconPlus /> הוסף מוצר
            </button>
          </div>
        </div>
      ) : (
        <div className="product-grid">
          {active.map((p) => {
            const low = p.trackStock && Number(p.stock) <= 2

            return (
              <div key={p.id} className="product-card rise">
                <div className="product-actions">
                  <button className="product-action-btn" onClick={() => setModal(p)} aria-label="ערוך">
                    <IconEdit />
                  </button>
                  <button className="product-action-btn delete" onClick={() => confirmDelete(p)} aria-label="מחק">
                    <IconTrash />
                  </button>
                </div>
                <div className="product-name">{p.name}</div>
                <div className="product-price">{fmtMoney(p.price)}</div>
                {p.unitWeight ? (
                  <div className="small muted">⚖️ {p.unitWeight} ק"ג ליחידה</div>
                ) : null}
                <div className="product-stock">
                  {p.trackStock ? (
                    <span className={`badge ${low ? 'badge-red' : 'badge-green'}`}>
                      מלאי: {p.stock} יח
                    </span>
                  ) : (
                    <span className="badge badge-gray">בלי מלאי</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {active.length > 0 && (
        <div style={{ padding: '4px 14px 10px' }}>
          <button className="btn btn-primary btn-block" onClick={() => setModal({})}>
            <IconPlus /> הוסף מוצר
          </button>
        </div>
      )}

      {modal !== null && (
        <ProductModal
          product={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      )}
    </>
  )
}
