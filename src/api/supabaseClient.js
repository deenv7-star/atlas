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

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
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
