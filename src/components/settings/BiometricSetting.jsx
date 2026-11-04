/**
 * iOS app only (lazy-loaded from Settings → אבטחה): "פתיחה עם Face ID" on / off.
 * On = the app lock (src/lib/nativeApp/appLock.js) plus the login-screen Face ID sign-in, one switch.
 * Renders nothing on the web or on a device without Face ID / Touch ID.
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
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

  return (
    <Card className="mb-4" data-testid="faceid-setting">
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0">
          <p id="faceid-setting-label" className="text-[15px] font-semibold text-navy-900">פתיחה עם <span dir="ltr">{label}</span></p>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-600">בכל פתיחה, ואחרי 5 דקות ברקע</p>
          {error ? <p role="alert" className="mt-1 text-[13px] text-danger-600">{error}</p> : null}
        </div>
        <Switch
          checked={on}
          disabled={busy}
          onCheckedChange={toggle}
          aria-labelledby="faceid-setting-label"
          className="data-[state=checked]:before:bg-brand-600"
        />
      </CardContent>
    </Card>
  );
}
