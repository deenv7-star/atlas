// Run: npm run test:unit — what booking / lead push notifications say (supabase/functions/_shared/pushMessages.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { heDate, dateRange, bookingMessage, leadMessage, bookingKind, toPayload, PREF_FOR_KIND } from '../../supabase/functions/_shared/pushMessages.js';

test('Hebrew dates', () => {
  assert.equal(heDate('2026-11-12'), '12 בנוב׳');
  assert.equal(dateRange('2026-11-12', '2026-11-14'), '12–14 בנוב׳');
  assert.equal(dateRange('2026-10-30', '2026-11-02'), '30 באוק׳ – 2 בנוב׳');
  assert.equal(dateRange('', ''), '');
});

test('a booking from the direct-booking page', () => {
  const m = bookingMessage({ id: 'b1', guest_name: 'דנה כהן', check_in_date: '2026-11-12', check_out_date: '2026-11-14', source: 'website' });
  assert.equal(m.kind, 'booking');
  assert.equal(m.title, 'הזמנה חדשה מדף ההזמנות');
  assert.equal(m.body, 'דנה כהן · 12–14 בנוב׳ · 2 לילות');
  assert.equal(m.url, '/booking/b1');
  assert.equal(m.tag, 'booking-b1');
});

test('an iCal booking names the channel and the unit, never the placeholder guest', () => {
  const row = { id: 'b2', guest_name: 'אורח Airbnb', check_in_date: '2026-12-01', check_out_date: '2026-12-02', source: 'airbnb', external_sync_id: 's1', external_uid: 'u1' };
  assert.equal(bookingKind(row), 'ical');
  const m = bookingMessage(row, { unitName: 'סוויטת הגפן' });
  assert.equal(m.title, 'הזמנה חדשה מ-Airbnb');
  assert.equal(m.body, '1–2 בדצמ׳ · לילה אחד · סוויטת הגפן');
  assert.equal(m.tag, 'ical-s1');
});

test('a lead', () => {
  const m = leadMessage({ id: 'l1', full_name: 'יוסי לוי', check_in_date: '2026-11-20', check_out_date: '2026-11-22', adults: 8, children: 4 });
  assert.equal(m.title, 'ליד חדש');
  assert.equal(m.body, 'יוסי לוי · 20–22 בנוב׳ · 12 אורחים');
  assert.equal(m.url, '/lead/l1');
  assert.equal(leadMessage({ id: 'l2' }).body, 'פנייה חדשה מחכה לתשובה');
});

test('payload is small, versioned, and every kind maps to a device preference', () => {
  const p = JSON.parse(toPayload(bookingMessage({ id: 'x', guest_name: 'א'.repeat(500) })));
  assert.equal(p.v, 1);
  assert.ok(toPayload(bookingMessage({ id: 'x', guest_name: 'א'.repeat(500) })).length < 600);
  assert.deepEqual(Object.keys(PREF_FOR_KIND).sort(), ['booking', 'ical', 'lead']);
  for (const s of [p.title, p.body]) assert.ok(!s.includes('!'));
});
