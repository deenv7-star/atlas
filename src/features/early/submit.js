/**
 * /early waitlist: where a signup goes.
 *
 * Production today (no migration, no deploy needed): public.contact_messages, the table behind the site's
 * contact form. anon has column INSERT (name, email, phone, subject, message, source) and an insert-only RLS
 * policy (migration 013b / 034); a BEFORE INSERT guard rate-limits per email (3 / 10 min) and globally
 * (30 / min). Platform admins read the rows in the admin console ("פניות מהאתר").
 *   source  = 'waitlist'
 *   subject = 'waitlist:early:<variant>'
 *   email   = the table requires one; the form does not ask for it, so we store a per-phone placeholder
 *             (<digits>@waitlist.atlas-il.com). That also makes the guard's per-email limit a per-phone limit.
 *   message = one line per field (units, complex, area, own ref code, referred-by code, variant, page).
 * anon cannot SELECT contact_messages, so this path can NOT return a place in line or a spots-left count.
 *
 * Optional, after Deen approves migration 039_waitlist.sql: set VITE_WAITLIST_RPC=1 and the page calls
 * public.join_waitlist(...) (returns the real position and spots left) and public.waitlist_stats().
 *
 * Without Supabase (local QA build): demo mode, nothing leaves the browser.
 */
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

export const FOUNDING_SPOTS = 50;
const RPC_ON = import.meta.env.VITE_WAITLIST_RPC === '1';

/** Israeli mobile → 05XXXXXXXX, or null. */
export function normalizePhone(raw) {
  let d = String(raw || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+972')) d = '0' + d.slice(4);
  else if (d.startsWith('972')) d = '0' + d.slice(3);
  d = d.replace(/\D/g, '');
  return /^05\d{8}$/.test(d) ? d : null;
}

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export function makeRefCode() {
  const a = new Uint8Array(6);
  (globalThis.crypto || window.crypto).getRandomValues(a);
  return Array.from(a, (n) => ALPHABET[n % ALPHABET.length]).join('');
}

/** ?ref=<code> from the URL, sanitized. */
export function incomingRef() {
  try {
    const r = new URLSearchParams(window.location.search).get('ref') || '';
    return /^[a-z0-9]{4,12}$/.test(r) ? r : null;
  } catch { return null; }
}

export const mode = () => (isSupabaseConfigured && supabase ? (RPC_ON ? 'rpc' : 'contact') : 'demo');

/** Real spots-left only when the RPC exists; otherwise null (the page then shows "50 מקומות בלבד"). */
export async function fetchSpotsLeft() {
  if (mode() !== 'rpc') return null;
  try {
    const { data, error } = await supabase.rpc('waitlist_stats');
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return typeof row?.spots_left === 'number' ? row.spots_left : null;
  } catch { return null; }
}

/**
 * @returns {Promise<{ ok: boolean, position?: number|null, refCode?: string, error?: string }>}
 */
export async function joinWaitlist({ name, phone, units, complex, consent, website, variant }) {
  if (website) return { ok: true, position: null, refCode: makeRefCode() }; // honeypot: look fine, store nothing
  const cleanName = String(name || '').trim().slice(0, 120);
  if (!cleanName) return { ok: false, error: 'כתבו את השם שלכם.' };
  const p = normalizePhone(phone);
  if (!p) return { ok: false, error: 'בדקו את מספר הטלפון. צריך מספר נייד, למשל 050-1234567.' };
  if (!units) return { ok: false, error: 'בחרו כמה יחידות יש לכם.' };
  if (!consent) return { ok: false, error: 'סמנו שמותר לחזור אליכם, כדי שנוכל לשמור לכם מקום.' };
  const refCode = makeRefCode();
  const referredBy = incomingRef();
  const m = mode();

  if (m === 'demo') {
    await new Promise((r) => setTimeout(r, 450));
    try { localStorage.setItem('atlas_early_demo', JSON.stringify({ at: Date.now(), refCode })); } catch { /* ignore */ }
    return { ok: true, position: null, refCode, demo: true };
  }

  if (m === 'rpc') {
    const { data, error } = await supabase.rpc('join_waitlist', {
      p_name: cleanName, p_phone: p, p_units: String(units), p_complex: String(complex || '').slice(0, 200) || null,
      p_ref: referredBy, p_variant: variant, p_consent: true,
    });
    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      return { ok: true, position: row?.position ?? null, refCode: row?.ref_code || refCode };
    }
    // fall through to the contact path so a signup is never lost
  }

  const message = [
    `רשימת המתנה (early, גרסה ${variant})`,
    `יחידות: ${units}`,
    complex ? `מתחם / אזור: ${String(complex).slice(0, 200)}` : null,
    `קוד הפניה שלו: ${refCode}`,
    referredBy ? `הגיע מהפניה: ${referredBy}` : null,
    'הסכמה לחזרה בטלפון ובוואטסאפ: כן',
  ].filter(Boolean).join('\n');
  const { error } = await supabase.from('contact_messages').insert({
    name: cleanName,
    email: `${p}@waitlist.atlas-il.com`,
    phone: p,
    subject: `waitlist:early:${variant}`,
    message,
    source: 'waitlist',
  });
  if (!error) return { ok: true, position: null, refCode };
  if (/[\u0590-\u05FF]/.test(error.message || '')) return { ok: false, error: error.message };
  return { ok: false, error: 'לא הצלחנו לשמור. נסו שוב בעוד רגע.' };
}
