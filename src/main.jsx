import React from 'react'
import ReactDOM from 'react-dom/client'
import Root, { isLeanUrl, loadFullApp } from '@/Root.jsx'
import { DEFER_CLASS, revealDeferredParts } from '@/lib/prerenderDefer'
import '@/index.css'
import '@/ui-direction/flag'
import { registerServiceWorker } from '@/lib/swUpdate'
import { isNativeApp, nativeStartRedirect, hasStoredSupabaseSession } from '@/lib/native'
import { liftBoot, hideBoot } from '@/lib/boot'

// Minimal fallback when app crashes (no external deps)
function CrashFallback({ error }) {
  hideBoot()
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

// iOS app (Capacitor): never open on the marketing landing / pricing. Rewrite the first URL to /login before
// anything reads it: with a stored session straight to /dashboard (Today), else /login (src/lib/native.js).
const nativeStart = nativeStartRedirect()
if (nativeStart) window.history.replaceState(null, '', nativeStart)
if (isNativeApp()) document.documentElement.classList.add('atlas-native')

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

// perf/cold-start: a returning owner opening Today (also every iOS cold start with a stored session, see
// nativeStartRedirect) gets the shell and Today's code requested now, in parallel with the app code, instead of
// after App.jsx has loaded and auth has answered (entry → App → Layout → Dashboard was a 4-step waterfall).
// Same files Vite's loader asks for on the lazy() imports in App.jsx / pages.config.js, so each is fetched once.
// modulepreload = download + compile only: nothing runs before the app code, so the session restore starts first.
// The chunk list comes from the build (scripts/prerender.mjs → <meta name="atlas-today-preload"> in app.html).
if (!lean && /^\/dashboard\/?$/.test(window.location.pathname) && hasStoredSupabaseSession()) {
  const list = document.querySelector('meta[name="atlas-today-preload"]')?.getAttribute('content') || ''
  for (const href of list.split(/\s+/).filter((h) => /^\/assets\/[\w.-]+\.(js|css)$/.test(h))) {
    if (document.querySelector(`link[href="${href}"]`)) continue
    const l = document.createElement('link')
    if (href.endsWith('.css')) { l.rel = 'preload'; l.as = 'style' } else { l.rel = 'modulepreload'; l.crossOrigin = '' }
    l.href = href
    document.head.appendChild(l)
  }
}

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
// The branded boot screen (index.html / app.html) becomes a fixed overlay above React: React renders the app under
// it, and it leaves the moment a real screen is up (src/lib/boot.js). Its animation never restarts or waits.
if (!hydrate && !ssrEl) liftBoot(rootEl)

// PERF-002: a prerendered lean page inlines only the CSS its HTML uses (scripts/critical-css.mjs) and keeps the
// full sheets linked but inert. Turn them on now (the browser fetches them, cached across pages and the app) and
// hydrate once they are in, so anything that appears after hydration (menus, dialogs, the cookie notice) is styled.
// The page is already painted, so this waits on nothing the visitor sees; 1.5 s is the safety net.
// CLS: the full entry sheet repeats the Heebo @font-face rules the inlined part already declared. Applied as is, they
// register as new faces that load again, and until they do the hero headline paints in the fallback font, re-wraps
// to three lines and back (Lighthouse/live mobile CLS ~0.2-0.28 whenever the reload is not an instant cache hit).
// So the sheet is fetched and parsed while its media is still "not all" (rules inert), the @font-face rules the page
// already has are dropped from it, and only then is it switched on. Any failure falls back to applying it unchanged.
function fontFaceTexts() {
  const seen = new Set()
  document.querySelectorAll('style[data-critical]').forEach((s) => {
    try { for (const r of s.sheet.cssRules) if (r.type === 5) seen.add(r.cssText) } catch { /* not readable: keep all */ }
  })
  return seen
}
function applyFullCss(l, seen) {
  if (l.dataset.atlasOn) return
  l.dataset.atlasOn = '1'
  const sheet = l.sheet
  // not loaded yet (the 1.5 s safety net): apply it the plain way
  if (!sheet) { l.media = 'all'; return }
  try {
    // the faces sit at the top of the sheet (src/styles/brand.css): scan only up to the first style rule instead of
    // touching all ~2,300, then delete from the end so the indexes hold
    const rules = sheet.cssRules
    const hit = []
    for (let i = 0; i < rules.length && hit.length < seen.size; i++) {
      const r = rules[i]
      if (r.type === 1) break
      if (r.type === 5 && seen.has(r.cssText)) hit.push(i)
    }
    for (let k = hit.length - 1; k >= 0; k--) sheet.deleteRule(hit[k])
    // Switch it on through the sheet's own media list. Changing the media attribute instead makes the browser rebuild
    // the sheet from the file (the dropped rules come back) and, without a fresh cache entry, fetch it again. The
    // attribute keeps saying "not all"; nothing re-processes these links after this.
    sheet.media.mediaText = 'all'
  } catch { l.media = 'all' }
}
function enableFullCss() {
  const links = [...document.querySelectorAll('link[data-atlas-full]')]
  if (!links.length) return Promise.resolve()
  const seen = fontFaceTexts()
  return Promise.race([
    Promise.all(links.map((l) => new Promise((done) => {
      const finish = () => { applyFullCss(l, seen); done() }
      l.addEventListener('load', finish, { once: true })
      l.addEventListener('error', finish, { once: true })
      // media stays "not all" until it has loaded: fetched and parsed, not applied
      l.removeAttribute('data-atlas-full'); l.removeAttribute('disabled'); l.disabled = false
    }))),
    new Promise((done) => window.setTimeout(() => { links.forEach((l) => applyFullCss(l, seen)); done() }, 1500)),
  ])
}

function boot() {
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
}
if (document.querySelector('link[data-atlas-full]')) enableFullCss().then(boot)
else boot()

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
if (!isNativeApp()) registerServiceWorker()
