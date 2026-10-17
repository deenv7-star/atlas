/** Per-property guest information (stored in properties.guest_info jsonb, migration 008). */
import { isSupabaseConfigured } from '@/api/supabaseClient';
import { readOrgSettings } from '@/lib/onboarding/orgSettings';

export const GUEST_INFO_DEFAULTS = {
  check_in_time: '15:00',
  check_out_time: '11:00',
  wifi_name: '',
  wifi_password: '',
  house_rules: '',
  arrival_instructions: '',
  host_name: '',
  host_phone: '',
  navigation_query: '',
  closing_line: '',
};

export function guestInfoOf(property) {
  const raw = property?.guest_info;
  let info = raw;
  if (typeof raw === 'string') {
    try { info = JSON.parse(raw); } catch { info = {}; }
  }
  // the owner's own business defaults (set in onboarding) sit between the built-in defaults and the unit's own info
  const org = readOrgSettings();
  const orgDefaults = {};
  if (org.check_in_time) orgDefaults.check_in_time = org.check_in_time;
  if (org.check_out_time) orgDefaults.check_out_time = org.check_out_time;
  if (org.host_name) orgDefaults.host_name = org.host_name;
  if (org.host_phone) orgDefaults.host_phone = org.host_phone;
  if (org.wa_greeting) orgDefaults.closing_line = org.wa_greeting;
  const own = info && typeof info === 'object' ? Object.fromEntries(Object.entries(info).filter(([, v]) => v !== '' && v != null)) : {};
  return { ...GUEST_INFO_DEFAULTS, ...orgDefaults, ...own };
}

export function navigationTarget(property) {
  const info = guestInfoOf(property);
  return (info.navigation_query || property?.address || property?.name || '').trim();
}

export function wazeUrl(query) {
  return `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
}

export function googleMapsUrl(query) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

/** URL-safe random token for a guest link (not guessable). */
export function makeToken(len = 22) {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(len);
  (globalThis.crypto || window.crypto).getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/** Latin slug from a property name; Hebrew names fall back to a short random tail. */
export function makeSlug(name) {
  const latin = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return `${latin || 'stay'}-${makeToken(6).toLowerCase()}`;
}

export function appOrigin() {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

/** '' when the booking has no private token yet on Supabase (the public RPC only accepts tokens). */
export function guestPageUrl(booking) {
  if (!booking?.guest_token && isSupabaseConfigured) return '';
  const token = booking?.guest_token || booking?.id;
  return `${appOrigin()}/g/${encodeURIComponent(token)}`;
}

export function bookingPageUrl(property) {
  const slug = property?.public_slug || property?.id;
  return `${appOrigin()}/book/${encodeURIComponent(slug)}`;
}
