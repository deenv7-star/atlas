// Calendar v2 model: weeks start Sunday, half-day bars, gaps, owner blocks vs iCal channel stays.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  monthMatrix, toStays, weekSegment, gapWindows, occupancyByUnit, freeUnitsOn, buildHolidayMap, rangeSegment,
} from '../../src/lib/calendar/calendarModel.js';

test('month matrix starts on Sunday and covers the month', () => {
  const w = monthMatrix(new Date(2026, 9, 20, 12));
  assert.equal(w[0][0], '2026-09-27'); // Sunday before 1 Oct 2026 (Thursday)
  assert.equal(w[0][4], '2026-10-01');
  assert.ok(w.flat().includes('2026-10-31'));
  assert.equal(w.length, 5);
});

test('stays: cancelled dropped, owner block vs channel import', () => {
  const s = toStays([
    { id: 1, property_id: 'u', check_in_date: '2026-10-04', check_out_date: '2026-10-07', source: 'airbnb', is_block: true, status: 'CONFIRMED' },
    { id: 2, property_id: 'u', check_in_date: '2026-10-10', check_out_date: '2026-10-12', source: 'manual', is_block: true, status: 'CONFIRMED' },
    { id: 3, property_id: 'u', check_in_date: '2026-10-15', nights: 2, status: 'CANCELLED' },
    { id: 4, property_id: 'u', check_in_date: '2026-10-20', nights: 2, status: 'PENDING' },
  ]);
  assert.deepEqual(s.map((x) => [x.id, x.channel, x.isBlock, x.pending]), [[1, 'airbnb', false, false], [2, 'block', true, false], [4, 'direct', false, true]]);
  assert.equal(s[2].end, '2026-10-22');
});

test('week segment: check-in and check-out are half days', () => {
  const week = ['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'];
  const [st] = toStays([{ id: 1, property_id: 'u', check_in_date: '2026-10-04', check_out_date: '2026-10-07' }]);
  assert.deepEqual(weekSegment(st, week), { from: 0.5, to: 3.5, startsHere: true, endsHere: true });
  const [cross] = toStays([{ id: 2, property_id: 'u', check_in_date: '2026-10-09', check_out_date: '2026-10-12' }]);
  assert.deepEqual(weekSegment(cross, week), { from: 5.5, to: 7, startsHere: true, endsHere: false });
  const next = ['2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17'];
  assert.deepEqual(weekSegment(cross, next), { from: 0, to: 1.5, startsHere: false, endsHere: true });
  assert.deepEqual(rangeSegment(st, week), { from: 0.5, to: 3.5, startsHere: true, endsHere: true });
});

test('gaps: 1–3 free nights between stays of one unit, from today on', () => {
  const s = toStays([
    { id: 1, property_id: 'u', check_in_date: '2026-10-19', check_out_date: '2026-10-21' },
    { id: 2, property_id: 'u', check_in_date: '2026-10-23', check_out_date: '2026-10-26' },
    { id: 3, property_id: 'u', check_in_date: '2026-11-05', check_out_date: '2026-11-08' },
  ]);
  assert.deepEqual(gapWindows(s, { today: '2026-10-20' }), [{ propertyId: 'u', start: '2026-10-21', end: '2026-10-23', nights: 2 }]);
  const occ = occupancyByUnit(s);
  assert.equal(freeUnitsOn(occ, [{ id: 'u' }, { id: 'v' }], '2026-10-20'), 1);
  assert.equal(freeUnitsOn(occ, [{ id: 'u' }, { id: 'v' }], '2026-10-21'), 2); // check-out day night is free
});

test('holidays: bundled Hebcal list when the server has none', () => {
  const m = buildHolidayMap(null);
  assert.equal(m.get('2026-10-03')[0].title, 'שמיני עצרת');
  assert.equal(m.get('2026-10-03')[0].yomtov, true);
  const srv = buildHolidayMap([{ day: '2026-12-04', kind: 'holiday', title_he: 'חֲנוּכָּה: א׳ נֵר', yomtov: false }]);
  assert.equal(srv.get('2026-12-04')[0].title, 'חנוכה א׳ נר');
});
