/**
 * C3 — server-side subscription enforcement for writes.
 *
 * The "trial over and not paid" check used to exist only in the client
 * (src/lib/access.js / src/lib/accessLock.js), so a locked account could keep
 * writing through the API. This middleware runs server-side before any write
 * and returns 402 when the org may no longer write. Reads are never blocked.
 *
 * What it checks (all fields already exist in the Express Postgres DB):
 *   - public.subscriptions.status / current_period_end (latest row for the org)
 *   - public.organizations.created_at (trial start fallback: signup + 14 days)
 *   - public.organizations.subscription_plan
 * There is NO trial_ends_at column in the Express DB (that lives in the
 * Supabase profiles table), so the trial window is derived from the org's
 * created_at + TRIAL_DAYS, mirroring src/lib/trial.js (14 days).
 *
 * Rules (same order as the client-side computeAccess in src/lib/access.js):
 *   - platform admin            → always allowed
 *   - subscription active/trialing → allowed (paid / in Stripe trial)
 *   - past_due                  → allowed during the 3-day grace after the paid
 *                                 period ends (or with no period end known,
 *                                 same as the client); locked after that
 *   - canceled/expired/etc.     → allowed only while the paid period hasn't
 *                                 ended yet, else falls through to the trial
 *   - no (or ended) subscription → allowed only while the 14-day trial runs
 *   - otherwise                 → 402 subscription_required
 *
 * TODO (Deen): if a trial_ends_at / subscription_status column is ever added to
 * the Express organizations table (or the Express DB is retired in favour of
 * Supabase), point this check at that column instead of created_at + 14 days.
 * Legacy orgs created before trials existed will be locked by this middleware
 * once their 14 days from created_at have passed — grandfather or backfill
 * their subscriptions before enabling it in production.
 */
import { pool } from '../db.js';
import { logger } from '../utils/logger.js';

const TRIAL_DAYS = 14;
const PAST_DUE_GRACE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const PAID = new Set(['active', 'paid', 'trialing']);
const ENDED = new Set(['canceled', 'cancelled', 'expired', 'churned', 'unpaid', 'incomplete_expired', 'paused']);

export async function requireActiveSubscription(req, res, next) {
  // Platform admins are never locked.
  if (req.authUser?.is_platform_admin) return next();

  try {
    const { rows: orgRows } = await pool.query(
      'SELECT id, created_at, subscription_plan FROM public.organizations WHERE id = $1',
      [req.orgId]
    );
    const org = orgRows[0];
    if (!org) return res.status(401).json({ error: 'Invalid session' });

    const { rows: subRows } = await pool.query(
      `SELECT status, current_period_end FROM public.subscriptions
       WHERE org_id = $1 ORDER BY updated_at DESC NULLS LAST LIMIT 1`,
      [req.orgId]
    );
    const sub = subRows[0] || null;
    const now = Date.now();

    if (sub && PAID.has(String(sub.status || '').toLowerCase())) return next();

    const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : null;

    if (sub && String(sub.status || '').toLowerCase() === 'past_due') {
      // A failed renewal: open while the card is retried. Lock only 3 days
      // after a known paid-period end (mirrors src/lib/access.js).
      if (!periodEnd || periodEnd + PAST_DUE_GRACE_DAYS * DAY_MS > now) return next();
      return res.status(402).json({
        error: 'Payment failed and the subscription is past due. Update your payment method to keep using Atlas.',
        code: 'subscription_required'
      });
    }

    if (sub && ENDED.has(String(sub.status || '').toLowerCase())) {
      // Canceled but paid-up time left: grace until the paid period ends.
      if (periodEnd && periodEnd > now) return next();
      // Otherwise fall through to the trial check below (a canceled sub does
      // not by itself grant a new trial — the trial window is from signup).
    }

    // Trial: 14 days from when the organization was created.
    const createdAt = org.created_at ? new Date(org.created_at).getTime() : null;
    if (createdAt && createdAt + TRIAL_DAYS * DAY_MS > now) return next();

    return res.status(402).json({
      error: 'Your free trial has ended. Choose a plan to keep using Atlas.',
      code: 'subscription_required'
    });
  } catch (error) {
    // Fail closed: a DB error must not silently allow writes from a locked org.
    logger.error('subscription_check.failed', { error, requestId: req.requestId, orgId: req.orgId });
    return res.status(503).json({ error: 'Subscription check unavailable. Try again shortly.' });
  }
}

export default requireActiveSubscription;
