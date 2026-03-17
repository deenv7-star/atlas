import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export function useSubscription() {
  const { user, isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: profile } = await supabase.from('profiles').select('trial_ends_at, selected_plan, subscription_status').eq('id', user.id).single();
      return profile;
    },
    enabled: Boolean(isAuthenticated && user?.id),
  });

  const trialEndsAt = data?.trial_ends_at ? new Date(data.trial_ends_at) : null;
  const now = new Date();
  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24))) : 0;
  const isExpired = trialEndsAt && trialEndsAt <= now;
  const isTrialing = data?.subscription_status === 'trialing' && !isExpired;
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
