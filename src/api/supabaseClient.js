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

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set.\n' +
    'Copy .env.example to .env and fill in your Supabase project credentials.\n' +
    'The app will fall back to the localStorage client until these are configured.'
  );
}

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
