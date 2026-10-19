/**
 * Version A: a small card on /today (under "המשך הגדרה", which it never shows alongside).
 *   not installed  -> "atlas על מסך הבית" + התקנה (Chrome / Edge) or איך מתקינים (iPhone guide in a sheet)
 *   installed      -> "התראה על כל הזמנה חדשה" + הפעל התראות
 *   just enabled   -> "ההתראות פועלות" + התראת ניסיון
 * Closing it is remembered on this device (Settings → התראות keeps both actions).
 */
import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Bell, BellRing, Check, Loader2 } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { AppIcon, IOSInstallGuide, EASE } from './parts';
import { useOffer } from './useOffer';

const pill = 'press inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full px-5 text-[16px] font-bold transition-colors duration-150';

export default function InstallCardA({ user }) {
  const { kind, install, push, dismissPush } = useOffer('card', user);
  const [guide, setGuide] = useState(false);
  const still = useReducedMotion();
  const desktop = install.platform === 'desktop';

  let icon; let title; let sub; let action; let onClose;
  if (kind === 'install') {
    icon = <AppIcon size={48} />;
    title = 'atlas על מסך הבית';
    sub = install.state === 'ios-guide' ? 'נפתח בלחיצה, עם התראה על כל הזמנה חדשה' : 'נפתח בלחיצה כמו אפליקציה, עם התראה על כל הזמנה חדשה';
    action = install.state === 'prompt'
      ? <button type="button" className={cn(pill, 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700')} onClick={() => install.install()}>התקנה</button>
      : <button type="button" className={cn(pill, 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700')} onClick={() => setGuide(true)}>איך מתקינים</button>;
    onClose = install.dismiss;
  } else if (kind === 'push') {
    const on = push.phase === 'on';
    icon = (
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', on ? 'bg-brand-600 text-white' : 'bg-[#E4E1FD] text-brand-700')} aria-hidden>
        {on ? <Check className="h-6 w-6" strokeWidth={2.75} /> : <BellRing className="h-6 w-6" strokeWidth={2} />}
      </span>
    );
    title = on ? 'ההתראות פועלות' : push.phase === 'blocked' ? 'ההתראות חסומות' : 'התראה על כל הזמנה חדשה';
    sub = push.note || (desktop ? 'הזמנות, לידים והזמנות מ-Booking.com ו-Airbnb, ישר למחשב הזה' : 'הזמנות, לידים והזמנות מ-Booking.com ו-Airbnb, ישר לטלפון');
    action = on
      ? <button type="button" className={cn(pill, 'bg-[#F1EFFE] text-brand-700 hover:bg-[#E4E1FD]')} onClick={() => push.test()}><Bell className="h-4 w-4" aria-hidden />התראת ניסיון</button>
      : push.phase === 'blocked' ? null
        : (
          <button type="button" className={cn(pill, 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 disabled:opacity-70')} disabled={push.phase === 'busy'} aria-busy={push.phase === 'busy'} onClick={() => push.enable()}>
            {push.phase === 'busy' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}הפעל התראות
          </button>
        );
    onClose = dismissPush;
  }

  return (
    <>
      <AnimatePresence initial={false}>
        {kind ? (
          <motion.section key={kind} aria-label={title} data-pwa-offer={`a-${kind}`}
            initial={still ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={still ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="mb-3 md:mb-4">
            <div className="flex min-h-[84px] flex-wrap items-center gap-x-4 gap-y-3 rounded-[24px] bg-white p-4 pe-2 shadow-[0_1px_2px_rgba(27,38,86,0.05),0_10px_28px_-16px_rgba(27,38,86,0.25)] ring-1 ring-[#E4E1FD] max-[359px]:gap-x-3 max-[359px]:p-3.5 max-[359px]:pe-1.5 md:p-5 md:pe-3">
              {icon}
              <div className="min-w-0 flex-1 basis-[170px]">
                <p className="text-[17px] font-extrabold leading-snug text-navy-900">{title}</p>
                <p className="mt-0.5 text-[15px] leading-snug text-ink-600" role={push.note ? 'status' : undefined}>{sub}</p>
              </div>
              <div className="flex items-center gap-1 max-md:w-full max-md:justify-between max-md:ps-16 max-[359px]:ps-0">
                {action}
                <button type="button" onClick={onClose} aria-label="סגירה"
                  className="press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-[#F1F2F7] hover:text-navy-900">
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <Drawer open={guide} onOpenChange={setGuide} shouldScaleBackground={false}>
        <DrawerContent className="mx-auto max-h-[92dvh] w-full max-w-[520px] bg-[#F7F8FB] outline-none" aria-describedby="pwa-guide-desc">
          <div className="overflow-y-auto px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">
            <div className="flex items-center gap-3">
              <AppIcon size={44} />
              <div className="min-w-0">
                <DrawerTitle className="text-[20px] font-extrabold text-navy-900">התקנה על האייפון</DrawerTitle>
                <DrawerDescription id="pwa-guide-desc" className="text-[15px] text-ink-600">שלוש לחיצות, פעם אחת.</DrawerDescription>
              </div>
            </div>
            <IOSInstallGuide className="mt-4" />
            <button type="button" onClick={() => setGuide(false)} className={cn(pill, 'mt-4 w-full bg-navy-900 text-white hover:bg-[#25306a]')}>הבנתי</button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
