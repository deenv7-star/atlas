/**
 * iOS app only (lazy-loaded from Settings → אבטחה): "פתיחה עם Face ID" on / off.
 * On = the app lock (src/lib/nativeApp/appLock.js) plus the login-screen Face ID sign-in, one switch.
 * Renders nothing on the web or on a device without Face ID / Touch ID.
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import FaceIdGlyph from '@/components/nativeApp/FaceIdGlyph.jsx';
import { Switch } from '@/components/ui/switch';
import { biometricAvailability } from '@/lib/auth/biometric';
import { lockErrorKind } from '@/lib/nativeApp/appLockCore';
import { lockPrefs, enableLock, disableLock, markLockOffered } from '@/lib/nativeApp/appLock';

export default function BiometricSetting() {
  const { user } = useAuth();
  const [avail, setAvail] = useState(null);
  const [on, setOn] = useState(() => lockPrefs().enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    biometricAvailability().then((a) => { if (alive) setAvail(a); });
    return () => { alive = false; };
  }, []);

  if (!avail?.available) return null;
  const label = avail.label;

  const toggle = async (next) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (next) {
        let session = null;
        try { session = supabase ? (await supabase.auth.getSession())?.data?.session : null; } catch { /* demo */ }
        await enableLock({ userId: user?.id, session });
      } else {
        await disableLock();
        markLockOffered();
      }
      setOn(next);
    } catch (err) {
      if (lockErrorKind(err) !== 'cancel') setError(`לא הצלחנו להפעיל את ${label}. בדקו שמוגדר קוד גישה באייפון.`);
    } finally {
      setBusy(false);
    }
  };

  // Direction A: an iOS inset-grouped row. The symbol sits bare (no tile), hairline edge, no shadow.
  return (
    <div className="mb-4 rounded-[16px] bg-white ring-1 ring-[#1B2656]/[0.07]" data-testid="faceid-setting">
      <div className="flex min-h-[64px] items-center gap-3.5 px-4 py-3">
        <FaceIdGlyph size={26} weight={1.75} className="shrink-0 text-[#1B2656]" />
        <div className="min-w-0 flex-1">
          <p id="faceid-setting-label" className="text-[16px] font-medium leading-tight text-[#1B2656]">פתיחה עם <span dir="ltr">{label}</span></p>
          <p className="mt-1 text-[13px] leading-snug text-[#1B2656]/70">בכל פתיחה, ואחרי 5 דקות ברקע</p>
          {error ? <p role="alert" className="mt-1 text-[13px] text-danger-600">{error}</p> : null}
        </div>
        <Switch
          checked={on}
          disabled={busy}
          onCheckedChange={toggle}
          aria-labelledby="faceid-setting-label"
          className="data-[state=checked]:before:bg-brand-600"
        />
      </div>
    </div>
  );
}
