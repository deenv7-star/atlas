import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heError } from '../../src/lib/heError.js';

const FB = 'לא הצלחנו לשמור. בדקו את החיבור לאינטרנט ונסו שוב.';
test('postgrest "TimeoutError: <hebrew>" shows only the Hebrew', () => {
  assert.equal(heError({ message: 'TimeoutError: החיבור איטי מדי כרגע. נסו שוב בעוד רגע.' }, FB), 'החיבור איטי מדי כרגע. נסו שוב בעוד רגע.');
  assert.equal(heError({ message: 'FetchError: החיבור איטי' }, FB), 'החיבור איטי');
});
test('English-only errors fall back to the Hebrew copy', () => {
  assert.equal(heError({ message: 'TypeError: Failed to fetch' }, FB), FB);
  assert.equal(heError(new Error('duplicate key value violates unique constraint'), FB), FB);
});
test('Hebrew messages pass unchanged', () => {
  assert.equal(heError('כתבו שם', FB), 'כתבו שם');
});
