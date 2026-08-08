import { useMemo, useRef, useState } from 'react'
import { saveOrder } from '../firebase'
import { fmtMoney, PAYMENTS } from '../utils'
import { IconPlus, IconX } from '../components/icons'

let keyCounter = 0
const nextKey = () => `item-${Date.now()}-${keyCounter++}`

function getActiveDiscounts(items, discountRules) {
  if (!discountRules?.length) return {}
  const triggered = {}
  for (const rule of discountRules) {
    if (rule.active === false) continue
    const triggerTotal = items
      .filter((it) => it.productId === rule.triggerProductId)
      .reduce((sum, it) => sum + (Number(it.qty) || 0), 0)
    if (triggerTotal >= (rule.minTriggerQty || 1)) {
      triggered[rule.targetProductId] = rule.targetPrice
    }
  }
  return triggered
}

function applyDiscounts(items, discountRules) {
  const discounts = getActiveDiscounts(items, discountRules)
  return items.map((it) => {
    if (it.productId && discounts[it.productId] !== undefined) {
      if (it.discounted) return it
      return { ...it, unitPrice: discounts[it.productId], discounted: true }
    }
    if (it.discounted) return { ...it, discounted: false }
    return it
  })
}

function ProductPicker({ products, bundles, onPickProduct, onPickBundle, onClose }) {
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('products')
  const filteredProducts = products.filter(
    (p) => p.active && (!q || p.name.includes(q)),
  )
  const filteredBundles = (bundles || []).filter(
    (b) => b.active !== false && (!q || b.name.includes(q)),
  )
  const items = tab === 'products' ? filteredProducts : filteredBundles
  const pick = tab === 'products' ? onPickProduct : onPickBundle

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-grabber" />
        <div className="modal-title">בחירת מוצרים</div>
        <div className="field">
          <input className="input" placeholder="🔍 חיפוש..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        </div>
        <div className="seg" style={{ margin: '0 0 12px' }}>
          <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>מוצרים</button>
          <button className={tab === 'bundles' ? 'active' : ''} onClick={() => setTab('bundles')}>באנדלים</button>
        </div>
        {items.length === 0 ? (
          <div className="empty" style={{ padding: 20 }}>
            <div className="empty-sub">{tab === 'products' ? 'לא נמצאו מוצרים' : 'לא נמצאו באנדלים'}</div>
          </div>
        ) : (
          <div className="list" style={{ margin: 0 }}>
            {items.map((item) => (
              <div className="list-row" key={item.id} onClick={() => pick(item)}>
                <div className="list-main">
                  <div className="list-title">
                    {item.name}
                    {tab === 'bundles' && <span className="badge badge-blue">באנדל</span>}
                  </div>
                  <div className="list-sub">
                    {item.tiers?.map((t, i) => (
                      <span key={i}>{t.qty} × {fmtMoney(t.price)}{i < item.tiers.length - 1 ? ' · ' : ''}</span>
                    ))}
                    {!item.tiers?.length && item.price && fmtMoney(item.price)}
                  </div>
                </div>
                <div className="list-price">{fmtMoney(item.tiers?.[0]?.price ?? item.price)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ItemRow({ item, onChange, onRemove }) {
  const setQty = (e) => {
    const v = e.target.value
    onChange({ ...item, qty: v === '' ? '' : Number(v) })
  }
  const setName = (e) => onChange({ ...item, name: e.target.value })
  const lineTotal = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0)

  const selectTier = (tier) => {
    onChange({ ...item, unitPrice: tier.price, selectedTier: tier })
  }

  const tiers = item.tiers || []

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div className="row" style={{ marginBottom: 8 }}>
        <div className="grow" style={{ fontWeight: 700 }}>
          {item.isCustom ? (
            <input className="input" value={item.name} onChange={setName} placeholder="שם הפריט" />
          ) : (
            <span>
              {item.name}
              {item.isBundle && <span className="badge badge-blue" style={{ marginInlineStart: 6 }}>באנדל</span>}
              {item.discounted && <span className="badge badge-violet" style={{ marginInlineStart: 6 }}>מבצע</span>}
            </span>
          )}
        </div>
        <button className="btn btn-sm btn-danger" onClick={onRemove} aria-label="הסר">
          <IconX />
        </button>
      </div>

      {tiers.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {tiers.map((t, i) => (
            <button
              key={i}
              type="button"
              className={`chip ${item.selectedTier?.qty === t.qty && item.selectedTier?.price === t.price ? 'active' : ''}`}
              onClick={() => selectTier(t)}
              style={{ flex: 1, minWidth: 80 }}
            >
              {t.qty} × {fmtMoney(t.price)}
            </button>
          ))}
        </div>
      )}

      <div className="input-row">
        <div>
          <label className="label">כמות</label>
          <input className="input" type="number" inputMode="decimal" step="1" min="1" value={item.qty} onChange={setQty} />
        </div>
        <div>
          <label className="label">מחיר ליחידה</label>
          <div style={{ fontSize: 17, fontWeight: 800, paddingTop: 8 }}>{fmtMoney(item.unitPrice)}</div>
        </div>
      </div>
      <div className="total-row grand" style={{ marginTop: 6 }}>
        <span>סה"כ</span>
        <span>{fmtMoney(lineTotal)}</span>
      </div>
    </div>
  )
}

function FormSection({ num, title, children }) {
  return (
    <div className="form-card rise">
      <div className="form-card-header">
        <span className="step-num">{num}</span>
        {title}
      </div>
      <div className="form-card-body">{children}</div>
    </div>
  )
}

export default function NewOrder({ products, bundles, discountRules, editOrder, onDone, onCancel }) {
  const [name, setName] = useState(editOrder?.customerName || '')
  const [rawItems, setRawItems] = useState(
    () =>
      editOrder?.items?.map((it) => ({
        ...it,
        key: nextKey(),
        isCustom: !it.productId && !it.bundleId,
      })) || [],
  )
  const [payment, setPayment] = useState(editOrder?.paymentMethod || 'bit')
  const [paid, setPaid] = useState(editOrder?.paid ?? false)
  const [arrived, setArrived] = useState(editOrder?.arrived ?? false)
  const [notes, setNotes] = useState(editOrder?.notes || '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)

  const items = useMemo(
    () => applyDiscounts(rawItems, discountRules),
    [rawItems, discountRules],
  )

  const total = useMemo(
    () => items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0),
    [items],
  )

  const pickProduct = (product) => {
    const tiers = product.tiers || (product.price ? [{ qty: 1, price: product.price }] : [])
    const item = {
      key: nextKey(),
      productId: product.id,
      bundleId: null,
      name: product.name,
      qty: 1,
      unitPrice: tiers[0]?.price ?? product.price ?? 0,
      selectedTier: tiers[0] || null,
      tiers,
      tracksStock: product.trackStock,
      isCustom: false,
      isBundle: false,
    }
    setRawItems((prev) => [...prev, item])
    setPickerOpen(false)
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80)
  }

  const pickBundle = (bundle) => {
    const tiers = bundle.tiers || []
    const item = {
      key: nextKey(),
      productId: null,
      bundleId: bundle.id,
      name: bundle.name,
      qty: 1,
      unitPrice: tiers[0]?.price ?? 0,
      selectedTier: tiers[0] || null,
      tiers,
      tracksStock: false,
      isCustom: false,
      isBundle: true,
    }
    setRawItems((prev) => [...prev, item])
    setPickerOpen(false)
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80)
  }

  const addCustom = () => {
    setRawItems((prev) => [
      ...prev,
      { key: nextKey(), productId: null, name: '', qty: 1, unitPrice: 0, tracksStock: false, isCustom: true },
    ])
  }

  const updateItem = (key, updated) =>
    setRawItems((prev) => prev.map((it) => (it.key === key ? updated : it)))

  const removeItem = (key) => setRawItems((prev) => prev.filter((it) => it.key !== key))

  const submit = async () => {
    if (!name.trim()) return setError('צריך להזין שם לקוח')
    if (items.length === 0) return setError('צריך לבחור לפחות מוצר אחד')

    for (const it of items) {
      if ((Number(it.qty) || 0) <= 0) return setError(`הזן כמות עבור "${it.name || 'פריט'}"`)
      if (it.isCustom && !it.name.trim()) return setError('הזן שם לפריט החד-פעמי')
    }

    const cleanItems = items.map(({ key: _key, ...it }) => ({
      productId: it.productId,
      bundleId: it.bundleId || null,
      name: it.name,
      qty: Number(it.qty) || 0,
      unitPrice: Number(it.unitPrice) || 0,
      tracksStock: it.tracksStock,
      isCustom: it.isCustom,
      isBundle: it.isBundle || false,
      selectedTier: it.selectedTier || null,
    }))

    setSaving(true)
    setError('')
    try {
      const id = await saveOrder(
        {
          customerName: name.trim(),
          items: cleanItems,
          total: Math.round(total * 100) / 100,
          paymentMethod: payment,
          paid,
          arrived,
          notes: notes.trim(),
        },
        editOrder,
      )
      onDone(id)
    } catch (e) {
      console.error(e)
      setError('שגיאה בשמירת ההזמנה, נסה שוב')
      setSaving(false)
    }
  }

  return (
    <>
      <FormSection num={1} title="מי הלקוח?">
        <div className="field" style={{ marginBottom: 0 }}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="שם מלא של הלקוח" />
        </div>
      </FormSection>

      <FormSection num={2} title="מה בהזמנה?">
        {items.length === 0 && (
          <div className="empty" style={{ padding: '8px 0 18px' }}>
            <span className="empty-icon">🧾</span>
            <div className="empty-sub">עדיין לא נבחרו מוצרים</div>
          </div>
        )}
        <div ref={scrollRef}>
          {items.map((it) => (
            <ItemRow key={it.key} item={it} onChange={(u) => updateItem(it.key, u)} onRemove={() => removeItem(it.key)} />
          ))}
        </div>
        <div className="row">
          <button className="btn btn-primary grow" onClick={() => setPickerOpen(true)}>
            <IconPlus /> הוסף מוצר
          </button>
          <button className="btn btn-outline" onClick={addCustom}>
            <IconPlus /> פריט חד-פעמי
          </button>
        </div>
        <div className="total-row grand" style={{ marginTop: 10 }}>
          <span>סה"כ להזמנה</span>
          <span>{fmtMoney(total)}</span>
        </div>
      </FormSection>

      <FormSection num={3} title="איך שולם?">
        <div className="chips">
          {PAYMENTS.map((p) => (
            <button key={p.key} type="button" className={`chip ${payment === p.key ? 'active' : ''}`} onClick={() => setPayment(p.key)}>
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection num={4} title="סטטוס והערות">
        <div className="switch-row">
          <span className="switch-label">שולם</span>
          <label className="switch">
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
            <span className="slider" />
          </label>
        </div>
        <div className="switch-row">
          <span className="switch-label">הסחורה הגיעה</span>
          <label className="switch">
            <input type="checkbox" checked={arrived} onChange={(e) => setArrived(e.target.checked)} />
            <span className="slider" />
          </label>
        </div>
        <div className="field" style={{ marginBottom: 0, marginTop: 10 }}>
          <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות חופשיות..." />
        </div>
      </FormSection>

      {error && <div className="banner">{error}</div>}

      <div style={{ padding: '0 14px', marginBottom: 12 }} className="row">
        <button className="btn btn-primary grow" onClick={submit} disabled={saving}>
          {saving ? 'שומר...' : editOrder ? 'שמור שינויים' : 'שמור הזמנה'}
        </button>
        <button className="btn btn-outline" onClick={onCancel}>ביטול</button>
      </div>

      {pickerOpen && (
        <ProductPicker products={products} bundles={bundles} onPickProduct={pickProduct} onPickBundle={pickBundle} onClose={() => setPickerOpen(false)} />
      )}
    </>
  )
}
