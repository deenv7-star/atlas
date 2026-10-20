import React from 'react'
import ReactDOM from 'react-dom/client'
import Root, { isLeanUrl, loadFullApp } from '@/Root.jsx'
import { DEFER_CLASS, revealDeferredParts } from '@/lib/prerenderDefer'
import '@/index.css'
import '@/ui-direction/flag'
import { registerServiceWorker } from '@/lib/swUpdate'

// Minimal fallback when app crashes (no external deps)
function CrashFallback({ error }) {
  return (
    <div dir="rtl" style={{
      minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Heebo', sans-serif", background: '#F7F8FB', textAlign: 'center'
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2656', marginBottom: 12 }}>atlas לא נטען</h1>
      <p style={{ color: '#6B7280', marginBottom: 20, maxWidth: 400 }}>רעננו את העמוד. אם זה חוזר, כתבו לנו.</p>
      {error && <pre style={{ background: '#FEE2E2', padding: 12, borderRadius: 8, fontSize: 12, overflow: 'auto', maxWidth: '100%', marginBottom: 20 }}>{String(error)}</pre>}
      <button onClick={() => window.location.href = '/'} style={{ padding: '12px 24px', background: '#3E2BF1', color: '#FFFFFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>חזרה לדף הבית</button>
      <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '12px 24px', background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>רענון</button>
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

// "/" and /pricing render without the app bundle (src/Root.jsx). Any other first URL, or one carrying a
// Supabase auth result, goes through the full app as before, and its code is requested right now rather
// than after React's first render.
const lean = isLeanUrl(window.location)
if (!lean) loadFullApp()

// Sign-in screens: request the screen's own code together with the app code, not after the app has
// rendered (entry → App → Login was a 3-step waterfall; Lighthouse mobile /login 66, LCP 5 s).
// Same module as the lazy() in src/App.jsx, so it is fetched once and the route renders without waiting.
const AUTH_SCREENS = {
  '/login': () => import('@/pages/Login'),
  '/register': () => import('@/pages/Register'),
}
if (!lean) AUTH_SCREENS[window.location.pathname.replace(/\/$/, '')]?.().catch(() => {})

// "/" and /pricing are prerendered (scripts/prerender.mjs → <div id="root" data-hydrate>): React adopts
// that HTML (hydration) instead of replacing it, so the page the visitor already sees stays as it is.
const hydrate = lean && rootEl.hasAttribute('data-hydrate')
// The prerendered landing does not lay out its below-the-fold parts before hydration (src/lib/prerenderDefer.js).
if (!hydrate) document.documentElement.classList.remove(DEFER_CLASS)
if (!hydrate && rootEl.hasAttribute('data-hydrate')) rootEl.textContent = ''

try {
  if (hydrate) {
    ReactDOM.hydrateRoot(rootEl, <Root lean />)
    revealDeferredParts()
  } else {
    ReactDOM.createRoot(rootEl).render(<Root lean={lean} />)
  }
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

// Service worker update loop: periodic/focus update checks + one safe reload when a new deploy takes over (see src/lib/swUpdate.js).
// /registerSW.js (vite-plugin-pwa) still registers the SW too; registering the same /sw.js twice is a no-op.
registerServiceWorker()
