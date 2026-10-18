/**
 * /register, version B: the same one-question-at-a-time feel as onboarding B (refs: Duolingo, Typeform).
 * Question 1: the email. Question 2: a password + the terms consent. Big inputs, a progress bar that carries
 * on into onboarding. All sign-up logic lives in useRegister (unchanged behaviour).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Shield, Loader2, CalendarDays, MessageCircle, Sparkles } from 'lucide-react';
import { Wordmark } from '@/components/app/shell/shared';
import TermsConsent from '@/components/legal/TermsConsent';
import AuthField, { StrengthMeter } from '@/components/auth/AuthField';
import { useRegister } from '@/lib/auth/useRegister';
import { cn } from '@/lib/utils';

const EASE = [0.23, 1, 0.32, 1];
const PROMISES = [
  { Icon: CalendarDays, t: 'Booking, Airbnb וטלפון בלוח אחד' },
  { Icon: MessageCircle, t: 'וואטסאפ לאורחים בלחיצה' },
  { Icon: Sparkles, t: '14 ימים חינם' },
];

export default function Register() {
  const r = useRegister();
  const { form, set, touched, errors, handleBlur, isLoading, emailExists } = r;
  const [q, setQ] = useState(0);
  const [dir, setDir] = useState(1);
  const pwRef = useRef(null);
  const emailRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => (q === 0 ? emailRef.current : pwRef.current)?.focus({ preventScroll: true }), 320);
    return () => clearTimeout(t);
  }, [q]);

  const toPassword = (e) => {
    e?.preventDefault?.();
    if (!r.validate(['email'])) return;
    setDir(1); setQ(1);
  };
  const back = () => { setDir(-1); setQ(0); };
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!r.emailOk) { back(); r.validate(['email']); return; }
    await r.submit(e);
  };

  if (r.isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FB]" dir="rtl">
        <Loader2 className="h-7 w-7 animate-spin text-brand-600 motion-reduce:animate-none" role="status" aria-label="טוען" />
      </div>
    );
  }

  const variants = {
    enter: (k) => ({ opacity: 0, x: k > 0 ? -32 : 32 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
    exit: (k) => ({ opacity: 0, x: k > 0 ? 20 : -20, transition: { duration: 0.15, ease: EASE } }),
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-[100dvh] overflow-x-clip bg-[#F7F8FB]" dir="rtl">
        <div aria-hidden className="pointer-events-none absolute -top-48 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(62,43,241,0.13),rgba(62,43,241,0))]" />
        <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col px-5 pb-8 pt-[max(14px,env(safe-area-inset-top))]">
          <header className="flex h-12 items-center gap-3">
            {q === 1 && !emailExists ? (
              <button type="button" onClick={back} aria-label="חזרה למייל" className="-ms-2 inline-flex h-12 w-12 items-center justify-center rounded-[14px] text-navy-900 hover:bg-navy-900/5"><ArrowRight className="h-6 w-6" aria-hidden /></button>
            ) : <Link to="/" aria-label="ATLAS, לדף הבית" className="inline-flex h-11 items-center"><Wordmark size={20} /></Link>}
            <div className="flex flex-1 gap-1.5" role="progressbar" aria-label="פתיחת חשבון" aria-valuemin={1} aria-valuemax={2} aria-valuenow={q + 1} aria-valuetext={`שאלה ${q + 1} מתוך 2`}>
              {[0, 1].map((k) => (
                <span key={k} className="h-2 flex-1 overflow-hidden rounded-full bg-[#E1E4EE]">
                  <span className="block h-full origin-right rounded-full bg-brand-600 transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${k < q ? 1 : k === q ? 0.5 : 0})` }} />
                </span>
              ))}
            </div>
            <Link to="/login" className="inline-flex h-11 items-center text-[14px] font-bold text-brand-600 hover:underline">כניסה</Link>
          </header>

          <div className="flex flex-1 flex-col justify-center py-8">
            {emailExists ? (
              <div className="space-y-4">
                <h1 className="text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em] text-navy-900">כבר יש לכם חשבון</h1>
                <div className="rounded-[18px] border border-[#D9DCFB] bg-brand-50 p-4" role="alert">
                  <p className="font-semibold text-navy-900">כתובת המייל הזו כבר רשומה במערכת</p>
                  <p className="mt-0.5 text-[14px] text-ink-600" dir="ltr">{form.email}</p>
                </div>
                <Link to={`/login?email=${encodeURIComponent(form.email)}`} className="flex h-[60px] w-full items-center justify-center gap-2 rounded-[18px] bg-brand-600 text-[18px] font-bold text-white active:scale-[0.98]">
                  התחברו עם המייל הזה<ArrowLeft className="h-5 w-5" aria-hidden />
                </Link>
                <button type="button" onClick={() => { r.setEmailExists(false); back(); }} className="flex h-11 w-full items-center justify-center text-[15px] font-semibold text-ink-600 hover:text-navy-900">מייל אחר</button>
              </div>
            ) : (
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                {q === 0 ? (
                  <motion.form key="email" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" onSubmit={toPassword} noValidate className="flex flex-col gap-7">
                    <div>
                      <p className="text-[14px] font-bold text-brand-600">שאלה 1 מתוך 2 · דקה וזה מוכן</p>
                      <h1 className="mt-2 text-[34px] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy-900 sm:text-[40px]">מה המייל שלכם?</h1>
                      <p className="mt-2 text-[17px] text-ink-600">לשם נשלח את אישור החשבון.</p>
                    </div>
                    <ul className="flex flex-wrap gap-2" aria-label="מה מקבלים">
                      {PROMISES.map(({ Icon, t }, k) => (
                        <motion.li key={t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE, delay: 0.1 + k * 0.07 } }}
                          className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.06),0_6px_16px_-10px_rgba(27,38,86,0.25)]">
                          <Icon className="h-4 w-4 text-brand-600" aria-hidden />{t}
                        </motion.li>
                      ))}
                    </ul>
                    <AuthField id="email" size="lg" label="אימייל" type="email" inputMode="email" dir="ltr" inputClassName="text-right" placeholder="name@example.com" autoComplete="email" maxLength={255}
                      value={form.email} onChange={set('email')} onBlur={handleBlur('email')} error={touched.email ? errors.email : null} ok={r.emailOk}
                      inputRef={emailRef} />
                    <button type="submit" disabled={!form.email}
                      className="flex h-[60px] w-full items-center justify-center gap-2 rounded-[18px] bg-brand-600 text-[18px] font-bold text-white shadow-[0_1px_2px_rgba(42,26,201,0.3),0_14px_30px_-14px_rgba(62,43,241,0.7)] transition-[background-color,transform] duration-150 hover:bg-[#3322E0] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#C9C3FB] disabled:shadow-none motion-reduce:transition-none">
                      המשך<ArrowLeft className="h-5 w-5" aria-hidden />
                    </button>
                  </motion.form>
                ) : (
                  <motion.form key="password" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
                    <div>
                      <p className="text-[14px] font-bold text-brand-600">שאלה 2 מתוך 2</p>
                      <h1 className="mt-2 text-[34px] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy-900 sm:text-[40px]">בחרו סיסמה</h1>
                      <p className="mt-2 truncate text-[16px] text-ink-600">לחשבון <span dir="ltr" className="font-semibold text-navy-900">{form.email}</span></p>
                    </div>
                    <AuthField id="password" size="lg" label="סיסמה" password placeholder="לפחות 8 תווים, ספרה ואות" autoComplete="new-password" maxLength={128}
                      value={form.password} onChange={set('password')} onBlur={handleBlur('password')} error={touched.password ? errors.password : null} inputRef={pwRef}>
                      <StrengthMeter strength={r.strength} value={form.password} />
                    </AuthField>
                    <AuthField id="confirmPassword" size="lg" label="עוד פעם, לאישור" password placeholder="הקלידו שוב את הסיסמה" autoComplete="new-password" maxLength={128}
                      value={form.confirmPassword} onChange={set('confirmPassword')} onBlur={handleBlur('confirmPassword')} error={touched.confirmPassword ? errors.confirmPassword : null} />
                    <div className={cn('rounded-[16px] border px-3.5 py-2 transition-colors duration-150 motion-reduce:transition-none', r.agreed ? 'border-brand-600/50 bg-brand-50' : r.consentError ? 'border-danger-500/60 bg-white' : 'border-[#DCE0EB] bg-white')}>
                      <TermsConsent checked={r.agreed} onChange={r.onConsent} error={r.consentError} variant="inline" />
                    </div>
                    <button type="submit" disabled={!r.canSubmit || isLoading} aria-busy={isLoading}
                      className={cn('flex h-[60px] w-full items-center justify-center gap-2 rounded-[18px] bg-brand-600 text-[18px] font-bold text-white shadow-[0_1px_2px_rgba(42,26,201,0.3),0_14px_30px_-14px_rgba(62,43,241,0.7)] transition-[background-color,transform] duration-150 hover:bg-[#3322E0] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#C9C3FB] disabled:shadow-none motion-reduce:transition-none')}>
                      {isLoading ? <><Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />פותחים חשבון…</> : <>פתיחת חשבון<ArrowLeft className="h-5 w-5" aria-hidden /></>}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            )}
          </div>

          <p className="flex items-center justify-center gap-1.5 text-[13px] text-ink-400"><Shield className="h-3.5 w-3.5" aria-hidden />המידע שלכם מאובטח ומוצפן</p>
        </main>
      </div>
    </MotionConfig>
  );
}
