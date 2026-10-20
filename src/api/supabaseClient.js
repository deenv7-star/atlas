/**
 * Supabase client singleton.
 *
 * Reads connection details from environment variables:
 *   VITE_SUPABASE_URL       – your project URL (e.g. https://xyz.supabase.co)
 *   VITE_SUPABASE_ANON_KEY  – your project's public anon key
 *
 * Both values are safe to expose in the browser because Row Level Security (RLS)
 * on all tables ensures users can only access their own organisation's data.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Every network call gives up after this long so loading states never hang. */
export const REQUEST_TIMEOUT_MS = 15000;

/**
 * fetch with a hard timeout. Respects a caller-provided AbortSignal as well.
 * A timeout rejects with an Error named 'TimeoutError' (err.isTimeout = true).
 */
export function fetchWithTimeout(input, init = {}, ms = REQUEST_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const outer = init.signal;
  if (outer) {
    if (outer.aborted) ctrl.abort(outer.reason);
    else outer.addEventListener('abort', () => ctrl.abort(outer.reason), { once: true });
  }
  let timedOut = false;
  const t = setTimeout(() => { timedOut = true; ctrl.abort(); }, ms);
  return fetch(input, { ...init, signal: ctrl.signal })
    .catch((err) => {
      if (timedOut) {
        const e = new Error('החיבור איטי מדי כרגע. נסו שוב בעוד רגע.');
        e.name = 'TimeoutError';
        e.isTimeout = true;
        throw e;
      }
      throw err;
    })
    .finally(() => clearTimeout(t));
}

/**
 * The auth result Supabase put in the URL when a confirmation / recovery link was opened
 * (#access_token=… or #error_code=otp_expired…). Captured before createClient(), because
 * detectSessionInUrl strips the hash right after reading it.
 */
export const INITIAL_AUTH_URL = (() => {
  if (typeof window === 'undefined') return { hash: '', search: '', path: '' };
  return { hash: window.location.hash || '', search: window.location.search || '', path: window.location.pathname || '' };
})();

/** { error, code, description } from the initial URL, or null. */
export function initialAuthUrlError() {
  const params = new URLSearchParams(`${INITIAL_AUTH_URL.hash.replace(/^#/, '')}&${INITIAL_AUTH_URL.search.replace(/^\?/, '')}`);
  const error = params.get('error');
  const code = params.get('error_code');
  if (!error && !code) return null;
  return { error, code, description: params.get('error_description') || '' };
}

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: (input, init = {}) => {
          const b = init.body;
          const isUpload = typeof Blob !== 'undefined' && (b instanceof Blob || b instanceof FormData || b instanceof ArrayBuffer);
          return fetchWithTimeout(input, init, isUpload ? 120000 : REQUEST_TIMEOUT_MS);
        },
      },
    })
  : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// ── Local REST API (Express server) ──────────────────────────────────────────
// Explicit VITE_API_URL wins. In production builds, default to same-origin (empty
// string) so fetches go to /api/* — typical when nginx/Render/Vercel proxies API.
// Development defaults to localhost Express.
function resolveApiBase() {
  const explicit = import.meta.env.VITE_API_URL;
  if (explicit) return String(explicit).replace(/\/$/, '');
  if (import.meta.env.PROD) return '';
  return 'http://localhost:3001';
}

export const LOCAL_API_URL = resolveApiBase();

export const isLocalApiConfigured = Boolean(
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && !isSupabaseConfigured && !import.meta.env.PROD)
);

/**
 * The signed-in user as stored by supabase-js ({ id, expiresAt }), read synchronously from storage
 * without any network call. Used only to decide what to preload / which cached copy to show first;
 * every real request is still authorised by the server (RLS).
 */
export function storedSessionUser() {
  if (!supabase || typeof window === 'undefined') return null;
  try {
    const key = supabase.auth?.storageKey;
    const raw = key ? window.localStorage.getItem(key) : null;
    if (!raw) return null;
    const s = JSON.parse(raw);
    const sess = s?.currentSession || s;
    const id = sess?.user?.id;
    return id ? { id, expiresAt: Number(sess.expires_at) || 0 } : null;
  } catch {
    return null;
  }
}
