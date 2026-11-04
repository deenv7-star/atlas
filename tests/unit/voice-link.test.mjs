// The voice socket never leaves a question unanswered and never dies on a recoverable error. npm run test:unit
import test from 'node:test';
import assert from 'node:assert/strict';

class FakeWS { constructor() { this.readyState = 1; this.sent = []; FakeWS.last = this; } send(s) { this.sent.push(JSON.parse(s)); } close() {} }
globalThis.WebSocket = FakeWS;
const { RealtimeLink, FATAL_ERRORS, ANSWER_WATCHDOG_MS } = await import('../../src/assistant/voice/realtime.js');

const audio = { flush() {}, play() {}, speaking: false };
const make = (on = {}) => { const events = []; const l = new RealtimeLink({ secret: 's', url: 'wss://x', model: 'm', audio, on: { state: (s) => events.push(s), ...on } }); return { l, ws: FakeWS.last, events }; };
const creates = (ws) => ws.sent.filter((m) => m.type === 'response.create').length;
const tick = () => new Promise((r) => setTimeout(r, 0));

test('tool results are answered once, after the running response ends (no response.create race)', async () => {
  const { l, ws } = make({ tool: async () => ({ arrivals: [] }) });
  await l.handle({ type: 'response.created' });
  await l.handle({ type: 'response.function_call_arguments.done', name: 'get_day_overview', arguments: '{}', call_id: 'c1' });
  await l.handle({ type: 'response.function_call_arguments.done', name: 'get_leads', arguments: '{}', call_id: 'c2' });
  assert.equal(creates(ws), 0, 'asked for an answer while a response was still active');
  assert.equal(ws.sent.filter((m) => m.item?.type === 'function_call_output').length, 2);
  await l.handle({ type: 'response.done', response: { status: 'completed', output: [{ type: 'function_call' }] } });
  assert.equal(creates(ws), 1);
});

test('a tool that throws still answers the model (never silence)', async () => {
  const { l, ws } = make({ tool: async () => { throw new Error('net'); } });
  await l.handle({ type: 'response.function_call_arguments.done', name: 'get_money', arguments: '{}', call_id: 'c1' });
  const out = ws.sent.find((m) => m.item?.type === 'function_call_output');
  assert.match(out.item.output, /lookup_failed/);
  assert.equal(creates(ws), 1);
});

test('an empty or failed response is retried once instead of leaving the owner in silence', async () => {
  const { l, ws } = make();
  await l.handle({ type: 'response.created' });
  await l.handle({ type: 'response.done', response: { status: 'failed', output: [] } });
  assert.equal(creates(ws), 1);
  await l.handle({ type: 'response.done', response: { status: 'failed', output: [] } });
  assert.equal(creates(ws), 1, 'retries only once');
});

test('recoverable server errors do not end the call; auth/expiry do', async () => {
  let fatal = null;
  const { l } = make({ error: (c) => { fatal = c; } });
  await l.handle({ type: 'error', error: { code: 'conversation_already_has_active_response', message: 'already has an active response' } });
  await l.handle({ type: 'error', error: { code: 'response_cancel_not_active' } });
  assert.equal(fatal, null);
  await l.handle({ type: 'error', error: { code: 'session_expired' } });
  assert.equal(fatal, 'expired');
  assert.ok(FATAL_ERRORS.has('invalid_api_key'));
});

test('watchdog: a finished turn with no answer gets one nudge', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let unanswered = 0;
  const { l, ws } = make({ unanswered: () => { unanswered += 1; } });
  await l.handle({ type: 'input_audio_buffer.speech_stopped' });
  t.mock.timers.tick(ANSWER_WATCHDOG_MS + 10);
  assert.equal(creates(ws), 1);
  await l.handle({ type: 'response.done', response: { status: 'completed', output: [] } }); // still nothing said → no second retry (already nudged)
  t.mock.timers.tick(ANSWER_WATCHDOG_MS + 10);
  assert.ok(unanswered >= 1);
  await tick;
});

test('typed text inside a voice call never double-creates a response', async () => {
  const { l, ws } = make();
  await l.handle({ type: 'response.created' });
  l.sayText('ומחר?');
  assert.equal(creates(ws), 0);
  await l.handle({ type: 'response.done', response: { status: 'completed', output: [{ type: 'message', content: [{ transcript: 'כן' }] }] } });
  assert.equal(creates(ws), 1);
});
