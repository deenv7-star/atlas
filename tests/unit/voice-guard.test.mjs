// One tap = one voice session, and the socket tells the server why it closed. npm run test:unit
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStartGuard, START_DEBOUNCE_MS } from '../../src/assistant/voice/startGuard.js';

class FakeWS { constructor() { this.readyState = 1; this.sent = []; FakeWS.last = this; } send(s) { this.sent.push(JSON.parse(s)); } close() {} }
globalThis.WebSocket = FakeWS;
const { RealtimeLink } = await import('../../src/assistant/voice/realtime.js');
const audio = { flush() {}, play() {}, speaking: false };

test('start guard: a double tap (1 s apart, as on 04.11 22:28:27/28) opens one session', () => {
  let t = 1000; const g = createStartGuard(() => t);
  assert.equal(g.tryEnter(), true);
  t += 1; assert.equal(g.tryEnter(), false, 'same-tick second start');
  t += 300; assert.equal(g.tryEnter(), false, 'still running');
  g.release(); t += 300; assert.equal(g.tryEnter(), false, 'debounce after a fast fail');
  t += START_DEBOUNCE_MS; assert.equal(g.tryEnter(), true, 'a real retry later works');
});

test('start guard: busy until released, then the next tap starts again', () => {
  let t = 0; const g = createStartGuard(() => t);
  assert.equal(g.tryEnter(), true); t = 60_000;
  assert.equal(g.tryEnter(), false); assert.equal(g.busy, true);
  g.release(); assert.equal(g.busy, false); assert.equal(g.tryEnter(), true);
});

test('socket close: code, reason, clean flag, age and errors reach the hook', () => {
  let info = null; const events = [];
  const l = new RealtimeLink({ secret: 's', url: 'wss://x', model: 'm', audio, on: { closed: (i) => { info = i; }, event: (k, d) => events.push([k, d]) } });
  const ws = FakeWS.last;
  ws.onopen();
  ws.onerror();
  ws.onclose({ code: 1006, reason: '', wasClean: false });
  assert.equal(info.code, 1006); assert.equal(info.clean, false); assert.equal(info.byUs, false);
  assert.ok(info.open_ms >= 0 && info.age_ms >= 0);
  assert.match(info.errors, /ws_error/);
  assert.equal(events[0][0], 'ws_error');
  assert.equal(l.closedByUs, false);
});

test('a socket error does not end the call by itself (close decides: reconnect once or end)', () => {
  let err = null;
  new RealtimeLink({ secret: 's', url: 'wss://x', model: 'm', audio, on: { error: (c) => { err = c; } } });
  FakeWS.last.onerror();
  assert.equal(err, null);
});

test('server errors are reported (fatal and recoverable) with their code', async () => {
  const events = []; let fatal = null;
  const l = new RealtimeLink({ secret: 's', url: 'wss://x', model: 'm', audio, on: { event: (k, d) => events.push([k, d.code]), error: (c) => { fatal = c; } } });
  await l.handle({ type: 'error', error: { code: 'conversation_already_has_active_response', message: 'x' } });
  await l.handle({ type: 'error', error: { code: 'invalid_client_secret', message: 'bad' } });
  assert.deepEqual(events, [['server_error', 'conversation_already_has_active_response'], ['fatal_error', 'invalid_client_secret']]);
  assert.equal(fatal, 'upstream');
  assert.equal(l.closeInfo({ code: 4001, reason: 'quota', wasClean: true }).reason, 'quota');
});

test('our own close is marked by_us (renewal / hang-up are not reported as drops)', () => {
  let info = null;
  const l = new RealtimeLink({ secret: 's', url: 'wss://x', model: 'm', audio, on: { closed: (i) => { info = i; } } });
  l.close(); FakeWS.last.onclose({ code: 1000, reason: '', wasClean: true });
  assert.equal(info.byUs, true); assert.equal(info.by_us, true);
});
