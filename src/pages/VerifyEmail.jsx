import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle2, Clock3, Monitor, Smartphone, Loader2 } from 'lucide-react';
import AuthShell from '@/components/app/AuthShell';
import { supabase, initialAuthUrlError } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mapAuthErrorToHebrew } from '@/lib/authErrors';
import { useCrossDeviceVerify } from '@/lib/auth/useCrossDeviceVerify';

const EMAIL_KEY = 'atlas_pending_verify_email';
const redirectUrl = () => `${window.location.origin}/verify-email?confirmed=1`;

/**
 * Three honest states:
 *  waiting   — right after signup: "check your inbox" + resend. Continues BY ITSELF when the email is
 *              confirmed anywhere, including on another device (useCrossDeviceVerify: polls a password
 *              sign-in kept in memory only; after a reload, "אישרתי במייל, המשך" + password).
 *  confirmed — the confirmation link was opened here (?confirmed=1 + session): "back to the computer,
 *              or continue here" (the device that opened the link is often the phone).
 *  expired   — Supabase sent back an error (otp_expired / access_denied) → send a new link
 */
export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { isAuthenticated, isLoadingAuth, user, loginUser } = useAuth();

  const urlError = useMemo(() => initialAuthUrlError(), []);
  const cameFromLink = params.get('confirmed') === '1';

  const initialEmail = location.state?.email || (() => { try { return sessionStorage.getItem(EMAIL_KEY) || ''; } catch { return ''; } })();
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    if (location.state?.email) { try { sessionStorage.setItem(EMAIL_KEY, location.state.email); } catch {} }
  }, [location.state?.email]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  let state = 'waiting';
  if (urlError) state = 'expired';
  else if (cameFromLink) state = isLoadingAuth ? 'checking' : (isAuthenticated ? 'confirmed' : 'confirmed_signed_out');

  // Waiting screen + confirmed in another tab (session arrives through storage): move on by itself.
  useEffect(() => {
    if (state === 'waiting' && isAuthenticated && user) {
      navigate(user.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true });
    }
  }, [state, isAuthenticated, user, navigate]);

  // Waiting screen + confirmed on ANOTHER device: sign in here (password in memory) and continue.
  const continuedRef = useRef(false);
  const onConfirmed = useCallback(async () => {
    if (continuedRef.current) return;
    continuedRef.current = true;
    try { sessionStorage.removeItem(EMAIL_KEY); } catch {}
    const me = await loginUser(null);
    navigate(me?.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true });
  }, [loginUser, navigate]);
  const cross = useCrossDeviceVerify({ email, enabled: state === 'waiting' && !isAuthenticated, onConfirmed });
  const [password, setPassword] = useState('');
  const needsPassword = cross.status === 'needs_password';
  const continueNow = async (e) => {
    e?.preventDefault?.();
    if (needsPassword && !password) return;
    await cross.checkWithPassword(needsPassword ? password : undefined);
  };

  useEffect(() => {
    if (state === 'confirmed') { try { sessionStorage.removeItem(EMAIL_KEY); } catch {} }
  }, [state]);

  const resend = async (e) => {
    e?.preventDefault?.();
    const addr = email.trim();
    if (!addr || countdown > 0 || !supabase) return;
    setSending(true);
    setSendError('');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: addr, options: { emailRedirectTo: redirectUrl() } });
      if (error) throw error;
      try { sessionStorage.setItem(EMAIL_KEY, addr); } catch {}
      setSentAt(Date.now());
      setCountdown(60);
    } catch (err) {
      setSendError(mapAuthErrorToHebrew(err)?.message || 'לא הצלחנו לשלוח כרגע. נסו שוב בעוד דקה.');
    } finally {
      setSending(false);
    }
  };

  const Icon = state === 'expired' ? Clock3 : (state === 'confirmed' || state === 'confirmed_signed_out') ? CheckCircle2 : Mail;

  const copy = {
    waiting: { title: 'בדקו את תיבת המייל', body: 'שלחנו לכם קישור לאימות החשבון. לחצו עליו, גם מהטלפון, והמסך הזה ימשיך לבד להגדרת הצימר.' },
    checking: { title: 'מאמתים את החשבון…', body: 'רק רגע.' },
    confirmed: { title: 'המייל אומת ✓', body: 'אפשר לחזור למחשב או להמשיך כאן.' },
    confirmed_signed_out: { title: 'המייל אומת ✓', body: 'אפשר לחזור למחשב או להתחבר כאן.' },
    expired: { title: 'פג תוקף הקישור', body: 'הקישור לאימות כבר לא בתוקף, או שכבר השתמשו בו. שלחו לעצמכם קישור חדש.' },
  }[state];

  const showResend = state === 'waiting' || state === 'expired';

  return (
    <AuthShell>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF0FF] text-brand-600" aria-hidden>
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <h1 className="mt-6 text-[30px] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy-900">{copy.title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-600" role="status">{copy.body}</p>

      {state === 'waiting' && email && (
        <p className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-[#EEF0FF] px-4 py-2 text-[14px] font-semibold text-brand-700">
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate" dir="ltr">{email}</span>
        </p>
      )}

      {(state === 'confirmed' || state === 'confirmed_signed_out') && (
        <div className="mt-7 grid gap-3" data-testid="verified-choices">
          <div className="flex items-start gap-3 rounded-[16px] border border-line bg-[#F7F8FB] p-4">
            <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-navy-900">חוזרים למחשב?</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-ink-600">המסך שהשארתם שם ימשיך לבד תוך כמה שניות. אפשר לסגור את הדף הזה.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-[16px] border border-line bg-white p-4">
            <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-navy-900">או ממשיכים כאן</p>
              {state === 'confirmed' ? (
                <Button
                  size="lg"
                  className="mt-3 h-12 w-full text-[15px] font-semibold"
                  onClick={() => navigate(user?.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true })}
                >
                  {user?.onboarding_completed ? 'מעבר ללוח הבקרה' : 'המשך כאן להגדרת הצימר'}
                </Button>
              ) : (
                <Button asChild size="lg" className="mt-3 h-12 w-full text-[15px] font-semibold">
                  <Link to="/login">התחברות כאן</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {state === 'waiting' && cross.status !== 'off' && (
        <form onSubmit={continueNow} className="mt-7 space-y-3" noValidate data-testid="cross-device">
          {cross.status === 'polling' && (
            <p className="flex items-center gap-2 text-[14px] text-ink-600" role="status" aria-live="polite">
              <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-600" />
              </span>
              ממתינים לאישור. אישרתם בטלפון? המסך הזה ימשיך לבד.
            </p>
          )}
          {cross.status === 'paused' && (
            <p className="text-[14px] text-ink-600" role="status">הפסקנו לבדוק אוטומטית. אחרי שתאשרו במייל, לחצו "אישרתי במייל — המשך".</p>
          )}
          {needsPassword && (
            <div className="space-y-2">
              <p className="text-[14px] text-ink-600">אישרתם במייל, בטלפון או כאן? הקלידו את הסיסמה ונמשיך.</p>
              <Label htmlFor="verify-password" className="text-[14px] font-medium text-navy-900">סיסמה</Label>
              <Input
                id="verify-password"
                type="password"
                autoComplete="current-password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-[14px] border-line bg-white text-base"
              />
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={cross.checking || (needsPassword && !password)}
            aria-busy={cross.checking}
            className="h-12 w-full gap-2 text-[15px] font-semibold"
          >
            {cross.checking ? <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />בודקים…</> : 'אישרתי במייל — המשך'}
          </Button>
          {cross.manualError && <p className="text-[14px] text-danger-600" role="alert">{cross.manualError}</p>}
        </form>
      )}

      {showResend && (
        <form onSubmit={resend} className="mt-8 space-y-3 border-t border-line pt-6" noValidate>
          <p className="text-[14px] text-ink-600">{state === 'expired' ? 'לאיזו כתובת לשלוח קישור חדש?' : 'המייל לא הגיע? בדקו גם בספאם, או שלחו שוב.'}</p>
          {(state === 'expired' || !initialEmail) && (
            <div className="space-y-2">
              <Label htmlFor="verify-email" className="text-[14px] font-medium text-navy-900">אימייל</Label>
              <Input
                id="verify-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-12 rounded-[14px] border-line bg-white text-base"
              />
            </div>
          )}
          <Button
            type="submit"
            variant={state === 'expired' ? 'default' : 'outline'}
            size="lg"
            disabled={sending || countdown > 0 || !email.trim()}
            className="h-12 w-full text-[15px] font-semibold"
          >
            {sending ? 'שולחים…' : countdown > 0 ? `אפשר לשלוח שוב בעוד ${countdown} שניות` : (state === 'expired' ? 'שליחת קישור חדש' : 'שליחה חוזרת')}
          </Button>
          {sentAt > 0 && !sendError && <p className="text-[14px] font-medium text-[var(--st-mint-fg)]" role="status">שלחנו קישור חדש. הוא תקף לשעה.</p>}
          {sendError && <p className="text-[14px] text-danger-600" role="alert">{sendError}</p>}
        </form>
      )}

      {state !== 'confirmed' && state !== 'confirmed_signed_out' && <p className="mt-8 text-center text-[15px] text-ink-600">
        <Link to="/login" className="inline-flex min-h-[44px] items-center font-semibold text-brand-600 hover:underline">חזרה להתחברות</Link>
      </p>}
    </AuthShell>
  );
}
