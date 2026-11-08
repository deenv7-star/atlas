import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, makeRefCode } from '../../src/features/early/phone.js';

test('normalizePhone accepts Israeli mobiles in common formats', () => {
  assert.equal(normalizePhone('050-1234567'), '0501234567');
  assert.equal(normalizePhone('+972 52 597 9520'), '0525979520');
  assert.equal(normalizePhone('972501234567'), '0501234567');
  assert.equal(normalizePhone(' 054 123 4567 '), '0541234567');
});

test('normalizePhone rejects landlines, short and junk', () => {
  for (const bad of ['04-9921234', '050123', '', null, 'abc', '0501234567890']) assert.equal(normalizePhone(bad), null);
});

test('makeRefCode is 6 url-safe chars and varies', () => {
  const a = makeRefCode(); const b = makeRefCode();
  assert.match(a, /^[a-z0-9]{6}$/);
  assert.notEqual(a, b);
});
