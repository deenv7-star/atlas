import test from 'node:test';
import assert from 'node:assert/strict';
import { FAQ, PHONE_DISPLAY } from '../../src/components/landing/v5/content.js';
import { PRICING_PLANS, TRIAL_DAYS } from '../../src/config/pricing.js';

// Landing FAQ v2 (19.10.2026): owner questions for zimmer / villa / complex owners, true claims only.
const text = FAQ.map((f) => `${f.q} ${f.a}`).join(' ');
const answers = FAQ.map((f) => f.a).join(' ');

test('6 to 9 sales questions, each a question with a short answer', () => {
  assert.ok(FAQ.length >= 6 && FAQ.length <= 9, `got ${FAQ.length}`);
  for (const f of FAQ) {
    assert.ok(f.q.trim().endsWith('?'), f.q);
    assert.ok(f.q.length <= 60, `${f.q}: question too long`);
    const sentences = f.a.split(/[.?!](?:\s|$)/).filter((x) => x.trim()).length;
    assert.ok(sentences >= 1 && sentences <= 3, `${f.q}: ${sentences} sentences`);
    assert.ok(f.a.length <= 240, `${f.q}: ${f.a.length} chars`);
  }
  assert.equal(new Set(FAQ.map((f) => f.q)).size, FAQ.length);
});

test('covers what owners ask before signing up', () => {
  const topics = [/Booking/, /Airbnb/, /כפולות/, /מישהו יעזור/, /14 ימי הניסיון/, /עולה/, /וואטסאפ/, /חשבוניות/, /בטלפון/, /יחידות/, /שמור/];
  for (const re of topics) assert.ok(FAQ.some((f) => re.test(f.q)), `missing question ${re}`);
});

test('zero technical jargon', () => {
  const banned = [/ical/i, /\bapi\b/i, /csv/i, /pdf/i, /rls/i, /sync/i, /סנכרון/, /קישור יומן/, /ייבוא/, /ייצוא/, /פרוטוקול/, /שרת/, /מסד נתונים/, /דפדפן/, /אפליקציית ווב/, /PWA/i];
  for (const re of banned) assert.ok(!re.test(text), `jargon ${re}`);
});

test('no promises ATLAS cannot keep, no invented numbers', () => {
  const banned = [/מפיקה חשבונית/, /מפיקים? (?:ב|דרך )?ATLAS חשבונית/, /סליקה/, /גובה (?:מ|את)/, /גבייה/, /אוטומטית לגמרי/, /בלי לחיצה/, /נשלח(?:ות)? לבד/, /יוצאות לבד(?! ?\?)/, /לקוחות מרוצים/, /ביקורות/, /\d+%/, /\d+\s*שעות/, /בעלי צימרים כבר/, /אי אפשר לשמור/];
  for (const re of banned) assert.ok(!re.test(answers), `claim ${re}`);
  // tax invoices: only ever said honestly (still issued in the owner's own software)
  if (/חשבונית מס/.test(answers)) assert.match(answers, /חשבונית מס רשמית עדיין מפיקים בתוכנת החשבוניות שלכם/);
  const allowedNumbers = new Set([String(TRIAL_DAYS), String(PRICING_PLANS[0].price), ...PHONE_DISPLAY.split('-')]);
  for (const n of text.match(/\d+/g) || []) assert.ok(allowedNumbers.has(n), `unexpected number ${n}`);
});

test('true anchors stay: trial, no card, no commitment, real price, a human on WhatsApp, phone', () => {
  assert.match(text, new RegExp(`${TRIAL_DAYS} הימים הראשונים חינם`));
  assert.match(text, /בלי כרטיס אשראי/);
  assert.match(text, /בלי התחייבות/);
  assert.ok(text.includes(`₪${PRICING_PLANS[0].price} לחודש`));
  assert.match(text, /בן אדם אמיתי עונה לכם בוואטסאפ/);
  assert.ok(text.includes(PHONE_DISPLAY));
  assert.match(text, /בטלפון/);
  assert.match(text, /בלחיצה אחת/); // WhatsApp is one tap, never auto-send
});

test('house style: no em or en dashes', () => {
  assert.ok(!/[\u2014\u2013]/.test(text));
});
