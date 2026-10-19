/**
 * Service worker registration + "every deploy shows up by itself".
 *
 * The SW (vite.config.js → workbox) uses skipWaiting + clientsClaim, so a new deploy's SW takes
 * control of open tabs as soon as it is installed. This module:
 *   - registers /sw.js and checks for a new one on load, when the tab becomes visible / gets focus /
 *     comes back online, and every 60 s while visible (registration.update());
 *   - reloads the page ONCE when a new SW takes control (controllerchange), so the open tab shows
 *     the new version without a manual refresh;
 *   - never reloads on the very first install (no previous controller), never twice in a row
 *     (sessionStorage guard), and never while the user has typed into a form that is still on screen:
 *     then the reload waits for the next in-app navigation (or the tab coming back with no dirty form).
 *
 * Written against injected globals so tests/unit/sw-update.test.mjs can drive it with fakes.
 */

export const CHECK_INTERVAL_MS = 60 * 1000;
export const MIN_CHECK_GAP_MS = 5 * 1000;
export const RELOAD_GUARD_MS = 15 * 1000;
export const RELOAD_GUARD_KEY = 'atlas:sw-reloaded-at';

const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
const NON_DATA_INPUTS = new Set(['button', 'submit', 'reset', 'image', 'hidden', 'file']);

function isEditable(el) {
  if (!el || typeof el.matches !== 'function' || !el.matches(EDITABLE)) return false;
  if (el.readOnly || el.disabled) return false;
  if (el.tagName === 'INPUT' && NON_DATA_INPUTS.has(String(el.type || '').toLowerCase())) return false;
  return true;
}

/**
 * Tracks form fields the user has actually typed into. A form counts as dirty while any such
 * field is still in the document (closing a dialog / leaving the page unmounts it, which clears it).
 * Fields inside a form that was submitted are forgotten.
 */
export function createDirtyTracker(doc) {
  const touched = new Set();
  const onInput = (e) => {
    if (e && e.isTrusted === false) return;
    const el = e && e.target;
    if (isEditable(el)) touched.add(el);
  };
  const onSubmit = (e) => {
    const form = e && e.target;
    for (const el of [...touched]) {
      if (form && typeof form.contains === 'function' && form.contains(el)) touched.delete(el);
    }
  };
  doc.addEventListener('input', onInput, true);
  doc.addEventListener('change', onInput, true);
  doc.addEventListener('submit', onSubmit, true);
  return {
    isDirty() {
      for (const el of [...touched]) {
        const connected = el.isConnected !== undefined ? el.isConnected : doc.contains(el);
        if (!connected) touched.delete(el);
      }
      return touched.size > 0;
    },
    clear() { touched.clear(); },
    size() { return touched.size; },
  };
}

/**
 * @param {object} env  { win, doc, nav, storage, now, reload, log }
 * @returns {object} handle with internals for tests ({ check, onControllerChange, state, stop })
 */
export function startSwUpdates(env = {}) {
  const win = env.win || (typeof window !== 'undefined' ? window : undefined);
  const doc = env.doc || (win && win.document);
  const nav = env.nav || (win && win.navigator);
  const storage = env.storage !== undefined ? env.storage : safeSession(win);
  const now = env.now || (() => Date.now());
  const reload = env.reload || (() => win.location.reload());
  const swUrl = env.swUrl || '/sw.js';
  // the page's entry bundle (assets/index-<hash>.js): its hash changes with every deploy that changes code
  const entryScript = env.entryScript || (() => {
    const el = doc.querySelector && doc.querySelector('script[type="module"][src*="/assets/index-"]');
    const m = el && /assets\/index-[^/?#]+\.js/.exec(el.getAttribute('src') || '');
    return m ? m[0] : null;
  });
  const fetchText = env.fetchText || ((url) => win.fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? r.text() : null)));
  const sw = nav && nav.serviceWorker;
  if (!win || !doc || !sw) return null;

  const dirty = createDirtyTracker(doc);
  const state = {
    hadController: !!sw.controller,
    reloading: false,
    pending: false,
    registration: null,
    lastCheck: 0,
    timer: null,
    path: win.location ? win.location.pathname : '/',
  };

  const recentlyReloaded = () => {
    try {
      const at = Number(storage && storage.getItem(RELOAD_GUARD_KEY));
      return at > 0 && now() - at < RELOAD_GUARD_MS;
    } catch { return false; }
  };

  const doReload = () => {
    if (state.reloading) return;
    state.reloading = true;
    state.pending = false;
    try { storage && storage.setItem(RELOAD_GUARD_KEY, String(now())); } catch { /* private mode */ }
    reload();
  };

  /** A new SW took control: reload now if safe, otherwise wait for the next navigation. */
  const tryReload = (reason) => {
    if (state.reloading) return;
    if (dirty.isDirty()) { state.pending = true; return; }
    if (reason === 'controllerchange' && recentlyReloaded()) { state.pending = true; return; }
    doReload();
  };

  const onControllerChange = () => {
    // First install on this page (no SW before): clientsClaim just adopted us, same version. No reload.
    if (!state.hadController) { state.hadController = true; return Promise.resolve(); }
    // Pages are network-first, so a page opened right after a deploy is often already the new version
    // while the old SW was still in charge. Only reload when this page's own bundle is not in the new SW.
    return pageIsCurrent().then((current) => { if (!current) tryReload('controllerchange'); });
  };

  const pageIsCurrent = () => {
    const entry = entryScript();
    if (!entry) return Promise.resolve(false);
    return Promise.resolve()
      .then(() => fetchText(swUrl))
      .then((text) => typeof text === 'string' && text.includes(entry), () => false);
  };

  const check = (force) => {
    const reg = state.registration;
    if (!reg || state.reloading) return Promise.resolve(false);
    if (!force && doc.visibilityState === 'hidden') return Promise.resolve(false);
    if (nav.onLine === false) return Promise.resolve(false);
    const t = now();
    if (!force && t - state.lastCheck < MIN_CHECK_GAP_MS) return Promise.resolve(false);
    state.lastCheck = t;
    // A failed check (offline, 5xx, deploy in progress) is harmless: try again next time, quietly.
    return Promise.resolve().then(() => reg.update()).then(() => true, () => false);
  };

  /** In-app navigation (pushState / back / forward): the moment to apply a deferred reload. */
  const onNavigate = () => {
    const p = win.location ? win.location.pathname : state.path;
    if (p === state.path) return;
    state.path = p;
    if (state.pending) {
      dirty.clear(); // the page with the form is gone; its fields were left on purpose
      doReload();
    }
  };

  const onVisible = () => {
    if (doc.visibilityState === 'hidden') return;
    if (state.pending && !dirty.isDirty()) { doReload(); return; }
    check();
  };

  sw.addEventListener('controllerchange', onControllerChange);
  doc.addEventListener('visibilitychange', onVisible);
  win.addEventListener('focus', onVisible);
  win.addEventListener('online', () => check(true));
  win.addEventListener('popstate', onNavigate);
  const hist = win.history;
  if (hist && typeof hist.pushState === 'function') {
    const push = hist.pushState;
    hist.pushState = function (...args) {
      const r = push.apply(this, args);
      try { onNavigate(); } catch { /* never break routing */ }
      return r;
    };
  }

  const register = () => Promise.resolve()
    .then(() => sw.register(swUrl, { scope: '/' }))
    .then((reg) => {
      state.registration = reg;
      state.lastCheck = now(); // register() itself just checked
      state.timer = win.setInterval(() => { check(); }, CHECK_INTERVAL_MS);
      return reg;
    })
    .catch(() => null); // no SW (private mode, blocked) = site works as a normal web page

  const ready = doc.readyState === 'complete'
    ? register()
    : new Promise((res) => win.addEventListener('load', () => res(register()), { once: true }));

  return {
    ready,
    state,
    dirty,
    check,
    onControllerChange,
    onNavigate,
    onVisible,
    stop() { if (state.timer) win.clearInterval(state.timer); },
  };
}

function safeSession(win) {
  try { return win && win.sessionStorage; } catch { return null; }
}

/** Browser entry: production web builds only (dev server has no SW). */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  if (!import.meta.env || !import.meta.env.PROD) return null;
  const handle = startSwUpdates();
  if (handle) window.__atlasSw = handle.state; // read-only peek for QA (no secrets in it)
  return handle;
}
