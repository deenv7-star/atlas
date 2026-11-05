// leads-v2 (05.11.2026): one inbox model (src/lib/inbox/model.js) + lead sources catalog. Run: npm run test:unit
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildThreads, filterThreads, countThreads, leadChannel, leadState, availabilityFor, availabilityLabel,
  viaLine, leadReplyText, STATE_TO_STATUS,
} from '../../src/lib/inbox/model.js';
import { LEAD_SOURCES, taggedLink, siteButtonSnippet, webhookUrl, SOURCE_STATUS_LABEL } from '../../src/lib/leads/sources.js';

const NOW = new Date('2026-11-05T20:00:00+02:00');
const TODAY = '2026-11-05';
const ago = (h) => new Date(NOW.getTime() - h * 3600000).toISOString();

const props = [{ id: 'p1', name: 'הגפן' }, { id: 'p2', name: 'הזית' }];
const bookings = [
  { id: 'b1', property_id: 'p1', guest_name: 'יוני', guest_phone: '050-1112233', check_in_date: '2026-11-08', check_out_date: '2026-11-10', status: 'CONFIRMED', created_at: ago(30) },
  { id: 'b2', property_id: 'p2', guest_name: 'רחל', guest_phone: '052-9998877', check_in_date: '2026-12-20', check_out_date: '2026-12-22', status: 'CONFIRMED', lead_id: 'l3', created_at: ago(5) },
  { id: 'b3', property_id: 'p2', guest_name: 'רחוק', check_in_date: '2027-03-01', check_out_date: '2027-03-03', status: 'CONFIRMED', created_at: ago(50) },
];
const leads = [
  { id: 'l1', full_name: 'מיכל כהן', phone: '054-1234567', check_in_date: '2026-11-08', check_out_date: '2026-11-09', property_id: 'p1', status: 'NEW', source: 'website', notes: 'פנייה מדף ההזמנה הישירה (הגפן)\nהגיעה דרך: אינסטגרם', created_at: ago(3) },
  { id: 'l2', full_name: 'דן', phone: '054-7654321', check_in_date: '2026-11-08', check_out_date: '2026-11-09', status: 'CONTACTED', source: 'phone', created_at: ago(1) },
  { id: 'l3', full_name: 'רחל', phone: '052-9998877', status: 'WON', created_at: ago(8) },
  { id: 'l4', full_name: 'לא רלוונטי', status: 'REJECTED', created_at: ago(40) },
];
const logs = [
  { id: 'm1', booking_id: 'b1', recipient: '0501112233', body: 'שלום יוני', direction: 'outbound', channel: 'whatsapp', created_at: ago(20) },
  { id: 'm2', recipient: '054-7654321', body: 'היי דן', direction: 'outbound', channel: 'whatsapp', created_at: ago(0.5) },
  { id: 'm3', guest_name: 'ישן', recipient: '053-0000000', body: 'הודעה ישנה', direction: 'outbound', channel: 'whatsapp', created_at: ago(100) },
];

test('threads: leads, guests, logs attached; far booking without messages is not a thread', () => {
  const t = buildThreads({ leads, bookings, logs, now: NOW, today: TODAY });
  const by = Object.fromEntries(t.map((x) => [x.key, x]));
  assert.ok(by['l:l1'] && by['l:l1'].kind === 'lead');
  assert.equal(by['b:b1'].kind, 'guest');
  assert.equal(by['b:b1'].messages.length, 1);
  assert.equal(by['b:b2'].lead.id, 'l3', 'converted lead lives in its booking thread');
  assert.ok(!by['l:l3'], 'no duplicate lead thread for a converted lead');
  assert.ok(!by['b:b3'], 'far booking without messages stays out');
  assert.equal(by['l:l2'].messages.length, 1, 'log matched by phone');
  assert.ok(t.some((x) => x.name === 'ישן'), 'old log without booking/lead still shown');
  assert.equal(t[0].key, 'l:l1', 'unanswered lead first');
  assert.equal(by['l:l1'].needsReply, true);
  assert.equal(by['l:l1'].overdue, true);
  assert.equal(by['l:l2'].needsReply, false);
});

test('filters and counts', () => {
  const t = buildThreads({ leads, bookings, logs, now: NOW, today: TODAY });
  const c = countThreads(t);
  assert.equal(c.leads, 2); // l1 new, l2 replied (l4 dropped is not open)
  assert.equal(c.waiting, 1);
  assert.deepEqual(filterThreads(t, 'leads').map((x) => x.key).sort(), ['l:l1', 'l:l2']);
  assert.ok(filterThreads(t, 'guests').every((x) => x.kind === 'guest'));
  assert.equal(filterThreads(t, 'all', 'מיכל').length, 1);
  assert.equal(filterThreads(t, 'all', '1234567').length, 1);
});

test('channel and state mapping', () => {
  assert.equal(leadChannel(leads[0]), 'instagram');
  assert.equal(leadChannel({ source: 'website' }), 'link');
  assert.equal(leadChannel({ source: 'webhook:facebook' }), 'facebook');
  assert.equal(leadChannel({ source: 'webhook' }), 'webhook');
  assert.equal(leadChannel({ channel: 'messenger', source: 'x' }), 'messenger');
  assert.equal(leadChannel({}), 'manual');
  assert.equal(leadState({ status: 'OFFER_SENT' }), 'replied');
  assert.equal(leadState({ status: 'CONFIRMED' }), 'booked');
  assert.equal(STATE_TO_STATUS.dropped, 'REJECTED');
  assert.equal(viaLine('instagram'), 'הגיעה דרך: אינסטגרם');
  assert.equal(viaLine('hack'), '');
});

test('availability: unit busy / free / partial across units', () => {
  assert.equal(availabilityFor(leads[0], bookings, props).state, 'busy');
  assert.equal(availabilityFor({ ...leads[0], check_in_date: '2026-11-10', check_out_date: '2026-11-11' }, bookings, props).state, 'free', 'check-out day is free');
  const av = availabilityFor(leads[1], bookings, props);
  assert.equal(av.state, 'partial'); assert.equal(av.freeUnits, 1);
  assert.equal(availabilityLabel(av), 'פנוי ב-1 מתוך 2 יחידות');
  assert.equal(availabilityFor({}, bookings, props).state, 'nodates');
});

test('reply text: dates + availability, Hebrew prefix rules', () => {
  const t = leadReplyText(leads[0], { unitName: 'הגפן', av: { state: 'free' } }, (d) => d);
  assert.match(t, /^שלום מיכל, תודה שפניתם לגפן\. 2026-11-08 עד 2026-11-09 פנוי אצלנו\.$/);
  assert.match(leadReplyText({ full_name: 'x', check_in_date: '2026-11-08' }, { unitName: 'INFINITY HOME', av: { state: 'busy' } }, (d) => d), /ל-INFINITY HOME/);
});

test('sources catalog for the integrations hub', () => {
  assert.ok(LEAD_SOURCES.find((s) => s.id === 'link').status === 'live');
  for (const id of ['whatsapp', 'instagram', 'messenger']) assert.equal(LEAD_SOURCES.find((s) => s.id === id).status, 'meta_review');
  assert.equal(SOURCE_STATUS_LABEL.meta_review, 'בקרוב');
  assert.equal(taggedLink('https://atlas-il.com/book/x', 'instagram'), 'https://atlas-il.com/book/x?src=instagram');
  assert.match(siteButtonSnippet('https://a/b'), /^<a href="https:\/\/a\/b"/);
  assert.equal(webhookUrl('https://x.supabase.co/', 'ab'), 'https://x.supabase.co/functions/v1/lead-intake?t=ab');
});
