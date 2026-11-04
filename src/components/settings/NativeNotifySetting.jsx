/**
 * iOS app only (lazy-loaded from Settings → התראות): the 09:00 check-in reminder on / off.
 * Off while iOS has notifications off for atlas; then it says where to turn them on.
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { permissionState, requestPermission, notifyPrefs, setNotifyPrefs, cancelAllReminders } from '@/lib/nativeApp/notify';

export default function NativeNotifySetting() {
  const [perm, setPerm] = useState('');
  const [off, setOff] = useState(() => notifyPrefs().remindersOff);
  const [busy, setBusy] = useState(false);

  useEffect(() => { permissionState().then(setPerm); }, []);
  if (!perm || perm === 'unavailable') return null;

  const denied = perm === 'denied';
  const on = perm === 'granted' && !off;

  const toggle = async (next) => {
    if (busy) return;
    setBusy(true);
    try {
      if (next) {
        let p = perm;
        if (p !== 'granted') {
          p = await requestPermission();
          setNotifyPrefs({ outcome: p });
          setPerm(p);
        }
        if (p === 'granted') { setNotifyPrefs({ remindersOff: false }); setOff(false); }
      } else {
        setNotifyPrefs({ remindersOff: true });
        setOff(true);
        await cancelAllReminders();
      }
    } finally {
      setBusy(false);
      try { window.dispatchEvent(new CustomEvent('atlas:notify-changed')); } catch { /* old WebView */ }
    }
  };

  return (
    <Card className="mb-4" data-testid="notify-setting">
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0">
          <p id="notify-setting-label" className="text-[15px] font-semibold text-navy-900">תזכורת בבוקר של הגעה</p>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-600">
            {denied ? 'ההתראות כבויות באייפון. מפעילים בהגדרות של האייפון, תחת atlas.' : 'ב-9:00, ביום שאורחים מגיעים'}
          </p>
        </div>
        <Switch
          checked={on}
          disabled={busy || denied}
          onCheckedChange={toggle}
          aria-labelledby="notify-setting-label"
          className="data-[state=checked]:bg-brand-600"
        />
      </CardContent>
    </Card>
  );
}
