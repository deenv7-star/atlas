/**
 * Sign-out that always finishes (web + iOS app). Pure: no React, no '@/' imports, unit tested
 * (tests/unit/signOut.test.mjs).
 *
 * Why: in the iOS app "יציאה מהחשבון" used to wait forever. A step before supabase.auth.signOut()
 * (the Face ID Keychain clear) never settled, so the session was never cleared and the app never moved
 * to /login. Every step here has its own time limit and can fail on its own; the local session is
 * removed from storage at the end no matter what the network or the plugin did.
 */

export const SIGN_OUT_TIMEOUT_MS = 4000;
export const LOCAL_SIGN_OUT_TIMEOUT_MS = 1500;
export const SIDE_STEP_TIMEOUT_MS = 1500;

const TIMED_OUT = Symbol('timed-out');

/**
 * Settle a promise (or a function returning one) within ms. Never throws, never hangs.
 * → { ok: true, value } | { ok: false, error } | { ok: false, timedOut: true }
 */
export function settle(work, ms) {
  let timer;
  const run = Promise.resolve().then(() => (typeof work === 'function' ? work() : work));
  const limit = new Promise((resolve) => { timer = setTimeout(() => resolve(TIMED_OUT), ms); });
  return Promise.race([run, limit]).then(
    (value) => (value === TIMED_OUT ? { ok: false, timedOut: true } : { ok: true, value }),
    (error) => ({ ok: false, error }),
  ).finally(() => clearTimeout(timer));
}

/** Storage keys that keep someone signed in: Supabase session / PKCE verifier, REST JWT, demo user, profile cache. */
export function isAuthStorageKey(key) {
  if (typeof key !== 'string') return false;
  if (key.startsWith('sb-') && (key.includes('-auth-token') || key.endsWith('-code-verifier'))) return true;
  return key === 'atlas_jwt_token' || key === 'atlas_current_user' || key === 'atlas.me.v1';
}

function storageKeys(store) {
  const keys = [];
  try {
    if (typeof store.length === 'number' && typeof store.key === 'function') {
      for (let i = 0; i < store.length; i++) keys.push(store.key(i));
    } else {
      keys.push(...Object.keys(store));
    }
  } catch { /* storage blocked */ }
  return keys;
}

/** Remove every auth key from the given storages (localStorage + sessionStorage by default). Never throws. */
export function clearAuthStorage(stores) {
  const list = stores || (() => {
    const s = [];
    try { if (typeof window !== 'undefined' && window.localStorage) s.push(window.localStorage); } catch { /* blocked */ }
    try { if (typeof window !== 'undefined' && window.sessionStorage) s.push(window.sessionStorage); } catch { /* blocked */ }
    return s;
  })();
  for (const store of list) {
    if (!store) continue;
    for (const k of storageKeys(store).filter(isAuthStorageKey)) {
      try { store.removeItem(k); } catch { /* ignore */ }
    }
  }
}

/**
 * Sign out of Supabase without ever blocking on the network or a native plugin.
 *   1. beforeSignOut (Face ID Keychain clear), time-limited, errors ignored
 *   2. signOut() (revokes the refresh token on the server), time-limited
 *   3. if that failed / hung: signOut({ scope: 'local' }), time-limited
 *   4. always: the auth keys are removed from storage
 * Resolves { server: boolean } (true = the server confirmed the sign-out). Never throws.
 */
export async function safeSignOut(supabase, {
  beforeSignOut,
  timeoutMs = SIGN_OUT_TIMEOUT_MS,
  localTimeoutMs = LOCAL_SIGN_OUT_TIMEOUT_MS,
  sideStepTimeoutMs = SIDE_STEP_TIMEOUT_MS,
  stores,
} = {}) {
  let server = false;
  try {
    if (beforeSignOut) await settle(beforeSignOut, sideStepTimeoutMs);
    if (supabase?.auth) {
      const r = await settle(() => supabase.auth.signOut(), timeoutMs);
      server = r.ok && !r.value?.error;
      if (!server) await settle(() => supabase.auth.signOut({ scope: 'local' }), localTimeoutMs);
    }
  } catch { /* settle never throws; belt and braces */ } finally {
    clearAuthStorage(stores);
  }
  return { server };
}

/**
 * Leave for the sign-in screen with a full reload (web and the iOS app, where capacitor://localhost/login
 * serves index.html). The reload drops every in-memory copy of the old session (Supabase client, React
 * state, a hydration still in flight), and replace() keeps the back gesture from returning to the app.
 */
export function hardRedirectToLogin(to = '/login', loc = typeof window !== 'undefined' ? window.location : null) {
  if (!loc) return;
  try { loc.replace(to); } catch { loc.href = to; }
}
