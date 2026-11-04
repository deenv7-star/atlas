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
 * Native start page: the app never shows the marketing landing / pricing. A cold start on "/" (or
 * /pricing) is rewritten to /login before the router reads the URL; /login itself sends a signed-in
 * owner on to /dashboard (Today), see src/App.jsx.
 */
export const NATIVE_START_PATH = '/login';
export const NATIVE_BLOCKED_PATHS = ['/', '/pricing'];

export function nativeStartRedirect(loc = typeof window !== 'undefined' ? window.location : null) {
  if (!loc || !isNativeApp()) return null;
  const path = (loc.pathname || '/').replace(/\/+$/, '') || '/';
  if (!NATIVE_BLOCKED_PATHS.includes(path)) return null;
  // Keep a Supabase auth result in the URL (hash / ?code=) so the full app still picks it up.
  return `${NATIVE_START_PATH}${loc.search || ''}${loc.hash || ''}`;
}
