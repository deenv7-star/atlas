import React, { useState } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Audit 04.11 (critical #1): the owner has a stored session but the first load failed on the network.
 * Never the login screen for that: say what happened, keep the session, retry on tap and on 'online'
 * (AuthContext listens for the event).
 */
export default function OfflineAuthScreen({ onRetry }) {
  const [busy, setBusy] = useState(false);
  const retry = async () => {
    if (busy) return;
    setBusy(true);
    try { await onRetry?.(); } finally { setBusy(false); }
  };
  return (
    <main dir="rtl" className="min-h-[100dvh] flex items-center justify-center px-6" style={{ background: '#F7F8FB' }}>
      <div className="w-full max-w-sm text-center" role="alert" aria-live="polite">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_1px_2px_rgba(27,38,86,.06),0_8px_24px_-12px_rgba(27,38,86,.18)]">
          <WifiOff className="h-6 w-6 text-[#3E2BF1]" strokeWidth={1.75} aria-hidden />
        </div>
        <h1 className="text-[22px] font-bold leading-tight text-[#1B2656]">אין חיבור כרגע</h1>
        <p className="mt-2 text-[16px] leading-relaxed text-[#1B2656]/75">החשבון שלכם שמור. נחזור לנתונים ברגע שהאינטרנט יחזור.</p>
        <button
          type="button"
          onClick={retry}
          disabled={busy}
          aria-busy={busy}
          className="mt-6 inline-flex min-h-[48px] min-w-[160px] items-center justify-center rounded-xl bg-[#3E2BF1] px-6 text-[16px] font-semibold text-white transition-transform active:scale-[0.97] disabled:opacity-70"
        >
          {busy ? 'מתחברים…' : 'נסו שוב'}
        </button>
      </div>
    </main>
  );
}
