/**
 * iOS app only (lazy-loaded from Settings → אבטחה): turn Face ID sign-in on / off.
 * Renders nothing on the web or on a device without Face ID / Touch ID.
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  biometricAvailability, biometricPrefs, biometricSaved, enableBiometric, clearBiometric, markBiometricOffered,
} from '@/lib/auth/biometric';

export default function BiometricSetting() {
  const [avail, setAvail] = useState(null);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([biometricAvailability(), biometricSaved()]).then(([a, saved]) => {
      if (!alive) return;
      setAvail(a);
      setOn(Boolean(biometricPrefs().enabled && saved));
    });
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
        const { data: { session } = {} } = await supabase.auth.getSession();
        await enableBiometric(session);
      } else {
        await clearBiometric();
        markBiometricOffered();
      }
      setOn(next);
    } catch {
      setError(`לא הצלחנו להפעיל את ${label}. בדקו שמוגדר קוד גישה במכשיר.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="text-sm font-medium text-navy-900">כניסה עם <span dir="ltr">{label}</span></p>
          <p className="text-xs text-ink-400">במקום מייל וסיסמה בכניסה לאפליקציה</p>
          {error ? <p role="alert" className="mt-1 text-xs text-danger-600">{error}</p> : null}
        </div>
        <Switch
          checked={on}
          disabled={busy}
          onCheckedChange={toggle}
          aria-label={`כניסה עם ${label}`}
          className="data-[state=checked]:bg-brand-600"
        />
      </CardContent>
    </Card>
  );
}
