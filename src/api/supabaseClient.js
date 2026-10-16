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
        const e = new Error('הבקשה לשרת לקחה יותר מדי זמן');
        e.name = 'TimeoutError';
        e.isTimeout = true;
        throw e;
      }
      throw err;
    })
    .finally(() => clearTimeout(t));
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
