import { useEffect, useState } from 'react'
import {
  isConfigured,
  signIn,
  onAuth,
  watchProducts,
  watchOrders,
} from './firebase'
import { IconPlus, IconHome, IconOrders, IconProducts } from './components/icons'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import NewOrder from './pages/NewOrder'
import Products from './pages/Products'
import Setup from './pages/Setup'
import Gate from './components/Gate'

const TITLES = {
  dashboard: ['החנות שלי', 'פירות וירקות'],
  orders: ['הזמנות', 'ניהול הזמנות'],
  products: ['מוצרים', 'קטלוג ומלאי'],
  newOrder: ['הזמנה חדשה', ''],
  order: ['פרטי הזמנה', ''],
}

const NAV = [
  { key: 'dashboard', label: 'בית', icon: IconHome },
  { key: 'orders', label: 'הזמנות', icon: IconOrders },
  { key: 'products', label: 'מוצרים', icon: IconProducts },
]

export default function App() {
  const [route, setRoute] = useState({ name: 'dashboard' })
  const [authed, setAuthed] = useState(false)
  const [authReady, setAuthReady] = useState(!isConfigured)
  const [products, setProducts] = useState(null)
  const [orders, setOrders] = useState(null)
  const [gateOk, setGateOk] = useState(() => localStorage.getItem('gate_ok') === '1')

  useEffect(() => {
    if (!isConfigured) return
    const unsubAuth = onAuth((ok) => {
      setAuthed(ok)
      if (ok) setAuthReady(true)
    })
    signIn()
    return unsubAuth
  }, [])

  useEffect(() => {
    if (!isConfigured || !authed) return
    const unsubP = watchProducts(setProducts)
    const unsubO = watchOrders(setOrders)
    return () => {
      unsubP()
      unsubO()
    }
  }, [authed])

  const navigate = (r) => {
    setRoute(r)
    window.scrollTo({ top: 0 })
  }

  const currentNav = route.name === 'order' ? 'orders' : route.name === 'newOrder' ? 'dashboard' : route.name

  const lock = () => {
    if (!window.confirm('בטוח שברצונך להתנתק?')) return
    localStorage.removeItem('gate_ok')
    setGateOk(false)
    setRoute({ name: 'dashboard' })
  }

  if (!gateOk) return <Gate onUnlock={() => setGateOk(true)} />

  if (!isConfigured) return <Setup />

  if (!authReady || !authed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 16 }}>
        <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 20 }} />
        <div className="skeleton" style={{ width: 160, height: 16 }} />
        <div className="skeleton" style={{ width: 220, height: 12 }} />
      </div>
    )
  }

  const loading = !products || !orders

  const renderPage = () => {
    if (loading) {
      return (
        <div style={{ padding: '0 12px' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton card" style={{ height: 74 }} />
          ))}
        </div>
      )
    }
    switch (route.name) {
      case 'orders':
        return <Orders orders={orders} onOpen={(id) => navigate({ name: 'order', id })} />
      case 'order': {
        const order = orders.find((o) => o.id === route.id)
        if (!order) return <Orders orders={orders} onOpen={(id) => navigate({ name: 'order', id })} />
        return (
          <OrderDetail
            order={order}
            onBack={() => navigate({ name: 'orders' })}
            onEdit={() => navigate({ name: 'newOrder', orderId: order.id })}
            onDelete={() => navigate({ name: 'orders' })}
          />
        )
      }
      case 'newOrder':
        return (
          <NewOrder
            products={products}
            orders={orders}
            editOrder={route.orderId ? orders.find((o) => o.id === route.orderId) : null}
            onDone={(id) => navigate({ name: 'order', id })}
            onCancel={() => navigate(route.orderId ? { name: 'order', id: route.orderId } : { name: 'dashboard' })}
          />
        )
      case 'products':
        return <Products products={products} />
      default:
        return <Dashboard orders={orders} products={products} onOpen={openDashboard} onLock={lock} />
    }
  }

  const openDashboard = (id) => {
    if (id === '__all__') return navigate({ name: 'orders' })
    navigate({ name: 'order', id })
  }

  const [title, sub] = TITLES[currentNav] || TITLES.dashboard

  return (
    <div className="app-shell">
      {route.name !== 'dashboard' && (
        <header className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            {sub && <div className="topbar-sub">{sub}</div>}
          </div>
          <button className="btn btn-outline btn-sm" onClick={lock} title="התנתקות">
            🚪 התנתק
          </button>
        </header>
      )}

      <main>{renderPage()}</main>

      <nav className="bottom-nav">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button key={key} className={`nav-item ${currentNav === key ? 'active' : ''}`} onClick={() => navigate({ name: key })}>
            <Icon />
            <span>{label}</span>
          </button>
        ))}
        <div className="nav-fab">
          <button className="fab" aria-label="הזמנה חדשה" onClick={() => navigate({ name: 'newOrder' })}>
            <IconPlus />
          </button>
        </div>
      </nav>
    </div>
  )
}
