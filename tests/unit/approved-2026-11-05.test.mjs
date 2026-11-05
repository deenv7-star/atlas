import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const PHONE = /5979520|597-9520|972525979520/;

test('channels wizard: no personal phone number, help goes to the in-app chat', () => {
  const dir = join(root, 'src/components/channels');
  for (const f of readdirSync(dir)) {
    const s = readFileSync(join(dir, f), 'utf8');
    assert.ok(!PHONE.test(s), `${f} still has the phone number`);
    assert.ok(!/tel:|wa\.me|WHATSAPP_URL|LEGAL\./.test(s), `${f} still links to a phone/WhatsApp`);
  }
  const kit = readFileSync(join(dir, 'channelKit.js'), 'utf8');
  assert.match(kit, /openHelp\(\{ text \}\)/);
});

test('QA comp account: subscription_status active is paid (no paywall)', async () => {
  const { computeAccess } = await import('../../src/lib/access.js');
  const a = computeAccess({ subscription_status: 'active', trial_ends_at: null, created_at: '2026-10-16T09:45:00Z' }, { now: new Date('2030-01-01T00:00:00Z') });
  assert.equal(a.state, 'paid');
  assert.equal(a.locked, false);
});

test('DATA-1: holiday titles drop the Hebrew maqaf (renders invisible in Heebo)', () => {
  const hook = readFileSync(join(root, 'src/hooks/useCalendarData.js'), 'utf8');
  assert.match(hook, /\\u05BE\/g, '-'/);
  assert.equal('יום בן־גוריון'.replace(/\u05BE/g, '-'), 'יום בן-גוריון');
});
