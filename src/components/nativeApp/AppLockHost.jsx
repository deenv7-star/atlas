/**
 * iOS app only (lazy-loaded from App.jsx): the Face ID lock screen.
 *
 *   cold start, lock on, signed in as the account that turned it on   → locked, Face ID asked at once
 *   app goes to the background                                       → a blurred cover (the app switcher
 *                                                                      snapshot shows no guest data)
 *   back within 5 minutes                                            → cover removed, no prompt
 *   back after more than 5 minutes                                   → locked, Face ID asked
 *   Face ID failed / cancelled                                       → "נסו שוב" and "התנתקות"
 *
 * Gates the UI only; the Supabase session is untouched (see src/lib/nativeApp/appLockCore.js).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ScanFace, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AtlasFace } from '@/components/mascot/AtlasFace.jsx';
import { lockAppliesTo, lockOnResume, lockErrorKind, lockErrorMessage } from '@/lib/nativeApp/appLockCore';
import { lockPrefs, verifyOwner, onAppLifecycle } from '@/lib/nativeApp/appLock';
import { biometricAvailability } from '@/lib/auth/biometric';
import { hapticTick } from '@/lib/haptics';
import './appLock.css';

const PROMPT_DELAY_MS = 280; // let the lock screen paint before the iOS sheet slides over it
const FADE_MS = 260;

function setAppInert(on) {
  const el = document.getElementById('root');
  if (!el) return;
  if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
  document.documentElement.toggleAttribute('data-atlas-locked', on);
  try { window.dispatchEvent(new CustomEvent('atlas:lock', { detail: { locked: on } })); } catch { /* old WebView */ }
}

export default function AppLockHost({ initialLocked = false }) {
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();
  // mode: 'off' | 'privacy' (cover only, no prompt) | 'locked'
  const [mode, setMode] = useState(initialLocked ? 'locked' : 'off');
  const [phase, setPhase] = useState('idle'); // idle | asking | failed | leaving
  const [kind, setKind] = useState('');
  const [label, setLabel] = useState('Face ID');
  const backgroundedAt = useRef(0);
  const askingRef = useRef(false);
  const userIdRef = useRef('');
  userIdRef.current = user?.id || '';
  const authRef = useRef(false);
  authRef.current = Boolean(isAuthenticated);

  useEffect(() => { biometricAvailability().then((a) => setLabel(a?.label || 'Face ID')).catch(() => {}); }, []);
  useEffect(() => { setAppInert(mode !== 'off'); }, [mode]);
  useEffect(() => () => setAppInert(false), []);

  const unlock = useCallback((animated) => {
    if (!animated) { setMode('off'); setPhase('idle'); setKind(''); return; }
    setPhase('leaving');
    setTimeout(() => { setMode('off'); setPhase('idle'); setKind(''); }, FADE_MS);
  }, []);

  const ask = useCallback(async () => {
    if (askingRef.current) return;
    askingRef.current = true;
    setPhase('asking');
    setKind('');
    try {
      await verifyOwner({ reason: 'פתיחת atlas' });
      hapticTick();
      unlock(true);
    } catch (err) {
      setKind(lockErrorKind(err));
      setPhase('failed');
    } finally {
      askingRef.current = false;
    }
  }, [unlock]);

  // Cold start: once auth is known, keep the lock only for the signed-in account that turned it on.
  useEffect(() => {
    if (mode !== 'locked' || phase !== 'idle' || isLoadingAuth) return undefined;
    if (!isAuthenticated || !lockAppliesTo(lockPrefs(), user?.id)) { unlock(false); return undefined; }
    const t = setTimeout(ask, PROMPT_DELAY_MS);
    return () => clearTimeout(t);
  }, [mode, phase, isLoadingAuth, isAuthenticated, user?.id, ask, unlock]);

  // Background / foreground.
  useEffect(() => {
    let remove = () => {};
    let alive = true;
    onAppLifecycle({
      pause: () => {
        if (askingRef.current) return;
        if (!authRef.current || !lockAppliesTo(lockPrefs(), userIdRef.current)) return;
        backgroundedAt.current = Date.now();
        setMode((m) => (m === 'locked' ? m : 'privacy'));
      },
      resume: () => {
        const was = backgroundedAt.current;
        backgroundedAt.current = 0;
        if (lockOnResume({ prefs: lockPrefs(), userId: userIdRef.current, backgroundedAt: was, now: Date.now() }) && authRef.current) {
          setPhase('idle');
          setMode('locked');
          return;
        }
        setMode((m) => (m === 'privacy' ? 'off' : m));
      },
    }).then((r) => { if (alive) remove = r; else r(); }).catch(() => {});
    return () => { alive = false; remove(); };
  }, []);

  // Move focus into the lock screen when it asks for an action.
  const primaryRef = useRef(null);
  useEffect(() => { if (phase === 'failed') primaryRef.current?.focus({ preventScroll: true }); }, [phase]);

  if (mode === 'off') return null;

  const leaving = phase === 'leaving';
  const asking = phase === 'asking';
  const failed = phase === 'failed';
  const msg = failed ? lockErrorMessage(kind, label) : '';
  const canRetry = kind !== 'unavailable';

  const cover = (
    <div
      dir="rtl"
      data-testid={mode === 'privacy' ? 'app-privacy-cover' : 'app-lock'}
      role={mode === 'locked' ? 'dialog' : undefined}
      aria-modal={mode === 'locked' ? 'true' : undefined}
      aria-labelledby={mode === 'locked' ? 'atlas-lock-title' : undefined}
      aria-hidden={mode === 'privacy' ? 'true' : undefined}
      className={`atlas-lock fixed inset-0 z-[2147483000] flex flex-col items-center text-white${mode === 'privacy' ? ' is-privacy' : ''}${leaving ? ' is-leaving' : ''}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="atlas-lock__glass" aria-hidden />
      {mode === 'locked' ? (
        <>
          <div className="relative flex w-full max-w-[360px] flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="atlas-lock__halo">
              <AtlasFace live mood={failed && kind !== 'cancel' ? 'concerned' : leaving ? 'happy' : 'neutral'} size={96} decorative />
            </div>
            <h1 id="atlas-lock-title" className="mt-7 text-[26px] text-white font-extrabold leading-tight tracking-[-0.01em]">
              ברוכים השבים
            </h1>
            <p className="mt-2 min-h-[48px] text-[16px] leading-relaxed text-white/75" aria-live="polite">
              {msg || (asking ? <>מזהים אתכם עם <span dir="ltr">{label}</span>…</> : <>פותחים את atlas עם <span dir="ltr">{label}</span></>)}
            </p>
          </div>
          <div className="relative flex w-full max-w-[360px] flex-col gap-2 px-6 pb-[max(28px,env(safe-area-inset-bottom))]">
            {canRetry ? (
              <button
                ref={primaryRef}
                type="button"
                onClick={ask}
                disabled={asking || leaving}
                aria-busy={asking || undefined}
                data-testid="lock-retry"
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-white text-[16px] font-bold text-[#1B2656] transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B2656] disabled:opacity-70"
              >
                {asking ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ScanFace className="h-5 w-5" aria-hidden />}
                <span>{failed ? 'נסו שוב' : <>פתיחה עם <span dir="ltr">{label}</span></>}</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => logout(true, '/login')}
              disabled={leaving}
              data-testid="lock-signout"
              className="flex h-[52px] w-full items-center justify-center rounded-[14px] text-[16px] font-medium text-white/85 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/50 disabled:opacity-50"
            >
              התנתקות
            </button>
          </div>
        </>
      ) : null}
    </div>
  );

  return createPortal(cover, document.body);
}
