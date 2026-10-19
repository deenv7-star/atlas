import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testPattern, testInfo } from '../../src/admin/v2/testAccounts.js';
import { computeKpis } from '../../src/admin/v2/kpis.js';
import { matches, sortRows, paginate, DEFAULT_FILTERS, filtersFromParams, filtersToParams } from '../../src/admin/v2/listModel.js';

const NOW = Date.parse('2026-10-19T12:00:00Z');
const D = 864e5;
const iso = (t) => new Date(t).toISOString();
const plans = [{ key: 'starter', price_monthly: 399, price_yearly: 319 }, { key: 'pro', price_monthly: 699, price_yearly: 559 }];
const c = (o) => ({ org_id: Math.random().toString(36), org_name: 'צימר', owner_email: 'a@zimmer.co.il', plan_key: 'starter', billing_cycle: 'monthly', price_ils: null, units_count: 1, bookings_count: 0, created_at: iso(NOW - 40 * D), trial_ends_at: iso(NOW - 26 * D), status: 'expired', ...o });

test('test-account pattern matches the live test addresses and not real ones', () => {
  for (const e of ['qa+hark@atlas-il.com', 'qa+onb1@atlas-il.com', 'roast+scout_a38e9b@gonogo.team', 'x@example.com', 'owner@test.invalid']) assert.equal(testPattern(e, ''), true, e);
  for (const e of ['noa.mirzai24@gmail.com', 'vinomusiic@gmail.com', 'deenv7@gmail.com', 'quality@zimmer.co.il']) assert.equal(testPattern(e, 'צימר הגפן'), false, e);
  assert.equal(testPattern('a@b.co', 'QA Hark Org'), true);
  assert.equal(testInfo({ is_test: false, is_test_source: 'manual', owner_email: 'qa+x@atlas-il.com' }).is_test, false, 'manual flag wins');
});

test('KPIs: zero paying customers → MRR ₪0, churn null (no denominator), not 0%', () => {
  const k = computeKpis([c({}), c({ owner_email: 'qa+1@atlas-il.com', status: 'active' })], [], plans, NOW);
  assert.equal(k.mrr, 0);
  assert.equal(k.paying, 0);
  assert.equal(k.churn, null);
  assert.equal(k.conversion, 0);
  assert.equal(k.tests, 1, 'the active qa+ account is not counted');
});

test('KPIs: MRR, yearly per month, special price, conversion and churn', () => {
  const rows = [
    c({ status: 'active' }),
    c({ status: 'active', plan_key: 'pro', billing_cycle: 'yearly' }),
    c({ status: 'past_due', price_ils: 250 }),
    c({ status: 'churned', canceled_at: iso(NOW - 5 * D), org_id: 'ch' }),
    c({ status: 'trialing', trial_ends_at: iso(NOW + 3 * D) }),
    c({ status: 'expired' }),
  ];
  const k = computeKpis(rows, [{ org_id: 'ch', status: 'paid' }], plans, NOW);
  assert.equal(k.mrr, 399 + 559 + 250);
  assert.equal(k.paying, 3);
  assert.equal(k.atRisk, 250);
  assert.equal(k.ended, 5);
  assert.equal(k.converted, 4, 'active x2, past_due, churned-after-paying');
  assert.equal(k.churned30, 1);
  assert.equal(k.churn, 1 / 4);
});

test('filters: tests hidden by default, has-units, signup window, never signed in, search', () => {
  const real = c({ org_name: 'בקתות האלון', units_count: 0, created_at: iso(NOW - 3 * D), last_sign_in_at: null });
  const tst = c({ owner_email: 'roast+scout_1@gonogo.team' });
  assert.equal(matches(tst, DEFAULT_FILTERS, NOW), false);
  assert.equal(matches(tst, { ...DEFAULT_FILTERS, tests: 'only' }, NOW), true);
  assert.equal(matches(real, { ...DEFAULT_FILTERS, units: 'no' }, NOW), true);
  assert.equal(matches(real, { ...DEFAULT_FILTERS, units: 'yes' }, NOW), false);
  assert.equal(matches(real, { ...DEFAULT_FILTERS, signup: '7' }, NOW), true);
  assert.equal(matches(real, { ...DEFAULT_FILTERS, signup: 'older' }, NOW), false);
  assert.equal(matches(real, { ...DEFAULT_FILTERS, active: 'never' }, NOW), true);
  assert.equal(matches({ ...real, last_sign_in_at: iso(NOW - D) }, { ...DEFAULT_FILTERS, active: 'never' }, NOW), false);
  assert.equal(matches(real, { ...DEFAULT_FILTERS, q: 'האלון' }, NOW), true);
  assert.equal(matches(real, { ...DEFAULT_FILTERS, q: 'הגפן' }, NOW), false);
});

test('sort puts empty values last in both directions; paging clamps', () => {
  const rows = [{ org_name: 'ב', trial_ends_at: null }, { org_name: 'א', trial_ends_at: iso(NOW) }, { org_name: 'ג', trial_ends_at: iso(NOW + D) }];
  assert.deepEqual(sortRows(rows, { key: 'trial_ends_at', dir: 'asc' }).map((r) => r.org_name), ['א', 'ג', 'ב']);
  assert.deepEqual(sortRows(rows, { key: 'trial_ends_at', dir: 'desc' }).map((r) => r.org_name), ['ג', 'א', 'ב']);
  const p = paginate(Array.from({ length: 60 }, (_, i) => i), 9, 25);
  assert.equal(p.page, 3); assert.equal(p.pages, 3); assert.equal(p.from, 51); assert.equal(p.to, 60);
  assert.equal(paginate([], 1).from, 0);
});

test('filters round-trip through the URL', () => {
  const f = { ...DEFAULT_FILTERS, status: 'trialing', tests: 'show', q: 'גולן' };
  const sp = new URLSearchParams(filtersToParams(f, { page: 2 }));
  assert.deepEqual(filtersFromParams(sp), f);
  assert.equal(sp.get('page'), '2');
});
