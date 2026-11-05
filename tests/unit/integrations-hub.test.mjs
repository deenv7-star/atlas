// Integrations hub copy rules (Deen, 05.11.2026): every tile has one plain line of what it does; no tech jargon
// ("API", "webhook", "iCal", "ics") in any on-screen string of the catalog; statuses are only the honest ones.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../../src/components/integrations/catalog.js', import.meta.url), 'utf8');
const block = src.slice(src.indexOf('export const INTEGRATIONS = ['), src.indexOf('/** Status shown on a tile.'));
const items = [...block.matchAll(/\{ id: '([^']+)'[\s\S]*?(?=\n  \{ id: |\n\];)/g)].map((m) => m[0]);

test('catalog has the categories Deen asked for', () => {
  for (const id of ['airbnb', 'booking', 'vrbo', 'expedia', 'gcal-in', 'gcal-out', 'ical-any', 'wa-business', 'messenger', 'instagram', 'morning', 'icount', 'accountant', 'zapier', 'make']) {
    assert.ok(items.some((t) => t.startsWith(`{ id: '${id}'`)), `missing ${id}`);
  }
});

test('every tile says what it does in one plain line', () => {
  for (const t of items) {
    const gain = (t.match(/gain: '([^']+)'/) || [])[1];
    assert.ok(gain, `no gain line in ${t.slice(0, 40)}`);
    assert.ok(gain.length <= 70, `gain too long (${gain.length}): ${gain}`);
  }
});

test('no tech jargon in on-screen strings', () => {
  const shown = items.flatMap((t) => [...t.matchAll(/(?:name|gain|why|sub|mono): '([^']+)'/g)].map((m) => m[1]));
  for (const s of shown) assert.ok(!/\b(API|api|webhook|Webhook|iCal|ics|OTA)\b/.test(s), `jargon in: ${s}`);
});

test('only honest statuses', () => {
  for (const t of items) {
    const st = (t.match(/status: '([^']+)'/) || [])[1];
    assert.ok(['live', 'ready', 'soon', 'meta', 'request'].includes(st), `bad status ${st}`);
  }
});
