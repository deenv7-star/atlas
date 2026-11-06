import React from 'react';

/**
 * Audit 04.11 #9 / m15: while the shell or the session loads, show the shape of the app (top bar, title,
 * cards, tab bar) instead of a lone spinner on a blank canvas. Static, so it is also calm with reduced motion.
 */
export default function AppFallback() {
  const bar = { background: '#E8EAF1' };
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#F7F8FB' }} role="status" aria-busy="true" aria-label="טוען" dir="rtl">
      <div className="flex h-16 items-center justify-between px-5">
        <span className="h-[22px] w-[76px] rounded-lg" style={bar} />
        <span className="h-10 w-10 rounded-full" style={bar} />
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-5 pt-2.5">
        <div className="h-[30px] w-[58%] max-w-[320px] rounded-[10px]" style={bar} />
        <div className="mt-3 h-3.5 w-[82%] max-w-[440px] rounded-md" style={{ background: '#EEF0F5' }} />
        <div className="mt-[22px] grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          <div className="h-28 rounded-[24px] bg-white" />
          <div className="h-28 rounded-[24px] bg-white" />
          <div className="hidden h-28 rounded-[24px] bg-white lg:block" />
        </div>
        <div className="mt-3 h-[220px] rounded-[24px] bg-white" />
      </div>
      <div className="absolute inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] h-16 rounded-[28px] bg-white/90 shadow-[0_8px_24px_-12px_rgba(27,38,86,.25)] lg:hidden" />
    </div>
  );
}

