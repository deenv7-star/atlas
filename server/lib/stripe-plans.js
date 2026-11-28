/**
 * Stripe price → plan map (C1/C2).
 *
 * Single source of truth for which Stripe price IDs may be sold and which plan
 * each one means. The map is built ONLY from server env vars — no price_…
 * value is ever hardcoded here, and no client-supplied price_id is trusted.
 *
 * Required env vars (set the real Stripe price IDs in the deployment):
 *   STRIPE_PRICE_STARTER       (already existed)
 *   STRIPE_PRICE_PROFESSIONAL  (TODO for Deen — see NOTES.md)
 *   STRIPE_PRICE_BUSINESS      (TODO for Deen — see NOTES.md)
 *
 * Plan keys match what the webhook already stored in
 * organizations.subscription_plan: 'starter' | 'professional' | 'business'.
 * NOTE: src/config/pricing.js uses the key 'pro' for the middle plan; the
 * server keeps 'professional' for backward compatibility with stored rows.
 * Do not rename one side without migrating the other.
 */
import { env } from '../config/env.js';

export const PLANS = ['starter', 'professional', 'business'];

const PRICE_ENV_VAR = {
  starter: 'STRIPE_PRICE_STARTER',
  professional: 'STRIPE_PRICE_PROFESSIONAL',
  business: 'STRIPE_PRICE_BUSINESS'
};

/** The configured Stripe price ID for a plan, or null when its env var is unset. */
export function priceIdForPlan(plan) {
  const varName = PRICE_ENV_VAR[plan];
  if (!varName) return null;
  return env[varName] || null;
}

/** The plan a Stripe price ID belongs to, or null when it is not configured. */
export function planForPriceId(priceId) {
  if (!priceId) return null;
  for (const plan of PLANS) {
    if (priceIdForPlan(plan) === priceId) return plan;
  }
  return null;
}

/** Map of every configured price ID → plan (only plans whose env var is set). */
export function getConfiguredPriceIds() {
  const out = new Map();
  for (const plan of PLANS) {
    const id = priceIdForPlan(plan);
    if (id) out.set(id, plan);
  }
  return out;
}
