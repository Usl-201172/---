import { useEffect, useState } from 'react'
import {
  isConfigured,
  onAuth,
  watchProducts,
  watchOrders,
  watchPurchases,
  watchBundles,
  watchDiscountRules,
  updateBundlesCache,
  watchSettings,
  createDefaultSettings,
  isStoreMember,
} from './firebase'
import { IconPlus, IconHome, IconOrders, IconProducts, IconWarehouse, IconUser } from './components/icons'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import NewOrder from './pages/NewOrder'
import Products from './pages/Products'
import Setup from './pages/Setup'
import Gate from './components/Gate'
import Warehouse from './pages/Warehouse'
import Account from './pages/Account'
import JoinStore from './pages/JoinStore'

const TITLES = {
  dashboard: ['החנות שלי', 'פירות וירקות'],
  orders: ['הזמנות', 'ניהול הזמנות'],
  products: ['מוצרים', 'קטלוג'],
  warehouse: ['מחסן', 'רכישות ועלויות'],
  newOrder: ['הזמנה חדשה', ''],
  order: ['פרטי הזמנה', ''],
  account: ['החשבון שלי', ''],
}

const NAV = [
  { key: 'dashboard', label: 'בית', icon: IconHome },
  { key: 'orders', label: 'הזמנות', icon: IconOrders },
  { key: 'warehouse', label: 'מחסן', icon: IconWarehouse },
  { key: 'products', label: 'מוצרים', icon: IconProducts },
  { key: 'account', label: 'חשבון', icon: IconUser },
]

export default function App() {
  const [route, setRoute] = useState({ name: 'dashboard' })
  const [authed, setAuthed] = useState(false)
  const [authReady, setAuthReady] = useState(!isConfigured)
  const [products, setProducts] = useState(null)
  const [orders, setOrders] = useState(null)
  const [purchases, setPurchases] = useState(null)
  const [bundles, setBundles] = useState(null)
  const [discountRules, setDiscountRules] = useState(null)
  const [settings, setSettings] = useState(null)
  const [uid, setUid] = useState(null)

  useEffect(() => {
    if (!isConfigured) return
    const unsubAuth = onAuth((user) => {
      setAuthed(Boolean(user))
      setUid(user?.uid || null)
      setAuthReady(true)
    })
    return unsubAuth
  }, [])

  useEffect(() => {
    if (!isConfigured || !authed || !uid) return
    const unsub = watchSettings((s) => {
      if (s) setSettings(s)
      else createDefaultSettings(uid).then(setSettings).catch(console.error)
    })
    return unsub
  }, [authed, uid])

  useEffect(() => {
    document.title = `${settings?.shopName || 'החנות שלי'} - פירות וירקות`
  }, [settings?.shopName])

  // רק חברים בחנות (בעלים או מצורפים בקוד) רואים את נתוני החנות
  const isMember = isStoreMember(settings, uid)

  useEffect(() => {
    if (!isConfigured || !authed || !isMember) return
    const unsubP = watchProducts(setProducts)
    const unsubO = watchOrders(setOrders)
    const unsubPr = watchPurchases(setPurchases)
    const unsubB = watchBundles((b) => { setBundles(b); updateBundlesCache(b) })
    const unsubDR = watchDiscountRules(setDiscountRules)
    return () => {
      unsubP()
      unsubO()
      unsubPr()
      unsubB()
      unsubDR()
    }
  }, [authed, isMember])

  const navigate = (r) => {
    setRoute(r)
    window.scrollTo({ top: 0 })
  }

  const currentNav = route.name === 'order' ? 'orders' : route.name === 'newOrder' ? 'dashboard' : route.name

  if (!isConfigured) return <Setup />

  if (!authReady) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 16 }}>
        <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 20 }} />
        <div className="skeleton" style={{ width: 160, height: 16 }} />
        <div className="skeleton" style={{ width: 220, height: 12 }} />
      </div>
    )
  }

  if (!authed) return <Gate />

  const loading = !products || !orders || !purchases || !bundles

  const renderPage = () => {
    // חשבון שלא מחובר לאף חנות — לא מקבל את נתוני החנות
    if (settings && !isMember) {
      return <JoinStore />
    }
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
        return <Orders orders={orders} products={products} bundles={bundles} onOpen={(id) => navigate({ name: 'order', id })} />
      case 'order': {
        const order = orders.find((o) => o.id === route.id)
        if (!order) return <Orders orders={orders} products={products} bundles={bundles} onOpen={(id) => navigate({ name: 'order', id })} />
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
            bundles={bundles}
            discountRules={discountRules}
            orders={orders}
            editOrder={route.orderId ? orders.find((o) => o.id === route.orderId) : null}
            onDone={(id) => navigate({ name: 'order', id })}
            onCancel={() => navigate(route.orderId ? { name: 'order', id: route.orderId } : { name: 'dashboard' })}
          />
        )
      case 'products':
        return <Products products={products} bundles={bundles} discountRules={discountRules} />
      case 'warehouse':
        return <Warehouse products={products} purchases={purchases} />
      case 'account':
        return (
          <Account
            settings={settings}
            uid={uid}
            onSettings={setSettings}
            onBack={() => navigate({ name: 'dashboard' })}
          />
        )
      default:
        return (
          <>
            <header className="dashboard-header">
              <div>
                <div className="topbar-title">{settings?.shopName || 'החנות שלי'}</div>
                <div className="topbar-sub">פירות וירקות</div>
              </div>
            </header>
            <Dashboard
              orders={orders}
              products={products}
              onOpen={openDashboard}
            />
          </>
        )
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
