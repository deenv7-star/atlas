// Deen 05.11.2026 batch 1: Today "נכנסו ב…" reads payments received (by paid date), toasts have one host,
// the calendar status line counts only real nights.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { monthlyReceived, receivedThisMonth, paidMonthKey } from '../../src/lib/stay/received.js';
import { computeBrief, nextWeekendNights, nightsLabel } from '../../src/components/calendar/briefModel.js';
import { occupancyByUnit, gapWindows } from '../../src/lib/calendar/calendarModel.js';

const NOW = new Date(2026, 10, 5, 12); // Thu 5 Nov 2026

test('received = PAID payments by paid date; unlinked payments count; pending and other months do not', () => {
  const P = [
    { amount: 500, status: 'PAID', paid_date: '2026-11-02' },                       // linked to nothing: counts
    { amount: '750', status: 'PAID', paid_date: null, created_at: '2026-11-04T09:00:00Z' }, // no paid date: created day
    { amount: 55000, status: 'PENDING' },                                          // not received
    { amount: 300, status: 'PAID', paid_date: '2026-10-30' },                       // last month
    { amount: 200, status: 'REFUNDED', paid_date: '2026-11-03' },
  ];
  assert.equal(receivedThisMonth(P, NOW), 1250);
  assert.deepEqual(monthlyReceived(P, 2, NOW).map((m) => m.value), [300, 1250]);
  assert.equal(paidMonthKey({ paid_date: '2026-11-30' }), '2026-11');
});

test('one toast host: the plain-div shadcn Toaster is gone and use-toast forwards to the sonner API', () => {
  const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
  assert.ok(!/components\/ui\/toaster/.test(app));
  assert.ok(/<AtlasToaster \/>/.test(app));
  assert.ok(!existsSync(new URL('../../src/components/ui/toaster.jsx', import.meta.url)));
  const ut = readFileSync(new URL('../../src/components/ui/use-toast.jsx', import.meta.url), 'utf8');
  assert.ok(/atlasToastApi/.test(ut) && !/const TOAST_REMOVE_DELAY/.test(ut));
  const api = readFileSync(new URL('../../src/components/ui/AtlasToast/atlasToastApi.tsx', import.meta.url), 'utf8');
  assert.ok(/dedupeId\(/.test(api), 'identical toasts share an id');
});

test('payment form lock holds after a success (no double save at 1.5–2s)', () => {
  const src = readFileSync(new URL('../../src/hooks/useFormMachine.ts', import.meta.url), 'utf8');
  assert.ok(!/inFlightRef\.current = false; \}, 1500\)/.test(src));
  assert.ok(/releaseAfterSuccess/.test(src));
});

test('weekend = Thursday and Friday nights from today', () => {
  assert.deepEqual(nextWeekendNights('2026-11-05'), ['2026-11-05', '2026-11-06']);
  assert.deepEqual(nextWeekendNights('2026-11-06'), ['2026-11-06']);
  assert.deepEqual(nextWeekendNights('2026-11-08'), ['2026-11-12', '2026-11-13']);
  assert.equal(nightsLabel(['2026-11-05', '2026-11-06']), '5–6 בנובמבר');
  assert.equal(nightsLabel(['2026-11-30', '2026-12-01']), '30 בנובמבר–1 בדצמבר');
});

test('calendar brief counts real nights only', () => {
  const units = [{ id: 'u1', name: 'הגפן' }, { id: 'u2', name: 'הזית' }];
  const stays = [
    { id: 'a', propertyId: 'u1', start: '2026-11-05', end: '2026-11-07', isBlock: false },
    { id: 'b', propertyId: 'u2', start: '2026-11-03', end: '2026-11-05', isBlock: false },
    { id: 'c', propertyId: 'u2', start: '2026-11-06', end: '2026-11-08', isBlock: false },
  ];
  const days = Array.from({ length: 7 }, (_, i) => `2026-11-0${i + 1}`);
  const b = computeBrief({ days, today: '2026-11-05', units, stays, occ: occupancyByUnit(stays), gaps: gapWindows(stays, { today: '2026-11-05' }) });
  assert.equal(b.total, 14);
  assert.equal(b.booked, 6);
  assert.equal(b.pct, 43);
  assert.equal(b.arrivals, 3);
  assert.equal(b.weekend.free, 1); // u2 on Thu 5 Nov
  assert.equal(b.weekend.first.unit.id, 'u2');
  assert.equal(b.gaps.nights, 1);
  // a period without today has no weekend line
  const later = computeBrief({ days: ['2026-12-01'], today: '2026-11-05', units, stays, occ: occupancyByUnit(stays), gaps: [] });
  assert.equal(later.weekend, null);
  assert.equal(later.empty, true);
});
