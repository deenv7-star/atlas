/**
 * Bookings page v2 (05.11.2026): pure helpers. The page answers three questions for a zimmer owner:
 * what bookings do I have, which need me, and what do I do next. Everything here is plain data so it is
 * unit tested (tests/unit/bookings-v2-model.test.mjs).
 */
import { addDays, nightsBetween, parseDay } from '../../lib/stay/format.js';
import { checkOutOf, channelOf } from '../../lib/stay/bookings.js';

const up = (s) => String(s || '').toUpperCase();
export const isCancelled = (b) => ['CANCELLED', 'CANCELED'].includes(up(b?.status));
export const isPending = (b) => ['PENDING', 'WAITLIST'].includes(up(b?.status));
/** Came in from a Booking / Airbnb / iCal calendar sync: the channel owns it, the next sync rewrites it. */
export const isImported = (b) => !!(b?.external_sync_id || b?.external_uid);

/** Dates the owner closed in the calendar ("חסום"): not a booking, so not on this page (calendarModel.js rule). */
export const isOwnerBlock = (b) => !!b?.is_block && !b?.external_sync_id && channelOf(b).key === 'direct';

/** Status the owner reads on a row. Only the ones that need a word; a normal confirmed future stay says nothing. */
export function statusOf(b, day) {
  if (isCancelled(b)) return { key: 'cancelled', label: 'בוטלה' };
  if (isPending(b)) return { key: 'pending', label: 'ממתינה לאישור' };
  const out = checkOutOf(b);
  if (out && out < day) return { key: 'past', label: 'הסתיימה' };
  if (b.check_in_date && b.check_in_date <= day && out >= day) return { key: 'staying', label: out === day ? 'יוצאים היום' : b.check_in_date === day ? 'מגיעים היום' : 'בשהייה' };
  return { key: 'confirmed', label: 'מאושרת' };
}

/** Money chip. bal = model.balanceFor(b): { total, paid, balance, unknown }. */
export function payOf(bal) {
  if (!bal || bal.unknown) return { key: 'unknown', label: '' };
  if (!bal.total) return { key: 'none', label: 'בלי מחיר' };
  if (bal.balance <= 0) return { key: 'paid', label: 'שולם' };
  if (bal.paid > 0) return { key: 'partial', label: 'שולמה מקדמה' };
  return { key: 'unpaid', label: 'לא שולם' };
}

export function sourceOf(b) {
  const ch = channelOf(b);
  return { key: ch.key, label: ch.key === 'booking' ? 'Booking' : ch.label };
}

export const nightsOf = (b) => Math.max(1, nightsBetween(b.check_in_date, checkOutOf(b)) || Number(b.nights) || 1);
export const nightsLabel = (n) => (n === 1 ? 'לילה אחד' : `${n} לילות`);

/** Filter chips. `upcoming` is the default view: everything not finished and not cancelled. */
export const CHIPS = [
  { key: 'upcoming', label: 'קרובות' },
  { key: 'pending', label: 'ממתינות לאישור' },
  { key: 'unpaid', label: 'חסר תשלום' },
  { key: 'past', label: 'עבר' },
  { key: 'cancelled', label: 'בוטלו' },
];

export function matchesChip(chip, b, day, bal) {
  const out = checkOutOf(b);
  const live = !isCancelled(b) && (!out || out >= day);
  if (chip === 'upcoming') return live;
  if (chip === 'pending') return live && isPending(b);
  if (chip === 'unpaid') return !isCancelled(b) && !!bal && !bal.unknown && bal.total > 0 && bal.balance > 0;
  if (chip === 'past') return !isCancelled(b) && !!out && out < day;
  if (chip === 'cancelled') return isCancelled(b);
  return true;
}

/** Map the legacy ?tab= values (Today / calendar links) onto a chip. */
export function chipFromTab(tab) {
  if (tab === 'pending') return 'pending';
  if (tab === 'cancelled') return 'cancelled';
  return 'upcoming';
}

const startOfWeekSat = (day) => {
  // Israeli week: Sunday..Saturday. "השבוע" = from tomorrow until this Saturday.
  const d = parseDay(day);
  const toSat = (6 - d.getDay() + 7) % 7;
  return addDays(day, toSat);
};

/**
 * Group a chip's rows for reading. Upcoming-type chips: עכשיו והיום / השבוע / בהמשך (by check-in, soonest first).
 * Past / cancelled: one group, newest first.
 */
export function groupRows(chip, rows, day) {
  if (chip === 'past' || chip === 'cancelled') {
    const list = [...rows].sort((a, b) => String(b.check_in_date || '').localeCompare(String(a.check_in_date || '')));
    return list.length ? [{ key: chip, label: chip === 'past' ? 'שהיות שהסתיימו' : 'הזמנות שבוטלו', rows: list }] : [];
  }
  const sat = startOfWeekSat(day);
  const sorted = [...rows].sort((a, b) => String(a.check_in_date || '').localeCompare(String(b.check_in_date || '')));
  const g = { now: [], week: [], later: [], past: [] };
  for (const b of sorted) {
    const ci = b.check_in_date || '';
    const out = checkOutOf(b);
    if (out && out < day) g.past.push(b);
    else if (ci <= day) g.now.push(b);
    else if (ci <= sat && ci !== day) g.week.push(b);
    else g.later.push(b);
  }
  return [
    { key: 'now', label: 'היום', rows: g.now },
    { key: 'week', label: day === sat ? 'מחר והלאה' : 'השבוע', rows: g.week },
    { key: 'later', label: 'בהמשך', rows: g.later },
    { key: 'past', label: 'הסתיימו', rows: g.past.reverse() },
  ].filter((x) => x.rows.length);
}

/** One line telling the owner what this booking needs from them, or null. */
export function nextStepOf(b, bal, day) {
  if (isCancelled(b)) return null;
  if (isPending(b)) return { key: 'approve', text: 'מחכה לאישור שלכם' };
  const out = checkOutOf(b);
  if (out && out < day) return bal && !bal.unknown && bal.total > 0 && bal.balance > 0 ? { key: 'pay', text: 'נשארה יתרה לגבות' } : null;
  if (bal && !bal.unknown && !bal.total && !isImported(b)) return { key: 'price', text: 'אין מחיר. הוסיפו מחיר כדי לעקוב אחרי תשלום' };
  if (bal && !bal.unknown && bal.total > 0 && bal.balance > 0) return { key: 'pay', text: bal.paid > 0 ? 'נשארה יתרה לגבות' : 'עוד לא התקבל תשלום' };
  return null;
}

export function searchMatch(q, b, unitName = '') {
  const s = String(q || '').trim().toLowerCase();
  if (!s) return true;
  return [b.guest_name, b.guest_phone, b.guest_email, unitName].some((x) => String(x || '').toLowerCase().includes(s));
}

/** A/B flag: ?bk=a|b (remembered), default A. */
export const BOOKINGS_DEFAULT_VARIANT = 'a';
export function readBookingsVariant() {
  if (typeof window === 'undefined') return BOOKINGS_DEFAULT_VARIANT;
  try {
    const q = new URLSearchParams(window.location.search).get('bk');
    if (q === 'a' || q === 'b') { localStorage.setItem('atlas_bookings_variant', q); return q; }
    const s = localStorage.getItem('atlas_bookings_variant');
    if (s === 'a' || s === 'b') return s;
  } catch { /* storage off */ }
  return BOOKINGS_DEFAULT_VARIANT;
}
