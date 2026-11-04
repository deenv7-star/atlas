// Assistant v2 (04.11.2026): guides to a next step, steers small talk back to business, iOS-safe demo. npm run test:unit
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFacts } from '../../src/assistant/facts.js';
import { nextStep, optionsOf, isSmallTalk, topicOf } from '../../src/assistant/nextStep.js';
import { demoAnswer } from '../../src/assistant/demoAnswer.js';

const TODAY = '2026-10-20';
const f = buildFacts({
  today: TODAY,
  properties: [{ id: 'u1', name: 'הגפן' }, { id: 'u2', name: 'הזית' }],
  bookings: [
    { id: 'b1', property_id: 'u1', guest_name: 'נועה לוי', check_in_date: '2026-10-20', check_out_date: '2026-10-23', total_price: 3000, status: 'CONFIRMED' },
    { id: 'b2', property_id: 'u2', guest_name: 'משפחת כהן', check_in_date: '2026-09-30', check_out_date: '2026-10-02', total_price: 2000, status: 'CONFIRMED' },
  ],
  payments: [{ booking_id: 'b1', amount: 2000, status: 'PAID', paid_date: '2026-10-01' }],
  leads: [{ id: 'l1', full_name: 'הדס בר', status: 'NEW', created_date: '2026-10-18' }, { id: 'l2', full_name: 'Dana', status: 'NEW', created_date: '2026-10-19' }],
});
const ONE_STEP = (s) => { assert.ok(s); assert.ok(s.line.length <= 70, s.line); assert.ok((s.line.match(/\?/g) || []).length <= 1, 'one question at a time'); };

test('small talk gets one line and is steered back to the business with concrete options', () => {
  for (const q of ['היי', 'מה נשמע?', 'תודה רבה', 'מה שלומך']) assert.ok(isSmallTalk(q), q);
  assert.ok(!isSmallTalk('מי מגיע היום?'));
  const s = nextStep(f, { question: 'היי' });
  assert.equal(s.ask, ''); assert.ok(s.options.length >= 2 && s.options.length <= 3);
  assert.match(demoAnswer('היי', f), /נבדוק מה מחכה לכם היום/);
  assert.ok(demoAnswer('מה נשמע?', f).length < 60, 'small talk stays short');
});

test('after each answer: one natural next step from real data, never pushy', () => {
  const money = nextStep(f, { question: 'מי עוד חייב לנו כסף?' });
  ONE_STEP(money); assert.match(money.line, /^נכין למשפחת כהן תזכורת/); assert.match(money.ask, /תזכורת על התשלום/);
  const today = nextStep(f, { question: 'מי מגיע היום?' });
  ONE_STEP(today); assert.match(today.ask, /לנועה/); assert.match(today.ask, /^תכינו הודעה/); // becomes a proposal card (needs אישור)
  const month = nextStep(f, { question: 'איך החודש?' });
  ONE_STEP(month);
  const leads = nextStep(f, { question: 'אילו פניות מחכות?' });
  assert.match(leads.line, /^נכין להדס/, 'never drop the ה of a name');
  const again = nextStep(f, { question: 'מי עוד חייב לנו כסף?', last: money.ask });
  assert.notEqual(again.ask, money.ask, 'never the same step twice in a row');
  assert.match(again.line, /2 פניות שעוד לא חזרתם אליהן/); // proactive: real leads waiting
});

test('unsure owner gets 2-3 concrete options; empty account gets the setup step', () => {
  const s = nextStep(f, { question: 'לא יודע מה לשאול' });
  assert.ok(s.options.length >= 2 && s.options.length <= 3); s.options.forEach((o) => assert.ok(o.label && o.ask));
  assert.ok(optionsOf(null).length >= 2);
  assert.match(nextStep(buildFacts({ today: TODAY }), { question: 'מי מגיע?' }).ask, /Booking/);
  assert.equal(topicOf('כמה נכנס החודש?'), 'month');
});

test('demo answers every question, and inside the iOS app never quotes plan prices', () => {
  for (const q of ['מה מזג האוויר?', 'כמה עולה מסלול מקצועי?', 'בלה בלה', 'מי מגיע היום?']) assert.ok(demoAnswer(q, f).trim().length > 10, q);
  const ios = demoAnswer('כמה עולה מסלול מקצועי?', f, { native: true });
  assert.ok(!/₪|399|699|999|subscription|atlas-il/.test(ios)); assert.match(ios, /לא מציגים כאן באפליקציה/);
});
