/**
 * Where is atlas running, and what can it offer there? Pure functions over injected globals
 * (tests/unit/pwa-platform.test.mjs drives them with fake navigators).
 *
 *   installState(env) -> 'installed' | 'native' | 'prompt' | 'ios-guide' | 'unavailable'
 *   pushState(env)    -> 'ready' | 'granted' | 'denied' | 'needs-install' | 'ios-too-old' | 'unsupported' | 'not-configured'
 */

export function readEnv(win = typeof window !== 'undefined' ? window : undefined) {
  if (!win) return { ssr: true };
  const nav = win.navigator || {};
  const mm = (q) => { try { return !!(win.matchMedia && win.matchMedia(q).matches); } catch { return false; } };
  return {
    ua: String(nav.userAgent || ''),
    platform: String(nav.platform || ''),
    maxTouchPoints: Number(nav.maxTouchPoints || 0),
    standalone: nav.standalone === true || mm('(display-mode: standalone)') || mm('(display-mode: minimal-ui)'),
    native: !!(win.Capacitor && typeof win.Capacitor.isNativePlatform === 'function' && win.Capacitor.isNativePlatform()),
    hasSW: 'serviceWorker' in nav,
    hasPushManager: 'PushManager' in win,
    hasNotification: 'Notification' in win,
    permission: 'Notification' in win ? win.Notification.permission : 'unsupported',
    secure: win.isSecureContext !== false,
  };
}

/** iPhone / iPod / iPad (iPadOS 13+ reports a Mac UA, but has touch). */
export function isIOS(env) {
  if (/iphone|ipod|ipad/i.test(env.ua)) return true;
  return /macintosh/i.test(env.ua) && env.maxTouchPoints > 1;
}

/**
 * iOS major.minor, or null. Safari's "Version/26.0" wins over "OS 18_6": since iOS 26 Safari freezes the OS part
 * of the UA, while Version/ still moves. Chrome / in-app browsers on iOS have no Version/, so the OS part is used.
 */
export function iosVersion(env) {
  if (!isIOS(env)) return null;
  const v = /Version\/(\d+)\.(\d+)/.exec(env.ua);
  const o = /OS (\d+)[._](\d+)/.exec(env.ua);
  const n = (m) => (m ? Number(m[1]) + Number(m[2]) / 100 : null);
  const a = n(v); const b = n(o);
  if (a == null) return b;
  if (b == null) return a;
  return Math.max(a, b);
}

export function isAndroid(env) { return /android/i.test(env.ua); }

/** Safari on iOS (Chrome/Firefox/Edge on iOS also install via the share menu since iOS 16.4). */
export function iosBrowser(env) {
  if (/CriOS/i.test(env.ua)) return 'chrome';
  if (/FxiOS/i.test(env.ua)) return 'firefox';
  if (/EdgiOS/i.test(env.ua)) return 'edge';
  if (/(FBAN|FBAV|Instagram|Line\/|WhatsApp)/i.test(env.ua)) return 'in-app';
  return 'safari';
}

export function devicePlatform(env) {
  if (isIOS(env)) return 'ios';
  if (isAndroid(env)) return 'android';
  if (/windows|macintosh|linux|cros/i.test(env.ua)) return 'desktop';
  return 'other';
}

/**
 * @param env  readEnv()
 * @param hasPrompt  a beforeinstallprompt event is waiting (Chrome / Edge / Samsung on Android and desktop)
 */
export function installState(env, hasPrompt = false) {
  if (!env || env.ssr) return 'unavailable';
  if (env.native) return 'native';
  if (env.standalone) return 'installed';
  if (hasPrompt) return 'prompt';
  if (isIOS(env)) {
    // in-app browsers (WhatsApp, Instagram) have no "add to home screen": the guide tells them to open Safari
    return 'ios-guide';
  }
  return 'unavailable';
}

/**
 * @param env  readEnv()
 * @param configured  a VAPID public key is in this build (VITE_VAPID_PUBLIC_KEY)
 */
export function pushState(env, configured = true) {
  if (!env || env.ssr || env.native) return 'unsupported';
  if (!configured) return 'not-configured';
  if (isIOS(env)) {
    const v = iosVersion(env);
    if (v != null && v < 16.4) return 'ios-too-old';
    // iOS / iPadOS only allow Web Push for a web app opened from the home screen
    if (!env.standalone) return 'needs-install';
  }
  if (!env.secure || !env.hasSW || !env.hasPushManager || !env.hasNotification) return 'unsupported';
  if (env.permission === 'denied') return 'denied';
  if (env.permission === 'granted') return 'granted';
  return 'ready';
}
