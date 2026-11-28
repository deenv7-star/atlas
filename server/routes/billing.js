import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { env } from '../config/env.js';
import { planForPriceId, priceIdForPlan } from '../lib/stripe-plans.js';

const router = Router();

router.post('/checkout-session', requireAuth, async (req, res) => {
  if (!env.STRIPE_SECRET_KEY) {
    return res.status(501).json({ error: 'Stripe is not configured (STRIPE_SECRET_KEY)' });
  }

  const parsed = z.object({ price_id: z.string().min(1).max(64).optional() }).safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  // C1: a client-supplied price_id is NEVER passed straight to Stripe. Only
  // price IDs configured on the server (STRIPE_PRICE_*, see
  // server/lib/stripe-plans.js) are accepted; anything else is rejected.
  let priceId;
  let plan;
  if (parsed.data.price_id) {
    plan = planForPriceId(parsed.data.price_id);
    if (!plan) {
      return res.status(400).json({ error: 'Unknown price_id' });
    }
    priceId = parsed.data.price_id;
  } else {
    // No price requested: default to Starter (previous behaviour).
    plan = 'starter';
    priceId = priceIdForPlan('starter');
    if (!priceId) {
      return res.status(503).json({ error: 'Starter price is not configured (STRIPE_PRICE_STARTER)' });
    }
  }

  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.FRONTEND_URL}/subscription?success=1`,
      cancel_url: `${env.FRONTEND_URL}/subscription?canceled=1`,
      client_reference_id: req.orgId,
      metadata: { org_id: req.orgId, plan },
      subscription_data: { metadata: { org_id: req.orgId, plan } }
    });
    return res.json({ url: session.url });
  } catch (e) {
    return res.status(502).json({ error: e?.message || 'Stripe checkout failed' });
  }
});

router.post('/portal-session', requireAuth, async (req, res) => {
  if (!env.STRIPE_SECRET_KEY) {
    return res.status(501).json({ error: 'Stripe is not configured' });
  }
  const { rows } = await pool.query(
    'SELECT stripe_customer_id FROM public.subscriptions WHERE org_id = $1 LIMIT 1',
    [req.orgId]
  );
  const customerId = rows[0]?.stripe_customer_id;
  if (!customerId) {
    return res.status(400).json({ error: 'No billing account yet — subscribe first' });
  }
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.FRONTEND_URL}/billing`
    });
    return res.json({ url: portal.url });
  } catch (e) {
    return res.status(502).json({ error: e?.message || 'Billing portal failed' });
  }
});

export default router;
