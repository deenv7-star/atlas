/**
 * Calls ATLAS edge functions (supabase/functions/*) with the signed-in user's session.
 * Errors come back as Error objects with a Hebrew message the UI can show as is.
 */
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

export class EdgeError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

export async function callEdge(fn, body = {}) {
  if (!isSupabaseConfigured || !supabase) throw new EdgeError('זמין אחרי שתתחברו לחשבון', 'not_configured');
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    let code = 'edge_error';
    try { const j = await error.context?.json?.(); code = j?.error || code; } catch { /* not json */ }
    throw new EdgeError(code === 'unauthorized' ? 'התחברו שוב כדי להמשיך' : 'אין תשובה כרגע. נסו שוב בעוד רגע', code);
  }
  return data;
}

const FUNCTIONS_BASE = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');

/**
 * Public .ics feed of a unit for pasting into Airbnb / Booking.com.
 * Production uses the real Supabase URL even when the app talks to a local proxy (QA builds).
 */
export function icalExportUrl(property, channel) {
  const token = property?.ical_export_token;
  if (!token) return '';
  const base = /127\.0\.0\.1|localhost/.test(FUNCTIONS_BASE) ? 'https://romvmqbcinurscwdsskx.supabase.co' : FUNCTIONS_BASE;
  return `${base}/functions/v1/ical-export?t=${token}${channel ? `&channel=${channel}` : ''}`;
}

/** Postgres exclusion violation from bookings_no_overlap → one friendly Hebrew sentence. */
export function isOverlapError(e) {
  const s = `${e?.code || ''} ${e?.message || ''} ${e?.details || ''}`;
  return /23P01|bookings_no_overlap|conflicting key value violates exclusion/i.test(s);
}
export const OVERLAP_MESSAGE = 'התאריכים האלה כבר תפוסים ביחידה הזו. בחרו תאריכים אחרים או יחידה אחרת.';

export function minutesAgoHe(iso) {
  if (!iso) return 'עוד לא עודכן';
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'עודכן עכשיו';
  if (m < 60) return `עודכן לפני ${m === 1 ? 'דקה' : `${m} דקות`}`;
  const h = Math.round(m / 60);
  if (h < 24) return `עודכן לפני ${h === 1 ? 'שעה' : `${h} שעות`}`;
  const d = Math.round(h / 24);
  return `עודכן לפני ${d === 1 ? 'יום' : `${d} ימים`}`;
}
