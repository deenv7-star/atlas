/**
 * Shared pieces of the "atlas on the home screen" offer (version A card on /today, version B sheet after setup,
 * and the device card in Settings → התראות): app icon, a sample notification, the iPhone install guide, and the
 * hook that runs the "הפעל התראות" tap.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Share, PlusSquare, MoreHorizontal, Bell, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { readEnv, iosVersion, iosBrowser } from '@/lib/pwa/platform';
import { enablePush, readPushStatus, showTestNotification } from '@/lib/pwa/push';

export const EASE = [0.23, 1, 0.32, 1];

export function AppIcon({ size = 48, className }) {
  return (
    <img src="/icons/apple-touch-180.png" alt="" width={size} height={size} aria-hidden
      className={cn('shrink-0 select-none', className)}
      style={{ width: size, height: size, borderRadius: size * 0.2237 }} />
  );
}

/** A lock-screen style sample of what a new-booking notification looks like. Decorative (aria-hidden). */
export function NotificationPreview({ className, delay = 0.15 }) {
  const still = useReducedMotion();
  return (
    <motion.div aria-hidden
      initial={still ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      className={cn('flex items-start gap-3 rounded-[20px] bg-white/90 p-3.5 shadow-[0_1px_2px_rgba(27,38,86,0.06),0_14px_34px_-14px_rgba(27,38,86,0.35)] ring-1 ring-black/[0.04] backdrop-blur', className)}>
      <AppIcon size={38} />
      <div className="min-w-0 flex-1 text-start">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[14px] font-bold text-navy-900">הזמנה חדשה מ-Booking.com</span>
          <span className="shrink-0 text-[12px] text-ink-400">עכשיו</span>
        </div>
        <p className="mt-0.5 truncate text-[14px] text-ink-600">דנה כהן · 12–14 בנוב׳ · 2 לילות</p>
      </div>
    </motion.div>
  );
}

/* ── iPhone install guide ────────────────────────────────────────────────── */

function Hi({ children, className }) {
  // the control to tap: indigo ring + soft halo (no infinite animation: calm, and reduced-motion safe)
  return <span className={cn('relative inline-flex items-center justify-center rounded-full bg-white text-brand-600 ring-2 ring-brand-600 shadow-[0_0_0_6px_rgba(62,43,241,0.14)]', className)}>{children}</span>;
}

function MockBar({ children, className }) {
  return <div aria-hidden className={cn('flex h-[52px] items-center justify-between rounded-[14px] bg-[#EEF0F6] px-3', className)}>{children}</div>;
}

function Dot({ w = 18 }) { return <span className="h-2 rounded-full bg-[#D6DAE6]" style={{ width: w }} />; }

function guideSteps(env) {
  const browser = iosBrowser(env);
  const v = iosVersion(env) || 0;
  const steps = [];
  if (browser === 'in-app') {
    steps.push({
      key: 'safari',
      text: 'פתחו את atlas-il.com בדפדפן Safari',
      mock: <MockBar><Dot w={46} /><Hi className="h-9 w-9"><Compass className="h-5 w-5" strokeWidth={2} /></Hi><Dot w={30} /></MockBar>,
    });
  }
  if (browser === 'chrome' || browser === 'edge') {
    steps.push({
      key: 'share',
      text: 'לחצו על כפתור השיתוף בשורת הכתובת למעלה',
      mock: <MockBar><span className="flex h-9 flex-1 items-center rounded-full bg-white px-3 text-[13px] text-ink-400" dir="ltr">atlas-il.com</span><Hi className="ms-2 h-9 w-9"><Share className="h-[18px] w-[18px]" strokeWidth={2} /></Hi></MockBar>,
    });
  } else if (v >= 26) {
    steps.push({
      key: 'share',
      text: 'לחצו על ••• ליד שורת הכתובת, ואז על ״שיתוף״',
      mock: <MockBar><Hi className="h-9 w-9"><MoreHorizontal className="h-5 w-5" strokeWidth={2.25} /></Hi><span className="mx-2 flex h-9 flex-1 items-center justify-center rounded-full bg-white text-[13px] text-ink-400" dir="ltr">atlas-il.com</span><Dot w={22} /></MockBar>,
    });
  } else {
    steps.push({
      key: 'share',
      text: 'לחצו על כפתור השיתוף בסרגל התחתון',
      mock: <MockBar><Dot /><Dot /><Hi className="h-9 w-9"><Share className="h-[18px] w-[18px]" strokeWidth={2} /></Hi><Dot /><Dot /></MockBar>,
    });
  }
  steps.push({
    key: 'add',
    text: 'גללו מעט ובחרו ״הוספה למסך הבית״',
    mock: (
      <div aria-hidden className="rounded-[14px] bg-[#EEF0F6] p-1.5">
        <div className="flex h-10 items-center justify-between rounded-[10px] bg-white px-3 ring-2 ring-brand-600 shadow-[0_0_0_6px_rgba(62,43,241,0.14)]">
          <span className="text-[14px] font-semibold text-navy-900">הוספה למסך הבית</span>
          <PlusSquare className="h-[18px] w-[18px] text-brand-600" strokeWidth={2} />
        </div>
      </div>
    ),
  });
  steps.push({
    key: 'confirm',
    text: 'לחצו ״הוסף״ בפינה העליונה. אם יש מתג לפתיחה כאפליקציה, השאירו אותו דלוק.',
    mock: (
      <MockBar>
        <span className="flex items-center gap-2"><AppIcon size={30} /><span className="text-[14px] font-semibold text-navy-900">אטלס</span></span>
        <Hi className="h-9 px-3.5 text-[14px] font-bold">הוסף</Hi>
      </MockBar>
    ),
  });
  return steps;
}

/** Step-by-step "Share → הוספה למסך הבית" for iPhone / iPad, matched to the browser and iOS version. */
export function IOSInstallGuide({ className, compact = false }) {
  const env = readEnv();
  const steps = guideSteps(env);
  const still = useReducedMotion();
  return (
    <div className={className}>
      <ol className="flex flex-col gap-2.5" aria-label="שלבי ההתקנה באייפון">
        {steps.map((s, i) => (
          <motion.li key={s.key} data-step={s.key}
            initial={still ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.06 * i }}
            className={cn('rounded-[18px] bg-white p-3 ring-1 ring-[#E7E9F1]', compact && 'p-2.5')}>
            <p className="flex items-start gap-2.5 text-[15px] font-semibold leading-snug text-navy-900">
              <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[13px] font-bold tabular-nums text-white">{i + 1}</span>
              <span>{s.text}</span>
            </p>
            <div className="mt-2.5">{s.mock}</div>
          </motion.li>
        ))}
      </ol>
      <p className="mt-3 flex items-start gap-2 text-[14px] leading-relaxed text-ink-600">
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} aria-hidden />
        <span>באייפון, התראות על הזמנות חדשות עובדות רק כשפותחים את atlas מהאייקון שעל מסך הבית (iOS 16.4 ומעלה).</span>
      </p>
    </div>
  );
}

/* ── "הפעל התראות" ───────────────────────────────────────────────────────── */

export const PUSH_COPY = {
  denied: 'ההתראות חסומות בדפדפן. אפשר לאפשר אותן בהגדרות האתר ולנסות שוב.',
  dismissed: 'לא אושר. אפשר לנסות שוב מתי שרוצים.',
  error: 'לא הצלחנו להפעיל עכשיו. נסו שוב בעוד רגע.',
  soon: 'המכשיר מוכן. ההתראות יתחילו להגיע בקרוב.',
  on: 'נודיע לכם על כל הזמנה חדשה, ליד חדש והזמנה מהערוצים.',
};

/**
 * phase: 'loading' | 'off' (can enable) | 'busy' | 'on' | 'blocked' (denied) | 'unavailable' | 'needs-install'
 */
export function usePushFlow() {
  const [st, setSt] = useState({ phase: 'loading', note: '' });
  const refresh = useCallback(async () => {
    const s = await readPushStatus();
    const phase = s.state === 'granted' ? (s.subscribed ? 'on' : 'off')
      : s.state === 'ready' ? 'off'
        : s.state === 'denied' ? 'blocked'
          : s.state === 'needs-install' ? 'needs-install'
            : 'unavailable';
    setSt((p) => ({ ...p, phase, raw: s.state }));
    return phase;
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const enable = useCallback(async () => {
    setSt({ phase: 'busy', note: '' });
    const r = await enablePush();
    if (r.ok) { setSt({ phase: 'on', note: r.saved === false ? PUSH_COPY.soon : PUSH_COPY.on, justEnabled: true }); return r; }
    const phase = r.reason === 'denied' ? 'blocked' : 'off';
    setSt({ phase, note: PUSH_COPY[r.reason] || PUSH_COPY.error });
    return r;
  }, []);
  const test = useCallback(async () => { try { await showTestNotification(); return true; } catch { return false; } }, []);
  return { ...st, enable, test, refresh };
}
