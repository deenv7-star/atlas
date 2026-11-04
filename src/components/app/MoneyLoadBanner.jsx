import React from 'react';
import { RotateCw } from 'lucide-react';

/**
 * Audit 04.11 #2: the payments could not be loaded. Amounts show "—" until they are; this says why and
 * offers a retry. Never shows a number.
 */
export function MoneyLoadBanner({ onRetry, className = '' }) {
  return (
    <div role="alert" dir="rtl" className={`flex items-center gap-3 rounded-[20px] bg-white px-4 py-3 text-[#1B2656] shadow-[inset_0_0_0_1px_rgba(27,38,86,.1),0_1px_2px_rgba(27,38,86,.05)] ${className}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold leading-snug">לא הצלחנו לטעון את התשלומים</p>
        <p className="mt-0.5 text-[13px] text-[#1B2656]/75">הסכומים יופיעו כאן כשהחיבור יחזור.</p>
      </div>
      <button type="button" onClick={onRetry} className="press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-[#F7F8FB] px-3.5 text-[15px] font-semibold text-[#1B2656] shadow-[inset_0_0_0_1px_rgba(27,38,86,.12)]">
        <RotateCw className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        נסו שוב
      </button>
    </div>
  );
}
