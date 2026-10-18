import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import BackendNotConfigured from '@/components/common/BackendNotConfigured'
import { isProductionBackendConfigured } from '@/lib/backendConfig'
import '@/index.css'
import '@/ui-direction/flag'

// Minimal fallback when app crashes (no external deps)
function CrashFallback({ error }) {
  return (
    <div dir="rtl" style={{
      minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Heebo', sans-serif", background: '#F7F8FB', textAlign: 'center'
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2656', marginBottom: 12 }}>אופס! משהו השתבש</h1>
      <p style={{ color: '#6B7280', marginBottom: 20, maxWidth: 400 }}>אירעה שגיאה בטעינת האפליקציה.</p>
      {error && <pre style={{ background: '#FEE2E2', padding: 12, borderRadius: 8, fontSize: 12, overflow: 'auto', maxWidth: '100%', marginBottom: 20 }}>{String(error)}</pre>}
      <button onClick={() => window.location.href = '/'} style={{ padding: '12px 24px', background: '#3E2BF1', color: '#FFFFFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>חזור לדף הבית</button>
      <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '12px 24px', background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>רענן</button>
    </div>
  )
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

// Prerendered public pages (blog / legal, scripts/prerender.mjs) ship real HTML inside #root.
// Keep that HTML on screen until the SPA has rendered the same page, then swap, so there is
// no blank flash while the JS chunks load. Safety net: swap after 6 s regardless.
const ssrEl = rootEl.querySelector('[data-ssr]')
if (ssrEl) {
  rootEl.parentNode.insertBefore(ssrEl, rootEl)
  rootEl.hidden = true
  let swapped = false
  const swap = () => {
    if (swapped) return
    swapped = true
    const y = window.scrollY
    ssrEl.remove()
    rootEl.hidden = false
    if (y) window.scrollTo(0, y)
  }
  window.addEventListener('atlas:site-ready', swap, { once: true })
  window.setTimeout(swap, 6000)
}

try {
  const root = ReactDOM.createRoot(rootEl)
  root.render(isProductionBackendConfigured() ? <App /> : <BackendNotConfigured />)
} catch (e) {
  rootEl.innerHTML = ''
  rootEl.style.minHeight = '100vh'
  ReactDOM.createRoot(rootEl).render(<CrashFallback error={e?.message || e} />)
}

// Catch unhandled errors (async, etc.)
let crashShown = false
window.onerror = (msg, src, line, col, err) => {
  console.error('Unhandled error:', msg, err)
  if (crashShown) return false
  const root = document.getElementById('root')
  if (root) {
    crashShown = true
    root.innerHTML = ''
    root.style.minHeight = '100vh'
    ReactDOM.createRoot(root).render(<CrashFallback error={err?.message || msg} />)
  }
  return false
}
