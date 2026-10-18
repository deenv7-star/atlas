import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle2, Clock3 } from 'lucide-react';
import AuthShell from '@/components/app/AuthShell';
import { supabase, initialAuthUrlError } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mapAuthErrorToHebrew } from '@/lib/authErrors';

const EMAIL_KEY = 'atlas_pending_verify_email';
const redirectUrl = () => `${window.location.origin}/verify-email?confirmed=1`;

/**
 * Three honest states:
 *  waiting   — right after signup: "check your inbox" + resend
 *  confirmed — the confirmation link was opened (?confirmed=1 + session) → continue to onboarding
 *  expired   — Supabase sent back an error (otp_expired / access_denied) → send a new link
 */
export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { isAuthenticated, isLoadingAuth, user } = useAuth();

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
    waiting: { title: 'בדקו את תיבת המייל', body: 'שלחנו לכם קישור לאימות החשבון. לחצו עליו, ונמשיך מכאן להגדרת הצימר.' },
    checking: { title: 'מאמתים את החשבון…', body: 'רק רגע.' },
    confirmed: { title: 'האימייל אומת', body: 'החשבון שלכם פעיל. נשאר רק להגדיר את הצימר, וזה לוקח כמה דקות.' },
    confirmed_signed_out: { title: 'האימייל אומת', body: 'החשבון פעיל. התחברו כדי להמשיך להגדרת הצימר.' },
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

      {state === 'confirmed' && (
        <Button
          size="lg"
          className="mt-8 h-12 w-full text-[15px] font-semibold"
          onClick={() => navigate(user?.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true })}
        >
          {user?.onboarding_completed ? 'מעבר ללוח הבקרה' : 'המשך להגדרת הצימר'}
        </Button>
      )}

      {state === 'confirmed_signed_out' && (
        <Button asChild size="lg" className="mt-8 h-12 w-full text-[15px] font-semibold">
          <Link to="/login">התחברות</Link>
        </Button>
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

      <p className="mt-8 text-center text-[15px] text-ink-600">
        <Link to="/login" className="inline-flex min-h-[44px] items-center font-semibold text-brand-600 hover:underline">חזרה להתחברות</Link>
      </p>
    </AuthShell>
  );
}
