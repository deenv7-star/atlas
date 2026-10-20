/**
 * "המשך עם Google" / "המשך עם Apple" for /login and /register.
 *
 * Google: Google Identity branding (light theme): white fill, 1px #747775 border, #1F1F1F label, the
 *         official four-colour "G" unmodified on white, localized label. https://developers.google.com/identity/branding-guidelines
 * Apple:  Human Interface Guidelines, "Sign in with Apple" black style: black fill, white Apple logo + label,
 *         same size and prominence as the other provider. https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
 * Both are 52px tall (matches the form fields), full width, the logo at the inline start (right, RTL).
 *
 * Renders nothing when no provider is enabled (local demo build, or both flags off).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { socialProviders, startSocialSignIn, cachedEnabled, fetchEnabled } from '@/lib/auth/socialAuth';
import { oauthErrorMessage, OAUTH_CALLBACK_PATH } from '@/lib/auth/oauthFlow';

export function GoogleG({ className }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={className}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

export function AppleLogo({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

const LABEL = { google: 'המשיכו עם Google', apple: 'המשיכו עם Apple' };
const GOING = { google: 'מעבירים ל-Google…', apple: 'מתחברים עם Apple…' };

/** The "או" separator between the providers and the email form. */
export function OrDivider({ className }) {
  return (
    <div className={cn('flex items-center gap-3', className)} role="separator" aria-label="או">
      <span className="h-px flex-1 bg-[#E7E9F1]" aria-hidden />
      <span className="text-[13px] font-medium text-ink-400" aria-hidden>או</span>
      <span className="h-px flex-1 bg-[#E7E9F1]" aria-hidden />
    </div>
  );
}

/**
 * @param intent    'login' | 'register'
 * @param returnTo  safe path to come back to (from ?return=)
 * @param getConsent  () => { at, version } | null  (register: the terms box state at click time)
 * @param getBusiness () => string                   (register: the business name typed so far)
 */
export default function SocialButtons({ intent = 'login', returnTo = null, getConsent, getBusiness, divider = null, className }) {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(() => cachedEnabled());
  const providers = socialProviders().filter((p) => !enabled || enabled[p] !== false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchEnabled().then((v) => { if (alive && v) setEnabled(v); });
    return () => { alive = false; };
  }, []);

  // Back from the provider with the browser's back button (bfcache): the page must be usable again.
  useEffect(() => {
    const reset = (e) => { if (e.persisted) setBusy(null); };
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  if (!providers.length) return null;

  const go = async (provider) => {
    if (busy) return;
    setError('');
    setBusy(provider);
    try {
      const res = await startSocialSignIn(provider, {
        intent,
        returnTo,
        consent: getConsent?.() || null,
        business: getBusiness?.() || '',
      });
      // Apple popup finished with a session: same finish step as the redirect flow.
      if (!res?.redirected) navigate(OAUTH_CALLBACK_PATH, { replace: true });
    } catch (err) {
      setBusy(null);
      setError(oauthErrorMessage(err, provider));
    }
  };

  return (
    <div className={className} data-testid="social-auth">
      {divider === 'before' ? <OrDivider className="mb-6" /> : null}
      <div className="flex flex-col gap-3">
      {providers.map((p) => {
        const isBusy = busy === p;
        return (
          <button
            key={p}
            type="button"
            data-provider={p}
            onClick={() => go(p)}
            // Keep focus where it is: blurring a form field first could re-layout the page mid-tap.
            onMouseDown={(e) => e.preventDefault()}
            disabled={Boolean(busy)}
            aria-busy={isBusy || undefined}
            className={cn(
              'relative flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] px-4 text-[16px] font-medium',
              'transition-[background-color,border-color,transform,opacity] duration-150 [transition-timing-function:cubic-bezier(.2,.8,.2,1)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(62,43,241,0.35)] focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed',
              busy && !isBusy && 'opacity-50',
              p === 'google'
                ? 'border border-[#747775] bg-white text-[#1F1F1F] hover:bg-[#F8F9FA] active:bg-[#F1F3F4]'
                : 'border border-black bg-black text-white hover:bg-[#1C1C1E] active:bg-[#2C2C2E]',
            )}
          >
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
              {isBusy
                ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />
                : p === 'google' ? <GoogleG className="h-5 w-5" /> : <AppleLogo className="h-5 w-5 -translate-y-px" />}
            </span>
            <span>{isBusy ? GOING[p] : <><span>המשיכו עם </span><span dir="ltr">{p === 'google' ? 'Google' : 'Apple'}</span></>}</span>
          </button>
        );
      })}
      {error ? <p role="alert" className="text-center text-[14px] font-medium text-danger-600">{error}</p> : null}
      </div>
      {divider === 'after' ? <OrDivider className="mt-6" /> : null}
    </div>
  );
}

export { LABEL as SOCIAL_LABEL };
