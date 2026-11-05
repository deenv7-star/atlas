// node --test supabase/tests/brain.test.mjs   (the assistant brain: tools, proposals, prompt, loop, voice secret)
import test from 'node:test';
import assert from 'node:assert/strict';
import { fakeDb } from './fakeDb.mjs';
import { runTool, forModel, TOOL_DEFS, TOOL_NAMES, WRITE_TOOLS, chatTools, realtimeTools } from '../functions/_shared/brain/tools.js';
import { runBrain, NO_ANSWER } from '../functions/_shared/brain/loop.js';
import { brainPrompt, NATIVE_RULE } from '../functions/_shared/brain/prompt.js';
import { searchHelp, kbDigest, ROUTE_SET } from '../functions/_shared/brain/knowledge.js';
import { secretRequest, clientPayload, VOICE, closeLog, eventLog } from '../functions/voice-session/core.js';
import { ATLAS_PERSON, PERSONA } from '../functions/_shared/brain/persona.js';
import { askWorld, plainAnswer, businessArea, worldInstructions, searchAllowed, WORLD } from '../functions/_shared/brain/world.js';

const TODAY = '2026-11-04';
const T = () => ({
  properties: [
    { id: 'u1', org_id: 'org-a', name: 'בקתת הגפן', base_price: 900, max_guests: 4 },
    { id: 'u2', org_id: 'org-a', name: 'הסוויטה', base_price: 1200, max_guests: 2 },
    { id: 'x1', org_id: 'org-b', name: 'צימר של מישהו אחר', base_price: 500 },
  ],
  bookings: [
    { id: 'b1', org_id: 'org-a', property_id: 'u1', guest_name: 'יואב כהן', guest_phone: '050-1234567', guest_email: 'y@x.com', check_in_date: '2026-11-04', check_out_date: '2026-11-06', total_price: 1800, status: 'CONFIRMED', is_block: false, notes: 'אלרגי' },
    { id: 'b2', org_id: 'org-a', property_id: 'u2', guest_name: 'משפחת לוי', check_in_date: '2026-11-02', check_out_date: '2026-11-04', total_price: 2400, status: 'CONFIRMED', is_block: false },
    { id: 'b3', org_id: 'org-a', property_id: 'u2', guest_name: 'דנה', check_in_date: '2026-10-28', check_out_date: '2026-11-03', total_price: 3000, status: 'CANCELLED', is_block: false },
    { id: 'b4', org_id: 'org-a', property_id: 'u1', guest_name: null, check_in_date: '2026-11-10', check_out_date: '2026-11-12', status: 'CONFIRMED', is_block: true },
    { id: 'bx', org_id: 'org-b', property_id: 'x1', guest_name: 'זר', check_in_date: '2026-11-04', check_out_date: '2026-11-05', total_price: 999, status: 'CONFIRMED' },
  ],
  payments: [
    { org_id: 'org-a', booking_id: 'b1', amount: 600, status: 'PAID', paid_date: '2026-11-01' },
    { org_id: 'org-a', booking_id: 'b2', amount: 2400, status: 'PAID', paid_date: '2026-10-20' },
  ],
  expenses: [{ org_id: 'org-a', category: 'ניקיון', amount: 350, expense_date: '2026-11-02' }],
  leads: [
    { id: 'l1', org_id: 'org-a', full_name: 'רונית אברהם', phone: '052', status: 'NEW', created_at: '2026-11-01T10:00:00Z', check_in_date: '2026-12-24', check_out_date: '2026-12-26', adults: 2 },
    { id: 'l2', org_id: 'org-a', full_name: 'אבי', status: 'WON', created_at: '2026-10-01T10:00:00Z' },
  ],
  cleaning_tasks: [{ id: 'c1', org_id: 'org-a', property_id: 'u2', status: 'PENDING', scheduled_date: '2026-11-04', title: 'ניקיון אחרי יציאה' }],
  calendar_syncs: [{ org_id: 'org-a', property_id: 'u1', provider: 'booking', is_active: true, sync_status: 'ok', last_success_at: '2026-11-04T08:00:00Z' }],
  automation_rules: [{ org_id: 'org-a', name: 'יום לפני ההגעה', trigger: 'before_arrival', is_active: true }],
  profiles: [{ id: 'user-a', full_name: 'דין וינוקור', organization_id: 'org-a', selected_plan: 'starter', trial_ends_at: '2026-11-10T00:00:00Z' }],
  organizations: [{ id: 'org-a', name: 'בקתות בגליל', subscription_plan: 'starter', address: 'חד-נס, רמת הגולן', settings: { check_in_time: '15:00' } }],
});
const ctx = (over = {}) => ({ db: fakeDb(T()), userId: 'user-a', today: TODAY, ...over });
const call = (name, args, c = ctx()) => runTool(name, args, c);
const PRIVATE = /050-1234567|y@x\.com|אלרגי|כהן/;

test('one tool list for text and voice, every tool documented', () => {
  assert.equal(chatTools().length, TOOL_DEFS.length);
  assert.deepEqual(realtimeTools().map((t) => t.name), TOOL_NAMES);
  for (const t of TOOL_DEFS) { assert.ok(t.description.length > 20, t.name); assert.equal(t.parameters.type, 'object'); }
  assert.deepEqual([...WRITE_TOOLS].sort(), ['propose_booking', 'propose_guest_message', 'propose_support_handoff']);
});

test('day overview: arrivals, departures, cleaning; cancelled, blocks and other orgs excluded', async () => {
  const { result: r } = await call('get_day_overview', {});
  assert.deepEqual(r.arrivals.map((b) => b.guest), ['יואב']);
  assert.deepEqual(r.departures.map((b) => b.guest), ['משפחת לוי']);
  assert.equal(r.cleaning.length, 1);
  assert.ok(!JSON.stringify(r).includes('זר'), 'org-b booking leaked');
  assert.ok(!PRIVATE.test(JSON.stringify(r)), 'private data leaked');
});

test('availability: a booked unit is taken, blocks count as taken', async () => {
  const a = (await call('check_availability', { from: '2026-11-05', to: '2026-11-07' })).result;
  assert.deepEqual(a.free.map((u) => u.unit), ['הסוויטה']);
  const b = (await call('check_availability', { from: '2026-11-10', to: '2026-11-11' })).result;
  assert.deepEqual(b.taken, ['בקתת הגפן']);
  assert.equal((await call('check_availability', { from: '2026-11-01', to: '2026-11-02' })).result.error, 'past_dates');
  assert.equal((await call('check_availability', { from: 'מחר', to: 'x' })).result.error, 'bad_dates');
});

test('money: nights inside the range, payments by paid date, expenses, open balance', async () => {
  const m = (await call('get_money', { from: '2026-11-01', to: '2026-12-01' })).result;
  assert.equal(m.revenue_from_stays, 1800 + 2400 * (2 / 2)); // b2 nights 2-3 Nov are both in November
  assert.equal(m.payments_received, 600);
  assert.equal(m.expenses_total, 350);
  assert.equal(m.open_balances_total, 1200);
  assert.deepEqual(m.open_balances.map((x) => x.guest), ['יואב']);
});

test('leads: open only by default, first names, no phones', async () => {
  const r = (await call('get_leads', {})).result;
  assert.equal(r.count_open, 1);
  assert.equal(r.leads[0].name, 'רונית');
  assert.ok(!JSON.stringify(r).includes('052'));
});

test('settings: plan, trial, units, channels', async () => {
  const s = (await call('get_business_settings', {})).result;
  assert.equal(s.business, 'בקתות בגליל');
  assert.equal(s.units.length, 2);
  assert.equal(s.calendar_channels[0].provider, 'booking');
  assert.equal(s.check_in_time, '15:00');
});

test('find + get booking: RLS hides another org even with its id', async () => {
  const f = (await call('find_bookings', { from: '2026-11-01', to: '2026-11-30' })).result;
  assert.deepEqual(f.bookings.map((b) => b.id).sort(), ['b1', 'b2']);
  assert.equal((await call('get_booking', { booking_id: 'bx' })).result.error, 'not_found');
  const g = (await call('get_booking', { booking_id: 'b1' })).result;
  assert.equal(g.balance, 1200);
  assert.ok(!PRIVATE.test(JSON.stringify(g)));
});

test('propose_booking validates and never writes', async () => {
  const c = ctx();
  const ok = await call('propose_booking', { unit: 'הסוויטה', check_in: '2026-11-20', check_out: '2026-11-22', guest_name: 'נועה', total_price: 2400 }, c);
  assert.equal(ok.proposal.kind, 'create_booking');
  assert.equal(ok.proposal.payload.property_id, 'u2');
  assert.equal(ok.proposal.payload.nights, 2);
  assert.ok(!c.db.log.some((t) => /insert|update/.test(t)));
  assert.equal((await call('propose_booking', { unit: 'בקתת הגפן', check_in: '2026-11-05', check_out: '2026-11-06', guest_name: 'x' })).result.error, 'unit_taken');
  assert.equal((await call('propose_booking', { unit: 'וילה', check_in: '2026-11-20', check_out: '2026-11-22', guest_name: 'x' })).result.error, 'unit_not_found');
  assert.equal((await call('propose_booking', { unit: 'גפן', check_in: '2026-12-01', check_out: '2026-12-03', guest_name: 'x' })).proposal.display.unit, 'בקתת הגפן');
});

test('guest message: the app gets the wa.me link, the model never sees the phone', async () => {
  const r = await call('propose_guest_message', { booking_id: 'b1', text: 'שלום יואב, מחכים לכם היום מ-15:00.' });
  assert.match(r.proposal.client.wa_link, /^https:\/\/wa\.me\/972501234567\?text=/);
  const m = JSON.stringify(forModel(r.result));
  assert.ok(!m.includes('972501234567') && !m.includes('wa.me'));
  assert.match(m, /waiting_for_confirmation/);
});

test('help search and digest come from the code-built KB (prices, limits)', () => {
  assert.ok(searchHelp('כמה עולה מסלול מקצועי').some((h) => /699/.test(h.text)));
  const d = kbDigest(3600);
  assert.match(d, /\[מקצועי \(Pro\)\][^[]*699/); // plan name stays next to its price (regression: names were dropped)
  assert.ok(ROUTE_SET.has('/bookings'));
});

test('prompt: owner in plural, atlas in first person, no invented features, actions need confirmation, voice speaks numbers', () => {
  const t = brainPrompt({ mode: 'text', today: TODAY });
  const v = brainPrompt({ mode: 'voice', today: TODAY });
  for (const p of [t, v]) { assert.match(p, /אסור להמציא/); assert.match(p, /אישור/); assert.match(p, /24\/7/); assert.match(p, /2026-11-04/); }
  assert.match(v, /במילים/); assert.match(v, /בוקינג/); assert.match(v, /אני יכולה/); // first person, female (Deen, 04.11: "להרגיש אנושית")
  assert.ok(v.length < 9000, `voice prompt too long: ${v.length}`); // paid per token on every turn
});

test('loop: tools run with the user ctx, proposals are emitted, answer streams', async () => {
  const script = [
    { message: { tool_calls: [{ id: 't1', function: { name: 'check_availability', arguments: '{"from":"2026-11-20","to":"2026-11-22"}' } }] }, usage: { prompt_tokens: 100, completion_tokens: 10 } },
    { message: { tool_calls: [{ id: 't2', function: { name: 'propose_booking', arguments: '{"unit":"הסוויטה","check_in":"2026-11-20","check_out":"2026-11-22","guest_name":"נועה"}' } }] }, usage: { prompt_tokens: 200, completion_tokens: 10 } },
    { message: { content: 'הכנו הזמנה לנועה בסוויטה. היא תישמר אחרי שתלחצו אישור.' }, usage: { prompt_tokens: 300, completion_tokens: 20 } },
  ];
  const seen = [];
  const llm = async (messages) => { seen.push(messages); return { ...script.shift(), model: 'fake' }; };
  const ev = [];
  const r = await runBrain({ system: 'S', turns: [{ role: 'user', content: 'תכינו הזמנה לנועה בסוויטה 20-22.11' }], llm, ctx: ctx(), emit: (e) => ev.push(e) });
  assert.deepEqual(r.tools, ['check_availability', 'propose_booking']);
  assert.equal(ev.filter((e) => e.action).length, 1);
  assert.equal(ev.find((e) => e.action).action.kind, 'create_booking');
  assert.equal(ev.filter((e) => e.delta).map((e) => e.delta).join(''), 'הכנו הזמנה לנועה בסוויטה. היא תישמר אחרי שתלחצו אישור.');
  const toolMsg = seen[2].find((m) => m.role === 'tool' && m.tool_call_id === 't2');
  assert.ok(!toolMsg.content.includes('payload'), 'model saw the raw payload');
  assert.equal(r.usage.in, 600);
});

test('loop stops after maxRounds and forces an answer', async () => {
  let n = 0;
  const llm = async () => { n += 1; return n < 5 ? { message: { tool_calls: [{ id: `t${n}`, function: { name: 'search_help', arguments: '{"query":"x"}' } }] }, usage: {} } : { message: { content: 'סוף' }, usage: {} }; };
  const r = await runBrain({ system: 'S', turns: [{ role: 'user', content: 'q' }], llm, ctx: ctx() });
  assert.equal(r.text, 'סוף'); assert.equal(n, 5);
});

test('voice secret: Max model, Hebrew, same tools, slice-capped, short TTL, no key in payload', () => {
  const b = secretRequest({ today: TODAY, seconds: 9999, sessionId: 's1' });
  assert.equal(b.session.model, 'eleven_realtime_v1_max');
  assert.equal(b.session.audio.input.transcription.language, 'he');
  assert.equal(b.session.max_duration_seconds, VOICE.sliceSeconds);
  assert.ok(b.session.max_response_output_tokens >= 1024);
  assert.deepEqual(b.session.tools.map((t) => t.name), TOOL_NAMES);
  assert.equal(b.expires_after.seconds, 60);
  assert.equal(b.session.tracing.group_id, 's1');
  const p = clientPayload({ secret: { value: 'ek_x', expires_at: 1 }, sessionId: 's1', seconds: 180, usedToday: 600 });
  assert.equal(p.remaining_today, 1800 - 600 - 180);
  assert.ok(!JSON.stringify(p).includes('xi-api-key'));
});

/* ── v2 (04.11.2026): answers every question, natural + business-focused, guides to a next step, iOS 3.1.1 ── */
test('prompt v2: always answers, steers small talk back, one next step, options when unsure (text + voice)', () => {
  for (const mode of ['text', 'voice']) {
    const p = brainPrompt({ mode, today: TODAY });
    assert.match(p, /עונים על כל שאלה, תמיד/);
    assert.match(p, /ומציעים את הפעולה הקרובה/);
    assert.match(p, /שיחת חולין/); assert.match(p, /מחזירים לעסק/); assert.match(p, /לא מנהלים שיחת חולין ארוכה/);
    assert.match(p, /צעד הבא אחד/); assert.match(p, /הצעה אחת בלבד, בלי לחץ/); assert.match(p, /שתיים או שלוש אפשרויות/);
    assert.match(p, /שאלת המשך קצרה/); // follow-ups keep context
    assert.match(p, /אף פעם לא אומרים שהפעולה בוצעה/); // proposals still need the owner's tap
    assert.ok(!/מחוץ לנושא.*לא עונים/.test(p));
  }
  const v = brainPrompt({ mode: 'voice', today: TODAY });
  assert.match(v, /לא רובוטי/);
  if (ATLAS_PERSON === 'female') { assert.match(v, /לא שמעתי טוב/); assert.match(v, /רגע, בודקת/); assert.match(v, /גוף ראשון נקבה/); }
  else { assert.match(v, /לא שמענו טוב/); assert.match(v, /רגע, בודקים/); assert.ok(!/גוף ראשון נקבה|בודקת|הכנתי/.test(v)); }
  assert.ok(v.length < 9000, `voice prompt too long: ${v.length}`);
});

test('iOS app (Apple 3.1.1): no plan prices, no buying outside, in prompt, help search and voice', async () => {
  const web = brainPrompt({ mode: 'text', today: TODAY });
  const ios = brainPrompt({ mode: 'text', today: TODAY, native: true });
  assert.match(web, /699/);
  assert.ok(!/399|699|999|319|559|799|מתחיל \(Starter\)/.test(ios), 'native prompt leaks a plan price');
  assert.ok(ios.includes(NATIVE_RULE)); assert.match(ios, /אסור לומר מחירים של מסלולי atlas/);
  const webHelp = await call('search_help', { query: 'כמה עולה מסלול מקצועי מחיר' });
  assert.match(JSON.stringify(webHelp.result), /₪/);
  const iosHelp = await call('search_help', { query: 'כמה עולה מסלול מקצועי מחיר' }, ctx({ native: true }));
  assert.ok(!/₪|699|399|999|atlas-il\.com\/(pricing|subscription|billing)/.test(JSON.stringify(iosHelp.result)), 'native help leaks a price');
  const sec = secretRequest({ today: TODAY, seconds: 180, sessionId: 's', native: true });
  assert.ok(!/399|699|999/.test(sec.session.instructions)); assert.match(sec.session.instructions, /אפליקציית האייפון/);
  assert.match(secretRequest({ today: TODAY, seconds: 180, sessionId: 's' }).session.instructions, /699/);
});

test('loop never goes silent: empty reply → one words-only retry → honest fallback with a next step', async () => {
  const opts = [];
  let n = 0;
  const llm1 = async (_m, _s, o = {}) => { opts.push(o); n += 1; return n === 1 ? { message: { content: '' }, usage: {} } : { message: { content: 'היום מגיעים שני אורחים.' }, usage: {} }; };
  const ev = [];
  const r1 = await runBrain({ system: 'S', turns: [{ role: 'user', content: 'מי מגיע?' }], llm: llm1, ctx: ctx(), emit: (e) => ev.push(e) });
  assert.equal(r1.text, 'היום מגיעים שני אורחים.'); assert.equal(opts[1].noTools, true);
  const r2 = await runBrain({ system: 'S', turns: [{ role: 'user', content: 'q' }], llm: async () => ({ message: { content: '  ' }, usage: {} }), ctx: ctx(), emit: () => {} });
  assert.equal(r2.text, NO_ANSWER); assert.match(NO_ANSWER, /נעביר|במילים אחרות/);
  const r3 = await runBrain({ system: 'S', turns: [{ role: 'user', content: 'q' }], llm: async () => { throw new Error('down'); }, ctx: ctx(), emit: () => {} }).catch((e) => e);
  assert.ok(r3 instanceof Error, 'a hard upstream error still surfaces (the edge fn turns it into a visible error frame)');
});

test('loop: the last round asks for words only (tool_choice none)', async () => {
  const seen = [];
  const llm = async (_m, _s, o = {}) => { seen.push(!!o.noTools); return seen.length < 5 ? { message: { tool_calls: [{ id: `t${seen.length}`, function: { name: 'search_help', arguments: '{"query":"x"}' } }] }, usage: {} } : { message: { content: 'סוף' }, usage: {} }; };
  await runBrain({ system: 'S', turns: [{ role: 'user', content: 'q' }], llm, ctx: ctx() });
  assert.deepEqual(seen, [false, false, false, false, true]);
});

test('a failing tool tells the model what to say instead of going quiet', async () => {
  const q = new Proxy({}, { get: (_t, k) => (k === 'then' ? (res) => res({ data: null, error: { message: 'db down' } }) : () => q) });
  const broken = { from: () => q };
  const { result } = await call('get_day_overview', {}, ctx({ db: broken }));
  assert.equal(result.error, 'lookup_failed'); assert.match(result.say, /לא הצלחתם לבדוק/);
  const none = await call('search_help', { query: 'זזזזזזזזזז קקקקקק' });
  if (!none.result.results.length) assert.match(none.result.note, /נציג/);
});

test('voice session: semantic VAD (the only mode Eleven accepts) that answers short questions', () => {
  const b = secretRequest({ today: TODAY, seconds: 180, sessionId: 's1' });
  const td = b.session.audio.input.turn_detection;
  assert.equal(td.type, 'semantic_vad'); assert.equal(td.create_response, true); assert.equal(td.interrupt_response, true);
  assert.equal(td.eagerness, 'medium'); // what ran live in v8; the v2 'high' guess is reverted (04.11.2026)
  assert.ok(b.session.max_duration_seconds >= 60 && b.session.max_duration_seconds <= VOICE.sliceSeconds);
  assert.match(secretRequest({ today: TODAY, seconds: 180, sessionId: 's', resume: 'הבעלים: היי' }).session.instructions, /לא לברך שוב/);
});

test('persona switch: both voices are complete and the prompt follows ATLAS_PERSON (one switch)', async () => {
  const P = await import('../functions/_shared/brain/persona.js');
  assert.ok(['female', 'plural'].includes(P.ATLAS_PERSON));
  for (const k of ['promptWho', 'promptSelf', 'promptCheck', 'promptVoiceSelf', 'promptNotHeard', 'checking', 'writeHere', 'writeToMe', 'placeholder', 'hintPrepare', 'notHeard', 'prepared', 'yesPrepared', 'askBooking']) assert.ok(PERSONA[k], k);
  for (const t of TOOL_NAMES.filter((n) => !WRITE_TOOLS.has?.(n))) assert.ok(typeof PERSONA.tools[t] === 'string' || !['get_day_overview', 'find_bookings'].includes(t), t);
  const v = brainPrompt({ mode: 'voice', today: TODAY });
  assert.ok(v.includes(PERSONA.promptVoiceSelf) && v.includes(PERSONA.promptCheck));
});

/* ── voice reliability (04.11.2026 evening): Hebrew + Max + medium VAD, close-code telemetry is typed and short ── */
test('voice config: Hebrew, eleven_realtime_v1_max, semantic VAD medium', () => {
  const b = secretRequest({ today: TODAY, seconds: 180, sessionId: 's1' });
  assert.equal(VOICE.model, 'eleven_realtime_v1_max');
  assert.equal(b.session.audio.input.transcription.language, 'he');
  assert.equal(b.session.audio.output.voice, 'enR7mijIG1cHGbbpygXW'); // "אירה" (Deen's pick, 04.11.2026)
  assert.deepEqual(b.session.audio.input.turn_detection, { type: 'semantic_vad', eagerness: 'medium', create_response: true, interrupt_response: true });
});

test('voice telemetry: close code/reason logged with typed, truncated fields; unknown event kinds dropped', () => {
  const c = closeLog({ user: 'u1', session: 's1', close: { code: '1006', reason: 'x'.repeat(500), clean: 'yes', by_us: false, age_ms: 21345.6, open_ms: 20000, state: 'thinking', errors: 'ws_error:ws@21s', evil: { a: 1 } } });
  assert.equal(c.event, 'close'); assert.equal(c.code, 1006); assert.equal(c.reason.length, 200);
  assert.equal(c.clean, false); assert.equal(c.age_ms, 21346); assert.equal(c.state, 'thinking'); assert.ok(!('evil' in c));
  assert.equal(closeLog({ user: 'u', session: 's', close: null }).code, null);
  const e = eventLog({ user: 'u1', body: { kind: 'server_error', code: 'rate_limit_exceeded', message: 'm', session_id: 's1' } });
  assert.equal(e.kind, 'server_error'); assert.equal(e.code, 'rate_limit_exceeded');
  assert.equal(eventLog({ user: 'u1', body: { kind: 'drop_table' } }), null);
});


/* ── general brain (04.11.2026): general knowledge + search_web for live / local info ───────────── */
// A fake OpenAI Responses API: records what was asked, answers like the real one (citation chips, markdown).
function fakeResponses(text = 'שלוש אפשרויות: **מגדלנה** — מטבח גלילי בצומת מגדל. ([rest.co.il](https://www.rest.co.il/x?utm_source=openai))', { status = 200, throwIt = false } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization });
    if (throwIt) throw new Error('aborted');
    return { ok: status < 400, status, json: async () => (status < 400 ? {
      model: 'gpt-6-luna',
      output: [{ type: 'web_search_call' }, { type: 'message', content: [{ type: 'output_text', text, annotations: [{ type: 'url_citation', url: 'https://www.rest.co.il/x' }] }] }],
    } : { error: { message: 'boom' } }) };
  };
  return { calls, fetchImpl };
}
const worldCtx = (f, over = {}) => ctx({ world: { apiKey: 'sk-test', model: 'gpt-6-luna', effort: 'none', fetchImpl: f.fetchImpl }, ...over });

test('search_web: one tool for text and voice, read-only, documented for local + live questions', () => {
  assert.ok(TOOL_NAMES.includes('search_web'));
  assert.ok(realtimeTools().some((t) => t.name === 'search_web'), 'voice cannot call it');
  assert.ok(!WRITE_TOOLS.has('search_web'));
  const d = TOOL_DEFS.find((t) => t.name === 'search_web');
  for (const w of ['מסעדות', 'מזג אוויר', 'זמני נסיעה', 'אטרקציות']) assert.match(d.description, new RegExp(w));
  assert.deepEqual(d.parameters.required, ['query']);
  assert.ok(PERSONA.tools.search_web, 'status line under her face');
});

test('search_web: restaurants near the Kinneret → Responses API web_search, short plain Hebrew, no links, no business data sent', async () => {
  const f = fakeResponses();
  const { result, proposal } = await call('search_web', { query: 'אילו מסעדות יש סביב הכנרת?', near: 'הכנרת' }, worldCtx(f));
  assert.equal(proposal, null);
  assert.equal(f.calls.length, 1);
  const { url, body, auth } = f.calls[0];
  assert.equal(url, 'https://api.openai.com/v1/responses'); assert.equal(auth, 'Bearer sk-test');
  assert.equal(body.model, 'gpt-6-luna'); assert.equal(body.reasoning.effort, 'none'); assert.equal(body.store, false);
  assert.equal(body.tools[0].type, 'web_search'); assert.equal(body.tools[0].user_location.country, 'IL');
  assert.match(body.input, /הכנרת/); assert.match(body.instructions, /הכנרת/);
  assert.match(body.instructions, /לא ממציאים מקום/); assert.match(body.instructions, /2026-11-04/);
  const sent = JSON.stringify(body);
  assert.ok(!/יואב|משפחת לוי|1800|בקתת הגפן|050-|בקתות בגליל/.test(sent), 'business data leaked to the search');
  assert.match(result.answer, /מגדלנה/);
  assert.ok(!/https?:|\*\*|\]\(|rest\.co\.il\/x/.test(result.answer), `not speakable: ${result.answer}`);
  assert.deepEqual(result.sources, ['rest.co.il']);
});

test('search_web: no place given → searches around the business address (org, then a unit)', async () => {
  const f = fakeResponses('מחר מעונן חלקית, עשר עד עשרים מעלות.');
  const { result } = await call('search_web', { query: 'מה מזג האוויר מחר?' }, worldCtx(f));
  assert.match(f.calls[0].body.instructions, /חד-נס, רמת הגולן/);
  assert.equal(result.area, 'חד-נס, רמת הגולן');
  // no org address → first unit with an address
  const t = T(); delete t.organizations[0].address; t.properties[1].address = 'ראש פינה';
  assert.equal(await businessArea(fakeDb(t), 'user-a'), 'ראש פינה');
  // nothing known → the search says so instead of guessing a place
  const t2 = T(); delete t2.organizations[0].address;
  assert.equal(await businessArea(fakeDb(t2), 'user-a'), '');
  assert.match(worldInstructions({ today: TODAY, area: '' }), /מיקום המתחם לא ידוע/);
});

test('search_web never goes silent: no key, upstream error, timeout, rate limit all come back with what to say', async () => {
  const none = (await call('search_web', { query: 'מסעדות' }, ctx())).result;
  assert.equal(none.error, 'not_available'); assert.match(none.say, /ידע הכללי/);
  const bad = (await call('search_web', { query: 'מסעדות' }, worldCtx(fakeResponses('x', { status: 500 })))).result;
  assert.equal(bad.error, 'search_failed'); assert.ok(bad.say);
  const slow = (await call('search_web', { query: 'מסעדות' }, worldCtx(fakeResponses('x', { throwIt: true })))).result;
  assert.equal(slow.error, 'search_timeout'); assert.ok(slow.say);
  assert.equal((await askWorld({ apiKey: 'k', model: 'm', query: '  ' })).error, 'empty_query');
  const k = `rl-${Math.random()}`; const now = 1_000_000;
  for (let i = 0; i < WORLD.perMinute; i += 1) assert.ok(searchAllowed(k, now + i));
  assert.equal(searchAllowed(k, now + 100), false);
  assert.ok(searchAllowed(k, now + 61_000), 'window slides');
});

test('plainAnswer: speakable text (no markdown, bullets, urls), capped', () => {
  const t = plainAnswer('## כותרת\n- **א** ליד [האתר](https://a.b/c)\n* ב https://x.y/z\n\n\nג');
  assert.equal(t, 'כותרת\nא ליד האתר\nב\nג');
  assert.ok(plainAnswer('א'.repeat(5000)).length <= WORLD.maxAnswerChars);
});

test('prompt: general knowledge allowed, live/local via search_web, business facts still only from tools, no invoices (text + voice + iOS)', () => {
  for (const [mode, native] of [['text', false], ['voice', false], ['voice', true], ['text', true]]) {
    const p = brainPrompt({ mode, today: TODAY, native });
    assert.match(p, /עוזרת חכמה כללית/); assert.match(p, /עונים מהידע שלכם/); assert.match(p, /בלי לסרב/);
    assert.match(p, /search_web/); assert.match(p, /מסעדות/); assert.match(p, /מזג אוויר/); assert.match(p, /זמני נסיעה/);
    assert.match(p, /סביב המתחם/); assert.match(p, /לא ממציאים שמות של מקומות/);
    assert.ok(!/בלי להעמיד פנים שיש לכם נתונים חיים/.test(p), 'old "no live data" line is back');
    assert.ok(!/עונים בקצרה שאפשר לעזור כאן רק/.test(p), 'business-only scope is back');
    assert.match(p, /כל מספר, שם, תאריך או סכום על העסק מגיע רק מכלי/); // business facts: tools only
    assert.match(p, /אף פעם לא אומרים שהפעולה בוצעה/); // writes: confirm first
    assert.match(p, /חשבוניות וקבלות: atlas לא מפיקה/);
    assert.match(p, /אף פעם לא בלשון זכר|גוף ראשון נקבה|ברבים/);
    if (native) { assert.ok(p.includes(NATIVE_RULE)); assert.ok(!/399|699|999/.test(p)); }
  }
  const v = brainPrompt({ mode: 'voice', today: TODAY });
  assert.match(v, /חיפוש ברשת לוקח כמה שניות/); assert.match(v, /עד שלושה מקומות/);
  assert.ok(brainPrompt({ mode: 'voice', today: TODAY, native: true }).length < 9000);
  assert.ok(secretRequest({ today: TODAY, seconds: 180, sessionId: 's', native: true }).session.tools.some((t) => t.name === 'search_web'));
});

// Scripted model turns (offline): the loop wires the four kinds of question the right way.
async function scripted(turns, steps, c) {
  let i = 0; const seen = [];
  const llm = async (messages, _s, opts = {}) => { seen.push({ messages, opts }); return steps[Math.min(i++, steps.length - 1)]; };
  const r = await runBrain({ system: brainPrompt({ mode: 'text', today: TODAY }), turns, llm, ctx: c });
  return { r, seen };
}
const tc = (id, name, args) => ({ message: { tool_calls: [{ id, function: { name, arguments: JSON.stringify(args) } }] }, usage: {} });
const say = (content) => ({ message: { content }, usage: {} });

test('brain: "which restaurants are around the Kinneret?" → search_web → answer from the search', async () => {
  const f = fakeResponses('מגדלנה בצומת מגדל, מטבח גלילי. דג על הכנרת בטבריה, דגים טריים.');
  const { r, seen } = await scripted([{ role: 'user', content: 'אילו מסעדות יש סביב הכנרת?' }],
    [tc('w1', 'search_web', { query: 'מסעדות מומלצות סביב הכנרת', near: 'הכנרת' }), say('ליד הכנרת יש את מגדלנה בצומת מגדל, ודג על הכנרת בטבריה. לשלוח את זה לאורחים בוואטסאפ?')], worldCtx(f));
  assert.deepEqual(r.tools, ['search_web']);
  const toolMsg = seen[1].messages.find((m) => m.role === 'tool');
  assert.match(toolMsg.content, /מגדלנה/);
  assert.match(r.text, /מגדלנה/);
});

test('brain: "weather tomorrow?" → search_web around the business, with tomorrow in the query', async () => {
  const f = fakeResponses('מחר, חמישי, מעונן חלקית, עשר עד עשרים מעלות, אולי ממטרים בבוקר.');
  const { r } = await scripted([{ role: 'user', content: 'מה מזג האוויר מחר?' }],
    [tc('w2', 'search_web', { query: 'מזג האוויר מחר, 2026-11-05' }), say('מחר מעונן חלקית, בין עשר לעשרים מעלות.')], worldCtx(f));
  assert.deepEqual(r.tools, ['search_web']);
  assert.match(f.calls[0].body.instructions, /חד-נס/);
});

test('brain: a general fact needs no tool and no handoff', async () => {
  const f = fakeResponses();
  const { r } = await scripted([{ role: 'user', content: 'מה הגובה של החרמון?' }], [say('החרמון מגיע לכאלפיים ושמונה מאות מטר, והחלק הישראלי שלו לכאלפיים ומאתיים.')], worldCtx(f));
  assert.deepEqual(r.tools, []); assert.equal(f.calls.length, 0);
});

test('brain: own bookings still come from the database tools, not from the web', async () => {
  const f = fakeResponses();
  const { r } = await scripted([{ role: 'user', content: 'מי מגיע היום?' }],
    [tc('d1', 'get_day_overview', {}), say('היום מגיע יואב לבקתת הגפן.')], worldCtx(f));
  assert.deepEqual(r.tools, ['get_day_overview']); assert.equal(f.calls.length, 0);
  assert.match(r.text, /יואב/);
});
