import test from 'node:test';
import assert from 'node:assert/strict';
import { createMascotState, reduceMascot, moodOf, gazeOf, nextChangeAt, eyeOffset, IDLE_MS, HOLD, isLateNight } from '../../src/components/mascot/mascotMood.js';
import { shortLink, URL_RE } from '../../src/components/magic/links.js';

const day = new Date('2026-11-03T14:00:00');
const night = new Date('2026-11-03T23:30:00');

test('rest: base mood, sleepy after long idle and late at night', () => {
  const s = createMascotState(0);
  assert.equal(moodOf(s, 1000, { base: 'neutral', date: day }), 'neutral');
  assert.equal(moodOf(s, 1000, { base: 'sleepy', date: day }), 'sleepy');
  assert.equal(moodOf(s, IDLE_MS + 10, { date: day }), 'sleepy');
  assert.equal(moodOf(s, 1000, { date: night }), 'sleepy');
  assert.equal(isLateNight(new Date('2026-11-03T05:59:00')), true);
  assert.equal(isLateNight(new Date('2026-11-03T06:00:00')), false);
});

test('assistant turn: typing → thinking → writing → happy → rest', () => {
  let s = createMascotState(0);
  s = reduceMascot(s, { type: 'user-typing', at: { x: 10, y: 10 } }, 100);
  assert.equal(moodOf(s, 200, { date: day }), 'attentive');
  assert.deepEqual(gazeOf(s, 200), { x: 10, y: 10 });
  s = reduceMascot(s, { type: 'waiting' }, 300);
  assert.equal(moodOf(s, 400, { date: day }), 'thinking');
  assert.equal(gazeOf(s, 400), null, 'thinking keeps its own drift');
  s = reduceMascot(s, { type: 'responding' }, 500);
  assert.equal(moodOf(s, 600, { date: day }), 'typing');
  s = reduceMascot(s, { type: 'answer' }, 700);
  assert.equal(moodOf(s, 800, { date: day }), 'happy');
  assert.equal(moodOf(s, 700 + HOLD.happy + 1, { date: day }), 'neutral');
});

test('error → concerned for a moment; success → happy + bounce, wins over late night', () => {
  let s = reduceMascot(createMascotState(0), { type: 'error' }, 0);
  assert.equal(moodOf(s, 10, { date: day }), 'concerned');
  assert.equal(moodOf(s, HOLD.concerned + 1, { date: day }), 'neutral');
  s = reduceMascot(s, { type: 'success' }, 5000);
  assert.equal(s.bounce, 1);
  assert.equal(moodOf(s, 5100, { date: night }), 'happy');
});

test('activity wakes a sleepy face; one timer for the next change', () => {
  let s = createMascotState(0);
  assert.equal(moodOf(s, IDLE_MS + 5, { date: day }), 'sleepy');
  s = reduceMascot(s, { type: 'activity' }, IDLE_MS + 10);
  assert.equal(moodOf(s, IDLE_MS + 20, { date: day }), 'neutral');
  s = reduceMascot(s, { type: 'success' }, 1000);
  assert.equal(nextChangeAt(s, 1000), 1000 + HOLD.happy);
});

test('eye offset stays inside the face', () => {
  const r = { left: 0, top: 0, width: 40, height: 40 };
  const o = eyeOffset(r, { x: 2000, y: 20 });
  assert.ok(o.x <= 4 && o.x > 3.5);
  const d = eyeOffset(r, { x: 20, y: 2000 });
  assert.ok(d.y <= 3.5 && d.y > 3);
  assert.deepEqual(eyeOffset(r, { x: NaN, y: 5 }), { x: 0, y: 0 }); // a bad pointer never throws the eyes out
  assert.deepEqual(eyeOffset(r, null), { x: 0, y: 0 });
});

test('links in a bubble are short', () => {
  assert.equal(shortLink('https://waze.com/ul?q=%D7%A6%D7%99%D7%9E%D7%A8&navigate=yes'), 'waze.com/…');
  assert.equal(shortLink('https://www.atlas-il.com/g/abcdefghijklmnop'), 'atlas-il.com/…');
  assert.equal(shortLink('atlas-il.com/g/x'), 'atlas-il.com/…');
  assert.equal(shortLink('https://atlas-il.com'), 'atlas-il.com');
  const parts = 'ניווט: https://waze.com/ul?q=x. ובדף: www.example.com/a/b'.split(URL_RE);
  assert.equal(parts.filter((_, i) => i % 2).length, 2);
});
