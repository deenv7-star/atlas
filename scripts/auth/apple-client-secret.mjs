#!/usr/bin/env node
/**
 * Sign in with Apple: generate the "client secret" Supabase needs (an ES256 JWT signed with the .p8 key).
 * Apple caps its life at 6 months, so it has to be generated again before it expires (Supabase then
 * starts rejecting Apple sign-ins). No dependencies, the key never leaves this machine.
 *
 *   node scripts/auth/apple-client-secret.mjs --team ABCDE12345 --key-id XYZ987WVU6 \
 *        --services-id com.atlasil.web --p8 ~/Downloads/AuthKey_XYZ987WVU6.p8 [--days 180]
 *
 * Prints the JWT on stdout and the expiry date on stderr.
 */
import { readFileSync } from 'node:fs';
import { createPrivateKey, sign } from 'node:crypto';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const team = args.team;
const keyId = args['key-id'];
const sub = args['services-id'];
const p8 = args.p8;
const days = Math.min(Number(args.days || 180), 182);
if (!team || !keyId || !sub || !p8) {
  console.error('usage: --team <TEAM_ID> --key-id <KEY_ID> --services-id <com.atlasil.web> --p8 <AuthKey_XXXX.p8> [--days 180]');
  process.exit(1);
}

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const now = Math.floor(Date.now() / 1000);
const exp = now + days * 24 * 3600;
const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
const claims = { iss: team, iat: now, exp, aud: 'https://appleid.apple.com', sub };
const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
const key = createPrivateKey(readFileSync(p8, 'utf8'));
const sig = sign('sha256', Buffer.from(input), { key, dsaEncoding: 'ieee-p1363' });
process.stdout.write(`${input}.${b64url(sig)}\n`);
console.error(`expires ${new Date(exp * 1000).toISOString()} (renew before then)`);
