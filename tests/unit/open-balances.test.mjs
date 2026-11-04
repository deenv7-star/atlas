// fix/today-tiles-c: Today "ממתינים לתשלום" and Money "ממתין לגבייה" read one definition (openBalances).
import test from 'node:test';
import assert from 'node:assert/strict';
import { openBalances, groupPaymentsByBooking } from '../../src/lib/stay/bookings.js';

const TODAY = '2026-11-04';
const b = (id, ci, total, extra = {}) => ({ id, property_id: 'u1', check_in_date: ci, check_out_date: ci, status: 'CONFIRMED', total_price: total, ...extra });
const pay = (bid, amount, status = 'PAID', extra = {}) => ({ id: `p-${bid}-${amount}-${status}`, booking_id: bid, amount, status, paid_date: '2026-11-01', ...extra });

test('unpaid balance of every non-cancelled booking, whatever month, no payment rows needed', () => {
  const B = [b('1', '2026-12-20', 2000), b('2', '2026-11-05', 1500), b('3', '2026-11-10', 900, { status: 'CANCELLED' }), b('4', '2026-11-12', 800, { status: 'WAITLIST' })];
  const r = openBalances(B, groupPaymentsByBooking([pay('2', 500)]), TODAY);
  assert.equal(r.total, 3000);
  assert.equal(r.count, 2);
  assert.deepEqual(r.items.map((x) => x.booking.id), ['2', '1']);
});

test('fully paid and refunds; PENDING payment rows do not count as paid', () => {
  const B = [b('1', '2026-11-20', 1000), b('2', '2026-11-21', 1000), b('3', '2026-11-22', 1000)];
  const P = [pay('1', 1000), pay('2', 1000), pay('2', 300, 'REFUNDED'), pay('3', 1000, 'PENDING')];
  const r = openBalances(B, groupPaymentsByBooking(P), TODAY);
  assert.deepEqual(r.items.map((x) => [x.booking.id, x.balance.balance]), [['2', 300], ['3', 1000]]);
  assert.equal(r.total, 1300);
});

test('overdue first and counted', () => {
  const B = [b('a', '2026-11-30', 700), b('late', '2026-10-28', 400)];
  const r = openBalances(B, new Map(), TODAY);
  assert.equal(r.items[0].booking.id, 'late');
  assert.equal(r.overdue, 1);
});

test('nothing owed: zero', () => {
  assert.deepEqual(openBalances([], new Map(), TODAY), { items: [], total: 0, count: 0, overdue: 0 });
});
