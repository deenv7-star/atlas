/**
 * Who may use the app right now: the ONE place that answers "trial over and not paid".
 * Pure (no imports besides ./trial.js) so tests/unit/access.test.mjs runs it with `node --test`.
 *
 * Inputs are the columns auth.me() reads from profiles (trial_ends_at, subscription_status) plus,
 * when the server ever sends it, current_period_end (platform_subscriptions, see
 * qa/trial-paywall/server-side-proposal.md). Same order as admin_list_customers() (migration 011/012):
 *   active / paid                       → paid, open
 *   canceled with time left             → grace, open until the paid period (or trial) ends
 *   past_due                            → grace: open until 3 days after the paid period ends; with no
 *                                         period end known client-side it stays open (never lock a
 *                                         failed card we cannot date)
 *   trial end in the future             → trial, open
 *   trial end unknown (no date at all)  → trial, open (a brand-new account before start_my_trial)
 *   anything else                       → locked: the paywall, data kept
 * A platform admin is never locked.
 */
import { defaultTrialEnd, trialDaysLeft } from './trial.js';

const PAID = new Set(['active', 'paid']);
const ENDED = new Set(['canceled', 'cancelled', 'expired', 'churned']);
export const PAST_DUE_GRACE_DAYS = 3;
const DAY_MS = 86400000;

function toDate(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {object|null} user  auth.me() result
 * @param {{ now?: Date, isAdmin?: boolean, force?: ''|'expired'|'trial'|'paid' }} [opts]
 * @returns {{ state: 'none'|'paid'|'grace'|'trial'|'expired', locked: boolean, reason: ''|'trial_ended'|'subscription_ended',
 *            trialEndsAt: Date|null, daysLeft: number, isAdmin: boolean }}
 */
export function computeAccess(user, opts = {}) {
  const now = opts.now || new Date();
  const isAdmin = Boolean(opts.isAdmin);
  if (!user) return { state: 'none', locked: false, reason: '', trialEndsAt: null, daysLeft: 0, isAdmin };

  const status = String(user.subscription_status || 'trialing').toLowerCase();
  const trialEndsAt = toDate(user.trial_ends_at) || defaultTrialEnd(user.created_date || user.created_at);
  const periodEnd = toDate(user.current_period_end);
  const daysLeft = trialDaysLeft(trialEndsAt, now);
  const out = (state, reason = '') => ({
    state,
    locked: state === 'expired' && !isAdmin,
    reason,
    trialEndsAt,
    daysLeft,
    isAdmin,
  });

  // Demo / local QA only (the caller passes it only without Supabase): force a state to test the paywall.
  if (opts.force === 'expired') return out('expired', 'trial_ended');
  if (opts.force === 'paid') return out('paid');
  if (opts.force === 'trial') return { ...out('trial'), daysLeft: daysLeft || 7 };

  if (PAID.has(status)) return out('paid');
  if (status === 'past_due') {
    // A failed renewal: open while the card is retried. Lock only 3 days after a known paid-period end.
    if (!periodEnd) return out('grace');
    if (periodEnd.getTime() + PAST_DUE_GRACE_DAYS * DAY_MS > now.getTime()) return out('grace');
    return out('expired', 'subscription_ended');
  }
  if (ENDED.has(status)) {
    const until = [periodEnd, trialEndsAt].filter(Boolean).sort((a, b) => b - a)[0];
    if (until && until > now) return out('grace');
    return out('expired', status === 'expired' && !periodEnd ? 'trial_ended' : 'subscription_ended');
  }
  // trialing (or an unknown value): open while the trial runs, or while no end date exists yet.
  if (!trialEndsAt || trialEndsAt > now) return out('trial');
  return out('expired', 'trial_ended');
}

/** Routes an expired account may still open (plan choice + payment, legal, contact, auth). */
export const LOCKED_ALLOWED_PATHS = ['/billing', '/subscription', '/privacy', '/terms', '/contact', '/accessibility', '/login', '/logout'];

export function isPathAllowedWhileLocked(pathname = '') {
  const p = String(pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
  return LOCKED_ALLOWED_PATHS.some((a) => p === a || p.startsWith(`${a}/`));
}
