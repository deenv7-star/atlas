/**
 * Onboarding v3 copy rules (atlas-hebrew-copy-master + brand voice): every string the wizard shows lives in
 * src/components/onboarding/v3/copy.js, so the rules are checked on the real strings, not on screenshots.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { COPY } from '../../src/components/onboarding/v3/copy.js';
import { KINDS, MORE_KINDS, CHANNELS, PRICE_MODES, SETUP_STEPS, kindInfo } from '../../src/lib/onboarding/v2/model.js';

const ALL_KINDS = [...KINDS, ...MORE_KINDS].map((k) => k.value);
const SAMPLE_A = { checkIn: '15:00', checkOut: '11:00', timesVary: true };

/** Every string in COPY, functions called with realistic arguments (every kind, 1 and 4 units, …). */
function strings(node, path = 'COPY', out = []) {
  if (typeof node === 'string') out.push([path, node]);
  else if (typeof node === 'function') {
    const tries = [
      ...ALL_KINDS.map((k) => [k]), ...ALL_KINDS.map((k) => [kindInfo(k), 1]), ...ALL_KINDS.map((k) => [kindInfo(k), 4]),
      [2, 5], [3], [SAMPLE_A], ['Booking'], [['Booking']], [['Booking', 'Airbnb']], ['Booking.com'], ['צימר'],
    ];
    for (const args of tries) {
      let v;
      try { v = node(...args); } catch { continue; }
      if (typeof v === 'string' && !v.includes('undefined') && !v.includes('[object')) out.push([`${path}(${args.map((x) => (typeof x === 'object' ? x.value || '…' : x)).join(',')})`, v]);
    }
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) strings(v, `${path}.${k}`, out);
  }
  return out;
}

const MODEL = { kinds: [...KINDS, ...MORE_KINDS].map((k) => ({ label: k.label, line: k.line || '' })), channels: CHANNELS.map((c) => c.label), price: PRICE_MODES.map((m) => [m.label, m.line]), setup: SETUP_STEPS.map((x) => [x.title, x.line]) };
const ALL = [...strings(COPY), ...strings(MODEL, 'model')];
const words = (s) => s.trim().split(/\s+/).filter((w) => w && !/^[·–-]$/.test(w));

test('step 1 asks exactly "מה סוג המתחם שלכם?" (Deen, 19.10.2026)', () => {
  assert.equal(COPY.kind.title, 'מה סוג המתחם שלכם?');
  if (COPY.b) assert.equal(COPY.b.place.title, 'מה סוג המתחם שלכם?');
  for (const [, s] of ALL) {
    assert.ok(!s.includes('איזה מקום יש לכם'), 'rejected wording is back');
    assert.ok(!s.includes('מה אתם מארחים'), 'rejected wording is back');
  }
});

test('no slash gender forms (/ה, /ת, /ים, /ות)', () => {
  for (const [p, s] of ALL) assert.ok(!/[\u0590-\u05FF]\/(ה|ת|ים|ות|י)(?![\u0590-\u05FF])/.test(s), `${p}: "${s}"`);
});

test('plural "אתם" throughout: no singular "שלך", "לך", "אתה"', () => {
  for (const [p, s] of ALL) {
    assert.ok(!/(^|[^\u0590-\u05FF])(שלך|לך|אתה|בשבילך|אליך|ממך)(?![\u0590-\u05FF])/.test(s), `${p}: "${s}"`);
  }
});

test('headlines are ≤ 6 words, helper lines ≤ 12 words', () => {
  const titles = ALL.filter(([p]) => /\.title(\(|$)/.test(p));
  assert.ok(titles.length >= 8, 'found the screen titles');
  for (const [p, s] of titles) assert.ok(words(s).length <= 6, `${p}: "${s}" has ${words(s).length} words`);
  const subs = ALL.filter(([p]) => /\.sub$/.test(p));
  for (const [p, s] of subs) assert.ok(words(s).length <= 12, `${p}: "${s}" has ${words(s).length} words`);
});

test('atlas is lowercase and never glued to a Hebrew letter', () => {
  for (const [p, s] of ALL) {
    assert.ok(!/ATLAS|Atlas/.test(s), `${p}: "${s}"`);
    assert.ok(!/[\u0590-\u05FF]-?atlas/.test(s), `${p}: "${s}"`);
  }
});

test('no exclamation marks, no emoji, no system words (מערכת ניהול, משתמש, נכס)', () => {
  for (const [p, s] of ALL) {
    assert.ok(!s.includes('!'), `${p}: "${s}"`);
    assert.ok(!/\p{Extended_Pictographic}/u.test(s), `${p}: "${s}"`);
    assert.ok(!/מערכת ניהול|משתמש|(^|\s)נכס/.test(s), `${p}: "${s}"`);
  }
});

test('"איך קוראים ל…?" is spelled right for every kind (לווילה, not לוילה)', () => {
  assert.equal(COPY.name.title('villa'), 'איך קוראים לווילה?');
  assert.equal(COPY.name.title('zimmer'), 'איך קוראים לצימר?');
  for (const k of ALL_KINDS) assert.match(COPY.name.title(k), /^איך קוראים ל[\u0590-\u05FF ]+\?$/);
});

test('channel labels speak the owner\'s words, plural', () => {
  assert.ok(CHANNELS.some((c) => c.label === 'האתר שלכם'));
  assert.ok(!CHANNELS.some((c) => /משלי|שלי/.test(c.label)));
});

test('review rows: times are short, "(משתנה)" only when they vary', () => {
  assert.equal(COPY.review.timesValue({ checkIn: '15:00', checkOut: '11:00', timesVary: false }), 'כניסה 15:00 · יציאה 11:00');
  assert.equal(COPY.review.timesValue(SAMPLE_A), 'כניסה 15:00 · יציאה 11:00 (משתנה)');
});

test('B: only valid links of ticked channels are saved, both to the first unit', async () => {
  const { linksFromAnswers } = await import('../../src/components/onboarding/v3/linksB.js');
  const ok = { icalBooking: ' https://ical.booking.com/v1/export?t=abc ', icalAirbnb: 'https://www.airbnb.com/calendar/ical/1.ics?s=x' };
  assert.deepEqual(linksFromAnswers({ ...ok, channels: ['booking', 'airbnb'] }).map((l) => [l.provider, l.unit, l.url]), [
    ['BOOKING_COM', 0, 'https://ical.booking.com/v1/export?t=abc'], ['AIRBNB', 0, 'https://www.airbnb.com/calendar/ical/1.ics?s=x']]);
  assert.equal(linksFromAnswers({ ...ok, channels: ['airbnb'] }).length, 1, 'unticked Booking is not saved');
  assert.equal(linksFromAnswers({ icalBooking: 'https://www.airbnb.com/rooms/1', channels: ['booking'] }).length, 0, 'wrong link is not saved');
  assert.equal(linksFromAnswers({ channels: ['booking'] }).length, 0);
});
