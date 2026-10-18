import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { trialDaysLeft, defaultTrialEnd } from '@/lib/trial';

export function useSubscription() {
  const { user, isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      if (isSupabaseConfigured && supabase) {
        const { data: profile } = await supabase.from('profiles').select('trial_ends_at, selected_plan, subscription_status').eq('id', user.id).single();
        return profile;
      }
      return {
        trial_ends_at: user?.trial_ends_at || null,
        selected_plan: user?.selected_plan || 'trial',
        subscription_status: user?.subscription_status || 'trialing',
      };
    },
    enabled: Boolean(isAuthenticated && user?.id),
  });

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
