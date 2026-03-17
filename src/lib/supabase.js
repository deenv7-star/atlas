/**
 * Single source of truth for Supabase client.
 * Re-exports from supabaseClient so auth session is shared with base44.
 */
export { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
