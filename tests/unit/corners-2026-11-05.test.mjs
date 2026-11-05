import test from 'node:test';
import assert from 'node:assert/strict';
import { regionHe, foundRows } from '../../src/lib/import/model.js';

test('COPY-1: Airbnb English districts become Hebrew or are dropped', () => {
  assert.equal(regionHe('North District'), 'מחוז הצפון');
  assert.equal(regionHe('Northern District'), 'מחוז הצפון');
  assert.equal(regionHe('Haifa District'), 'מחוז חיפה');
  assert.equal(regionHe('גליל עליון'), 'גליל עליון');
  assert.equal(regionHe('Some County'), '');
  assert.equal(regionHe(''), '');
  const rows = foundRows({ location: { locality: 'נהריה', region: 'North District' } });
  const loc = rows.find((r) => r.id === 'location');
  assert.equal(loc.value, 'נהריה, מחוז הצפון');
});
