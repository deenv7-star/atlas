// Audit 04.11 #2 / #6: no money values until the payments are really loaded; a quiet mark for old data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStateOf, canShowValues, staleStateOf, staleTimeLabel } from '../../src/lib/stay/loadState.js';

test('pending / hanging payments query: no values', () => {
  assert.equal(loadStateOf({ status: 'pending', data: undefined, fetchStatus: 'fetching' }), 'loading');
  assert.equal(canShowValues(loadStateOf({ status: 'pending' })), false);
  assert.equal(loadStateOf(undefined), 'loading');
});

test('failed with nothing cached: error ("—" + banner)', () => {
  assert.equal(loadStateOf({ status: 'error', data: undefined }), 'error');
  assert.equal(canShowValues('error'), false);
});

test('failed refresh with the last good copy: stale, values may show', () => {
  assert.equal(loadStateOf({ status: 'error', data: [{ amount: 100 }] }), 'stale');
  assert.equal(canShowValues('stale'), true);
});

test('success: ready (an empty list is a real "nothing paid")', () => {
  assert.equal(loadStateOf({ status: 'success', data: [] }), 'ready');
  assert.equal(loadStateOf({ isSuccess: true, data: [] }), 'ready');
});

test('stale mark: offline with data on screen', () => {
  const st = staleStateOf([{ status: 'success', data: [], dataUpdatedAt: 1000 }], { online: false });
  assert.deepEqual(st, { show: true, reason: 'offline', updatedAt: 1000 });
});

test('stale mark: a refresh failed (500) with data kept', () => {
  const st = staleStateOf([{ status: 'success', data: [1], dataUpdatedAt: 5000 }, { status: 'error', data: [2], dataUpdatedAt: 3000 }]);
  assert.equal(st.show, true);
  assert.equal(st.reason, 'failed');
  assert.equal(st.updatedAt, 3000); // the oldest copy on screen
});

test('stale mark: hidden when fresh, or when nothing is on screen', () => {
  assert.equal(staleStateOf([{ status: 'success', data: [1], dataUpdatedAt: 1 }]).show, false);
  assert.equal(staleStateOf([{ status: 'error', data: undefined }], { online: false }).show, false);
});

test('time label: today = HH:MM, older = D.M · HH:MM', () => {
  const now = new Date(2026, 10, 4, 12, 0).getTime();
  assert.equal(staleTimeLabel(new Date(2026, 10, 4, 9, 5).getTime(), now), '09:05');
  assert.equal(staleTimeLabel(new Date(2026, 10, 3, 22, 40).getTime(), now), '3.11 · 22:40');
  assert.equal(staleTimeLabel(0, now), '');
});
