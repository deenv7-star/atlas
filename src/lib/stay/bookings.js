/** Pure booking math shared by Today, balances, reports and the double-booking guard. */
import { parseDay, todayISO, nightsBetween, addDays } from './format';

export const INACTIVE_STATUSES = new Set(['CANCELLED', 'CANCELED', 'WAITLIST', 'cancelled', 'canceled', 'waitlist']);

export function isActiveBooking(b) {
  return !!b && !INACTIVE_STATUSES.has(b.status) && !!b.check_in_date;
}

/** The thing that cannot be double booked: unit when the booking has one, otherwise the property. */
export function unitKeyOf(b) {
  return b?.unit_id || b?.property_id || '';
}

export function checkOutOf(b) {
  if (b.check_out_date) return b.check_out_date;
  const d = parseDay(b.check_in_date);
  if (!d) return '';
  d.setDate(d.getDate() + Math.max(1, Number(b.nights) || 1));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Half-open night ranges: a check-out and a check-in on the same day do not clash. */
export function rangesOverlap(aIn, aOut, bIn, bOut) {
  if (!aIn || !bIn) return false;
  const aEnd = aOut && aOut > aIn ? aOut : addDays(aIn, 1);
  const bEnd = bOut && bOut > bIn ? bOut : addDays(bIn, 1);
  return aIn < bEnd && bIn < aEnd;
}

/**
 * Bookings that overlap a candidate in the same unit.
 * candidate: { property_id, unit_id?, check_in_date, check_out_date }
 */
export function findOverlaps(bookings, candidate, excludeId) {
  const key = unitKeyOf(candidate);
  if (!key || !candidate?.check_in_date) return [];
  const cOut = checkOutOf(candidate);
  return (bookings || []).filter((b) =>
    b.id !== excludeId
    && isActiveBooking(b)
    && unitKeyOf(b) === key
    && rangesOverlap(candidate.check_in_date, cOut, b.check_in_date, checkOutOf(b)),
  );
}

// ─── Channels ────────────────────────────────────────────────────────────────
export const CHANNELS = {
  booking: { key: 'booking', label: 'Booking.com', color: 'var(--channel-booking)' },
  airbnb: { key: 'airbnb', label: 'Airbnb', color: 'var(--channel-airbnb)' },
  direct: { key: 'direct', label: 'ישיר', color: 'var(--channel-direct)' },
  other: { key: 'other', label: 'אחר', color: 'var(--channel-other)' },
};

export function channelOf(b) {
  const raw = String(b?.booking_source || b?.source || '').toLowerCase();
  if (raw.includes('booking')) return CHANNELS.booking;
  if (raw.includes('airbnb')) return CHANNELS.airbnb;
  if (!raw || ['direct', 'website', 'phone', 'whatsapp', 'ישיר', 'direct_page', 'instagram', 'facebook', 'manual'].includes(raw)) return CHANNELS.direct;
  return CHANNELS.other;
}

// ─── Money ───────────────────────────────────────────────────────────────────
const PAID = new Set(['PAID', 'paid', 'COMPLETED', 'completed', 'succeeded', 'SUCCEEDED']);
const REFUNDED = new Set(['REFUNDED', 'refunded']);

export function isPaid(p) {
  return PAID.has(p?.status);
}

export function groupPaymentsByBooking(payments) {
  const map = new Map();
  for (const p of payments || []) {
    if (!p.booking_id) continue;
    if (!map.has(p.booking_id)) map.set(p.booking_id, []);
    map.get(p.booking_id).push(p);
  }
  return map;
}

/**
 * Deposit / balance picture for one booking.
 * deposit: paid payments typed 'deposit', otherwise the first paid payment when it is less than the total.
 */
export function balanceOf(booking, bookingPayments = [], today = todayISO()) {
  const total = Number(booking?.total_price) || 0;
  const paidList = bookingPayments.filter(isPaid).sort((a, b) => String(a.paid_at || a.paid_date || a.created_at || '').localeCompare(String(b.paid_at || b.paid_date || b.created_at || '')));
  const refunded = bookingPayments.filter((p) => REFUNDED.has(p.status)).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const paid = Math.max(0, paidList.reduce((s, p) => s + (Number(p.amount) || 0), 0) - refunded);
  const typedDeposit = paidList.filter((p) => String(p.type || '').toLowerCase() === 'deposit');
  let deposit = typedDeposit.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  if (!typedDeposit.length && paidList.length && Number(paidList[0].amount) < total) deposit = Number(paidList[0].amount) || 0;
  const balance = Math.max(0, total - paid);

  const pendingDue = bookingPayments
    .filter((p) => !isPaid(p) && !REFUNDED.has(p.status) && p.due_date)
    .map((p) => String(p.due_date).slice(0, 10))
    .sort()[0];
  const dueDate = pendingDue || booking?.check_in_date || '';
  const overdue = balance > 0 && !!dueDate && dueDate < today && isActiveBooking(booking);
  const dueSoon = balance > 0 && !overdue && !!dueDate && nightsBetween(today, dueDate) <= 3;

  let state = 'paid';
  if (total <= 0) state = 'no_price';
  else if (balance <= 0) state = 'paid';
  else if (paid <= 0) state = 'unpaid';
  else state = 'partial';

  return { total, paid, deposit, balance, dueDate, overdue, dueSoon, state };
}
