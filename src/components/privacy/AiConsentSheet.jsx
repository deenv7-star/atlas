/**
 * App Store 5.1.2(i): who gets what, then an explicit yes, before the first question leaves the device.
 * `inline` renders inside a panel (help chat); otherwise a full-screen sheet above the assistant.
 */
import React, { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3E2BF1]/30';

export function AiConsentBody({ onAccept, onDecline, titleId = 'ai-consent-t' }) {
  const ok = useRef(null);
  useEffect(() => { ok.current?.focus?.(); }, []);
  return (
    <div dir="rtl" className="w-full max-w-[400px] rounded-[20px] bg-white p-5 text-right text-[#1B2656] shadow-[0_12px_40px_-12px_rgba(27,38,86,0.35)]">
      <ShieldCheck className="h-7 w-7 text-[#3E2BF1]" strokeWidth={1.75} aria-hidden />
      <h2 id={titleId} className="mt-3 text-[22px] font-bold leading-tight">לפני השיחה עם atlas</h2>
      <p className="mt-2 text-[16px] leading-relaxed text-[#4A5170]">
        כדי לענות לכם, atlas שולח לספקי בינה מלאכותית את מה ששאלתם ואת פרטי העסק שצריך לתשובה, כמו הזמנות, שמות אורחים ותשלומים.
      </p>
      <ul className="mt-3 space-y-2 text-[15px] leading-snug">
        <li className="rounded-[12px] bg-[#F7F8FB] px-3 py-2"><b dir="ltr">OpenAI</b>: תשובות בכתב ובצ׳אט העזרה.</li>
        <li className="rounded-[12px] bg-[#F7F8FB] px-3 py-2"><b dir="ltr">ElevenLabs</b>: שיחה בקול. הקול שלכם עובר אליהם בזמן השיחה.</li>
      </ul>
      <p className="mt-3 text-[14px] leading-relaxed text-[#4A5170]">
        בלי אישור העוזר לא נפתח, וכל השאר באפליקציה עובד כרגיל. הפרטים ב<a href="/privacy" className={`font-semibold text-[#3E2BF1] underline underline-offset-[3px] ${FOCUS}`}>מדיניות הפרטיות</a>.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <button ref={ok} type="button" onClick={onAccept} className={`inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#3E2BF1] px-6 text-[16px] font-semibold text-white active:scale-[0.98] ${FOCUS}`}>
          אישור
        </button>
        <button type="button" onClick={onDecline} className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-6 text-[15px] font-medium text-[#4A5170] hover:text-[#1B2656] ${FOCUS}`}>
          לא עכשיו
        </button>
      </div>
    </div>
  );
}

export default function AiConsentSheet({ onAccept, onDecline }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onDecline?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDecline]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-consent-t"
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#1B2656]/45 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] sm:items-center"
    >
      <AiConsentBody onAccept={onAccept} onDecline={onDecline} />
    </div>
  );
}
