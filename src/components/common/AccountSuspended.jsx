import { PauseCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/** Shown instead of the app when the ATLAS team suspended this organization (admin console). */
export default function AccountSuspended({ reason }) {
  const logout = async () => {
    try { await base44.auth.logout(); } catch { /* ignore */ }
    window.location.assign('/login');
  };
  return (
    <main dir="rtl" className="flex min-h-[100dvh] items-center justify-center px-5" style={{ background: '#F7F8FB' }}>
      <div className="w-full max-w-[440px] rounded-[24px] border border-[#E6E8F0] bg-white p-7 text-center shadow-[0_1px_2px_rgba(16,24,64,0.04),0_12px_32px_-12px_rgba(16,24,64,0.12)]">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF0FF] text-[#3E2BF1]" aria-hidden>
          <PauseCircle className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-[22px] font-bold text-[#0F1640]">החשבון מושהה כרגע</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#4A5170]">
          הגישה ל-ATLAS הושהתה על ידי הצוות שלנו. המידע שלכם שמור ולא נמחק.
          {reason ? <><br />סיבה: {reason}</> : null}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href="https://wa.me/972525979520"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#3E2BF1] px-6 text-[15px] font-semibold text-white"
          >
            דברו איתנו בוואטסאפ
          </a>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#E6E8F0] bg-white px-6 text-[15px] font-semibold text-[#0F1640]"
          >
            התנתקות
          </button>
        </div>
      </div>
    </main>
  );
}
