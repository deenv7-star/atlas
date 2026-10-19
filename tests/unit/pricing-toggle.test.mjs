// Pricing monthly/yearly toggle (19.10.2026). The animated price keeps a fixed width only when the
// monthly and yearly prices of a plan have the same number of characters, and the yearly saving
// badge must be a true number derived from the listed prices.
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRICING_PLANS } from '../../src/config/pricing.js';

const fmt = (n) => n.toLocaleString('en-US');

test('monthly and yearly prices have the same width (no layout shift on toggle)', () => {
  for (const p of PRICING_PLANS) assert.equal(fmt(p.price).length, fmt(p.priceYearly).length, p.key);
});

test('yearly is cheaper and the saving badge is positive', () => {
  for (const p of PRICING_PLANS) assert.ok((p.price - p.priceYearly) * 12 > 0, p.key);
});
