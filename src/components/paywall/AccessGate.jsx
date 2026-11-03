import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import BrandWordmark from '@/components/common/BrandWordmark';

const TrialPaywall = lazy(() => import('./TrialPaywall'));

function Wait() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#F7F8FB]" role="status" aria-label="טוען">
      <div className="h-8 w-8 rounded-full border-[3px] border-[#E6E8F0] border-t-[#3E2BF1] motion-safe:animate-spin" />
    </div>
  );
}

export function Paywall(props) {
  const { reason } = useAccess();
  return <Suspense fallback={<Wait />}><TrialPaywall reason={reason || undefined} {...props} /></Suspense>;
}

/**
 * Wraps every signed-in app route (ProtectedRoute in src/App.jsx). Trial over and not paid →
 * the full-screen paywall instead of the screen; the screen itself is never mounted.
 * `locked` = what to render on a route that stays reachable while locked (billing / plan choice).
 */
export default function AccessGate({ children, locked: lockedRender }) {
  const { locked, checking, reason } = useAccess();
  if (checking) return <Wait />;
  if (!locked) return children;
  if (lockedRender) return lockedRender;
  return <Paywall reason={reason || undefined} />;
}

/** /billing while locked: the billing page without the app shell (no tabs, no + button, no assistant). */
export function LockedFrame({ children }) {
  return (
    <div dir="rtl" className="min-h-[100dvh] bg-[#F7F8FB] pt-[env(safe-area-inset-top)]">
      <header className="mx-auto flex max-w-[1040px] items-center justify-between px-5 py-3">
        <span className="text-[#1B2656]"><BrandWordmark size={22} /></span>
        <Link to="/subscription" className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-[15px] font-medium text-[#3E2BF1] hover:bg-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3E2BF1]/30">
          <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          בחירת חבילה
        </Link>
      </header>
      {children}
    </div>
  );
}
