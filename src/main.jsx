import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.message || e.reason?.name || ''
  if (String(msg).includes('Database is closing/hidden')) e.preventDefault()
})

createRoot(document.getElementById('root')).render(<App />)
