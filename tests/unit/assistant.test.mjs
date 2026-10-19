// Run: npm run test:unit
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFacts, factsForModel, factsToText, firstName, withPrefix, money } from '../../src/assistant/facts.js';
import { insightOf, suggestionsOf, safeHref, splitActions, SAFE_LINK } from '../../src/assistant/insights.js';
import { demoAnswer } from '../../src/assistant/demoAnswer.js';
import { createSSEParser, chunkText } from '../../src/assistant/sse.js';

const TODAY = '2026-10-20'; // Tuesday
const properties = [{ id: 'u1', name: 'הגפן' }, { id: 'u2', name: 'הזית' }];
const bookings = [
  // this month: 3 nights in u1, 3,000 → arrives today, owes 1,000 (paid 2,000)
  { id: 'b1', property_id: 'u1', guest_name: 'נועה לוי', guest_phone: '0501234567', check_in_date: '2026-10-20', check_out_date: '2026-10-23', total_price: 3000, status: 'CONFIRMED' },
  // crosses months: 30 Sep → 2 Oct, 2 nights, 2,000 → 1,000 in Sep, 1,000 in Oct; overdue since check-in, nothing paid
  { id: 'b2', property_id: 'u2', guest_name: 'משפחת כהן', check_in_date: '2026-09-30', check_out_date: '2026-10-02', total_price: 2000, status: 'CONFIRMED' },
  // last month only
  { id: 'b3', property_id: 'u2', guest_name: 'Dana Ross', check_in_date: '2026-09-10', check_out_date: '2026-09-12', total_price: 1600, status: 'CONFIRMED' },
  // cancelled: ignored everywhere
  { id: 'b4', property_id: 'u2', guest_name: 'בוטל', check_in_date: '2026-10-22', check_out_date: '2026-10-24', total_price: 9999, status: 'CANCELLED' },
  // leaves today
  { id: 'b5', property_id: 'u2', guest_name: 'יואב', check_in_date: '2026-10-18', check_out_date: '2026-10-20', total_price: 1200, status: 'CONFIRMED' },
];
const payments = [
  { id: 'p1', booking_id: 'b1', amount: 2000, status: 'PAID' },
  { id: 'p3', booking_id: 'b3', amount: 1600, status: 'PAID' },
  { id: 'p5', booking_id: 'b5', amount: 1200, status: 'PAID' },
];
const leads = [
  { id: 'l1', full_name: 'רון אבני', phone: '050', status: 'NEW', created_date: '2026-10-18T10:00:00Z' },
  { id: 'l2', name: 'שירה', status: 'CONFIRMED', created_date: '2026-10-01' },
];
const f = buildFacts({ bookings, payments, leads, properties, today: TODAY });

test('revenue reads total_price and splits stays by nights (not total_amount)', () => {
  assert.equal(f.month.label, 'אוקטובר 2026');
  // Oct: b1 3000 + b2 half 1000 + b5 1200 (2 nights in Oct) = 5200
  assert.equal(f.month.revenue, 5200);
  assert.equal(f.prevMonth.label, 'ספטמבר 2026');
  assert.equal(f.prevMonth.revenue, 1000 + 1600);
});

test('occupancy uses units × days', () => {
  assert.equal(f.month.nights, 3 + 1 + 2);
  assert.equal(Math.round(f.month.occupancy * 1000), Math.round((6 / 62) * 1000));
});

test('arrivals / departures read check_in_date / check_out_date; first names only', () => {
  assert.deepEqual(f.arrivals.map((a) => a.name), ['נועה']);
  assert.deepEqual(f.departures.map((a) => a.name), ['יואב']);
  const text = JSON.stringify(factsForModel(f)) + factsToText(f);
  assert.ok(!text.includes('לוי'), 'no last names');
  assert.ok(!text.includes('0501234567'), 'no phones');
  assert.ok(!text.includes('Ross'));
  assert.equal(firstName('משפחת כהן'), 'משפחת כהן');
});

test('overdue balances: unpaid past due only, biggest first', () => {
  assert.deepEqual(f.overdue.map((r) => [r.id, r.amount]), [['b2', 2000]]);
  assert.equal(f.overdueTotal, 2000);
  // b1 is due today (check-in), not overdue
  assert.ok(!f.overdue.some((r) => r.id === 'b1'));
  assert.ok(f.dueSoon.some((r) => r.id === 'b1' && r.amount === 1000));
});

test('open leads and free nights (cancelled booking frees its nights)', () => {
  assert.deepEqual(f.openLeads.map((l) => l.name), ['רון']);
  const gefen = f.freeNights.find((u) => u.unit === 'הגפן');
  assert.equal(gefen.free, 14 - 3);
  assert.ok(!gefen.weekend.includes('2026-10-22'));
  const zayit = f.freeNights.find((u) => u.unit === 'הזית');
  assert.equal(zayit.free, 14);
  assert.deepEqual(zayit.weekend.slice(0, 2), ['2026-10-22', '2026-10-23']);
});

test('insight: money owed comes first, and it is real', () => {
  const i = insightOf(f);
  assert.equal(i.kind, 'money');
  assert.equal(i.title, `${money(2000)} עוד לא שולמו`);
  assert.equal(i.action.href, '/balances');
});

test('insight order falls through: free Thu/Fri → arrivals → month → leads → null', () => {
  const noMoney = buildFacts({ bookings: bookings.filter((b) => b.id !== 'b2'), payments, leads, properties, today: TODAY });
  const i = insightOf(noMoney);
  assert.equal(i.kind, 'free');
  assert.match(i.title, /ליל חמישי פנוי/);
  assert.match(i.body, /בזית/); // ב + הזית → בזית
  assert.equal(insightOf(buildFacts({ today: TODAY })), null);
  const onlyLeads = buildFacts({ leads, today: TODAY });
  assert.equal(insightOf(onlyLeads).kind, 'leads');
});

test('suggestions follow the screen and only ask what the data can answer', () => {
  const pay = suggestionsOf(f, '/payments');
  assert.ok(pay.length >= 1 && pay.length <= 3);
  assert.ok(!pay.includes(insightOf(f).ask));
  const cal = suggestionsOf(f, '/calendar');
  assert.equal(cal[0], 'אילו לילות פנויים בשבועיים הקרובים?');
  const empty = buildFacts({ today: TODAY });
  assert.deepEqual(suggestionsOf(empty, '/'), []);
  const noLeads = buildFacts({ bookings, payments, properties, today: TODAY });
  assert.ok(!suggestionsOf(noLeads, '/leads', 6).includes('אילו פניות מחכות לתשובה?'));
});

test('SAFE_LINK: app screens only', () => {
  assert.equal(safeHref('/balances'), '/balances');
  assert.equal(safeHref('/booking/b1'), '/booking/b1');
  assert.equal(safeHref('/booking/b1?x=1#y'), '/booking/b1');
  for (const bad of ['https://evil.com', '//evil.com', 'javascript:alert(1)', '/admin', '/booking/../admin', '/bookings/x/y', '/lead/<x>', '', 'balances']) {
    assert.equal(safeHref(bad), null, bad);
  }
  assert.ok(Object.isFrozen(SAFE_LINK));
});

test('splitActions turns trailing app links into chips and drops unsafe ones', () => {
  const r = splitActions('יש 2 יתרות.\n\n[פתיחת היתרות](/balances) [אתר](https://x.com) [ההזמנה](/booking/b2)');
  assert.equal(r.body, 'יש 2 יתרות.');
  assert.deepEqual(r.actions.map((a) => a.href), ['/balances', '/booking/b2']);
  const inline = splitActions('ראו [כאן](/balances) בבקשה.');
  assert.equal(inline.actions.length, 0);
});

test('demo answers come from the snapshot (tables included) and never invent', () => {
  const m = demoAnswer('מי עוד חייב לנו כסף?', f);
  assert.match(m, /\| אורח \| יחידה \| יתרה/);
  assert.ok(m.includes(money(2000)));
  assert.ok(m.includes('(/balances)'));
  const month = demoAnswer('איך החודש לעומת החודש שעבר?', f);
  assert.ok(month.includes(money(5200)) && month.includes(money(2600)));
  assert.match(demoAnswer('מה מזג האוויר?', f), /בהדגמה אפשר לשאול/);
  assert.match(demoAnswer('מי חייב?', buildFacts({ today: TODAY })), /עוד אין הזמנות/);
});

test('withPrefix merges the article', () => {
  assert.equal(withPrefix('ב', 'הגפן'), 'בגפן');
  assert.equal(withPrefix('ל', 'Olive'), 'ל-Olive');
  assert.equal(withPrefix('ב', 'צימר דבש'), 'בצימר דבש');
});

test('SSE parser: v4 frames, OpenAI frames, split chunks, errors', () => {
  const ev = [];
  const p = createSSEParser((e) => ev.push(e));
  p.push('data: {"d":"של'); p.push('ום"}\n\n');
  p.push('data: {"choices":[{"delta":{"content":" לכם"}}]}\n\ndata: {"error":"rate_limited"}\n\n');
  p.push('data: [DONE]\n\n');
  assert.deepEqual(ev, [{ delta: 'שלום' }, { delta: ' לכם' }, { error: 'rate_limited' }, { done: true }]);
  assert.equal(chunkText('אחת שתיים שלוש ארבע', 2).join(''), 'אחת שתיים שלוש ארבע');
});
