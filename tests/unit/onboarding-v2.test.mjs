import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultAnswers, applyKind, normalizeGuests, unitRow, unitProfile, guestsLabel, priceLabel, timesLabel,
  setupStatus, setupProgress, checkIcalLink, waLink, unitsLabel, KINDS,
} from '../../src/lib/onboarding/v2/model.js';

test('kinds: צימר / וילה / מתחם אירוח first, villas and complexes default to groups (10+)', () => {
  assert.deepEqual(KINDS.map((k) => k.label), ['צימר', 'וילה', 'מתחם אירוח']);
  const villa = applyKind(defaultAnswers(), 'villa');
  assert.equal(villa.guestsMin, 10);
  const complex = applyKind(defaultAnswers(), 'complex');
  assert.deepEqual([complex.guestsMin, complex.guestsMax, complex.unitCount], [10, 30, 3]);
});

test('changing the kind keeps values the owner changed', () => {
  let a = applyKind(defaultAnswers(), 'villa');
  a = { ...a, guestsMin: 12, guestsMax: 25 };
  a = applyKind(a, 'complex');
  assert.deepEqual([a.guestsMin, a.guestsMax], [12, 25]);
});

test('guest range is normalized and labelled', () => {
  assert.deepEqual(normalizeGuests(30, 10), [10, 30]);
  assert.deepEqual(normalizeGuests(0, 999), [1, 60]);
  assert.equal(guestsLabel({ guestsMin: 10, guestsMax: 30 }), '10–30 אורחים');
  assert.equal(guestsLabel({ guestsVary: true }), 'משתנה בין היחידות');
});

test('price is never invented: varies / later write no base_price unless a number was given', () => {
  const base = { ...applyKind(defaultAnswers(), 'villa'), name: 'וילה בכרם' };
  assert.equal(unitRow({ ...base, priceMode: 'varies' }, 0).base_price, null);
  assert.equal(unitRow({ ...base, priceMode: 'later', price: 900 }, 0).base_price, null);
  assert.equal(unitRow({ ...base, priceMode: 'fixed', price: 1800 }, 0).base_price, 1800);
  assert.equal(unitRow({ ...base, priceMode: 'varies', priceFrom: 2500 }, 0).base_price, 2500);
  assert.equal(unitRow(base, 0).max_guests, 20);
  assert.equal(unitRow(base, 0).name, 'וילה בכרם');
  assert.equal(priceLabel({ priceMode: 'varies', priceFrom: '' }), 'משתנה לפי ההרכב והעונה');
  assert.deepEqual(unitProfile({ ...base, priceMode: 'varies' }), { guests_min: 10, guests_max: 20, guests_vary: false, price_mode: 'varies', price_from: null });
});

test('times can vary by day / season', () => {
  assert.match(timesLabel({ checkIn: '15:00', checkOut: '11:00', timesVary: true }), /משתנה לפי יום ועונה/);
});

test('hebrew unit counts', () => {
  assert.equal(unitsLabel('zimmer', 1), 'צימר אחד');
  assert.equal(unitsLabel('villa', 1), 'וילה אחת');
  assert.equal(unitsLabel('complex', 4), '4 יחידות');
});

test('setup: progress counts only real steps, payments are "soon", channels lead the order', () => {
  const steps = setupStatus({ units: 2, syncs: [], hostPhone: '', channels: ['airbnb'], setup: { done: { units: true }, skipped: {} } });
  assert.deepEqual(steps.map((s) => s.id), ['units', 'airbnb', 'whatsapp', 'booking', 'payments']);
  assert.equal(steps.find((s) => s.id === 'payments').status, 'soon');
  const p = setupProgress(steps);
  assert.deepEqual([p.handled, p.total, p.complete, p.next.id], [1, 4, false, 'airbnb']);
});

test('setup: a calendar step is done only when a real link was saved; skip counts as handled', () => {
  const facts = { units: 1, syncs: [{ provider: 'BOOKING_COM' }], hostPhone: '0525979520', channels: [], setup: { done: { units: true, whatsapp: true }, skipped: { airbnb: true } } };
  const p = setupProgress(setupStatus(facts));
  assert.equal(p.complete, true);
  const withPlan = setupStatus({ ...facts, planChoice: { kind: 'plan', key: 'pro' } });
  assert.ok(withPlan.some((s) => s.id === 'plan' && s.status === 'todo'));
});

test('calendar links: plain-Hebrew validation per platform', () => {
  assert.equal(checkIcalLink('BOOKING_COM', 'https://ical.booking.com/v1/export?t=abc123').ok, true);
  assert.equal(checkIcalLink('BOOKING_COM', 'https://www.airbnb.com/calendar/ical/1.ics?s=x').ok, false);
  assert.match(checkIcalLink('BOOKING_COM', 'https://www.booking.com/hotel/il/x.html').message, /דף המודעה/);
  assert.equal(checkIcalLink('AIRBNB', 'https://www.airbnb.com/calendar/ical/35450605.ics?s=fd').ok, true);
  assert.match(checkIcalLink('AIRBNB', 'https://www.airbnb.co.il/rooms/123').message, /דף המודעה/);
  assert.equal(checkIcalLink('AIRBNB', 'not a link').ok, false);
  assert.equal(checkIcalLink('AIRBNB', '').message, '');
});

test('wa.me links from Israeli numbers', () => {
  assert.equal(waLink('052-597-9520'), 'https://wa.me/972525979520');
  assert.equal(waLink('12'), '');
});
