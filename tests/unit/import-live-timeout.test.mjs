// Live bug 05.11.2026: the global Supabase fetch cut every call at 15 s, so a real property import (10–40 s) was
// aborted by the app before the function answered. property-import gets 2 min; everything else keeps its old limit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { requestTimeoutMs, REQUEST_TIMEOUT_MS, LONG_FUNCTION_TIMEOUT_MS, UPLOAD_TIMEOUT_MS } from '../../src/lib/requestTimeout.js';

const FN = 'https://romvmqbcinurscwdsskx.supabase.co/functions/v1';

test('property-import (import + save_photos) waits long enough for a real import', () => {
  assert.equal(requestTimeoutMs(`${FN}/property-import`, '{"op":"import"}'), LONG_FUNCTION_TIMEOUT_MS);
  assert.equal(requestTimeoutMs(`${FN}/property-import?forceFunctionRegion=eu-central-2`, '{}'), LONG_FUNCTION_TIMEOUT_MS);
  assert.ok(LONG_FUNCTION_TIMEOUT_MS >= 40_000 + 45_000, 'covers the server budget: fetch 40 s + model 45 s');
  assert.ok(LONG_FUNCTION_TIMEOUT_MS < 150_000, 'stays inside the edge wall clock');
});

test('everything else keeps its limits', () => {
  assert.equal(REQUEST_TIMEOUT_MS, 15000);
  assert.equal(requestTimeoutMs(`${FN}/ai-chat`, '{}'), REQUEST_TIMEOUT_MS);
  assert.equal(requestTimeoutMs(`${FN}/property-importer`, '{}'), REQUEST_TIMEOUT_MS);
  assert.equal(requestTimeoutMs('https://x.supabase.co/rest/v1/properties?select=*', undefined), REQUEST_TIMEOUT_MS);
  assert.equal(requestTimeoutMs('https://x.supabase.co/storage/v1/object/atlas-files/a.jpg', new Blob(['x'])), UPLOAD_TIMEOUT_MS);
  assert.equal(requestTimeoutMs(undefined, undefined), REQUEST_TIMEOUT_MS);
});
