import { useState } from 'react'
import { addPurchase, deletePurchase } from '../firebase'
import { fmtMoney, fmtDateTime } from '../utils'
import { IconPlus, IconX } from '../components/icons'

export default function Warehouse({ products, purchases }) {
  const [modalOpen, setModalOpen] = useState(false)

  const active = products.filter((p) => p.active)

  const getProduct = (id) => products.find((p) => p.id === id)

  return (
    <>
      <div className="section-title with-bar rise">
        <span className="bar" />
        <span>מחסן — רכישות</span>
      </div>

      {purchases.length === 0 ? (
        <div className="card rise rise-1">
          <div className="empty">
            <span className="empty-icon">📦</span>
            <div className="empty-title">אין רכישות עדיין</div>
            <div className="empty-sub">הוסף רכישה ראשונה כדי לעקוב אחר העלויות</div>
            <button className="btn btn-primary mt" onClick={() => setModalOpen(true)}>
              <IconPlus /> הוסף רכישה
            </button>
          </div>
        </div>
      ) : (
        <div className="list rise rise-1">
          {purchases.map((p) => {
            const product = getProduct(p.productId)
            const costPerKg = p.weight > 0 ? p.cost / p.weight : 0
            const costPerUnit = product?.unitWeight ? costPerKg * product.unitWeight : null

            return (
              <div className="list-row" key={p.id}>
                <div className="list-main">
                  <div className="list-title">{product?.name || 'מוצר לא ידוע'}</div>
                  <div className="list-sub">
                    {p.weight} ק"ג · {fmtMoney(p.cost)}
                    {fmtDateTime(p.createdAt) ? ` · ${fmtDateTime(p.createdAt)}` : ''}
                  </div>
                  <div className="list-badges">
                    <span className="badge badge-blue">לק"ג: {fmtMoney(costPerKg)}</span>
                    {costPerUnit && (
                      <span className="badge badge-green">ליחידה: {fmtMoney(costPerUnit)}</span>
                    )}
                  </div>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => {
                  if (window.confirm('למחוק את הרכישה?')) deletePurchase(p.id)
                }}>
                  <IconX />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {purchases.length > 0 && (
        <div style={{ padding: '4px 14px 10px' }}>
          <button className="btn btn-primary btn-block" onClick={() => setModalOpen(true)}>
            <IconPlus /> הוסף רכישה
          </button>
        </div>
      )}

      <CostSummary purchases={purchases} products={products} />

      {modalOpen && (
        <PurchaseModal
          products={active}
          onClose={() => setModalOpen(false)}
          onSaved={() => setModalOpen(false)}
        />
      )}
    </>
  )
}

function CostSummary({ purchases, products }) {
  if (purchases.length === 0) return null

  const productIds = [...new Set(purchases.map((p) => p.productId))]
  const summary = productIds.map((pid) => {
    const product = products.find((p) => p.id === pid)
    const productPurchases = purchases.filter((p) => p.productId === pid)
    const totalWeight = productPurchases.reduce((s, p) => s + (Number(p.weight) || 0), 0)
    const totalCost = productPurchases.reduce((s, p) => s + (Number(p.cost) || 0), 0)
    const avgCostPerKg = totalWeight > 0 ? totalCost / totalWeight : 0
    const costPerUnit = product?.unitWeight ? avgCostPerKg * product.unitWeight : null

    return {
      id: pid,
      name: product?.name || 'לא ידוע',
      totalWeight,
      totalCost,
      avgCostPerKg,
      costPerUnit,
      sellingPrice: product?.price || 0,
      profit: product?.price && costPerUnit ? product.price - costPerUnit : null,
    }
  })

  return (
    <div className="card rise rise-2" style={{ marginTop: 12 }}>
      <div className="card-title" style={{ marginBottom: 10 }}>📊 סיכום עלויות</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted)', fontWeight: 700 }}>
              <td style={{ padding: '6px 0' }}>מוצר</td>
              <td style={{ padding: '6px 0', textAlign: 'center' }}>ק"ג</td>
              <td style={{ padding: '6px 0', textAlign: 'center' }}>לק"ג</td>
              <td style={{ padding: '6px 0', textAlign: 'center' }}>ליחידה</td>
              <td style={{ padding: '6px 0', textAlign: 'center' }}>מכירה</td>
              <td style={{ padding: '6px 0', textAlign: 'center' }}>רווח</td>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 0', fontWeight: 600 }}>
                  {s.name}
                </td>
                <td style={{ padding: '8px 0', textAlign: 'center' }}>{Math.round(s.totalWeight * 100) / 100}</td>
                <td style={{ padding: '8px 0', textAlign: 'center' }}>{fmtMoney(s.avgCostPerKg)}</td>
                <td style={{ padding: '8px 0', textAlign: 'center', fontWeight: 700 }}>{s.costPerUnit ? fmtMoney(s.costPerUnit) : '—'}</td>
                <td style={{ padding: '8px 0', textAlign: 'center' }}>{fmtMoney(s.sellingPrice)}</td>
                <td style={{ padding: '8px 0', textAlign: 'center', fontWeight: 700, color: s.profit > 0 ? 'var(--primary-dark)' : s.profit < 0 ? 'var(--danger)' : 'var(--muted)' }}>
                  {s.profit != null ? fmtMoney(s.profit) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PurchaseModal({ products, onClose, onSaved }) {
  const [productId, setProductId] = useState(products[0]?.id || '')
  const [weight, setWeight] = useState('')
  const [cost, setCost] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedProduct = products.find((p) => p.id === productId)
  const w = Number(weight) || 0
  const c = Number(cost) || 0
  const costPerKg = w > 0 ? c / w : 0
  const costPerUnit = selectedProduct?.unitWeight ? costPerKg * selectedProduct.unitWeight : null

  const submit = async () => {
    if (!productId) return setError('בחר מוצר')
    if (w <= 0) return setError('הזן משקל')
    if (c <= 0) return setError('הזן עלות')
    setSaving(true)
    try {
      await addPurchase({ productId, weight: w, cost: c })
      onSaved()
    } catch {
      setError('שגיאה בשמירה')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-grabber" />
        <div className="modal-title">רכישה חדשה</div>

        <div className="field">
          <label className="label">מוצר</label>
          <select className="select" value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="input-row">
          <div className="field">
            <label className="label">משקל (ק"ג)</label>
            <input className="input" type="number" inputMode="decimal" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" autoFocus />
          </div>
          <div className="field">
            <label className="label">עלות כוללת (₪)</label>
            <input className="input" type="number" inputMode="decimal" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" />
          </div>
        </div>

        {w > 0 && c > 0 && (
          <div className="card" style={{ background: 'var(--primary-softer)', margin: '0 0 12px', padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 4 }}>חישוב אוטומטי:</div>
            <div style={{ fontSize: 13 }}>מחיר לק"ג: <b>{fmtMoney(costPerKg)}</b></div>
            {selectedProduct?.unitWeight && (
              <div style={{ fontSize: 13 }}>מחיר ליחידה ({selectedProduct.unitWeight} ק"ג): <b>{fmtMoney(costPerUnit)}</b></div>
            )}
            {selectedProduct?.price && costPerUnit && (
              <div style={{ fontSize: 13, marginTop: 4 }}>
                רווח ליחידה: <b style={{ color: selectedProduct.price - costPerUnit > 0 ? 'var(--primary-dark)' : 'var(--danger)' }}>
                  {fmtMoney(selectedProduct.price - costPerUnit)}
                </b>
              </div>
            )}
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
