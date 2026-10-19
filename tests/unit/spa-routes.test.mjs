import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { expected } from '../../scripts/spa-routes.mjs';

const read = (f) => fs.readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');

test('SPA routes: vercel.json, _redirects and server list match the app routes (run scripts/spa-routes.mjs --write)', () => {
  const { segs, vercel, redirects } = expected();
  assert.ok(segs.includes('today') && segs.includes('dashboard') && segs.includes('auth'));
  assert.ok(!segs.includes('pricing') && !segs.includes('blog'));
  const vj = JSON.parse(read('vercel.json'));
  assert.deepEqual(vj.rewrites.at(-1), vercel);
  assert.ok(!vj.rewrites.some((r) => r.source === '/(.*)'), 'no catch-all: unknown URLs must 404');
  const lines = read('public/_redirects').trim().split('\n');
  for (const l of redirects) assert.ok(lines.includes(l), l);
  assert.equal(lines.at(-1), '/*    /404.html   404');
  assert.deepEqual(JSON.parse(read('src/config/spa-routes.json')), segs);
});
