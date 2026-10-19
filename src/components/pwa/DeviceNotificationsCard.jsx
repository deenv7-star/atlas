/**
 * Settings → התראות: this device. Install atlas on the home screen, turn push on / off, choose what it notifies
 * about, and send a test notification. Both offer versions (A card, B sheet) point here after being closed.
 */
import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, Smartphone, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useInstall } from '@/lib/pwa/install';
import { disablePush, readPrefs, setPushPrefs } from '@/lib/pwa/push';
import { AppIcon, IOSInstallGuide, usePushFlow } from './parts';

const pill = 'press inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-5 text-[15px] font-bold transition-colors duration-150';
const KINDS = [
  { key: 'bookings', label: 'הזמנה חדשה', desc: 'מדף ההזמנות, מצוות המתחם או מה-API' },
  { key: 'ical', label: 'הזמנה מהערוצים', desc: 'Booking.com, Airbnb ויומנים מחוברים' },
  { key: 'leads', label: 'ליד חדש', desc: 'פנייה חדשה מאורח' },
];

export default function DeviceNotificationsCard() {
  const install = useInstall('settings');
  const push = usePushFlow();
  const [prefs, setPrefs] = useState(readPrefs);
  const [guide, setGuide] = useState(false);
  const [busyOff, setBusyOff] = useState(false);
  const [tested, setTested] = useState(false);
  useEffect(() => { if (!tested) return undefined; const t = setTimeout(() => setTested(false), 2500); return () => clearTimeout(t); }, [tested]);

  if (install.state === 'native') return null;
  const installed = install.state === 'installed';
  const on = push.phase === 'on';

  const turnOff = async () => { setBusyOff(true); await disablePush(); await push.refresh(); setBusyOff(false); };

  return (
    <section aria-labelledby="pwa-device-title" className="rounded-[20px] bg-white p-5 ring-1 ring-[#E7E9F1] md:p-6" data-pwa-settings>
      <div className="flex items-start gap-3">
        <AppIcon size={44} />
        <div className="min-w-0">
          <h2 id="pwa-device-title" className="text-[18px] font-bold text-navy-900">התראות במכשיר הזה</h2>
          <p className="text-[15px] text-ink-600">התראה על כל הזמנה חדשה, גם כשהאפליקציה סגורה.</p>
        </div>
      </div>

      {/* 1. install */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7E9F1] pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', installed ? 'bg-brand-600 text-white' : 'bg-[#F1EFFE] text-brand-700')} aria-hidden>
            {installed ? <Check className="h-5 w-5" strokeWidth={2.75} /> : <Smartphone className="h-5 w-5" strokeWidth={2} />}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-navy-900">{installed ? 'atlas מותקן במכשיר הזה' : 'atlas על מסך הבית'}</p>
            <p className="text-[14px] text-ink-400">{installed ? 'פותחים מהאייקון, כמו כל אפליקציה'
              : install.state === 'ios-guide' ? 'באייפון זה נדרש כדי לקבל התראות'
                : install.state === 'prompt' ? 'נפתח בלחיצה, בלי לחפש בדפדפן'
                  : install.platform === 'android' ? 'בתפריט הדפדפן: ״הוספה למסך הבית״ או ״התקנת אפליקציה״'
                    : 'בכרום או באדג׳: סמל ההתקנה בקצה שורת הכתובת'}</p>
          </div>
        </div>
        {install.state === 'prompt' ? <button type="button" className={cn(pill, 'bg-brand-600 text-white hover:bg-brand-500')} onClick={() => install.install()}>התקנה</button> : null}
        {install.state === 'ios-guide' ? <button type="button" className={cn(pill, 'bg-brand-600 text-white hover:bg-brand-500')} onClick={() => setGuide(true)}>איך מתקינים</button> : null}
      </div>

      {/* 2. push on / off */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7E9F1] pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', on ? 'bg-brand-600 text-white' : 'bg-[#F1EFFE] text-brand-700')} aria-hidden>
            {on ? <Bell className="h-5 w-5" strokeWidth={2} /> : <BellOff className="h-5 w-5" strokeWidth={2} />}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-navy-900">{on ? 'ההתראות פועלות' : 'ההתראות כבויות'}</p>
            <p className="text-[14px] text-ink-400" role={push.note ? 'status' : undefined}>
              {push.note || (push.phase === 'needs-install' ? 'באייפון מפעילים מתוך atlas שעל מסך הבית (iOS 16.4 ומעלה)'
                : push.phase === 'blocked' ? 'חסומות בדפדפן. אפשר לאפשר בהגדרות האתר.'
                  : push.phase === 'unavailable' ? (push.raw === 'not-configured' ? 'יהיה זמין בקרוב' : 'הדפדפן הזה לא תומך בהתראות')
                    : on ? 'במכשיר הזה' : 'אפשר להפעיל בלחיצה')}
            </p>
          </div>
        </div>
        {push.phase === 'off' || push.phase === 'busy' ? (
          <button type="button" className={cn(pill, 'bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-70')} disabled={push.phase === 'busy'} aria-busy={push.phase === 'busy'} onClick={() => push.enable()}>
            {push.phase === 'busy' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}הפעל התראות
          </button>
        ) : null}
        {on ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={cn(pill, 'bg-[#F1EFFE] text-brand-700 hover:bg-[#E4E1FD]')} onClick={async () => setTested(await push.test())}>{tested ? 'נשלחה' : 'התראת ניסיון'}</button>
            <button type="button" className={cn(pill, 'bg-transparent text-ink-600 ring-1 ring-[#E7E9F1] hover:bg-[#F7F8FB]')} disabled={busyOff} onClick={turnOff}>כיבוי</button>
          </div>
        ) : null}
      </div>

      {/* 3. what to notify about (this device) */}
      {on ? (
        <ul className="mt-2" aria-label="על מה להודיע">
          {KINDS.map((k) => (
            <li key={k.key} className="flex min-h-[56px] items-center justify-between gap-3 border-t border-[#F0F1F6] py-2 first:border-0">
              <label htmlFor={`pwa-pref-${k.key}`} className="min-w-0 cursor-pointer">
                <span className="block text-[15px] font-medium text-navy-900">{k.label}</span>
                <span className="block text-[13px] text-ink-400">{k.desc}</span>
              </label>
              <Switch id={`pwa-pref-${k.key}`} checked={prefs[k.key] !== false}
                onCheckedChange={async (v) => setPrefs(await setPushPrefs({ [k.key]: v }))}
                className="data-[state=checked]:bg-brand-600" />
            </li>
          ))}
        </ul>
      ) : null}

      <Drawer open={guide} onOpenChange={setGuide} shouldScaleBackground={false}>
        <DrawerContent className="mx-auto max-h-[92dvh] w-full max-w-[520px] bg-[#F7F8FB] outline-none" aria-describedby="pwa-sguide-desc">
          <div className="overflow-y-auto px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">
            <DrawerTitle className="text-[20px] font-extrabold text-navy-900">התקנה על האייפון</DrawerTitle>
            <DrawerDescription id="pwa-sguide-desc" className="text-[15px] text-ink-600">שלוש לחיצות, פעם אחת.</DrawerDescription>
            <IOSInstallGuide className="mt-4" />
            <button type="button" onClick={() => setGuide(false)} className={cn(pill, 'mt-4 h-12 w-full bg-navy-900 text-white')}>הבנתי</button>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
