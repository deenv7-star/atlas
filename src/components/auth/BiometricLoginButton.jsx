/**
 * iOS app only (lazy-loaded from Login.jsx): "כניסה עם Face ID" when Face ID was turned on and the saved
 * sign-in is in the Keychain. Renders nothing otherwise, so the login screen looks exactly as before.
 */
import React, { useEffect, useState } from 'react';
import { ScanFace, Loader2 } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { isNativeApp } from '@/lib/native';
import { OrDivider } from '@/components/auth/SocialButtons';
import {
  shouldShowBiometricLogin, biometricErrorKind, biometricErrorMessage,
} from '@/lib/auth/nativeAuthCore';
import {
  biometricAvailability, biometricPrefs, biometricSaved, signInWithBiometric, clearBiometric,
} from '@/lib/auth/biometric';

/** @param onSignedIn  async () => void  same post-login step as the password form (hydrate + navigate). */
export default function BiometricLoginButton({ onSignedIn, className }) {
  const [state, setState] = useState({ show: false, label: 'Face ID' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const [avail, saved] = await Promise.all([biometricAvailability(), biometricSaved()]);
      if (!alive) return;
      const show = shouldShowBiometricLogin({ native: isNativeApp(), available: avail.available, prefs: biometricPrefs(), saved });
      setState({ show, label: avail.label });
    })();
    return () => { alive = false; };
  }, []);

  if (!state.show) return null;

  const go = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await signInWithBiometric(supabase, { reason: 'כניסה ל-atlas' });
      await onSignedIn?.();
    } catch (err) {
      const kind = biometricErrorKind(err);
      if (kind === 'invalid') {
        await clearBiometric();
        setState((s) => ({ ...s, show: false }));
      }
      setError(biometricErrorMessage(kind, state.label));
      setBusy(false);
    }
  };

  return (
    <div className={className} data-testid="biometric-login">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        aria-busy={busy || undefined}
        className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[16px] bg-[#3E2BF1] px-4 text-[16px] font-bold text-white transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(62,43,241,0.35)] focus-visible:ring-offset-2 disabled:opacity-70"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ScanFace className="h-5 w-5" aria-hidden />}
        <span>{busy ? 'מתחברים…' : <>כניסה עם <span dir="ltr">{state.label}</span></>}</span>
      </button>
      {error ? <p role="alert" className="mt-3 text-center text-[14px] font-medium text-danger-600">{error}</p> : null}
      <OrDivider className="mt-6" />
    </div>
  );
}
