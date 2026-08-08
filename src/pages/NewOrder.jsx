import { useMemo, useRef, useState } from 'react'
import { saveOrder } from '../firebase'
import { fmtMoney, PAYMENTS } from '../utils'
import { IconPlus, IconX } from '../components/icons'

let keyCounter = 0
const nextKey = () => `item-${Date.now()}-${keyCounter++}`

function newLine(product) {
  return {
    key: nextKey(),
    productId: product.id,
    name: product.name,
    qty: 1,
    unitPrice: product.price ?? 0,
    tracksStock: product.trackStock,
    isCustom: false,
  }
}

function ProductPicker({ products, onPick, onClose }) {
  const [q, setQ] = useState('')
  const filtered = products.filter(
    (p) => p.active && (!q || p.name.includes(q) || p.category.includes(q)),
  )

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-grabber" />
        <div className="modal-title">בחירת מוצרים</div>
        <div className="field">
          <input className="input" placeholder="🔍 חיפוש מוצר..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        </div>
        {filtered.length === 0 ? (
          <div className="empty" style={{ padding: 20 }}>
            <div className="empty-sub">לא נמצאו מוצרים. הוסף אותם בדף "מוצרים".</div>
          </div>
        ) : (
          <div className="list" style={{ margin: 0 }}>
            {filtered.map((p) => (
              <div className="list-row" key={p.id} onClick={() => onPick(p)}>
                <div className="list-main">
                  <div className="list-title">{p.name}</div>
                  <div className="list-sub">
                    {fmtMoney(p.price)} ליחידה
                    {p.unitWeight ? ` · ${p.unitWeight} ק"ג` : ''}
                    {p.trackStock ? ` · מלאי: ${p.stock}` : ''}
                  </div>
                </div>
                <div className="list-price">{fmtMoney(p.price)}</div>
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

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div className="row" style={{ marginBottom: 8 }}>
        <div className="grow" style={{ fontWeight: 700 }}>
          {item.isCustom ? (
            <input className="input" value={item.name} onChange={setName} placeholder="שם הפריט (למשל: הנחה, משלוח)" />
          ) : (
            <span>{item.name}</span>
          )}
        </div>
        <button className="btn btn-sm btn-danger" onClick={onRemove} aria-label="הסר פריט">
          <IconX />
        </button>
      </div>
      <div className="input-row">
        <div>
          <label className="label">כמות (יחידות)</label>
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

export default function NewOrder({ products, editOrder, onDone, onCancel }) {
  const [name, setName] = useState(editOrder?.customerName || '')
  const [items, setItems] = useState(
    () =>
      editOrder?.items?.map((it) => ({
        ...it,
        key: nextKey(),
        isCustom: !it.productId,
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

  const total = useMemo(
    () => items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0),
    [items],
  )

  const pick = (product) => {
    setItems((prev) => [...prev, newLine(product)])
    setPickerOpen(false)
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80)
  }

  const addCustom = () => {
    setItems((prev) => [
      ...prev,
      { key: nextKey(), productId: null, name: '', qty: 1, unitPrice: 0, tracksStock: false, isCustom: true },
    ])
  }

  const updateItem = (key, updated) =>
    setItems((prev) => prev.map((it) => (it.key === key ? updated : it)))

  const removeItem = (key) => setItems((prev) => prev.filter((it) => it.key !== key))

  const submit = async () => {
    if (!name.trim()) return setError('צריך להזין שם לקוח')
    if (items.length === 0) return setError('צריך לבחור לפחות מוצר אחד')

    for (const it of items) {
      if ((Number(it.qty) || 0) <= 0) return setError(`הזן כמות עבור "${it.name || 'פריט'}"`)
      if (it.isCustom && !it.name.trim()) return setError('הזן שם לפריט החד-פעמי')
    }

    const cleanItems = items.map(({ key: _key, ...it }) => ({
      productId: it.productId,
      name: it.name,
      qty: Number(it.qty) || 0,
      unitPrice: Number(it.unitPrice) || 0,
      tracksStock: it.tracksStock,
      isCustom: it.isCustom,
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
        <ProductPicker products={products} onPick={pick} onClose={() => setPickerOpen(false)} />
      )}
    </>
  )
}
