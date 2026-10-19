/**
 * /auth/callback: where Google / Apple (through Supabase) send the owner back.
 *
 * supabase-js has already read the session from the URL (detectSessionInUrl). This screen:
 *  1. shows the provider's error in Hebrew (cancelled, provider not enabled, …) with a way back;
 *  2. fills empty profile fields from the provider (Google name + photo; Apple has no photo);
 *  3. asks only what is still missing, once: the terms + privacy consent for a brand-new account that did
 *     not tick it before leaving (Upay requirement), and a name when the provider gave none (Apple web);
 *  4. routes: a set-up account → its return URL or /today; a new account → /onboarding (v2).
 * The email/password + cross-device verification flow never passes through here.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase, INITIAL_AUTH_URL } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AuthShell from '@/components/app/AuthShell';
import AuthField from '@/components/auth/AuthField';
import TermsConsent from '@/components/legal/TermsConsent';
import { GuestAvatar } from '@/components/app/atoms';
import { TERMS_VERSION } from '@/config/consent';
import { PENDING_BUSINESS_KEY } from '@/lib/auth/useRegister';
import { pendingStore, readOwnProfile, completeSocialProfile } from '@/lib/auth/socialAuth';
import {
  callbackUrlError, oauthErrorMessage, finishNeeds, postAuthPath, nameFromMetadata, avatarFromMetadata,
  sessionProvider, isPrivateRelayEmail, PROVIDER_LABEL,
} from '@/lib/auth/oauthFlow';

function Centered({ label }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#F7F8FB] px-6" dir="rtl">
      <Loader2 className="h-7 w-7 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden />
      <p role="status" className="text-[16px] font-medium text-navy-900">{label}</p>
    </div>
  );
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [stage, setStage] = useState('loading'); // loading | error | finish | going
  const [error, setError] = useState('');
  const [ctx, setCtx] = useState(null); // { user, profile, pending, needs, onboardingCompleted }
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [saving, setSaving] = useState(false);
  const started = useRef(false);

  const finish = async (c, { consent = null, typedName = '' } = {}) => {
    setStage('going');
    const pending = c.pending;
    await completeSocialProfile({ user: c.user, profile: c.profile, consent: consent || pending?.consent || null, typedName });
    try { if (pending?.business) localStorage.setItem(PENDING_BUSINESS_KEY, pending.business); } catch { /* ignore */ }
    pendingStore.clear();
    const me = await loginUser(null).catch(() => null);
    try { localStorage.setItem('login_just_completed', String(Date.now())); } catch { /* ignore */ }
    const done = Boolean(me?.onboarding_completed ?? c.onboardingCompleted);
    navigate(postAuthPath({ onboardingCompleted: done, returnTo: pending?.returnTo }), { replace: true });
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const pending = pendingStore.read();
      const urlErr = callbackUrlError(INITIAL_AUTH_URL.hash, INITIAL_AUTH_URL.search);
      if (urlErr) {
        pendingStore.clear();
        setError(oauthErrorMessage(urlErr, pending?.provider || 'google'));
        setStage('error');
        return;
      }
      try {
        const { data: { session } = {} } = await supabase.auth.getSession();
        if (!session?.user) {
          setError('לא הצלחנו להשלים את ההתחברות. נסו שוב.');
          setStage('error');
          return;
        }
        const user = session.user;
        const [profile, me] = await Promise.all([
          readOwnProfile(user.id).catch(() => ({})),
          base44.auth.me().catch(() => null),
        ]);
        const onboardingCompleted = Boolean(me?.onboarding_completed ?? profile?.onboarding_completed);
        const needs = finishNeeds({ user, profile, pending, onboardingCompleted });
        const c = { user, profile, pending, needs, onboardingCompleted };
        setCtx(c);
        if (!needs.any) { await finish(c); return; }
        setName(nameFromMetadata(user.user_metadata || {}));
        setStage('finish');
      } catch (err) {
        setError(oauthErrorMessage(err, pending?.provider || 'google'));
        setStage('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!ctx || saving) return;
    let ok = true;
    const typed = name.replace(/\s+/g, ' ').trim();
    if (ctx.needs.name && typed.length < 2) { setNameError('איך קוראים לכם? שם פרטי לפחות.'); ok = false; }
    if (ctx.needs.consent && !agreed) {
      setConsentError(true);
      if (ok) document.getElementById('terms-consent')?.focus();
      ok = false;
    }
    if (!ok) return;
    setSaving(true);
    try {
      await finish(ctx, {
        consent: ctx.needs.consent ? { at: new Date().toISOString(), version: TERMS_VERSION } : null,
        typedName: ctx.needs.name ? typed : '',
      });
    } catch (err) {
      setSaving(false);
      setStage('finish');
      setNameError('');
      setError(oauthErrorMessage(err, ctx.pending?.provider || sessionProvider(ctx.user)));
    }
  };

  if (stage === 'loading') return <Centered label="מתחברים…" />;
  if (stage === 'going') return <Centered label="מכינים את המערכת שלכם…" />;

  if (stage === 'error') {
    return (
      <AuthShell>
        <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-navy-900">ההתחברות לא הושלמה</h1>
        <p role="alert" className="mt-3 text-[16px] leading-relaxed text-ink-600">{error}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link to="/login" className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand-600 text-[16px] font-bold text-white hover:bg-[#3322E0]">
            חזרה לכניסה<ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <Link to="/register" className="flex h-11 w-full items-center justify-center text-[15px] font-semibold text-ink-600 hover:text-navy-900">פתיחת חשבון עם אימייל</Link>
        </div>
      </AuthShell>
    );
  }

  // finish
  const meta = ctx?.user?.user_metadata || {};
  const provider = ctx?.pending?.provider || sessionProvider(ctx?.user);
  const photo = avatarFromMetadata(meta);
  const email = ctx?.user?.email || '';
  return (
    <AuthShell>
      <div className="flex items-center gap-3">
        <GuestAvatar name={name || email} src={photo || undefined} photo={Boolean(photo)} size={48} owner />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-400">מחוברים עם {PROVIDER_LABEL[provider] || 'Google'}</p>
          <p className="truncate text-[15px] font-semibold text-navy-900" dir="ltr">{email}</p>
        </div>
      </div>
      <h1 className="mt-6 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-navy-900">עוד צעד קטן</h1>
      <p className="mt-2 text-[16px] text-ink-600">
        {ctx?.needs.name ? 'כדי שנדע איך לפנות אליכם.' : 'לפני שמתחילים.'}
      </p>
      {isPrivateRelayEmail(email) ? (
        <p className="mt-3 rounded-[12px] bg-brand-50 px-4 py-3 text-[14px] leading-relaxed text-navy-900">
          בחרתם להסתיר את המייל ב-Apple. ההודעות שלנו יגיעו אליכם דרך Apple, וזה עובד רגיל.
        </p>
      ) : null}
      <form onSubmit={submit} noValidate className="mt-7 flex flex-col gap-4">
        {ctx?.needs.name ? (
          <AuthField id="full_name" label="השם שלכם" autoComplete="name" maxLength={80} placeholder="למשל: דנה כהן"
            value={name} onChange={(e) => { setName(e.target.value); if (nameError) setNameError(''); }}
            error={nameError || null} autoFocus />
        ) : null}
        {ctx?.needs.consent ? (
          <TermsConsent checked={agreed} onChange={(v) => { setAgreed(v); if (v) setConsentError(false); }} error={consentError} />
        ) : null}
        {error ? <p role="alert" className="text-[14px] font-medium text-danger-600">{error}</p> : null}
        <button type="submit" disabled={saving} aria-busy={saving || undefined}
          className="mt-1 flex h-[56px] w-full items-center justify-center gap-2 rounded-[16px] bg-brand-600 text-[17px] font-bold text-white transition-[background-color,transform] duration-150 hover:bg-[#3322E0] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#C9C3FB] motion-reduce:transition-none">
          {saving ? <><Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />שומרים…</> : <>המשך<ArrowLeft className="h-5 w-5" aria-hidden /></>}
        </button>
      </form>
    </AuthShell>
  );
}
