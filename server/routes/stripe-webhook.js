/**
 * POST /api/stripe/webhook — must use express.raw body (see app.js)
 *
 * C2: the plan is derived from the real Stripe price ID on each event (via
 * server/lib/stripe-plans.js), never hardcoded to 'professional'. Unknown
 * price IDs keep the previously stored plan instead of inventing one.
 * past_due and invoice.payment_failed are recorded so the server-side
 * paywall (server/middleware/require-active-subscription.js) can lock the
 * org once the grace period ends — access is never silently kept.
 */
import Stripe from 'stripe';
import { pool } from '../db.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { planForPriceId } from '../lib/stripe-plans.js';

function priceIdFromSubscription(sub) {
  return sub?.items?.data?.[0]?.price?.id || null;
}

/** Look up the subscription in Stripe and map its price to a plan (or null). */
async function planFromSubscription(stripe, subscriptionId) {
  if (!subscriptionId) return null;
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    return planForPriceId(priceIdFromSubscription(sub));
  } catch (e) {
    logger.error('stripe.webhook.subscription_retrieve_failed', {
      subscriptionId,
      message: String(e?.message || e)
    });
    return null;
  }
}

async function setOrgPlan(orgId, plan) {
  if (!plan) return;
  await pool.query(
    `UPDATE public.organizations SET subscription_plan = $2, updated_at = NOW() WHERE id = $1`,
    [orgId, plan]
  );
}

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
        // Derive the real plan from the subscription's price. If Stripe cannot
        // be reached or the price is unknown, keep the previously stored plan
        // (never assume 'professional').
        let plan = await planFromSubscription(stripe, stripeSubscriptionId);
        if (!plan) {
          const { rows } = await pool.query(
            'SELECT plan FROM public.subscriptions WHERE org_id = $1 LIMIT 1',
            [orgId]
          );
          plan = rows[0]?.plan || null;
        }
        await upsertSubscriptionRow({
          orgId,
          stripeSubscriptionId,
          stripeCustomerId,
          status: 'active',
          plan
        });
        await setOrgPlan(orgId, plan);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;
        const plan = planForPriceId(priceIdFromSubscription(sub));
        await pool.query(
          `UPDATE public.subscriptions
           SET status = $2,
               current_period_start = to_timestamp($3::double precision),
               current_period_end = to_timestamp($4::double precision),
               updated_at = NOW()
           WHERE org_id = $1`,
          [orgId, sub.status, sub.current_period_start, sub.current_period_end]
        );
        if (sub.status === 'past_due') {
          // Failed renewal: keep the plan for now — the paywall middleware
          // grants a 3-day grace after the paid period ends, then locks.
          logger.warn('stripe.webhook.subscription_past_due', { orgId, subscriptionId: sub.id });
        } else if (sub.status === 'active' || sub.status === 'trialing') {
          if (plan) {
            await setOrgPlan(orgId, plan);
          } else {
            logger.warn('stripe.webhook.unknown_price', { orgId, subscriptionId: sub.id, priceId: priceIdFromSubscription(sub) });
          }
        } else {
          // canceled / unpaid / incomplete_expired / paused: downgrade.
          await setOrgPlan(orgId, 'starter');
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const stripeSubscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        if (!stripeSubscriptionId) break;
        // Mark the subscription past_due so the paywall can lock the org once
        // the grace period ends. Do not silently keep full access.
        await pool.query(
          `UPDATE public.subscriptions
           SET status = 'past_due', updated_at = NOW()
           WHERE stripe_subscription_id = $1`,
          [stripeSubscriptionId]
        );
        logger.warn('stripe.webhook.invoice_payment_failed', { subscriptionId: stripeSubscriptionId });
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
      // Unknown plan defaults to 'starter', never 'professional': paid access
      // must come from a real Stripe price, not from a guess.
      [orgId, plan || 'starter', status, stripeSubscriptionId || null, stripeCustomerId || null]
    );
  }
}
