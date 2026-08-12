export const fmtMoney = (n) => {
  const num = Number(n) || 0
  return '₪' + Math.round(num * 100) / 100
}

export const fmtQty = (it) => {
  const q = Number(it.qty) || 0
  return q % 1 === 0 ? String(q) : String(Math.round(q * 1000) / 1000)
}

export const fmtDate = (ts) => {
  if (!ts) return ''
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
}

export const fmtDateTime = (ts) => {
  if (!ts) return ''
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return (
    d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  )
}

export const isToday = (ts) => {
  if (!ts) return false
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

export const PAYMENTS = [
  { key: 'bit', label: 'ביט', icon: '📱' },
  { key: 'paybox', label: 'פייבוקס', icon: '💳' },
  { key: 'cash', label: 'מזומן', icon: '💵' },
  { key: 'unpaid', label: 'עוד לא שולם', icon: '⏳' },
]

export const payLabel = (key) => PAYMENTS.find((p) => p.key === key)?.label || key || ''

export const CATEGORIES = ['ירקות', 'פירות', 'אחר']

const PRODUCE_EMOJI = {
  'תפוחים': '🍎', 'תפוח': '🍎',
  'תפוזים': '🍊', 'תפוז': '🍊',
  'בננות': '🍌', 'בננה': '🍌',
  'ענבים': '🍇', 'ענב': '🍇',
  'תותים': '🍓', 'תות': '🍓',
  'אבטיח': '🍉', 'מלון': '🍈',
  'אגסים': '🍐', 'אגס': '🍐',
  'קיווי': '🥝', 'אננס': '🍍',
  'דובדבנים': '🍒', 'דובדבן': '🍒',
  'לימונים': '🍋', 'לימון': '🍋',
  'אפרסקים': '🍑', 'אפרסק': '🍑',
  'שזיפים': '🟣', 'שזיף': '🟣',
  'רימונים': '🔴', 'רימון': '🔴',
  'משמשים': '🟠', 'משמש': '🟠',
  'נקטרינות': '🍑', 'נקטרינה': '🍑',
  'פירות': '🍎',

  'עגבניות': '🍅', 'עגבנייה': '🍅',
  'מלפפונים': '🥒', 'מלפפון': '🥒',
  'חצילים': '🍆', 'חציל': '🍆',
  'פלפל': '🫑', 'פלפלים': '🫑',
  'פלפל חריף': '🌶️', 'פלפלים חריפים': '🌶️',
  'בצל': '🧅', 'בצלים': '🧅',
  'שום': '🧄',
  'גזר': '🥕', 'גזרים': '🥕',
  'תפוחי אדמה': '🥔', 'תפוח אדמה': '🥔',
  'חסה': '🥬', 'כרוב': '🥬',
  'כרובית': '🥦', 'ברוקולי': '🥦',
  'פטריות': '🍄', 'פטריה': '🍄',
  'תירס': '🌽',
  'אבוקדו': '🥑',
  'זיתים': '🫒', 'זית': '🫒',
  'כוסברה': '🌿', 'פטרוזיליה': '🌿',
  'נענע': '🌿', 'בזיליקום': '🌿',
  'רוקט': '🌿', 'גרגיר הנחלים': '🌿',
  'סלק': '🟣', 'קולרבי': '🟢',
  'סלרי': '🥬', 'אפונה': '🟢',
  'בצל ירוק': '🧅', 'שום ירוק': '🧅',
  'ירקות': '🥦', 'ירק': '🥦',
  'ackers': '🍎', 'apples': '🍎',
  'bananas': '🍌',
  'oranges': '🍊', 'tomatoes': '🍅',
  'potatoes': '🥔', 'carrots': '🥕',
}

export function fmtRelative(ts) {
  if (!ts) return ''
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  const diffMs = now - d
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)
  const diffW = Math.floor(diffD / 7)
  const diffM = Math.floor(diffD / 30)

  if (diffMin < 1) return 'הרגע'
  if (diffMin < 60) return `לפני ${diffMin} דקות`
  if (diffH < 24) return `לפני ${diffH} שעות`
  if (diffD === 1) return 'אתמול'
  if (diffD < 7) return `לפני ${diffD} ימים`
  if (diffW < 5) return `לפני ${diffW} שבועות`
  return `לפני ${diffM} חודשים`
}

export function guessEmoji(name, category) {
  if (!name) return category === 'פירות' ? '🍎' : category === 'ירקות' ? '🥦' : '📦'
  const n = name.trim().toLowerCase()
  for (const [key, emoji] of Object.entries(PRODUCE_EMOJI)) {
    if (n.includes(key.toLowerCase())) return emoji
  }
  return category === 'פירות' ? '🍎' : category === 'ירקות' ? '🥦' : '📦'
}

export const EMOJI_OPTIONS = [
  '🍎', '🍊', '🍌', '🍇', '🍓', '🍉', '🍈', '🍐', '🥝', '🍍', '🍒', '🍋', '🍑', '🫐',
  '🍅', '🥒', '🍆', '🫑', '🌶️', '🧅', '🧄', '🥕', '🥔', '🥬', '🥦', '🍄', '🌽', '🥑', '🫒', '🌿',
  '📦', '🧃', '🧊', '💰', '🧺', '🏷️', '🛒', '🚛', '✂️', '📦',
]
