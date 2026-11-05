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
