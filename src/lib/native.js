/**
 * Running inside the Capacitor iOS app (WebView at capacitor://localhost)?
 *
 * Reads the bridge Capacitor injects at document start (window.Capacitor) instead of importing
 * @capacitor/core, so the lean landing / pricing bundles on atlas-il.com do not grow. Same answer as
 * Capacitor.isNativePlatform().
 */
export const PUBLIC_ORIGIN = 'https://atlas-il.com';

export function isNativeApp() {
  try {
    return typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

/**
 * Origin for any link that leaves the device: email confirm / reset links, guest links sent on WhatsApp.
 * In the app window.location.origin is capacitor://localhost, which no browser or mail client can open.
 */
export function publicOrigin() {
  if (typeof window === 'undefined') return PUBLIC_ORIGIN;
  if (isNativeApp()) return PUBLIC_ORIGIN;
  const o = window.location.origin;
  if (!o || !/^https?:/i.test(o)) return PUBLIC_ORIGIN;
  return o;
}

/**
 * Native start page: the app never shows the marketing landing / pricing. A cold start on "/" (or /pricing, or the
 * start file itself: capacitor.config.json server.appStartPath = app.html) is rewritten before the router reads the URL:
 *   - a stored session on the device → straight to /dashboard (Today). perf/cold-start 05.11: going through /login
 *     first cost a redirect, and Today's code was only requested after it (the shell waited ~1.5 s on a phone).
 *   - no session, or a Supabase auth result in the URL (hash / ?code=) → /login, as before.
 * Every request is still authorised by the server; a refused session lands on /login from /dashboard as before.
 */
export const NATIVE_START_PATH = '/login';
export const NATIVE_HOME_PATH = '/dashboard';
export const NATIVE_BLOCKED_PATHS = ['/', '/pricing', '/app.html', '/index.html'];

/** A Supabase session is stored on this device (sb-<ref>-auth-token with a user id). No network, no supabase-js. */
export function hasStoredSupabaseSession(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return false;
  try {
    for (let i = 0; i < storage.length; i += 1) {
      const k = storage.key(i);
      if (!k || !/^sb-[a-z0-9]+-auth-token$/i.test(k)) continue;
      const s = JSON.parse(storage.getItem(k) || 'null');
      const sess = s?.currentSession || s;
      if (sess?.user?.id && (sess.refresh_token || sess.access_token)) return true;
    }
  } catch { /* private mode / bad JSON: treat as signed out */ }
  return false;
}

export function nativeStartRedirect(loc = typeof window !== 'undefined' ? window.location : null, storage) {
  if (!loc || !isNativeApp()) return null;
  const path = (loc.pathname || '/').replace(/\/+$/, '') || '/';
  if (!NATIVE_BLOCKED_PATHS.includes(path)) return null;
  const search = loc.search || '';
  const hash = loc.hash || '';
  const authInUrl = /[?&]code=|access_token=|error_code=|[?&]error=/.test(search + hash);
  // Keep a Supabase auth result in the URL (hash / ?code=) so the full app still picks it up on /login.
  if (!authInUrl && hasStoredSupabaseSession(storage)) return NATIVE_HOME_PATH;
  return `${NATIVE_START_PATH}${search}${hash}`;
}
