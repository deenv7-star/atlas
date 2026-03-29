import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { env } from '../config/env.js';

const router = Router();

router.post('/checkout-session', requireAuth, async (req, res) => {
  if (!env.STRIPE_SECRET_KEY) {
    return res.status(501).json({ error: 'Stripe is not configured (STRIPE_SECRET_KEY)' });
  }
  const priceId = env.STRIPE_PRICE_STARTER;
  if (!priceId) {
    return res.status(501).json({ error: 'Missing STRIPE_PRICE_STARTER (Price ID) in server environment' });
  }

  const parsed = z.object({ price_id: z.string().optional() }).safeParse(req.body || {});
  const linePrice = parsed.success && parsed.data.price_id ? parsed.data.price_id : priceId;

  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: linePrice, quantity: 1 }],
      success_url: `${env.FRONTEND_URL}/subscription?success=1`,
      cancel_url: `${env.FRONTEND_URL}/subscription?canceled=1`,
      client_reference_id: req.orgId,
      metadata: { org_id: req.orgId },
      subscription_data: { metadata: { org_id: req.orgId } }
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
