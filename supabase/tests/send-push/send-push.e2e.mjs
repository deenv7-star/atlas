// Run: node --experimental-strip-types --import ./supabase/tests/send-push/register.mjs supabase/tests/send-push/send-push.e2e.mjs
// The real supabase/functions/send-push/index.ts, with: Deno.env / Deno.serve shimmed, an in-memory database, and a
// mocked push service (globalThis.fetch) that decrypts every message with the device's private key (RFC 8291).
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { generateVapidKeys, b64urlEncode } from '../../functions/_shared/webpush.js';

const vapid = await generateVapidKeys();
const ENV = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'svc', SUPABASE_ANON_KEY: 'anon', ATLAS_CRON_SECRET: 'cron-secret',
  VAPID_PUBLIC_KEY: vapid.publicKey, VAPID_PRIVATE_KEY: vapid.privateKey, VAPID_SUBJECT: 'mailto:support@atlas-il.com' };
let handler = null;
globalThis.Deno = { env: { get: (k) => ENV[k] }, serve: (fn) => { handler = fn; } };

// devices: real P-256 keys, so the mocked push service can decrypt what send-push sends
function device(id, user, org, prefs = { bookings: true, leads: true, ical: true }) {
  const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
  const auth = crypto.randomBytes(16);
  return { row: { id, user_id: user, org_id: org, endpoint: `https://push.mock/${id}`, p256dh: b64urlEncode(ecdh.getPublicKey()), auth: b64urlEncode(auth), prefs, failure_count: 0, disabled_at: null }, ecdh, auth };
}
const hk = (salt, ikm, info, len) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));
function decrypt(body, d) {
  const b = Buffer.from(body); const salt = b.subarray(0, 16); const as = b.subarray(21, 86); const c = b.subarray(86);
  const ikm = hk(d.auth, d.ecdh.computeSecret(as), Buffer.concat([Buffer.from('WebPush: info\0'), d.ecdh.getPublicKey(), as]), 32);
  const dc = crypto.createDecipheriv('aes-128-gcm', hk(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), hk(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12));
  dc.setAuthTag(c.subarray(c.length - 16));
  const p = Buffer.concat([dc.update(c.subarray(0, c.length - 16)), dc.final()]);
  return JSON.parse(p.subarray(0, p.length - 1).toString());
}

const ORG = '00000000-0000-0000-0000-0000000000a1', OWNER = '00000000-0000-0000-0000-0000000000b1', PARTNER = '00000000-0000-0000-0000-0000000000b2';
const OTHER_ORG = '00000000-0000-0000-0000-0000000000a2';
const D = { ownerPhone: device('d1', OWNER, ORG), partnerPhone: device('d2', PARTNER, ORG, { bookings: true, leads: false, ical: true }), gone: device('d3', PARTNER, ORG), otherOrg: device('d4', OWNER, OTHER_ORG) };
const byEndpoint = Object.fromEntries(Object.values(D).map((d) => [d.row.endpoint, d]));
let delivered = [];
globalThis.fetch = async (url, init) => {
  const d = byEndpoint[url];
  assert.ok(init.headers.Authorization.startsWith('vapid t='), 'VAPID header');
  if (d === D.gone) return new Response('', { status: 410 });
  delivered.push({ device: d.row.id, msg: decrypt(init.body, d), ttl: init.headers.TTL, urgency: init.headers.Urgency, topic: init.headers.Topic });
  return new Response('', { status: 201 });
};
const B1 = '11111111-0000-0000-0000-000000000001', B2 = '11111111-0000-0000-0000-000000000002', B3 = '11111111-0000-0000-0000-000000000003', L1 = '22222222-0000-0000-0000-000000000001', S1 = '33333333-0000-0000-0000-000000000001', S2 = '33333333-0000-0000-0000-000000000002';
globalThis.__db = {
  push_subscriptions: Object.values(D).map((d) => d.row),
  bookings: [
    { id: B1, org_id: ORG, guest_name: 'דנה כהן', check_in_date: '2099-11-12', check_out_date: '2099-11-14', source: 'website', status: 'CONFIRMED', unit_id: 'u1' },
    { id: B2, org_id: ORG, guest_name: 'אורח Airbnb', check_in_date: '2099-12-01', check_out_date: '2099-12-03', source: 'airbnb', status: 'CONFIRMED', external_sync_id: S1, external_uid: 'x', is_block: true, unit_id: 'u1' },
    { id: B3, org_id: ORG, guest_name: 'תפוס ב-Booking.com', check_in_date: '2099-12-05', check_out_date: '2099-12-06', source: 'booking', status: 'CONFIRMED', external_sync_id: S2, external_uid: 'y', is_block: true },
  ],
  leads: [{ id: L1, org_id: ORG, full_name: 'יוסי לוי', check_in_date: '2099-11-20', check_out_date: '2099-11-22', adults: 8, children: 4 }],
  units: [{ id: 'u1', name: 'סוויטת הגפן' }],
  properties: [],
  calendar_syncs: [{ id: S1, last_success_at: '2026-10-19T10:00:00Z' }, { id: S2, last_success_at: null }],
};
globalThis.__jwtUsers = { 'jwt-owner': { id: OWNER } };

await import('../../functions/send-push/index.ts');
const call = async (body, headers = { 'x-atlas-cron': 'cron-secret' }) => {
  delivered = [];
  const res = await handler(new Request('https://x.supabase.co/functions/v1/send-push', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }));
  return { status: res.status, json: await res.json() };
};
const out = []; let fail = 0;
const t = async (name, fn) => { try { await fn(); out.push('PASS  ' + name); } catch (e) { fail++; out.push('FAIL  ' + name + '  — ' + e.message); } };

await t('rejects calls without the cron secret', async () => {
  const r = await call({ kind: 'booking', id: B1, org_id: ORG }, {});
  assert.equal(r.status, 401);
});
await t('direct-booking-page booking: every device of the org gets it, decrypted payload is right, other org gets nothing; a 410 device is deleted', async () => {
  const r = await call({ kind: 'booking', id: B1, org_id: ORG, actor: null });
  assert.equal(r.status, 200);
  assert.deepEqual(delivered.map((d) => d.device).sort(), ['d1', 'd2']);
  const m = delivered[0].msg;
  assert.equal(m.title, 'הזמנה חדשה מדף ההזמנות');
  assert.equal(m.body, 'דנה כהן · 12–14 בנוב׳ · 2 לילות');
  assert.equal(m.url, `/booking/${B1}`);
  assert.equal(delivered[0].urgency, 'high');
  assert.ok(!globalThis.__db.push_subscriptions.some((s) => s.id === 'd3'), 'gone device removed');
});
await t('the person who typed the booking in is not notified; teammates are', async () => {
  const r = await call({ kind: 'booking', id: B1, org_id: ORG, actor: OWNER });
  assert.deepEqual(delivered.map((d) => d.device), ['d2']);
  assert.equal(r.json.sent, 1);
});
await t('iCal booking after the first sync: channel + unit, collapsible tag', async () => {
  await call({ kind: 'booking', id: B2, org_id: ORG });
  assert.equal(delivered.length, 2);
  assert.equal(delivered[0].msg.title, 'הזמנה חדשה מ-Airbnb');
  assert.equal(delivered[0].msg.body, '1–3 בדצמ׳ · 2 לילות · סוויטת הגפן');
  assert.equal(delivered[0].msg.tag, `ical-${S1}`);
});
await t('first import of a calendar is silent', async () => {
  const r = await call({ kind: 'booking', id: B3, org_id: ORG });
  assert.equal(r.json.skipped, 'first_import');
  assert.equal(delivered.length, 0);
});
await t('lead: respects a device that turned leads off', async () => {
  await call({ kind: 'lead', id: L1, org_id: ORG });
  assert.deepEqual(delivered.map((d) => d.device), ['d1']);
  assert.equal(delivered[0].msg.title, 'ליד חדש');
  assert.equal(delivered[0].msg.body, 'יוסי לוי · 20–22 בנוב׳ · 12 אורחים');
});
await t('a row from another org id is never read (org_id must match)', async () => {
  const r = await call({ kind: 'booking', id: B1, org_id: OTHER_ORG });
  assert.equal(r.json.skipped, 'not_found');
  assert.equal(delivered.length, 0);
});
await t('test notification from Settings goes only to the caller\'s devices', async () => {
  const r = await call({ test: true }, { Authorization: 'Bearer jwt-owner' });
  assert.deepEqual(delivered.map((d) => d.device).sort(), ['d1', 'd4']);
  assert.equal(delivered[0].msg.title, 'ההתראות פועלות');
  assert.equal(r.json.sent, 2);
  const bad = await call({ test: true }, { Authorization: 'Bearer nope' });
  assert.equal(bad.status, 401);
});
await t('bad input is a 400', async () => {
  const r = await call({ kind: 'payment', id: B1, org_id: ORG });
  assert.equal(r.status, 400);
});
console.log(out.join('\n'));
console.log(`\n${out.length - fail} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
