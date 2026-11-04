// Audit 04.11 #7: a new account with no units — no fake occupancy, and no booking without a unit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { monthOccupancy } from '../../src/lib/stay/occupancy.js';
import { makeBookingFormSchema, emptyBookingFormValues } from '../../src/components/forms/atlasFormSchemas.ts';

const NOW = new Date(2026, 10, 4, 12, 0); // 4 Nov 2026
const b = (id, ci, co, extra = {}) => ({ id, property_id: 'u1', check_in_date: ci, check_out_date: co, status: 'CONFIRMED', total_price: 1000, ...extra });

test('no units: occupancy is null, not a percentage', () => {
  assert.equal(monthOccupancy({ bookings: [b('1', '2026-11-03', '2026-11-05')], unitCount: 0, now: NOW }), null);
});

test('with units: booked nights / (units × days in month)', () => {
  // 2 nights in Nov, 1 unit, 30 days → 7%
  assert.equal(monthOccupancy({ bookings: [b('1', '2026-11-03', '2026-11-05')], unitCount: 1, now: NOW }), 7);
  // nights before the month are not counted; cancelled bookings are ignored
  assert.equal(monthOccupancy({ bookings: [b('2', '2026-10-30', '2026-11-02'), b('3', '2026-11-10', '2026-11-20', { status: 'CANCELLED' })], unitCount: 2, now: NOW }), 2);
});

const valid = { ...emptyBookingFormValues, guest_name: 'נועה לוי', check_in_date: '2026-11-10', check_out_date: '2026-11-12' };

test('a booking without a unit does not validate', () => {
  const r = makeBookingFormSchema({ requireProperty: true }).safeParse({ ...valid, property_id: '' });
  assert.equal(r.success, false);
  assert.ok(r.error.issues.some((i) => i.path[0] === 'property_id'));
});

test('a booking with a unit validates', () => {
  const r = makeBookingFormSchema({ requireProperty: true }).safeParse({ ...valid, property_id: 'u1' });
  assert.equal(r.success, true, JSON.stringify(r.error?.issues));
});
