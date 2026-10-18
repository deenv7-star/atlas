import { useAuth } from '@/lib/AuthContext';
import { trialDaysLeft, defaultTrialEnd } from '@/lib/trial';

export function useSubscription() {
  const { user, isAuthenticated } = useAuth();

  // auth.me() already selects trial_ends_at / selected_plan / subscription_status from profiles,
  // so read them from the cached user instead of a second profiles round-trip on every page.
  const data = user ? {
    trial_ends_at: user.trial_ends_at || null,
    selected_plan: user.selected_plan || 'trial',
    subscription_status: user.subscription_status || 'trialing',
  } : null;
  const isLoading = !isAuthenticated && !user ? false : !user;

  // Fallback: 14-day trial from signup when trial_ends_at is missing (previously showed a red "0 days left" to brand-new users).
  const createdAt = user?.created_date || user?.created_at;
  const trialEndsAt = data?.trial_ends_at ? new Date(data.trial_ends_at) : defaultTrialEnd(createdAt);
  const now = new Date();
  // Calendar days, not ceil(ms / 24h): a trial crossing the end of summer time is 14 days + 1 hour
  // long and used to show "15 ימים" right after signup (src/lib/trial.js, tests/unit/trial.test.mjs).
  const daysLeft = trialDaysLeft(trialEndsAt, now);
  const isExpired = trialEndsAt && trialEndsAt <= now;
  const isTrialing = data?.subscription_status === 'trialing' && Boolean(trialEndsAt) && !isExpired;
  const isPaid = data?.subscription_status === 'active' || data?.subscription_status === 'paid';

  return {
    plan: data?.selected_plan || 'trial',
    status: data?.subscription_status || 'trialing',
    daysLeft,
    isTrialing,
    isExpired,
    isPaid,
    isLoading,
  };
}
