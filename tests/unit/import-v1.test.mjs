// ייבוא מתחם (import v1): client model shared by versions A and B.
import test from 'node:test';
import assert from 'node:assert/strict';
import { linkKind, linkOk, extractLinks, linkHint, summaryChips, foundRows, questionsFor, applyAnswer, stillMissing, toProfile, unitRows, unitsLabelHe } from '../../src/lib/import/model.js';

const draft = {
  business_name: 'אחוזת דוגמה', property_type: 'zimmer_complex', unit_count: 4,
  units: [{ name: 'סוויטה', max_guests: 2, bedrooms: 1, bathrooms: 1, amenities: ['ג׳קוזי'] }],
  location: { address: 'החלוצים 1, ראש פינה', locality: 'ראש פינה' }, parking: 'חניה פרטית', check_in_time: '15:00', check_out_time: '11:30',
  house_rules: ['בלי עישון', 'שקט אחרי 23:00'], amenities: ['בריכה', 'ג׳קוזי'], contact: {}, photos: ['a', 'b', 'c'], thumbs: ['x'], reviews: { score: 9.4, scale: 10 },
  confidence: { business_name: 'high', unit_count: 'medium', parking: 'high', check_in_time: 'high', house_rules: 'high', contact: 'none' },
  sources: [{ ok: true, kind: 'booking', url: 'https://www.booking.com/hotel/il/x.he.html' }, { ok: false, kind: 'airbnb', url: null }],
};

test('links: what the owner pasted is recognised instantly', () => {
  assert.equal(linkKind('https://www.booking.com/hotel/il/hameiri-estate.he.html?aid=1').kind, 'booking');
  assert.equal(linkKind('booking.com/searchresults.he.html?ss=x').kind, 'booking_other');
  assert.equal(linkKind('he.airbnb.co.il/rooms/45244430').kind, 'airbnb');
  assert.equal(linkKind('ramotnof.co.il').kind, 'site');
  assert.equal(linkKind('https://maps.app.goo.gl/abc').kind, 'unsupported');
  assert.equal(linkKind('שלום').kind, 'bad');
  assert.ok(linkOk('www.zimmer.co.il') && !linkOk(''));
  assert.deepEqual(extractLinks('היי, זה המודעה שלנו https://www.airbnb.com/rooms/123?x=1. תודה!'), ['https://www.airbnb.com/rooms/123?x=1']);
  for (const l of ['', 'x', 'booking.com/hotel/il/a.html', 'airbnb.com/s/x', 'a.co.il']) assert.equal(typeof linkHint(l), 'string');
});

test('preview: chips and rows, "בדקו" on medium confidence', () => {
  assert.deepEqual(summaryChips(draft).map((c) => c.text), ['4 צימרים', '3 תמונות', 'ראש פינה', '9.4 מתוך 10']);
  const rows = foundRows(draft);
  assert.equal(rows.find((r) => r.id === 'unit_count').check, true);
  assert.equal(rows.find((r) => r.id === 'parking').check, false);
  assert.match(rows.find((r) => r.id === 'check_in_time').value, /כניסה 15:00 · יציאה 11:30/);
  assert.ok(!rows.some((r) => r.id === 'contact'));
  assert.equal(unitsLabelHe('villa', 1), 'וילה אחת');
  assert.equal(unitsLabelHe('zimmer', 1), 'צימר אחד');
});

test('questions: only what is missing; check-out rides with check-in; no link = the full short list', () => {
  assert.deepEqual(questionsFor(draft, ['contact', 'check_out_time', 'arrival_instructions']).map((q) => q.id), ['check_in_time', 'arrival_instructions', 'contact']);
  assert.equal(questionsFor(draft, []).length, 0);
  assert.ok(questionsFor(null).length >= 8);
});

test('answers: applied, marked as confirmed, clamped', () => {
  let d = applyAnswer(draft, 'unit_count', 99);
  assert.equal(d.unit_count, 30);
  assert.equal(d.confidence.unit_count, 'high');
  d = applyAnswer(d, 'check_in_time', { in: '14:00', out: '10:00' });
  assert.equal(d.check_out_time, '10:00');
  d = applyAnswer(d, 'contact', '050-1234567');
  assert.equal(d.contact.whatsapp, '050-1234567');
  d = applyAnswer(d, 'house_rules', ['בלי עישון', 'בלי עישון', ' ']);
  assert.deepEqual(d.house_rules, ['בלי עישון']);
  assert.equal(draft.unit_count, 4, 'pure');
  assert.ok(stillMissing(d).includes('cancellation_policy'));
  assert.ok(!stillMissing(d).includes('contact'));
});

test('profile for the brain: no preview thumbs, only working sources, stored photos', () => {
  const p = toProfile(draft, { photos: ['https://store/1.jpg'], missing: ['cancellation_policy'] });
  assert.equal(p.thumbs, undefined);
  assert.deepEqual(p.photos, ['https://store/1.jpg']);
  assert.deepEqual(p.sources, [{ kind: 'booking', url: 'https://www.booking.com/hotel/il/x.he.html' }]);
  assert.equal(p.v, 1);
});

test('units to create: listing names when they match the count, else numbered', () => {
  const rows = unitRows(draft);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].name, 'צימר 1');
  const one = unitRows({ ...draft, unit_count: 1, prices: { from: 700 } });
  assert.equal(one[0].name, 'אחוזת דוגמה');
  assert.equal(one[0].max_guests, 2);
  assert.equal(one[0].base_price, 700);
  const named = unitRows({ ...draft, unit_count: 1, units: [{ name: 'בקתה', max_guests: 3 }], business_name: '' });
  assert.equal(named[0].name, 'בקתה');
});
