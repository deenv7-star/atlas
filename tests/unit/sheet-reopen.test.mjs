import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// iPhone report 05.11: the second "הזמנה חדשה" left the sheet parked off-screen under the dim overlay.
// The sheet's shown/hidden must follow `open`, never a state synced from the (not yet mounted) portal node.
test('AtlasSheet: shown follows open, no stale data-state sync', () => {
  const src = readFileSync(new URL('../../src/components/ui/sheet/AtlasSheet.jsx', import.meta.url), 'utf8');
  assert.match(src, /const shown = !!open;/);
  assert.doesNotMatch(src, /MutationObserver/);
  assert.doesNotMatch(src, /useState\('open'\)/);
});
