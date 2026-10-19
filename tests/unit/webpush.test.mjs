// Run: npm run test:unit — Web Push sender (supabase/functions/_shared/webpush.js).
// A fake "browser" subscription is made with node:crypto, the sender encrypts for it with WebCrypto, and this
// file decrypts the result with an independent RFC 8291 implementation on node:crypto. The VAPID JWT is
// verified with node:crypto too. A mocked push service checks the request the sender makes.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  encryptPayload, sendWebPush, importVapidKeys, vapidJwt, generateVapidKeys, b64urlEncode, b64urlDecode,
} from '../../supabase/functions/_shared/webpush.js';

function fakeBrowserSubscription(endpoint = 'https://fcm.googleapis.com/fcm/send/abc123') {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  const auth = crypto.randomBytes(16);
  return {
    ecdh, auth,
    sub: { endpoint, keys: { p256dh: b64urlEncode(ecdh.getPublicKey()), auth: b64urlEncode(auth) } },
  };
}

const hkdf = (salt, ikm, info, len) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));

/** RFC 8291 receiver side, written against the RFC with node:crypto only. */
function decrypt(body, ecdh, auth) {
  const buf = Buffer.from(body);
  const salt = buf.subarray(0, 16);
  const rs = buf.readUInt32BE(16);
  const idlen = buf[20];
  const asPublic = buf.subarray(21, 21 + idlen);
  const cipher = buf.subarray(21 + idlen);
  assert.equal(rs, 4096);
  assert.equal(idlen, 65);
  const shared = ecdh.computeSecret(asPublic);
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), ecdh.getPublicKey(), asPublic]);
  const ikm = hkdf(auth, shared, keyInfo, 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(cipher.subarray(cipher.length - 16));
  const plain = Buffer.concat([d.update(cipher.subarray(0, cipher.length - 16)), d.final()]);
  assert.equal(plain[plain.length - 1], 2, 'last-record delimiter');
  return plain.subarray(0, plain.length - 1).toString('utf8');
}

test('encrypts a Hebrew payload that an independent RFC 8291 receiver can read', async () => {
  const { ecdh, auth, sub } = fakeBrowserSubscription();
  const payload = JSON.stringify({ title: 'הזמנה חדשה', body: 'דנה כהן · 12–14 בנוב׳ · 2 לילות', url: '/booking/1' });
  const body = await encryptPayload(sub, payload);
  assert.equal(decrypt(body, ecdh, auth), payload);
});

test('every message uses a fresh salt and server key', async () => {
  const { sub } = fakeBrowserSubscription();
  const a = await encryptPayload(sub, 'x');
  const b = await encryptPayload(sub, 'x');
  assert.notDeepEqual(Buffer.from(a).subarray(0, 16), Buffer.from(b).subarray(0, 16));
  assert.notDeepEqual(Buffer.from(a).subarray(21, 86), Buffer.from(b).subarray(21, 86));
});

test('rejects payloads over one 4 KB record and broken subscription keys', async () => {
  const { sub } = fakeBrowserSubscription();
  await assert.rejects(encryptPayload(sub, 'x'.repeat(4000)), /payload_too_large/);
  await assert.rejects(encryptPayload({ ...sub, keys: { p256dh: 'AAAA', auth: sub.keys.auth } }, 'x'), /subscription_keys_invalid/);
});

test('VAPID JWT is ES256, signed by the VAPID key, audience = push service origin', async () => {
  const keys = await generateVapidKeys();
  const vapid = await importVapidKeys({ ...keys, subject: 'mailto:support@atlas-il.com' });
  const jwt = await vapidJwt(vapid, 'https://web.push.apple.com/QGZx/abc', 1_800_000_000);
  const [h, c, s] = jwt.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(b64urlDecode(h)).toString()), { typ: 'JWT', alg: 'ES256' });
  const claims = JSON.parse(Buffer.from(b64urlDecode(c)).toString());
  assert.equal(claims.aud, 'https://web.push.apple.com');
  assert.equal(claims.sub, 'mailto:support@atlas-il.com');
  assert.equal(claims.exp, 1_800_000_000 + 12 * 3600);
  const pub = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64urlEncode(b64urlDecode(keys.publicKey).slice(1, 33)), y: b64urlEncode(b64urlDecode(keys.publicKey).slice(33)) }, format: 'jwk' });
  const ok = crypto.verify('sha256', Buffer.from(`${h}.${c}`), { key: pub, dsaEncoding: 'ieee-p1363' }, Buffer.from(b64urlDecode(s)));
  assert.equal(ok, true);
});

test('bad VAPID input is refused before anything is sent', async () => {
  const keys = await generateVapidKeys();
  await assert.rejects(importVapidKeys({ ...keys, subject: 'support@atlas-il.com' }), /vapid_subject_invalid/);
  await assert.rejects(importVapidKeys({ publicKey: 'AAAA', privateKey: keys.privateKey, subject: 'mailto:a@b.c' }), /vapid_public_key_invalid/);
});

test('sendWebPush makes the request a push service expects (mocked push service)', async () => {
  const { ecdh, auth, sub } = fakeBrowserSubscription('https://push.example.test/send/xyz');
  const keys = await generateVapidKeys();
  const vapid = await importVapidKeys({ ...keys, subject: 'mailto:support@atlas-il.com' });
  let seen = null;
  const fetchImpl = async (url, init) => { seen = { url, init }; return new Response('', { status: 201 }); };
  const r = await sendWebPush(sub, '{"title":"ליד חדש"}', vapid, { fetchImpl, topic: 'lead-123!' });
  assert.equal(r.ok, true);
  assert.equal(seen.url, 'https://push.example.test/send/xyz');
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.headers['Content-Encoding'], 'aes128gcm');
  assert.equal(seen.init.headers.TTL, '86400');
  assert.equal(seen.init.headers.Urgency, 'high');
  assert.equal(seen.init.headers.Topic, 'lead-123');
  assert.match(seen.init.headers.Authorization, new RegExp(`^vapid t=[\\w-]+\\.[\\w-]+\\.[\\w-]+, k=${keys.publicKey}$`));
  assert.equal(decrypt(seen.init.body, ecdh, auth), '{"title":"ליד חדש"}');
});

test('404 / 410 from the push service mark the subscription as gone', async () => {
  const { sub } = fakeBrowserSubscription();
  const vapid = await importVapidKeys({ ...(await generateVapidKeys()), subject: 'mailto:a@atlas-il.com' });
  for (const [status, gone] of [[410, true], [404, true], [429, false], [500, false]]) {
    const r = await sendWebPush(sub, 'x', vapid, { fetchImpl: async () => new Response('', { status }) });
    assert.equal(r.gone, gone, String(status));
    assert.equal(r.ok, false);
  }
});
