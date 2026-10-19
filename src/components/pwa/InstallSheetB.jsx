/**
 * Version B: a bottom sheet that opens once, on /today, after setup is finished.
 *   - waits 1.6 s after /today settles, and never while the product tour or another dialog is open
 *   - step "install": sample notification + התקנה (Chrome / Edge) or the iPhone guide inline
 *   - step "push" (installed, or a browser that can do push as is): הפעל התראות
 *   - step "done": ההתראות פועלות + התראת ניסיון
 * Any close (לא עכשיו, swipe down, tap outside, Esc) is remembered on this device; Settings → התראות keeps both actions.
 */
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { getTourState } from '@/lib/tour/tourState';
import { AppIcon, IOSInstallGuide, NotificationPreview, EASE } from './parts';
import { useOffer } from './useOffer';

const btn = 'press inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full px-6 text-[17px] font-bold transition-colors duration-150';
const OPEN_DELAY_MS = 1600;

export default function InstallSheetB({ user }) {
  const { kind, install, push, dismissPush } = useOffer('sheet', user);
  const [open, setOpen] = useState(false);
  const [shownKind, setShownKind] = useState(null); // the step the sheet opened with stays the frame
  const still = useReducedMotion();

  // open once, a moment after /today settles, if there is something to offer
  useEffect(() => {
    if (!kind || open || shownKind) return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      let tour = null;
      try { tour = await getTourState(user); } catch { /* ignore */ }
      if (!alive || tour?.status === 'pending') return;
      if (document.querySelector('[role="dialog"][aria-modal="true"], [role="alertdialog"]')) return;
      setShownKind(kind);
      setOpen(true);
    }, OPEN_DELAY_MS);
    return () => { alive = false; clearTimeout(t); };
  }, [kind, open, shownKind, user]);

  const close = () => {
    setOpen(false);
    install.dismiss();
    dismissPush();
  };

  if (!shownKind) return null;
  // after an Android / desktop install the same sheet moves on to notifications
  const step = push.phase === 'on' && push.justEnabled ? 'done'
    : kind === 'push' || (shownKind === 'install' && install.state !== 'prompt' && install.state !== 'ios-guide') ? 'push'
      : 'install';
  const ios = install.state === 'ios-guide';
  const desktop = install.platform === 'desktop';

  const title = step === 'done' ? 'ההתראות פועלות'
    : step === 'push' ? 'התראה על כל הזמנה חדשה'
      : ios ? 'atlas על מסך הבית של האייפון' : desktop ? 'atlas כאפליקציה במחשב' : 'atlas על מסך הבית';
  const desc = step === 'done' ? (push.note || 'נודיע לכם על כל הזמנה חדשה, ליד חדש והזמנה מהערוצים.')
    : step === 'push' ? `הזמנה מ-Booking.com, מ-Airbnb או מהאתר, וגם ליד חדש: הודעה קטנה ${desktop ? 'במחשב הזה' : 'בטלפון'}, ברגע שזה קורה.`
      : desktop ? 'נפתח בחלון משלו, ישר מהשולחן או מסרגל המשימות. ומקבלים התראה על כל הזמנה חדשה.'
        : 'נפתח בלחיצה אחת כמו אפליקציה, בלי לחפש בדפדפן. ומקבלים התראה על כל הזמנה חדשה.';

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) close(); }} shouldScaleBackground={false}>
      <DrawerContent data-pwa-offer={`b-${step}`} aria-describedby="pwa-sheet-desc"
        className="mx-auto max-h-[94dvh] w-full max-w-[540px] overflow-hidden bg-[#F7F8FB] outline-none">
        <div className="overflow-y-auto px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 md:px-7">
          {/* header visual: the app icon on an indigo stage with a sample notification sliding in */}
          <div className="relative overflow-hidden rounded-[24px] bg-brand-600 px-4 pb-5 pt-6" aria-hidden>
            <div className="absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '18px 18px' }} />
            <div className="relative flex flex-col items-center">
              <motion.div initial={still ? false : { scale: 0.86, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: EASE }}>
                <AppIcon size={64} className="shadow-[0_12px_30px_-10px_rgba(10,8,60,0.6)]" />
              </motion.div>
              <span className="mt-2 text-[13px] font-semibold text-white/90">אטלס</span>
              {step === 'done'
                ? <span className="mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600"><Check className="h-6 w-6" strokeWidth={3} /></span>
                : <NotificationPreview className="mt-4 w-full max-w-[380px]" delay={0.35} />}
            </div>
          </div>

          <DrawerTitle className="mt-5 text-[24px] font-extrabold leading-[1.2] tracking-[-0.01em] text-navy-900">{title}</DrawerTitle>
          <DrawerDescription id="pwa-sheet-desc" className="mt-1.5 text-[16px] leading-relaxed text-ink-600" role={step === 'done' ? 'status' : undefined}>{desc}</DrawerDescription>

          {step === 'install' && ios ? <IOSInstallGuide className="mt-4" compact /> : null}
          {step === 'push' && push.note && push.phase !== 'on' ? <p className="mt-3 rounded-[14px] bg-white px-4 py-3 text-[15px] text-navy-900 ring-1 ring-[#E7E9F1]" role="status">{push.note}</p> : null}

          <div className="mt-5 flex flex-col gap-2">
            {step === 'install' && !ios ? (
              <button type="button" className={cn(btn, 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700')} onClick={() => install.install()}>התקנה</button>
            ) : null}
            {step === 'install' && ios ? (
              <button type="button" className={cn(btn, 'bg-navy-900 text-white hover:bg-[#25306a]')} onClick={close}>הבנתי</button>
            ) : null}
            {step === 'push' && push.phase !== 'blocked' ? (
              <button type="button" className={cn(btn, 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 disabled:opacity-70')} disabled={push.phase === 'busy'} aria-busy={push.phase === 'busy'} onClick={() => push.enable()}>
                {push.phase === 'busy' ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Bell className="h-5 w-5" aria-hidden />}הפעל התראות
              </button>
            ) : null}
            {step === 'done' ? (
              <>
                <button type="button" className={cn(btn, 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700')} onClick={close}>סיום</button>
                <button type="button" className={cn(btn, 'bg-transparent text-brand-700 hover:bg-[#F1EFFE]')} onClick={() => push.test()}>שליחת התראת ניסיון</button>
              </>
            ) : (
              !(step === 'install' && ios) ? <button type="button" className={cn(btn, 'bg-transparent text-ink-600 hover:bg-[#EEF0F6]')} onClick={close}>לא עכשיו</button> : null
            )}
          </div>
          <p className="mt-3 text-center text-[13px] text-ink-400">אפשר לשנות את זה בכל רגע בהגדרות ← התראות</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
