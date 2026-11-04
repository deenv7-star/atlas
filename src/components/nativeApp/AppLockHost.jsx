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
import { useAuth } from '@/lib/AuthContext';
import BrandWordmark from '@/components/common/BrandWordmark.jsx';
import FaceIdGlyph from './FaceIdGlyph.jsx';
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
  useEffect(() => { if (phase === 'failed') primaryRef.current?.focus({ preventScroll: true, focusVisible: false }); }, [phase]);

  if (mode === 'off') return null;

  const leaving = phase === 'leaving';
  const asking = phase === 'asking';
  const failed = phase === 'failed';
  // The glyph button already says "נסו שוב"; don't repeat it in the line under it.
  const msg = failed ? lockErrorMessage(kind, label).replace(/\s*נסו שוב\.?$/, '') : '';
  const canRetry = kind !== 'unavailable';
  const glyph = leaving ? 'success' : asking ? 'scanning' : failed ? 'failed' : 'idle';
  const locked = mode === 'locked';

  // Direction A, "native Apple": a thick system material over the app, the atlas wordmark small at the top,
  // the Face ID symbol in thin lines, one text link. Nothing else.
  const cover = (
    <div
      dir="rtl"
      data-testid={mode === 'privacy' ? 'app-privacy-cover' : 'app-lock'}
      role={locked ? 'dialog' : undefined}
      aria-modal={locked ? 'true' : undefined}
      aria-labelledby={locked ? 'atlas-lock-title' : undefined}
      aria-hidden={mode === 'privacy' ? 'true' : undefined}
      className={`atlas-lock fixed inset-0 z-[2147483000] flex flex-col items-center${mode === 'privacy' ? ' is-privacy' : ''}${leaving ? ' is-leaving' : ''}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="atlas-lock__material" aria-hidden />
      <div className="relative flex w-full justify-center pt-[max(18px,env(safe-area-inset-top))]">
        <div className="atlas-lock__mark mt-3" aria-hidden><BrandWordmark size={13} /></div>
      </div>
      {locked ? (
        <>
          <h1 id="atlas-lock-title" className="sr-only">פתיחת atlas</h1>
          <div className="relative flex w-full max-w-[360px] flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
            {canRetry ? (
              <button
                ref={primaryRef}
                type="button"
                onClick={ask}
                disabled={asking || leaving}
                aria-busy={asking || undefined}
                aria-label={failed ? `נסו שוב עם ${label}` : `פתיחה עם ${label}`}
                data-testid="lock-retry"
                className="atlas-lock__face group flex min-w-[140px] flex-col items-center gap-4 rounded-[24px] px-6 py-5 outline-none"
              >
                <FaceIdGlyph size={64} state={glyph} className={failed ? 'text-[#1B2656]/80' : 'text-[#1B2656]'} />
                <span className={`text-[16px] leading-none ${failed ? 'font-semibold text-[#3E2BF1]' : 'font-medium text-[#1B2656]/55'}`} dir={failed ? 'rtl' : 'ltr'}>
                  {failed ? 'נסו שוב' : label}
                </span>
              </button>
            ) : (
              <FaceIdGlyph size={64} state="idle" className="text-[#1B2656]/35" />
            )}
            <p className="mt-1 min-h-[44px] max-w-[270px] text-[14px] leading-relaxed text-[#1B2656]/60" aria-live="polite">
              {msg || (asking ? <span className="sr-only">מזהים אתכם עם {label}</span> : null)}
            </p>
          </div>
          <div className="relative flex w-full justify-center pb-[max(20px,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => logout(true, '/login')}
              disabled={leaving}
              data-testid="lock-signout"
              className="atlas-lock__link h-11 rounded-full px-5 text-[15px] font-medium text-[#3E2BF1] disabled:opacity-50"
            >
              התחברות מחדש
            </button>
          </div>
        </>
      ) : <div className="flex-1" />}
    </div>
  );

  return createPortal(cover, document.body);
}
