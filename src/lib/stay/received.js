/**
 * Money that actually came in, by the month it was paid (Deen 05.11.2026).
 *
 * Today's "נכנסו ב{חודש}" used to read monthlyRevenue(): bookings by CHECK-IN month (full price when confirmed,
 * the paid part when pending). A payment that was not linked to a booking, or that paid for a stay in another month,
 * never moved it, so after saving a payment the hero still said ₪0. "נכנסו" means received: paid payments, by the
 * day they were paid (paid_date, else paid_at, else when the row was created). Same definition as the Money page's
 * "התקבל ב{חודש}" tile, so both screens show the same number.
 */
import { isPaid } from './bookings.js';

const pad = (n) => String(n).padStart(2, '0');
const ymOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/** 'YYYY-MM' of the day a payment was received, in the device's local time. '' when unknown. */
export function paidMonthKey(p) {
  if (!p) return '';
  if (p.paid_date) return String(p.paid_date).slice(0, 7); // a DATE column: already the owner's calendar day
  const ts = p.paid_at || p.created_date || p.created_at;
  if (!ts) return '';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '' : ymOf(d);
}

/** Paid amount per month for the last `count` months, oldest → current: [{ key, value }]. */
export function monthlyReceived(payments, count = 6, now = new Date()) {
  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: ymOf(d), value: 0 });
  }
  const byKey = new Map(out.map((m) => [m.key, m]));
  for (const p of payments || []) {
    if (!isPaid(p)) continue;
    const m = byKey.get(paidMonthKey(p));
    if (m) m.value += Number(p.amount) || 0;
  }
  return out;
}

/** What came in during the month of `now`. */
export function receivedThisMonth(payments, now = new Date()) {
  return monthlyReceived(payments, 1, now)[0].value;
}
