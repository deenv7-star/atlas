/**
 * POST /api/stripe/webhook — must use express.raw body (see app.js)
 */
import Stripe from 'stripe';
import { pool } from '../db.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function handleStripeWebhook(req, res) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return res.status(501).send('Stripe not configured');
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    event = stripe.webhooks.constructEvent(buf, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('stripe.webhook.verify_failed', { message: String(err?.message || err) });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orgId = session.metadata?.org_id || session.client_reference_id;
        if (!orgId) break;
        const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        await upsertSubscriptionRow({
          orgId,
          stripeSubscriptionId,
          stripeCustomerId,
          status: 'active',
          plan: 'professional'
        });
        await pool.query(
          `UPDATE public.organizations SET subscription_plan = $2, updated_at = NOW() WHERE id = $1`,
          [orgId, 'professional']
        );
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;
        const active = sub.status === 'active' || sub.status === 'trialing';
        await pool.query(
          `UPDATE public.subscriptions
           SET status = $2,
               current_period_start = to_timestamp($3::double precision),
               current_period_end = to_timestamp($4::double precision),
               updated_at = NOW()
           WHERE org_id = $1`,
          [orgId, sub.status, sub.current_period_start, sub.current_period_end]
        );
        if (!active) {
          await pool.query(
            `UPDATE public.organizations SET subscription_plan = $2, updated_at = NOW() WHERE id = $1`,
            [orgId, 'starter']
          );
        } else {
          await pool.query(
            `UPDATE public.organizations SET subscription_plan = $2, updated_at = NOW() WHERE id = $1`,
            [orgId, 'professional']
          );
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    logger.error('stripe.webhook.handler_failed', { error: e, type: event.type });
    return res.status(500).json({ error: 'Webhook handler failed' });
  }

  return res.json({ received: true });
}

async function upsertSubscriptionRow({ orgId, stripeSubscriptionId, stripeCustomerId, status, plan }) {
  const { rows } = await pool.query('SELECT id FROM public.subscriptions WHERE org_id = $1 LIMIT 1', [orgId]);
  if (rows[0]) {
    await pool.query(
      `UPDATE public.subscriptions
       SET plan = COALESCE($2::text, plan),
           status = $3,
           stripe_subscription_id = COALESCE($4, stripe_subscription_id),
           stripe_customer_id = COALESCE($5, stripe_customer_id),
           updated_at = NOW()
       WHERE org_id = $1`,
      [orgId, plan, status, stripeSubscriptionId || null, stripeCustomerId || null]
    );
  } else {
    await pool.query(
      `INSERT INTO public.subscriptions (org_id, plan, status, stripe_subscription_id, stripe_customer_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [orgId, plan || 'professional', status, stripeSubscriptionId || null, stripeCustomerId || null]
    );
  }
}
