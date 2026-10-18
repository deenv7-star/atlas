import test from 'node:test';
import assert from 'node:assert/strict';
import { heCount } from '../../src/lib/hebrewCount.js';

test('one → singular word with "אחד/אחת", no digit', () => {
  assert.equal(heCount(1, 'unit'), 'יחידה אחת');
  assert.equal(heCount(1, 'booking'), 'הזמנה אחת');
  assert.equal(heCount(1, 'night'), 'לילה אחד');
  assert.equal(heCount(1, 'guest'), 'אורח אחד');
  assert.equal(heCount(1, 'lead'), 'ליד אחד');
  assert.equal(heCount(1, 'property'), 'נכס אחד');
  assert.equal(heCount(1, 'complex'), 'מתחם אחד');
  assert.equal(heCount(1, 'message'), 'הודעה אחת');
  assert.equal(heCount(1, 'payment'), 'תשלום אחד');
});

test('other counts → digit + plural; day has the dual', () => {
  assert.equal(heCount(0, 'unit'), '0 יחידות');
  assert.equal(heCount(3, 'unit'), '3 יחידות');
  assert.equal(heCount(2, 'night'), '2 לילות');
  assert.equal(heCount(2, 'day'), 'יומיים');
  assert.equal(heCount(14, 'day'), '14 ימים');
  assert.equal(heCount('5', 'booking'), '5 הזמנות');
  assert.equal(heCount(undefined, 'unit'), '0 יחידות');
});
