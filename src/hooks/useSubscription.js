import { useAuth } from '@/lib/AuthContext';
import { useAccess } from '@/hooks/useAccess';

/**
 * Trial / plan state for the banner and the sidebar card. The decision itself ("trial over and not paid")
 * lives in src/lib/access.js; the gate (src/components/paywall/AccessGate.jsx) uses the same function.
 * Before 3.11.2026 this hook computed isExpired from the trial date only, so a paying owner whose trial date
 * had passed saw "תקופת הניסיון הסתיימה", and nothing ever stopped an unpaid owner from using the app.
 */
export function useSubscription() {
  const { user, isAuthenticated } = useAuth();
  const isLoading = !isAuthenticated && !user ? false : !user;
  // Same answer as the gate, including the offline fallback (audit 05.11 NET-1).
  const a = useAccess();

  return {
    plan: user?.selected_plan || 'trial',
    status: user?.subscription_status || 'trialing',
    daysLeft: a.daysLeft,
    isTrialing: a.state === 'trial' && Boolean(a.trialEndsAt || a.daysLeft),
    isExpired: a.state === 'expired',
    isPaid: a.state === 'paid' || a.state === 'grace',
    isLoading,
  };
}
