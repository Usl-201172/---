import { useState } from 'react'
import { addProduct, updateProduct, deleteProduct, addBundle, updateBundle, deleteBundle, addDiscountRule, updateDiscountRule, deleteDiscountRule } from '../firebase'
import { fmtMoney } from '../utils'
import { IconPlus, IconTrash, IconEdit, IconX } from '../components/icons'

function emptyProduct() {
  return {
    name: '',
    unitWeight: '',
    trackStock: true,
    stock: 0,
    tiers: [{ qty: 1, price: '' }],
  }
}

function ProductModal({ product, onClose, onSaved }) {
  const initTiers = product?.tiers?.length
    ? product.tiers
    : product?.price
      ? [{ qty: 1, price: product.price }]
      : [{ qty: 1, price: '' }]

  const [form, setForm] = useState(
    product
      ? { ...product, unitWeight: product.unitWeight ?? '', stock: product.stock ?? 0, tiers: initTiers }
      : emptyProduct(),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const num = (key) => (e) => setForm({ ...form, [key]: e.target.value === '' ? '' : Number(e.target.value) })

  const updateTier = (index, field, value) => {
    const tiers = [...form.tiers]
    tiers[index] = { ...tiers[index], [field]: value === '' ? '' : Number(value) }
    setForm({ ...form, tiers })
  }

  const addTier = () => {
    setForm({ ...form, tiers: [...form.tiers, { qty: '', price: '' }] })
  }

  const removeTier = (index) => {
    if (form.tiers.length <= 1) return
    setForm({ ...form, tiers: form.tiers.filter((_, i) => i !== index) })
  }

  const submit = async () => {
    if (!form.name.trim()) return setError('צריך להזין שם מוצר')
    const validTiers = form.tiers.filter((t) => t.qty > 0 && t.price > 0)
    if (validTiers.length === 0) return setError('צריך להזין לפחות מחיר אחד עם כמות')
    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        unitWeight: form.unitWeight === '' ? null : Number(form.unitWeight),
        trackStock: form.trackStock,
        stock: Number(form.stock || 0),
        tiers: validTiers.map((t) => ({ qty: Number(t.qty), price: Number(t.price) })),
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
          <input className="input" value={form.name} onChange={set('name')} placeholder="למשל: ביצים" autoFocus />
        </div>

        <div className="field">
          <label className="label">משקל ליחידה (ק"ג)</label>
          <input className="input" type="number" inputMode="decimal" step="0.01" value={form.unitWeight} onChange={num('unitWeight')} placeholder="אופציונלי" />
        </div>

        <div className="field">
          <label className="label">מחירי מכירה (לכמויות שונות)</label>
          {form.tiers.map((tier, i) => (
            <div key={i} className="row" style={{ marginBottom: 8, gap: 6 }}>
              <input
                className="input"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="1"
                value={tier.qty}
                onChange={(e) => updateTier(i, 'qty', e.target.value)}
                placeholder="כמות"
                style={{ flex: 1 }}
              />
              <span className="muted" style={{ fontSize: 13 }}>×</span>
              <input
                className="input"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={tier.price}
                onChange={(e) => updateTier(i, 'price', e.target.value)}
                placeholder="מחיר (₪)"
                style={{ flex: 1.5 }}
              />
              {form.tiers.length > 1 && (
                <button className="btn btn-sm btn-danger" onClick={() => removeTier(i)} style={{ padding: '8px' }}>
                  <IconX />
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-sm btn-ghost" onClick={addTier}>
            <IconPlus /> הוסף מחיר
          </button>
        </div>

        <div className="switch-row">
          <span className="switch-label">ניהול מלאי</span>
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

function BundleModal({ bundle, products, onClose, onSaved }) {
  const [name, setName] = useState(bundle?.name || '')
  const [items, setItems] = useState(bundle?.items || [{ productId: products[0]?.id || '', qty: 1 }])
  const [tiers, setTiers] = useState(bundle?.tiers || [{ qty: 1, price: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: field === 'qty' ? Number(value) : value }
    setItems(newItems)
  }

  const addItem = () => setItems([...items, { productId: products[0]?.id || '', qty: 1 }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))

  const updateTier = (index, field, value) => {
    const newTiers = [...tiers]
    newTiers[index] = { ...newTiers[index], [field]: Number(value) }
    setTiers(newTiers)
  }

  const addTier = () => setTiers([...tiers, { qty: '', price: '' }])
  const removeTier = (i) => setTiers(tiers.filter((_, idx) => idx !== i))

  const submit = async () => {
    if (!name.trim()) return setError('צריך להזין שם')
    if (items.length === 0) return setError('צריך לפחות מוצר אחד')
    const validTiers = tiers.filter((t) => t.qty > 0 && t.price > 0)
    if (validTiers.length === 0) return setError('צריך לפחות מחיר אחד')
    setSaving(true)
    try {
      const data = {
        name: name.trim(),
        items: items.filter((it) => it.productId),
        tiers: validTiers.map((t) => ({ qty: Number(t.qty), price: Number(t.price) })),
      }
      if (bundle?.id) await updateBundle(bundle.id, data)
      else await addBundle(data)
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
        <div className="modal-title">{bundle?.id ? 'עריכת באנדל' : 'באנדל חדש'}</div>

        <div className="field">
          <label className="label">שם הבאנדל</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: קרטון מנגו וביצים" autoFocus />
        </div>

        <div className="field">
          <label className="label">מוצרים בבאנדל</label>
          {items.map((item, i) => (
            <div key={i} className="row" style={{ marginBottom: 8, gap: 6 }}>
              <select className="select" value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)} style={{ flex: 2 }}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input className="input" type="number" min="1" value={item.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} style={{ flex: 0.7 }} />
              {items.length > 1 && (
                <button className="btn btn-sm btn-danger" onClick={() => removeItem(i)}><IconX /></button>
              )}
            </div>
          ))}
          <button className="btn btn-sm btn-ghost" onClick={addItem}><IconPlus /> הוסף מוצר</button>
        </div>

        <div className="field">
          <label className="label">מחירי מכירה</label>
          {tiers.map((tier, i) => (
            <div key={i} className="row" style={{ marginBottom: 8, gap: 6 }}>
              <input className="input" type="number" min="1" value={tier.qty} onChange={(e) => updateTier(i, 'qty', e.target.value)} placeholder="כמות" style={{ flex: 1 }} />
              <span className="muted" style={{ fontSize: 13 }}>×</span>
              <input className="input" type="number" min="0" value={tier.price} onChange={(e) => updateTier(i, 'price', e.target.value)} placeholder="מחיר (₪)" style={{ flex: 1.5 }} />
              {tiers.length > 1 && (
                <button className="btn btn-sm btn-danger" onClick={() => removeTier(i)}><IconX /></button>
              )}
            </div>
          ))}
          <button className="btn btn-sm btn-ghost" onClick={addTier}><IconPlus /> הוסף מחיר</button>
        </div>

        {error && <div className="banner" style={{ margin: 0, marginBottom: 10 }}>{error}</div>}

        <div className="row">
          <button className="btn btn-primary grow" onClick={submit} disabled={saving}>{saving ? 'שומר...' : 'שמור'}</button>
          <button className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  )
}

function DiscountModal({ rule, products, onClose, onSaved }) {
  const [name, setName] = useState(rule?.name || '')
  const [triggerProductId, setTriggerProductId] = useState(rule?.triggerProductId || products[0]?.id || '')
  const [minTriggerQty, setMinTriggerQty] = useState(rule?.minTriggerQty ?? 1)
  const [targetProductId, setTargetProductId] = useState(rule?.targetProductId || products[0]?.id || '')
  const [targetPrice, setTargetPrice] = useState(rule?.targetPrice ?? '')
  const [active, setActive] = useState(rule?.active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!name.trim()) return setError('צריך להזין שם')
    if (!triggerProductId) return setError('בחר מוצר שמקנה את ההנחה')
    if (!targetProductId) return setError('בחר מוצר שמקבל את ההנחה')
    if (!targetPrice || Number(targetPrice) <= 0) return setError('הזן מחיר ייעודי')
    setSaving(true)
    try {
      const data = {
        name: name.trim(),
        triggerProductId,
        minTriggerQty: Number(minTriggerQty) || 1,
        targetProductId,
        targetPrice: Number(targetPrice),
        active,
      }
      if (rule?.id) await updateDiscountRule(rule.id, data)
      else await addDiscountRule(data)
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
        <div className="modal-title">{rule?.id ? 'עריכת מבצע' : 'מבצע חדש'}</div>

        <div className="field">
          <label className="label">שם המבצע</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: מנגו = ליצ'י ב-5₪" autoFocus />
        </div>

        <div className="field">
          <label className="label">מוצר שמקנה את ההנחה</label>
          <select className="select" value={triggerProductId} onChange={(e) => setTriggerProductId(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">כמות מינימום</label>
          <input className="input" type="number" min="1" value={minTriggerQty} onChange={(e) => setMinTriggerQty(e.target.value)} placeholder="1" />
        </div>

        <div className="field">
          <label className="label">מוצר שמקבל את ההנחה</label>
          <select className="select" value={targetProductId} onChange={(e) => setTargetProductId(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">מחיר ייעודי (₪)</label>
          <input className="input" type="number" min="0" step="0.1" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="5" />
        </div>

        <div className="switch-row">
          <span className="switch-label">מבצע פעיל</span>
          <label className="switch">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span className="slider" />
          </label>
        </div>

        {error && <div className="banner" style={{ margin: 0, marginBottom: 10 }}>{error}</div>}

        <div className="row">
          <button className="btn btn-primary grow" onClick={submit} disabled={saving}>{saving ? 'שומר...' : 'שמור'}</button>
          <button className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  )
}

export default function Products({ products, bundles, discountRules }) {
  const [modal, setModal] = useState(null)
  const [view, setView] = useState('products')
  const [bundleModal, setBundleModal] = useState(null)
  const [discountModal, setDiscountModal] = useState(null)

  const active = products.filter((p) => p.active)

  const confirmDelete = (p) => {
    if (window.confirm(`למחוק את "${p.name}"?`)) deleteProduct(p.id)
  }

  const confirmDeleteBundle = (b) => {
    if (window.confirm(`למחוק את "${b.name}"?`)) deleteBundle(b.id)
  }

  const confirmDeleteRule = (r) => {
    if (window.confirm(`למחוק את "${r.name}"?`)) deleteDiscountRule(r.id)
  }

  const getProduct = (id) => products.find((p) => p.id === id)

  return (
    <>
      <div className="seg" style={{ margin: '0 14px 12px' }}>
        <button className={view === 'products' ? 'active' : ''} onClick={() => setView('products')}>
          מוצרים ({active.length})
        </button>
        <button className={view === 'bundles' ? 'active' : ''} onClick={() => setView('bundles')}>
          באנדלים ({bundles?.length || 0})
        </button>
        <button className={view === 'discounts' ? 'active' : ''} onClick={() => setView('discounts')}>
          מבצעים ({discountRules?.length || 0})
        </button>
      </div>

      {view === 'products' ? (
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
                const tiers = p.tiers || (p.price ? [{ qty: 1, price: p.price }] : [])

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
                    <div style={{ marginTop: 4 }}>
                      {tiers.map((t, i) => (
                        <div key={i} className="small" style={{ color: i === 0 ? 'var(--primary-dark)' : 'var(--muted)', fontWeight: i === 0 ? 700 : 500 }}>
                          {t.qty} × {fmtMoney(t.price)}
                        </div>
                      ))}
                    </div>
                    {p.unitWeight ? (
                      <div className="small muted" style={{ marginTop: 2 }}>⚖️ {p.unitWeight} ק"ג ליחידה</div>
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
        </>
      ) : view === 'bundles' ? (
        <>
          {bundles?.length === 0 ? (
            <div className="card">
              <div className="empty">
                <span className="empty-icon">📦</span>
                <div className="empty-title">אין באנדלים עדיין</div>
                <div className="empty-sub">באנדלים מאפשרים לשלב מוצרים יחד במחיר מיוחד</div>
                <button className="btn btn-primary mt" onClick={() => setBundleModal({})}>
                  <IconPlus /> הוסף באנדל
                </button>
              </div>
            </div>
          ) : (
            <div className="list">
              {bundles?.map((b) => (
                <div className="list-row" key={b.id}>
                  <div className="list-main">
                    <div className="list-title">{b.name}</div>
                    <div className="list-sub">
                      {b.items?.map((it) => {
                        const prod = getProduct(it.productId)
                        return `${it.qty}× ${prod?.name || '?'}`
                      }).join(' + ')}
                    </div>
                    <div className="list-badges">
                      {b.tiers?.map((t, i) => (
                        <span key={i} className="badge badge-green">
                          {t.qty} × {fmtMoney(t.price)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-ghost" onClick={() => setBundleModal(b)}>
                    <IconEdit />
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => confirmDeleteBundle(b)}>
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: '4px 14px 10px' }}>
            <button className="btn btn-primary btn-block" onClick={() => setBundleModal({})}>
              <IconPlus /> הוסף באנדל
            </button>
          </div>
        </>
      ) : (
        <>
          {discountRules?.length === 0 ? (
            <div className="card">
              <div className="empty">
                <span className="empty-icon">🏷️</span>
                <div className="empty-title">אין מבצעים עדיין</div>
                <div className="empty-sub">מבצעים מאפשרים מתן מחיר ייעודי כשקונים מוצר מסוים</div>
                <button className="btn btn-primary mt" onClick={() => setDiscountModal({})}>
                  <IconPlus /> הוסף מבצע
                </button>
              </div>
            </div>
          ) : (
            <div className="list">
              {discountRules?.map((r) => {
                const trigger = getProduct(r.triggerProductId)
                const target = getProduct(r.targetProductId)
                return (
                  <div className="list-row" key={r.id}>
                    <div className="list-main">
                      <div className="list-title">{r.name}</div>
                      <div className="list-sub">
                        קנה {r.minTriggerQty > 1 ? `${r.minTriggerQty}× ` : ''}{trigger?.name || '?'} → {target?.name || '?'} ב-{fmtMoney(r.targetPrice)}
                      </div>
                      <div className="list-badges">
                        <span className="badge badge-violet">מבצע</span>
                        {!r.active && <span className="badge badge-gray">מושבת</span>}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-ghost" onClick={() => setDiscountModal(r)}>
                      <IconEdit />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => confirmDeleteRule(r)}>
                      <IconTrash />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ padding: '4px 14px 10px' }}>
            <button className="btn btn-primary btn-block" onClick={() => setDiscountModal({})}>
              <IconPlus /> הוסף מבצע
            </button>
          </div>
        </>
      )}

      {modal !== null && (
        <ProductModal
          product={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      )}

      {bundleModal !== null && (
        <BundleModal
          bundle={bundleModal.id ? bundleModal : null}
          products={active}
          onClose={() => setBundleModal(null)}
          onSaved={() => setBundleModal(null)}
        />
      )}

      {discountModal !== null && (
        <DiscountModal
          rule={discountModal.id ? discountModal : null}
          products={active}
          onClose={() => setDiscountModal(null)}
          onSaved={() => setDiscountModal(null)}
        />
      )}
    </>
  )
}
