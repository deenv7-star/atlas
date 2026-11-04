// Audit 04.11 #3: the assistant gives up on a hung connection (30 s first response, stall timer).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeadline, FIRST_BYTE_MS, STALL_MS } from '../../src/assistant/deadline.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('defaults: 30 s to a first response, a stall timer after that', () => {
  assert.equal(FIRST_BYTE_MS, 30_000);
  assert.ok(STALL_MS > 0 && STALL_MS <= 30_000);
});

test('no response within firstMs: aborts and reports a timeout', async () => {
  const dl = createDeadline(null, { firstMs: 20, stallMs: 1000 });
  await wait(40);
  assert.equal(dl.signal.aborted, true);
  assert.equal(dl.timedOut(), true);
});

test('pieces keep arriving: no timeout; a stall then times out', async () => {
  const dl = createDeadline(null, { firstMs: 30, stallMs: 30 });
  for (let i = 0; i < 4; i += 1) { await wait(15); dl.bump(); }
  assert.equal(dl.signal.aborted, false);
  await wait(50);
  assert.equal(dl.timedOut(), true);
});

test('the stop button aborts without counting as a timeout', async () => {
  const outer = new AbortController();
  const dl = createDeadline(outer.signal, { firstMs: 1000 });
  outer.abort();
  assert.equal(dl.signal.aborted, true);
  assert.equal(dl.timedOut(), false);
  dl.clear();
});

test('clear() stops the timer (a finished answer never times out later)', async () => {
  const dl = createDeadline(null, { firstMs: 20 });
  dl.clear();
  await wait(40);
  assert.equal(dl.signal.aborted, false);
  assert.equal(dl.timedOut(), false);
});

test('an already-aborted outer signal aborts at once', () => {
  const outer = new AbortController(); outer.abort();
  const dl = createDeadline(outer.signal, { firstMs: 1000 });
  assert.equal(dl.signal.aborted, true);
  dl.clear();
});
