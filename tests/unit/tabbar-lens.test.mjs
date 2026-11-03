import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nearestIndex, rubberband, softClamp, stepSpring, settled, shouldLift, LENS } from '../../src/ui-direction/y/lensMath.js';

test('nearest tab wins, in LTR and RTL order alike', () => {
  const ltr = [40, 98, 156, 214, 272];
  const rtl = [...ltr].reverse(); // RTL: index 0 is the rightmost tab
  assert.equal(nearestIndex(ltr, 10), 0);
  assert.equal(nearestIndex(ltr, 126), 1); // just left of the 127 midpoint
  assert.equal(nearestIndex(ltr, 128), 2);
  assert.equal(nearestIndex(rtl, 280), 0);
  assert.equal(nearestIndex(rtl, 50), 4);
  assert.equal(nearestIndex(rtl, 160), 2);
});

test('rubber band resists more the further you pull, never past the give', () => {
  assert.equal(rubberband(0, 24), 0);
  const a = rubberband(10, 24); const b = rubberband(100, 24); const c = rubberband(10000, 24);
  assert.ok(a > 0 && a < 10);
  assert.ok(b > a && b < 24);
  assert.ok(c < 24);
  assert.ok(rubberband(-10, 24) < 0);
  assert.equal(softClamp(50, 0, 100), 50);
  assert.ok(softClamp(140, 0, 100) > 100 && softClamp(140, 0, 100) < 124);
  assert.ok(softClamp(-40, 0, 100) < 0 && softClamp(-40, 0, 100) > -24);
});

test('snap spring settles on target with a small overshoot and no blow-up on a dropped frame', () => {
  const s = { v: 0, vel: 0, target: 100 };
  let max = 0; let t = 0;
  while (t < 1.5) { stepSpring(s, 1 / 60, LENS.snap.response, LENS.snap.damping); max = Math.max(max, s.v); t += 1 / 60; }
  assert.ok(settled(s, 0.5, 2), `settled at ${s.v}`);
  assert.ok(max > 100 && max < 110, `overshoot ${max}`); // a little bounce, not a wobble
  const j = { v: 0, vel: 0, target: 100 };
  stepSpring(j, 0.5, LENS.snap.response, LENS.snap.damping); // 500ms hitch
  assert.ok(Number.isFinite(j.v) && Math.abs(j.v) < 300);
});

test('release velocity carries into the snap', () => {
  const still = { v: 0, vel: 0, target: 50 };
  const thrown = { v: 0, vel: 1200, target: 50 };
  stepSpring(still, 1 / 60, 0.38, 0.74); stepSpring(thrown, 1 / 60, 0.38, 0.74);
  assert.ok(thrown.v > still.v);
});

test('lift: long hold or sideways move lifts; a vertical swipe never does', () => {
  assert.equal(shouldLift({ heldMs: 100, dx: 2, dy: 1 }), false); // a tap in progress
  assert.equal(shouldLift({ heldMs: 260, dx: 0, dy: 0 }), true);
  assert.equal(shouldLift({ heldMs: 60, dx: 12, dy: 2 }), true);
  assert.equal(shouldLift({ heldMs: 300, dx: 2, dy: 40 }), false);
});
