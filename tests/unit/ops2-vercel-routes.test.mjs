import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;

test('OPS-2: long cache headers only after a filesystem hit (missing files are not cached)', () => {
  const v = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  assert.ok(Array.isArray(v.routes), 'vercel.json uses routes');
  const hit = v.routes.findIndex((r) => r.handle === 'hit');
  const fsIdx = v.routes.findIndex((r) => r.handle === 'filesystem');
  assert.ok(fsIdx > 0 && hit > fsIdx);
  v.routes.forEach((r, i) => {
    const cc = r.headers?.['Cache-Control'] || '';
    if (/immutable|max-age=(86400|2592000)/.test(cc) && !/well-known/.test(r.src)) assert.ok(i > hit, `${r.src} long cache before hit`);
  });
  const assets = v.routes.find((r, i) => i > hit && r.src.startsWith('^/assets'));
  assert.equal(assets.headers['Cache-Control'], 'public, max-age=31536000, immutable');
  // security headers still on every response
  const all = v.routes.find((r) => r.src === '^(?:/(.*))$');
  assert.ok(all.headers['Content-Security-Policy'] && all.headers['Strict-Transport-Security']);
});
