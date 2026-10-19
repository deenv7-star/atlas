/**
 * /register, version A: split screen. The form on one side; on the other the owner's own system
 * assembling as they type (LivePreview). Phones get a compact live card above the form.
 * All sign-up logic lives in useRegister (unchanged behaviour: validation, rate limit, consent gate,
 * duplicate email, Hebrew errors, verify-email / onboarding routing).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { Wordmark } from '@/components/app/shell/shared';
import TermsConsent from '@/components/legal/TermsConsent';
import AuthField, { StrengthMeter } from '@/components/auth/AuthField';
import { useRegister } from '@/lib/auth/useRegister';
import { LivePreviewFull, LivePreviewCompact, levelOf } from '@/components/auth/a/LivePreview';
import SocialButtons from '@/components/auth/SocialButtons';
import { socialProviders } from '@/lib/auth/socialAuth';
import { SOCIAL_LAYOUT } from '@/config/socialAuth';
import { TERMS_VERSION } from '@/config/consent';

export default function Register() {
  const r = useRegister();
  const { form, set, touched, errors, handleBlur, isLoading, emailExists } = r;
  const level = levelOf({ business: form.business.trim(), emailOk: r.emailOk, passwordOk: r.passwordOk, confirmOk: r.confirmOk, agreed: r.agreed });

  const hasSocial = socialProviders().length > 0;
  // A ticked terms box travels with the owner to Google / Apple, so a new account is not asked again.
  const social = (divider) => (
    <SocialButtons intent="register" divider={divider}
      getConsent={() => (r.agreed ? { at: new Date().toISOString(), version: TERMS_VERSION } : null)}
      getBusiness={() => form.business} />
  );

  if (r.isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FB]" dir="rtl">
        <Loader2 className="h-7 w-7 animate-spin text-brand-600 motion-reduce:animate-none" role="status" aria-label="טוען" />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh] bg-white lg:grid lg:grid-cols-[minmax(440px,1fr)_minmax(0,1.15fr)]" dir="rtl">
        <main className="flex min-h-[100dvh] flex-col px-5 pb-8 pt-[max(18px,env(safe-area-inset-top))] sm:px-10 lg:px-14 xl:px-20">
          <header className="flex h-12 items-center justify-between">
            <Link to="/" aria-label="ATLAS, לדף הבית" className="inline-flex h-11 items-center"><Wordmark size={20} /></Link>
            <p className="text-[14px] text-ink-600">
              כבר רשומים? <Link to="/login" className="inline-flex h-11 min-w-11 items-center justify-center px-1 font-bold text-brand-600 hover:underline">כניסה</Link>
            </p>
          </header>

          <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-6 lg:py-10">
            <div className="mb-5 lg:hidden"><LivePreviewCompact business={form.business} level={level} /></div>

            <h1 className="text-[30px] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy-900 sm:text-[36px]">בונים את המערכת שלכם</h1>
            <p className="mt-2 text-[16px] text-ink-600">14 ימים חינם, אחר כך מחליטים. דקה אחת והיא מוכנה.</p>

            {emailExists ? (
              <div className="mt-8 space-y-4">
                <div className="rounded-[16px] border border-[#D9DCFB] bg-brand-50 p-4 text-center" role="alert">
                  <p className="font-semibold text-navy-900">כתובת המייל הזו כבר רשומה במערכת</p>
                </div>
                <Link to={`/login?email=${encodeURIComponent(form.email)}`} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand-600 text-[16px] font-bold text-white">
                  התחברו עם המייל הזה<ArrowLeft className="h-5 w-5" aria-hidden />
                </Link>
                <button type="button" onClick={() => r.setEmailExists(false)} className="flex h-11 w-full items-center justify-center text-[14px] font-semibold text-ink-600 hover:text-navy-900">מייל אחר</button>
              </div>
            ) : (
              <>
              {hasSocial && SOCIAL_LAYOUT === 'above' ? (
                <div className="mt-7">{social('after')}</div>
              ) : null}
              <form onSubmit={r.submit} noValidate className={hasSocial && SOCIAL_LAYOUT === 'above' ? 'mt-6 flex flex-col gap-4' : 'mt-7 flex flex-col gap-4'}>
                <AuthField id="business" label="איך קוראים למתחם?" hint="לא חובה. אפשר גם אחר כך." value={form.business} onChange={set('business')} placeholder="למשל: צימרי הגליל" maxLength={50} autoComplete="organization" ok={form.business.trim().length >= 2} />
                <AuthField id="email" label="אימייל" type="email" inputMode="email" dir="ltr" inputClassName="text-right" placeholder="name@example.com" autoComplete="email" maxLength={255}
                  value={form.email} onChange={set('email')} onBlur={handleBlur('email')} error={touched.email ? errors.email : null} ok={touched.email && r.emailOk} />
                <AuthField id="password" label="סיסמה" password placeholder="לפחות 8 תווים, ספרה ואות" autoComplete="new-password" maxLength={128}
                  value={form.password} onChange={set('password')} onBlur={handleBlur('password')} error={touched.password ? errors.password : null}>
                  <StrengthMeter strength={r.strength} value={form.password} />
                </AuthField>
                <AuthField id="confirmPassword" label="אימות סיסמה" password placeholder="הקלידו שוב את הסיסמה" autoComplete="new-password" maxLength={128}
                  value={form.confirmPassword} onChange={set('confirmPassword')} onBlur={handleBlur('confirmPassword')} error={touched.confirmPassword ? errors.confirmPassword : null} />

                <TermsConsent checked={r.agreed} onChange={r.onConsent} error={r.consentError} className="pt-1" />

                <button type="submit" disabled={!r.canSubmit || isLoading} aria-busy={isLoading}
                  className="mt-1 flex h-[56px] w-full items-center justify-center gap-2 rounded-[16px] bg-brand-600 text-[17px] font-bold text-white shadow-[0_1px_2px_rgba(42,26,201,0.3),0_14px_30px_-14px_rgba(62,43,241,0.7)] transition-[background-color,transform] duration-150 hover:bg-[#3322E0] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#C9C3FB] disabled:shadow-none motion-reduce:transition-none">
                  {isLoading ? <><Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />פותחים חשבון…</> : <>פתיחת חשבון<ArrowLeft className="h-5 w-5" aria-hidden /></>}
                </button>
              </form>
              {hasSocial && SOCIAL_LAYOUT === 'below' ? (
                <div className="mt-6">{social('before')}</div>
              ) : null}
              </>
            )}

            <p className="mt-6 flex items-center justify-center gap-1.5 text-[13px] text-ink-400"><Shield className="h-3.5 w-3.5" aria-hidden />המידע שלכם מאובטח ומוצפן</p>
          </div>
        </main>

        <aside className="sticky top-0 hidden h-[100dvh] p-4 lg:block">
          <LivePreviewFull business={form.business} email={form.email} level={level} />
        </aside>
      </div>
    </MotionConfig>
  );
}
