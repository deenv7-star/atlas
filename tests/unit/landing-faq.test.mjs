import test from 'node:test';
import assert from 'node:assert/strict';
import { FAQ } from '../../src/components/landing/v5/content.js';
import { PRICING_PLANS, TRIAL_DAYS } from '../../src/config/pricing.js';

const text = FAQ.map((f) => `${f.q} ${f.a}`).join(' ');

test('6 to 8 sales questions, each a question with a short answer', () => {
  assert.ok(FAQ.length >= 6 && FAQ.length <= 8, `got ${FAQ.length}`);
  for (const f of FAQ) {
    assert.ok(f.q.trim().endsWith('?'), f.q);
    const sentences = f.a.split(/[.?!](?:\s|$)/).filter((x) => x.trim()).length;
    assert.ok(sentences >= 1 && sentences <= 3, `${f.q}: ${sentences} sentences`);
    assert.ok(f.a.length <= 240, `${f.q}: ${f.a.length} chars`);
  }
  assert.equal(new Set(FAQ.map((f) => f.q)).size, FAQ.length);
});

test('zero technical jargon', () => {
  const banned = [/ical/i, /\bapi\b/i, /csv/i, /pdf/i, /rls/i, /sync/i, /סנכרון/, /קישור יומן/, /ייבוא/, /ייצוא/, /פרוטוקול/, /שרת/, /מסד נתונים/, /דפדפן כרום/];
  for (const re of banned) assert.ok(!re.test(text), `jargon ${re}`);
});

test('no promises ATLAS cannot keep, no invented numbers', () => {
  const banned = [/חשבונית מס/, /חשבוניות/, /סליקה/, /גובה (?:מ|את)/, /גבייה/, /אוטומטית לגמרי/, /בלי לחיצה/, /נשלח(?:ות)? לבד/, /לקוחות מרוצים/, /ביקורות/, /\d+%/, /\d+\s*שעות/, /בעלי צימרים כבר/];
  for (const re of banned) assert.ok(!re.test(text), `claim ${re}`);
  const allowedNumbers = new Set([String(TRIAL_DAYS), String(PRICING_PLANS[0].price)]);
  for (const n of text.match(/\d+/g) || []) assert.ok(allowedNumbers.has(n), `unexpected number ${n}`);
});

test('true anchors stay: trial, no card, no commitment, real price, a human on WhatsApp, phone', () => {
  assert.match(text, new RegExp(`${TRIAL_DAYS} הימים הראשונים חינם`));
  assert.match(text, /בלי כרטיס אשראי/);
  assert.match(text, /בלי התחייבות/);
  assert.ok(text.includes(`₪${PRICING_PLANS[0].price} לחודש`));
  assert.match(text, /בן אדם אמיתי עונה לכם בוואטסאפ/);
  assert.match(text, /בטלפון/);
  assert.match(text, /בלחיצה אחת/); // WhatsApp is one tap, never auto-send
});

test('house style: no em or en dashes', () => {
  assert.ok(!/[\u2014\u2013]/.test(text));
});
