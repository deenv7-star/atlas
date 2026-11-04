// fix/today-tiles: the occupancy sheet splits the month by unit with the same rule as the tile.
import test from 'node:test';
import assert from 'node:assert/strict';
import { monthOccupancy, unitOccupancy } from '../../src/lib/stay/occupancy.js';

const NOW = new Date(2026, 10, 4, 12, 0); // 4 Nov 2026 (30 days)
const b = (id, pid, ci, co, extra = {}) => ({ id, property_id: pid, check_in_date: ci, check_out_date: co, status: 'CONFIRMED', total_price: 1000, ...extra });
const P = [{ id: 'u1', name: 'הגפן' }, { id: 'u2', name: 'הזית' }];

test('per unit nights are clipped to the month and skip cancelled', () => {
  const B = [b('1', 'u1', '2026-10-30', '2026-11-03'), b('2', 'u1', '2026-11-28', '2026-12-02'), b('3', 'u2', '2026-11-10', '2026-11-12', { status: 'CANCELLED' })];
  const r = unitOccupancy({ bookings: B, properties: P, now: NOW });
  assert.deepEqual(r.map((x) => [x.name, x.nights, x.days]), [['הגפן', 5, 30], ['הזית', 0, 30]]);
  assert.equal(r[0].pct, 17);
});

test('units average matches the tile', () => {
  const B = [b('1', 'u1', '2026-11-01', '2026-11-16'), b('2', 'u2', '2026-11-01', '2026-11-04')];
  const r = unitOccupancy({ bookings: B, properties: P, now: NOW });
  const nights = r.reduce((s, x) => s + x.nights, 0);
  assert.equal(Math.round((nights / 60) * 100), monthOccupancy({ bookings: B, unitCount: 2, now: NOW }));
});

test('no units: empty list', () => {
  assert.deepEqual(unitOccupancy({ bookings: [], properties: [], now: NOW }), []);
});
