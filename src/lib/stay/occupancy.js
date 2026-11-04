import { isActiveBooking, checkOutOf } from './bookings.js';
import { nightsBetween } from './format.js';

/**
 * Booked share of this month's unit-nights, 0..100. Audit 04.11 #7: no units = null (it used to divide
 * by a fake 1 unit and read "7% · 0 יחידות" on a brand-new account).
 */
export function monthOccupancy({ bookings = [], unitCount = 0, now = new Date() } = {}) {
  if (!unitCount) return null;
  const y = now.getFullYear(); const m = now.getMonth();
  const first = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const nextM = `${m === 11 ? y + 1 : y}-${String(m === 11 ? 1 : m + 2).padStart(2, '0')}-01`;
  const days = new Date(y, m + 1, 0).getDate();
  let nights = 0;
  for (const b of bookings) {
    if (!isActiveBooking(b)) continue;
    const s = b.check_in_date > first ? b.check_in_date : first;
    const e = checkOutOf(b) < nextM ? checkOutOf(b) : nextM;
    if (e > s) nights += nightsBetween(s, e);
  }
  return Math.min(100, Math.round((nights / (unitCount * days)) * 100));
}
