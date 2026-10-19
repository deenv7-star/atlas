/**
 * Cross-device email verification for the "check your email" screen.
 *
 * Supabase's confirmation link creates a session only on the device that opens it (often the phone).
 * The original device (desktop) has no way to be told, so it asks: with the password the owner just
 * typed (memory only, see pendingCredentials.js) it tries signInWithPassword on a gentle schedule
 * (verifyPoll.js) and on tab focus / visibility. "Email not confirmed" = keep waiting; a session =
 * confirmed → onConfirmed(). After a reload there is no password in memory: no polling, and the
 * screen offers "אישרתי במייל — המשך" with a password field (checkWithPassword).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { getPendingCredentials, clearPendingCredentials, setPendingCredentials } from '@/lib/auth/pendingCredentials';
import { nextPollDelay, canCheckNow, classifySignIn } from '@/lib/auth/verifyPoll';

/**
 * status: 'polling'      — waiting, checking automatically
 *         'paused'       — stopped after 15 minutes (button still works)
 *         'needs_password' — no password in memory (page reloaded) or it no longer matches
 *         'confirmed'    — signed in
 *         'off'          — not active (no Supabase / no email / disabled)
 */
export function useCrossDeviceVerify({ email, enabled, onConfirmed }) {
  const [status, setStatus] = useState('off');
  const [checking, setChecking] = useState(false);
  const [manualError, setManualError] = useState('');
  const stateRef = useRef({ startedAt: Date.now(), attempts: [], failures: 0 });
  const timerRef = useRef(null);
  const busyRef = useRef(false);
  const doneRef = useRef(false);
  const onConfirmedRef = useRef(onConfirmed);
  onConfirmedRef.current = onConfirmed;

  const addr = String(email || '').trim();
  const active = Boolean(enabled && supabase && addr);

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  /** One signInWithPassword attempt. Returns the classification. */
  const attempt = useCallback(async (creds) => {
    if (busyRef.current || doneRef.current) return 'busy';
    busyRef.current = true;
    stateRef.current.attempts.push(Date.now());
    let kind = 'error';
    try {
      const res = await supabase.auth.signInWithPassword({ email: creds.email, password: creds.password });
      kind = classifySignIn(res);
      if (kind === 'confirmed') {
        doneRef.current = true;
        clearTimer();
        clearPendingCredentials();
        setStatus('confirmed');
        await onConfirmedRef.current?.(res.data.session);
      }
    } catch (err) {
      kind = classifySignIn({ error: err });
    } finally {
      busyRef.current = false;
    }
    const s = stateRef.current;
    if (kind === 'rate_limited' || kind === 'error') s.failures += 1;
    else if (kind === 'waiting') s.failures = 0;
    return kind;
  }, []);

  const schedule = useCallback(() => {
    clearTimer();
    if (doneRef.current) return;
    const delay = nextPollDelay(stateRef.current, Date.now());
    if (delay == null) { setStatus('paused'); return; }
    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      const creds = getPendingCredentials(addr);
      if (!creds) { setStatus('needs_password'); return; }
      const kind = await attempt(creds);
      if (kind === 'bad_credentials') { clearPendingCredentials(); setStatus('needs_password'); return; }
      if (kind !== 'confirmed') schedule();
    }, delay);
  }, [addr, attempt]);

  // Start / stop polling.
  useEffect(() => {
    if (!active) { setStatus('off'); return undefined; }
    doneRef.current = false;
    stateRef.current = { startedAt: Date.now(), attempts: [], failures: 0 };
    if (!getPendingCredentials(addr)) { setStatus('needs_password'); return undefined; }
    setStatus('polling');
    schedule();
    return () => clearTimer();
  }, [active, addr, schedule]);

  // Back to this tab / window (the owner just confirmed on the phone): check at once, within the cap.
  useEffect(() => {
    if (!active) return undefined;
    const onBack = async () => {
      if (document.visibilityState === 'hidden' || doneRef.current) return;
      const creds = getPendingCredentials(addr);
      if (!creds || !canCheckNow(stateRef.current, Date.now())) return;
      clearTimer();
      const kind = await attempt(creds);
      if (kind === 'bad_credentials') { clearPendingCredentials(); setStatus('needs_password'); return; }
      if (kind === 'confirmed') return;
      // A focus check after the 15-minute stop does not restart the loop.
      if (nextPollDelay(stateRef.current, Date.now()) == null) setStatus('paused');
      else schedule();
    };
    window.addEventListener('focus', onBack);
    document.addEventListener('visibilitychange', onBack);
    return () => {
      window.removeEventListener('focus', onBack);
      document.removeEventListener('visibilitychange', onBack);
    };
  }, [active, addr, attempt, schedule]);

  /**
   * The "אישרתי במייל — המשך" button. Uses the password in memory, or the one typed after a reload.
   * Returns the classification so the screen can show the right message.
   */
  const checkWithPassword = useCallback(async (typedPassword) => {
    if (!supabase || !addr) return 'error';
    const creds = typedPassword ? { email: addr, password: typedPassword } : getPendingCredentials(addr);
    if (!creds) { setStatus('needs_password'); return 'needs_password'; }
    setChecking(true);
    setManualError('');
    clearTimer();
    let kind;
    // A manual click may wait for an in-flight automatic check.
    for (let i = 0; i < 20 && busyRef.current; i += 1) await new Promise((r) => setTimeout(r, 150));
    kind = await attempt(creds);
    setChecking(false);
    if (kind === 'confirmed') return kind;
    if (kind === 'waiting') {
      if (typedPassword) { setPendingCredentials(addr, typedPassword); }
      setManualError('עדיין לא ראינו את האישור. לחצו על הקישור במייל, ומיד נמשיך.');
      stateRef.current.startedAt = Math.max(stateRef.current.startedAt, Date.now() - 60000); // resume a calm schedule
      setStatus('polling');
      schedule();
    } else if (kind === 'bad_credentials') {
      clearPendingCredentials();
      setStatus('needs_password');
      setManualError('הסיסמה לא תואמת לכתובת הזו. נסו שוב.');
    } else if (kind === 'rate_limited') {
      setManualError('יותר מדי ניסיונות. חכו דקה ונסו שוב.');
      if (getPendingCredentials(addr)) schedule();
    } else {
      setManualError('לא הצלחנו לבדוק כרגע. בדקו את החיבור ונסו שוב.');
      if (getPendingCredentials(addr)) schedule();
    }
    return kind;
  }, [addr, attempt, schedule]);

  return { status, checking, manualError, checkWithPassword, hasPassword: Boolean(getPendingCredentials(addr)) };
}
