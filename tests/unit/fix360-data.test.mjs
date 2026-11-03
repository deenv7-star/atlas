// fix/360-data: booking form rules, phone helpers, iCal parsing (time zones, empty feed), sync safety, export.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeBookingFormSchema, emptyBookingFormValues, isValidPhone, parsePrice, nightsBetweenISO, BOOKING_LIMITS } from '../../src/components/forms/atlasFormSchemas.ts';
import { toInternationalDigits, telHref, whatsappHref, phoneSearchCore, phoneIlikePattern, phoneMatches, isDialable } from '../../src/lib/phone.js';
import { icsDate, parseIcs, buildIcs } from '../../supabase/functions/_shared/ics.ts';
import { planCancellations, warningMessage, isDuplicateInsert } from '../../supabase/functions/_shared/syncPlan.ts';
import { exportEvents } from '../../supabase/functions/_shared/exportPlan.ts';
import { isPrivateIp, checkResolvedHost } from '../../supabase/functions/_shared/feedUrl.ts';

const schema = makeBookingFormSchema({ requireProperty: true });
const valid = { ...emptyBookingFormValues, guest_name: 'דנה כהן', property_id: 'u1', check_in_date: '2026-11-20', check_out_date: '2026-11-22' };
const errorsOf = (v, s = schema) => {
  const r = s.safeParse(v);
  if (r.success) return {};
  return Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
};

test('booking form: a normal booking passes', () => {
  assert.deepEqual(errorsOf(valid), {});
});

test('APP-001: check-out before check-in is rejected with a Hebrew message', () => {
  const e = errorsOf({ ...valid, check_in_date: '2026-11-20', check_out_date: '2026-11-18' });
  assert.equal(e.check_out_date, 'תאריך היציאה צריך להיות אחרי תאריך הכניסה');
});

test('APP-002: same-day check-out is rejected (min 1 night)', () => {
  const e = errorsOf({ ...valid, check_in_date: '2026-11-25', check_out_date: '2026-11-25' });
  assert.equal(e.check_out_date, 'היציאה צריכה להיות לפחות לילה אחד אחרי הכניסה');
});

test('booking form: check-out is required, and more than 365 nights is rejected', () => {
  assert.equal(errorsOf({ ...valid, check_out_date: '' }).check_out_date, 'בחרו תאריך יציאה');
  assert.match(errorsOf({ ...valid, check_out_date: '2028-01-01' }).check_out_date, /365/);
});

test('APP-003: price must be 0…1,000,000 and numeric; empty is allowed', () => {
  assert.equal(errorsOf({ ...valid, total_price: '-500' }).total_price, 'המחיר לא יכול להיות שלילי');
  assert.equal(errorsOf({ ...valid, total_price: '99999999999' }).total_price, 'המחיר גבוה מדי. בדקו שאין אפס מיותר');
  assert.equal(errorsOf({ ...valid, total_price: 'abc' }).total_price, 'כתבו מחיר במספרים');
  for (const ok of ['', '0', '1200', '1,200', '950.5', String(BOOKING_LIMITS.maxPrice)]) assert.deepEqual(errorsOf({ ...valid, total_price: ok }), {}, ok);
  assert.equal(parsePrice('1,200'), 1200);
  assert.equal(parsePrice(''), null);
});

test('APP-004: phone must be a real Israeli or international number', () => {
  assert.equal(errorsOf({ ...valid, guest_phone: 'abc' }).guest_phone, 'מספר הטלפון לא נראה תקין. למשל 050-1234567');
  for (const ok of ['', '050-1234567', '0521234567', '04-9876543', '+972 52 123 4567', '972521234567', '+44 20 7946 0958', '(052) 123-4567']) {
    assert.equal(isValidPhone(ok), true, ok);
  }
  for (const bad of ['abc', '123', '05212', '0521234567890', '+1', '052-123-4567 ext 9', '++972521234567']) {
    assert.equal(isValidPhone(bad), false, bad);
  }
});

test('APP-005: unit is required when the account has units, optional when it has none', () => {
  assert.equal(errorsOf({ ...valid, property_id: '' }).property_id, 'בחרו יחידה');
  assert.deepEqual(errorsOf({ ...valid, property_id: '' }, makeBookingFormSchema({ requireProperty: false })), {});
});

test('APP-006: max lengths on name, phone, notes', () => {
  assert.match(errorsOf({ ...valid, guest_name: 'א'.repeat(81) }).guest_name, /80/);
  assert.deepEqual(errorsOf({ ...valid, guest_name: 'א'.repeat(80) }), {});
  assert.match(errorsOf({ ...valid, notes: 'x'.repeat(2001) }).notes, /2000/);
  assert.equal(errorsOf({ ...valid, guest_phone: '0'.repeat(31) }).guest_phone, 'מספר הטלפון ארוך מדי');
  assert.equal(errorsOf({ ...valid, guest_name: '   ' }).guest_name, 'כתבו את שם האורח');
});

test('booking form: all problems are reported together (not one at a time)', () => {
  const e = errorsOf({ ...valid, guest_name: '', property_id: '', check_out_date: '2026-11-01', total_price: '-1', guest_phone: 'abc' });
  assert.deepEqual(Object.keys(e).sort(), ['check_out_date', 'guest_name', 'guest_phone', 'property_id', 'total_price']);
});

test('nightsBetweenISO counts calendar days with no DST drift', () => {
  assert.equal(nightsBetweenISO('2026-10-24', '2026-10-26'), 2); // Israel DST ends 25.10.2026
  assert.equal(nightsBetweenISO('2026-03-26', '2026-03-28'), 2);
  assert.equal(nightsBetweenISO('2026-11-20', '2026-11-18'), -2);
  assert.equal(nightsBetweenISO('', '2026-11-18'), null);
});

test('phone helpers: wa.me / tel: from any stored form, nothing from junk', () => {
  assert.equal(toInternationalDigits('052-123-4567'), '972521234567');
  assert.equal(toInternationalDigits('+972 52 123 4567'), '972521234567');
  assert.equal(toInternationalDigits('00972521234567'), '972521234567');
  assert.equal(toInternationalDigits('+44 20 7946 0958'), '442079460958');
  assert.equal(toInternationalDigits('abc'), '');
  assert.equal(isDialable('abc'), false);
  assert.equal(telHref('052-1234567'), 'tel:+972521234567');
  assert.equal(telHref('abc'), '');
  assert.equal(whatsappHref('0521234567', 'שלום'), `https://wa.me/972521234567?text=${encodeURIComponent('שלום')}`);
  assert.equal(whatsappHref('0521234567'), 'https://wa.me/972521234567');
});

test('APP-007: phone search matches whatever format was stored', () => {
  assert.equal(phoneSearchCore('0521234567'), '521234567');
  assert.equal(phoneSearchCore('+972-52-123-4567'), '521234567');
  assert.equal(phoneSearchCore('דנה'), '');
  assert.equal(phoneSearchCore('12'), '');
  assert.equal(phoneIlikePattern('5212'), '%5%2%1%2%');
  for (const stored of ['052-123-4567', '0521234567', '+972521234567', '+972 52 123 4567']) {
    assert.equal(phoneMatches(stored, '0521234567'), true, stored);
    assert.equal(phoneMatches(stored, '4567'), true, stored);
  }
  assert.equal(phoneMatches('054-765-4321', '0521234567'), false);
  assert.equal(phoneMatches(null, '0521234567'), false);
});

test('ENG-02: iCal all-day dates are taken as is', () => {
  assert.equal(icsDate('20261020', 'VALUE=DATE'), '2026-10-20');
  assert.equal(icsDate('20261020'), '2026-10-20');
});

test('ENG-02: UTC timestamps are converted to Israel time, not sliced', () => {
  assert.equal(icsDate('20261019T220000Z'), '2026-10-20'); // 01:00 IDT on 20.10 (UTC+3)
  assert.equal(icsDate('20261119T220000Z'), '2026-11-20'); // 00:00 IST on 20.11 (UTC+2, after DST)
  assert.equal(icsDate('20261119T215959Z'), '2026-11-19'); // 23:59:59 IST on 19.11
  assert.equal(icsDate('20261020T140000Z'), '2026-10-20');
});

test('ENG-02: TZID wall time is read in its own zone, then shown as the Israel date', () => {
  assert.equal(icsDate('20261020T150000', 'TZID=Asia/Jerusalem'), '2026-10-20');
  assert.equal(icsDate('20261020T230000', 'TZID=Europe/London'), '2026-10-21'); // 01:00 in Israel
  assert.equal(icsDate('20261020T230000', 'TZID="America/New_York"'), '2026-10-21'); // 06:00 in Israel
  assert.equal(icsDate('20261020T100000', 'TZID=Not/AZone'), '2026-10-20'); // unknown zone: wall date
  assert.equal(icsDate('20261020T230000'), '2026-10-20'); // floating = Israel local
});

test('parseIcs: timed UTC events land on the right nights; quoted TZID params are understood', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT', 'UID:a1', 'DTSTART:20261119T220000Z', 'DTEND:20261121T220000Z', 'SUMMARY:Reserved', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:a2', 'DTSTART;TZID="America/New_York":20261124T200000', 'DTEND;TZID="America/New_York":20261126T200000', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:a3', 'DTSTART;VALUE=DATE:20261201', 'DTEND;VALUE=DATE:20261203', 'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const ev = parseIcs(ics);
  assert.deepEqual(ev.map((e) => [e.uid, e.start, e.end]), [
    ['a1', '2026-11-20', '2026-11-22'],
    ['a2', '2026-11-25', '2026-11-27'],
    ['a3', '2026-12-01', '2026-12-03'],
  ]);
});

test('ENG-01: an empty or truncated feed parses to fewer events, never throws', () => {
  assert.deepEqual(parseIcs('BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n'), []);
  const cut = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:x\r\nDTSTART;VALUE=DATE:20261201\r\nDTEND;VALUE=DATE:20261203\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:y\r\nDTSTART;VALUE=DATE:2026';
  assert.deepEqual(parseIcs(cut).map((e) => e.uid), ['x']);
  assert.throws(() => parseIcs('<html>maintenance</html>'), /not_ical/);
});

const future = (uid, co = '2026-12-10', status = 'CONFIRMED') => ({ id: `b-${uid}`, external_uid: uid, status, check_out_date: co });
const today = '2026-11-01';

test('ENG-01: empty feed with future bookings → cancel nothing, warn', () => {
  const p = planCancellations({ existing: [future('a'), future('b'), future('c')], seenUids: new Set(), today, feedEvents: 0, previousEvents: 3 });
  assert.equal(p.suspicious, true);
  assert.equal(p.reason, 'empty_feed');
  assert.equal(p.toCancel.length, 0);
  assert.equal(p.gone.length, 3);
  assert.match(warningMessage(p, 'Airbnb'), /^היומן של Airbnb חזר ריק: 3 הזמנות לא מופיעות בו, ולא ביטלנו אותן\./);
});

test('ENG-01: a single real booking in an empty feed is held too (one-booking calendar)', () => {
  const p = planCancellations({ existing: [future('a')], seenUids: new Set(), today, feedEvents: 0, previousEvents: 1 });
  assert.equal(p.toCancel.length, 0);
  assert.match(warningMessage(p, 'Booking.com'), /הזמנה אחת לא מופיעה בו, ולא ביטלנו אותה/);
});

test('ENG-01: feed dropped by more than half vs last sync → cancel nothing', () => {
  const existing = ['a', 'b', 'c', 'd', 'e', 'f'].map((u) => future(u));
  const p = planCancellations({ existing, seenUids: new Set(['a', 'b']), today, feedEvents: 2, previousEvents: 6 });
  assert.equal(p.reason, 'feed_dropped');
  assert.equal(p.toCancel.length, 0);
});

test('ENG-01: more than half of the future imported bookings vanish → cancel nothing', () => {
  const existing = ['a', 'b', 'c'].map((u) => future(u));
  const p = planCancellations({ existing, seenUids: new Set(['a', 'z1', 'z2', 'z3']), today, feedEvents: 4, previousEvents: 3 });
  assert.equal(p.reason, 'mass_cancel');
  assert.equal(p.toCancel.length, 0);
});

test('ENG-01: a normal single cancellation still goes through', () => {
  const existing = ['a', 'b', 'c', 'd'].map((u) => future(u));
  const p = planCancellations({ existing, seenUids: new Set(['a', 'b', 'c']), today, feedEvents: 3, previousEvents: 4 });
  assert.equal(p.suspicious, false);
  assert.deepEqual(p.toCancel.map((r) => r.external_uid), ['d']);
});

test('ENG-01: past stays and already-cancelled rows are never touched and never count', () => {
  const existing = [future('old', '2026-10-01'), future('x', '2026-12-01', 'CANCELLED'), future('a')];
  const p = planCancellations({ existing, seenUids: new Set(['a']), today, feedEvents: 1, previousEvents: 1 });
  assert.equal(p.suspicious, false);
  assert.equal(p.toCancel.length, 0);
  // empty feed, but nothing active in the future to lose → not a warning
  const q = planCancellations({ existing: [future('old', '2026-10-01')], seenUids: new Set(), today, feedEvents: 0, previousEvents: 0 });
  assert.equal(q.suspicious, false);
});

test('ENG-03: a duplicate insert from a parallel run is not an error', () => {
  assert.equal(isDuplicateInsert({ code: '23505' }), true);
  assert.equal(isDuplicateInsert({ code: '23P01' }), false);
  assert.equal(isDuplicateInsert(null), false);
});

test('ENG-10: export includes bookings with no check-out (end from nights) and drops inactive ones', () => {
  const rows = [
    { id: '1', check_in_date: '2026-11-20', check_out_date: null, nights: 3, status: 'CONFIRMED', source: 'direct' },
    { id: '2', check_in_date: '2026-11-20', check_out_date: '2026-11-18', nights: null, status: 'PENDING', source: 'direct' },
    { id: '3', check_in_date: '2026-11-20', check_out_date: '2026-11-22', nights: 2, status: 'CANCELLED', source: 'direct' },
    { id: '4', check_in_date: '2026-11-20', check_out_date: '2026-11-22', nights: 2, status: 'CONFIRMED', source: 'airbnb' },
    { id: '5', check_in_date: '2026-09-01', check_out_date: null, nights: 2, status: 'CONFIRMED', source: 'direct' },
  ];
  const ev = exportEvents(rows, { from: '2026-10-02', channel: 'airbnb' });
  assert.deepEqual(ev.map((e) => [e.uid, e.start, e.end]), [
    ['atlas-1@atlas-il.com', '2026-11-20', '2026-11-23'],
    ['atlas-2@atlas-il.com', '2026-11-20', '2026-11-21'],
  ]);
  const body = buildIcs({ name: 'atlas · צימר', events: ev });
  assert.match(body, /DTSTART;VALUE=DATE:20261120\r\nDTEND;VALUE=DATE:20261123/);
});

test('SEC-03: private / loopback addresses are refused after DNS resolution', async () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.10', '172.20.1.1', '169.254.169.254', '100.64.0.1', '::1', 'fd00::1', '::ffff:127.0.0.1', '0.0.0.0']) {
    assert.equal(isPrivateIp(ip), true, ip);
  }
  for (const ip of ['8.8.8.8', '54.230.1.1', '2a03:2880:f10e:83:face:b00c:0:25de']) assert.equal(isPrivateIp(ip), false, ip);
  const fake = (map) => async (host, type) => { const v = map[`${host}/${type}`]; if (!v) throw new Error('NotFound'); return v; };
  assert.equal(await checkResolvedHost('evil.example.com', fake({ 'evil.example.com/A': ['127.0.0.1'] })), 'private');
  assert.equal(await checkResolvedHost('mixed.example.com', fake({ 'mixed.example.com/A': ['8.8.8.8'], 'mixed.example.com/AAAA': ['::1'] })), 'private');
  assert.equal(await checkResolvedHost('www.airbnb.com', fake({ 'www.airbnb.com/A': ['54.230.1.1'] })), 'ok');
  assert.equal(await checkResolvedHost('nope.example.com', fake({})), 'unresolved');
  assert.equal(await checkResolvedHost('www.airbnb.com', null), 'unsupported');
  assert.equal(await checkResolvedHost('10.0.0.5', null), 'private');
});
