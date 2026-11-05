import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, LockKeyhole, MessageCircle, ShieldCheck } from 'lucide-react';
import { isNativeApp } from '@/lib/nativePlatform';
import BrandWordmark from '@/components/common/BrandWordmark';
import TermsConsent from '@/components/legal/TermsConsent';
import { DeleteAccount } from '@/components/settings/SecuritySettings';
import { PRICING_PLANS, VAT_LINE, yearlyTotal } from '@/config/pricing';
import { TERMS_VERSION } from '@/config/consent';
import { LEGAL, WHATSAPP_URL } from '@/config/legal';
import { submitPublicContact } from '@/lib/submitPublicContact';
import { heError } from '@/lib/heError';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';


const fmt = (n) => Number(n).toLocaleString('he-IL');
const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' };
const FOCUS = 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3E2BF1]/30';
const BTN = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[16px] font-semibold transition-[background-color,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 ${FOCUS}`;

function useLogout() {
  const { logout } = useAuth();
  return () => logout(true);
}

/** Logout + account deletion: always reachable, also while locked (Apple 5.1.1(v), privacy law). */
function AccountActions() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 w-full">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="pw-account"
        onClick={() => setOpen((v) => !v)}
        className={`mx-auto flex min-h-11 items-center rounded-[10px] px-3 text-[15px] font-medium text-[#4A5170] hover:text-[#1B2656] ${FOCUS}`}
      >
        ניהול החשבון
      </button>
      {open ? (
        <div id="pw-account" className="mt-2 space-y-3 rounded-[16px] border border-[#E6E8F0] bg-white p-4 text-right">
          <DeleteAccount
            onDeleted={async () => {
              try { await logout(false); } catch { /* session already gone */ }
              window.location.href = '/login?success=' + encodeURIComponent('החשבון נמחק. תודה שהייתם איתנו.');
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function Footer({ native }) {
  return (
    <footer className="mt-8 flex w-full flex-col items-center gap-1 text-center">
      <nav aria-label="קישורים" className="flex flex-wrap items-center justify-center gap-x-1 text-[14px] text-[#4A5170]">
        {!native ? <Link to="/billing" className={`inline-flex min-h-11 items-center rounded-[8px] px-2 hover:text-[#1B2656] ${FOCUS}`}>חיובים</Link> : null}
        <a href="/terms" {...NEW_TAB} className={`inline-flex min-h-11 items-center rounded-[8px] px-2 hover:text-[#1B2656] ${FOCUS}`}>תקנון<span className="sr-only"> (נפתח בכרטיסייה חדשה)</span></a>
        <a href="/privacy" {...NEW_TAB} className={`inline-flex min-h-11 items-center rounded-[8px] px-2 hover:text-[#1B2656] ${FOCUS}`}>פרטיות<span className="sr-only"> (נפתח בכרטיסייה חדשה)</span></a>
        {!native ? <a href="/contact" {...NEW_TAB} className={`inline-flex min-h-11 items-center rounded-[8px] px-2 hover:text-[#1B2656] ${FOCUS}`}>דברו איתנו<span className="sr-only"> (נפתח בכרטיסייה חדשה)</span></a> : null}
      </nav>
      <AccountActions />
    </footer>
  );
}

function TopBar() {
  const logout = useLogout();
  return (
    <header className="flex w-full items-center justify-between">
      <span className="text-[#1B2656]"><BrandWordmark size={22} /></span>
      <button type="button" onClick={logout} className={`inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-medium text-[#4A5170] hover:bg-white hover:text-[#1B2656] ${FOCUS}`}>
        יציאה
      </button>
    </header>
  );
}

function SavedLine() {
  return (
    <p className="mt-5 inline-flex items-center gap-2 rounded-[16px] bg-white px-4 py-2 text-[14px] font-medium leading-snug text-[#1B2656] shadow-[0_1px_2px_rgba(27,38,86,0.06)] [text-wrap:balance]">
      <ShieldCheck className="h-4 w-4 shrink-0 text-[#3E2BF1]" strokeWidth={1.75} aria-hidden />
      שום דבר לא נמחק: הזמנות, יומן, אורחים ותשלומים
    </p>
  );
}

/** iOS app: no prices, no purchase button, no link to buy (App Store 3.1.1 / 3.1.3). */
function NativeLocked() {
  return (
    <section className="flex w-full flex-1 flex-col items-center justify-center text-center">
      <LockKeyhole className="h-9 w-9 text-[#3E2BF1]" strokeWidth={1.75} aria-hidden />
      <h1 className="mt-5 text-[28px] font-bold leading-tight tracking-[-0.01em] text-[#1B2656]">המנוי לא פעיל</h1>
      <p className="mt-3 max-w-[340px] text-[16px] leading-relaxed text-[#4A5170]">
        המידע שלכם שמור. לחידוש המנוי דברו איתנו.
      </p>
      <SavedLine />
      {/* iOS (Apple 3.1.1): the same words, but plain text with no link out of the app. */}
      <p className="mt-8 flex w-full max-w-[340px] items-center justify-center gap-2 text-[16px] font-semibold text-[#1B2656]">
        <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
        <span>שאלות? דברו איתנו: <bdi dir="ltr">{LEGAL.WHATSAPP_DISPLAY}</bdi></span>
      </p>
    </section>
  );
}

function CycleToggle({ yearly, onChange }) {
  const opts = [{ v: false, label: 'חודשי' }, { v: true, label: 'שנתי · חוסכים 20%' }];
  return (
    <div role="radiogroup" aria-label="תקופת חיוב" className="mt-8 inline-flex rounded-full bg-white p-1 shadow-[0_1px_2px_rgba(27,38,86,0.06)] ring-1 ring-[#E6E8F0]">
      {opts.map((o) => {
        const on = yearly === o.v;
        return (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.v)}
            className={cn(
              `min-h-11 rounded-full px-5 text-[15px] font-semibold transition-colors duration-150 ease-out motion-reduce:transition-none ${FOCUS}`,
              on ? 'bg-[#1B2656] text-white' : 'text-[#4A5170] hover:text-[#1B2656]',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function PlanCard({ plan, yearly, busy, disabled, onChoose }) {
  const price = yearly ? plan.priceYearly : plan.price;
  return (
    <li
      className={cn(
        'relative flex flex-col rounded-[24px] bg-white p-5 text-right shadow-[0_1px_2px_rgba(27,38,86,0.05),0_12px_32px_-16px_rgba(27,38,86,0.18)] md:p-6',
        plan.popular ? 'ring-2 ring-[#3E2BF1]' : 'ring-1 ring-[#E6E8F0]',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[19px] font-bold text-[#1B2656]">{plan.nameHe}</h2>
        {plan.popular ? <span className="inline-flex h-7 items-center rounded-full bg-[#EEF0FF] px-3 text-[13px] font-bold text-[#3E2BF1]">מומלץ</span> : null}
      </div>
      <p className="mt-1 text-[15px] text-[#4A5170]">{plan.limit}</p>
      <p className="mt-4 flex items-baseline gap-1.5 text-[#1B2656]">
        <bdi dir="ltr" className="text-[36px] font-bold leading-none tracking-[-0.02em] tabular-nums">₪{fmt(price)}</bdi>
        <span className="text-[15px] text-[#4A5170]">לחודש</span>
      </p>
      <p className="mt-2 min-h-[22px] text-[14px] text-[#4A5170]">
        {yearly ? <>חיוב שנתי מראש: <bdi dir="ltr" className="tabular-nums">₪{fmt(yearlyTotal(plan))}</bdi></> : 'בחיוב חודשי, בלי התחייבות'}
      </p>
      <button
        type="button"
        onClick={() => onChoose(plan)}
        disabled={disabled}
        aria-busy={busy || undefined}
        className={cn(
          `${BTN} mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60`,
          plan.popular ? 'bg-[#3E2BF1] text-white hover:bg-[#3322d6]' : 'border border-[#D9DCE8] bg-white text-[#1B2656] hover:bg-[#F7F8FB]',
        )}
      >
        {busy ? 'שולחים…' : `בחירת ${plan.nameHe}`}
      </button>
    </li>
  );
}

function Requested({ plan, yearly }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="mt-8 w-full max-w-[520px] rounded-[24px] bg-white p-6 text-center shadow-[0_1px_2px_rgba(27,38,86,0.05),0_12px_32px_-16px_rgba(27,38,86,0.18)] ring-1 ring-[#E6E8F0]" role="status">
      <Check className="mx-auto h-8 w-8 text-[#3E2BF1]" strokeWidth={1.75} aria-hidden />
      <h2 ref={ref} tabIndex={-1} className="mt-4 text-[22px] font-bold text-[#1B2656] focus:outline-none">הבקשה התקבלה</h2>
      <p className="mt-2 text-[16px] leading-relaxed text-[#4A5170]">
        {`חבילת ${plan.nameHe}, ${yearly ? 'בחיוב שנתי' : 'בחיוב חודשי'}. נחזור אליכם תוך יום עסקים כדי להפעיל אותה, והכל יחזור בדיוק כמו שהיה.`}
      </p>
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`${BTN} mt-5 bg-[#1B2656] text-white hover:bg-[#141d45]`}>
        <MessageCircle className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        רוצים מהר יותר? וואטסאפ
        <span className="sr-only"> (נפתח בוואטסאפ)</span>
      </a>
    </div>
  );
}

/** Web: the plans, with the same request flow as /subscription (contact_messages, subject upgrade:<plan>). */
function WebPaywall({ user, reason }) {
  const [yearly, setYearly] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [requested, setRequested] = useState(null);

  const choose = async (plan) => {
    if (!agreed) {
      setConsentError(true);
      document.getElementById('pw-consent')?.focus();
      return;
    }
    setBusy(plan.key);
    setError('');
    try {
      const price = yearly ? plan.priceYearly : plan.price;
      const { ok, data } = await submitPublicContact({
        name: user?.full_name || user?.organization_name || user?.email || 'לקוח atlas',
        email: user?.email || '',
        phone: user?.phone || '',
        subject: `upgrade:${plan.key}`,
        message: `בקשה לחבילת ${plan.nameHe}, ${yearly ? `חיוב שנתי מראש (₪${yearlyTotal(plan)} לשנה, ₪${price} לחודש)` : `חיוב חודשי (₪${price} לחודש)`}, אחרי שתקופת הניסיון הסתיימה. ארגון: ${user?.organization_name || '—'} (${user?.organization_id || '—'}). הלקוח אישר את התקנון ומדיניות הפרטיות (גרסה ${TERMS_VERSION}) ב-${new Date().toISOString()}.`,
      });
      if (!ok) throw new Error(data?.error || '');
      setRequested(plan);
    } catch (e) {
      setError(heError(e, `לא הצלחנו לשלוח את הבקשה. כתבו לנו בוואטסאפ ${LEGAL.WHATSAPP_DISPLAY}, אנחנו זמינים 24/7.`));
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="flex w-full flex-col items-center text-center">
      <h1 className="mt-10 text-[30px] font-bold leading-tight tracking-[-0.015em] text-[#1B2656] md:mt-14 md:text-[40px]">
        {reason === 'subscription_ended' ? 'המנוי הסתיים' : 'תקופת הניסיון הסתיימה'}
      </h1>
      <p className="mt-3 max-w-[560px] text-[17px] leading-relaxed text-[#4A5170]">
        המידע שלכם שמור. בוחרים חבילה, והכל חוזר ברגע שהיא מופעלת.
      </p>
      <SavedLine />

      {requested ? <Requested plan={requested} yearly={yearly} /> : (
        <>
          <CycleToggle yearly={yearly} onChange={setYearly} />
          {/* Consent before the plan buttons (Upay/Bit requirement), so the blocked tap never sends people scrolling. */}
          <div className="mt-5 flex w-full justify-center">
            <TermsConsent id="pw-consent" variant="inline" className="text-right" checked={agreed} onChange={(v) => { setAgreed(v); if (v) setConsentError(false); }} error={consentError} />
          </div>
          {error ? <p role="alert" className="mt-2 text-[14px] font-medium text-danger-600">{error}</p> : null}
          <ul className="mt-4 grid w-full gap-4 md:grid-cols-3" aria-label="החבילות">
            {PRICING_PLANS.map((p) => (
              <PlanCard key={p.key} plan={p} yearly={yearly} busy={busy === p.key} disabled={Boolean(busy)} onChoose={choose} />
            ))}
          </ul>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[14px] text-[#4A5170]">
            {['כל היכולות בכל חבילה', 'ביטול בכל רגע', VAT_LINE].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#3E2BF1]" strokeWidth={2} aria-hidden />{t}</li>
            ))}
          </ul>
          <p className="mt-4 text-[15px] text-[#4A5170]">
            לא בטוחים איזו חבילה?{' '}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center rounded-[8px] px-1 font-semibold text-[#3E2BF1] hover:underline ${FOCUS}`}>
              דברו איתנו בוואטסאפ<span className="sr-only"> (נפתח בוואטסאפ)</span>
            </a>
          </p>
        </>
      )}
    </section>
  );
}

/**
 * Full-screen lock for an expired, unpaid account (src/lib/access.js). Replaces every app screen;
 * nothing behind it is mounted, so no data screen, + button or assistant can run.
 */
export default function TrialPaywall({ reason = 'trial_ended', native: nativeProp }) {
  const { user } = useAuth();
  const native = nativeProp ?? isNativeApp();
  useEffect(() => {
    const prev = document.title;
    document.title = native ? 'המנוי לא פעיל · atlas' : 'בחירת חבילה · atlas';
    return () => { document.title = prev; };
  }, [native]);
  return (
    <main
      dir="rtl"
      data-paywall={native ? 'native' : 'web'}
      className="flex min-h-[100dvh] w-full justify-center bg-[#F7F8FB] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] font-[Heebo,system-ui,sans-serif]"
    >
      <div className={cn('flex w-full flex-col items-center', native ? 'max-w-[440px]' : 'max-w-[1040px]')}>
        <TopBar />
        {native ? <NativeLocked /> : <WebPaywall user={user} reason={reason} />}
        <Footer native={native} />
      </div>
    </main>
  );
}
