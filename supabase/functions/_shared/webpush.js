// Web Push sender with no dependencies: VAPID (RFC 8292) + aes128gcm payload encryption (RFC 8291 / RFC 8188).
// Plain JavaScript on WebCrypto only, so the same file runs in Supabase Edge Functions (Deno) and in the
// Node unit tests (tests/unit/webpush.test.mjs decrypts what it produces with an independent implementation).
//
//   const vapid = await importVapidKeys({ publicKey, privateKey, subject })   // base64url keys, see scripts/push/generate-vapid.mjs
//   const res = await sendWebPush(subscription, JSON.stringify(payload), vapid, { ttl: 86400, urgency: 'high' })
//   res.status 201 = accepted; 404 / 410 = the subscription is gone (delete it).

const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();

export function b64urlEncode(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(...parts) {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

/** VAPID keys: publicKey = 65-byte uncompressed P-256 point, privateKey = 32-byte scalar, both base64url. */
export async function importVapidKeys({ publicKey, privateKey, subject }) {
  const pub = b64urlDecode(publicKey);
  const d = b64urlDecode(privateKey);
  if (pub.length !== 65 || pub[0] !== 4) throw new Error('vapid_public_key_invalid');
  if (d.length !== 32) throw new Error('vapid_private_key_invalid');
  if (!/^(mailto:|https:)/.test(subject || '')) throw new Error('vapid_subject_invalid');
  const jwk = {
    kty: 'EC', crv: 'P-256', ext: true,
    x: b64urlEncode(pub.slice(1, 33)), y: b64urlEncode(pub.slice(33, 65)), d: b64urlEncode(d),
  };
  const key = await subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  return { key, publicKey: b64urlEncode(pub), subject };
}

/** ES256 JWT for the push service's origin (aud), valid 12 h (RFC 8292 allows up to 24 h). */
export async function vapidJwt(vapid, endpoint, nowSec = Math.floor(Date.now() / 1000)) {
  const aud = new URL(endpoint).origin;
  const header = b64urlEncode(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64urlEncode(enc.encode(JSON.stringify({ aud, exp: nowSec + 12 * 3600, sub: vapid.subject })));
  const input = `${header}.${claims}`;
  // WebCrypto ECDSA returns r||s (IEEE P1363), which is exactly the JWS ES256 signature format
  const sig = new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, vapid.key, enc.encode(input)));
  return `${input}.${b64urlEncode(sig)}`;
}

async function hkdf(salt, ikm, info, length) {
  const key = await subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8));
}

/**
 * aes128gcm body for one subscription. `opts.salt` / `opts.serverKeys` exist only so tests can pin them.
 * Returns the full message body: salt(16) | rs(4) | idlen(1) | as_public(65) | ciphertext.
 */
export async function encryptPayload(subscription, plaintext, opts = {}) {
  const uaPublic = b64urlDecode(subscription.keys.p256dh);
  const authSecret = b64urlDecode(subscription.keys.auth);
  if (uaPublic.length !== 65 || authSecret.length < 16) throw new Error('subscription_keys_invalid');
  const data = typeof plaintext === 'string' ? enc.encode(plaintext) : new Uint8Array(plaintext);
  // one record of at most 4096 bytes: payload + 1 delimiter + 16 tag (push services cap the body at 4 KB anyway)
  if (data.length > 3993) throw new Error('payload_too_large');

  const serverKeys = opts.serverKeys || await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await subtle.exportKey('raw', serverKeys.publicKey));
  const uaKey = await subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: uaKey }, serverKeys.privateKey, 256));

  const keyInfo = concat(enc.encode('WebPush: info\0'), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, shared, keyInfo, 32);
  const salt = opts.salt || globalThis.crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  const aes = await subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const padded = concat(data, new Uint8Array([2])); // 0x02 = last (and only) record, no padding
  const cipher = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, aes, padded));

  const rs = new Uint8Array([0, 0, 0x10, 0]); // 4096
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, cipher);
}

/**
 * POST one encrypted message to the subscription's push service.
 * @returns {Promise<{status:number, ok:boolean, gone:boolean, body:string}>}
 */
export async function sendWebPush(subscription, payload, vapid, { ttl = 86400, urgency = 'high', topic, fetchImpl } = {}) {
  const body = await encryptPayload(subscription, payload);
  const jwt = await vapidJwt(vapid, subscription.endpoint);
  const headers = {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    TTL: String(ttl),
    Urgency: urgency,
    Authorization: `vapid t=${jwt}, k=${vapid.publicKey}`,
  };
  if (topic) headers.Topic = String(topic).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);
  const f = fetchImpl || globalThis.fetch;
  const res = await f(subscription.endpoint, { method: 'POST', headers, body });
  const text = await res.text().catch(() => '');
  return { status: res.status, ok: res.status >= 200 && res.status < 300, gone: res.status === 404 || res.status === 410, body: text.slice(0, 300) };
}

/** New VAPID key pair as base64url strings (scripts/push/generate-vapid.mjs prints these). */
export async function generateVapidKeys() {
  const kp = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await subtle.exportKey('jwk', kp.privateKey);
  const pub = new Uint8Array(await subtle.exportKey('raw', kp.publicKey));
  return { publicKey: b64urlEncode(pub), privateKey: jwk.d };
}
