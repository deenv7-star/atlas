import test from 'node:test';
import assert from 'node:assert/strict';
import { heDate, heNights, nightsBetween, monthGrid, heDateLong, addDays } from '../../src/lib/heDate.js';
import { isPlaceholderUnitName, unitDisplayName, displayUnits } from '../../src/lib/unitName.js';

test('heDate: Hebrew format, never English', () => {
  assert.equal(heDate('2026-11-04'), 'ד׳, 4 בנוב׳ 2026');
  assert.equal(heDate('2026-11-04', { year: 'auto', today: '2026-11-04' }), 'ד׳, 4 בנוב׳');
  assert.equal(heDate('2027-01-01', { year: 'auto', today: '2026-11-04' }), 'ו׳, 1 בינו׳ 2027');
  assert.equal(heDate('bad'), '');
  assert.doesNotMatch(heDate('2026-11-04'), /[A-Za-z]/);
  assert.equal(heDateLong('2026-11-04'), 'יום רביעי, 4 בנובמבר 2026');
});

test('nights + grid', () => {
  assert.equal(nightsBetween('2026-11-04', '2026-11-05'), 1);
  assert.equal(nightsBetween('2026-11-05', '2026-11-04'), 0);
  assert.equal(heNights(1), 'לילה אחד');
  assert.equal(heNights(3), '3 לילות');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  const g = monthGrid(2026, 10); // Nov 2026 starts on Sunday
  assert.equal(g[0][0], '2026-11-01');
  assert.ok(g.every((r) => r.length === 7));
});

test('unit names: the account name is never shown as a unit', () => {
  assert.equal(isPlaceholderUnitName("Deen Vinokur's Organization"), true);
  assert.equal(isPlaceholderUnitName('צימר הגפן'), false);
  assert.equal(isPlaceholderUnitName('Acme', 'acme'), true);
  assert.equal(unitDisplayName("Deen Vinokur's Organization"), 'היחידה שלכם');
  assert.deepEqual(displayUnits([{ id: 'a', name: "X's Organization" }, { id: 'b', name: 'בקתה' }]).map((u) => u.name), ['יחידה 1', 'בקתה']);
});
