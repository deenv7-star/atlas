/**
 * Register A: the owner's system assembling itself while they type (refs: Cal.com split sign-up,
 * XSpot / Piplz stacked preview cards, Amie "the screen reacts to you").
 *   business name → the dashboard header + sidebar take the name
 *   valid email   → the week calendar gets its first booking
 *   valid password→ more bookings + a "new booking" toast with an amount
 *   passwords match / consent → a WhatsApp confirmation bubble pops in
 * Fixed sizes everywhere so nothing shifts (no CLS). Transform/opacity only. Decorative: aria-hidden.
 */
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Home, Inbox, Wallet, MessageCircle, Settings, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wordmark } from '@/components/app/shell/shared';

const EASE = [0.23, 1, 0.32, 1];
const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const UNITS = ['הזית', 'התאנה', 'הגפן'];
// [row, startDay, nights, level it appears at, tone]
const BOOKINGS = [
  [0, 1, 3, 1, 'solid'],
  [1, 0, 2, 2, 'soft'],
  [2, 3, 3, 2, 'navy'],
  [1, 4, 3, 3, 'solid'],
  [0, 5, 2, 3, 'soft'],
];
const TONES = {
  solid: 'bg-brand-600 text-white',
  soft: 'bg-brand-100 text-brand-700',
  navy: 'bg-navy-900 text-white',
};
const GUESTS = ['משפחת לוי', 'נועה ואיתי', 'דניאל כ.', 'שירן ומיכל', 'Sarah K.'];

const pop = {
  initial: { opacity: 0, scale: 0.94, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.16, ease: EASE } },
};

export function levelOf({ business, emailOk, passwordOk, confirmOk, agreed }) {
  return (business ? 1 : 0) + (emailOk ? 1 : 0) + (passwordOk ? 1 : 0) + (confirmOk && agreed ? 1 : 0);
}

function firstOfEmail(email) {
  const n = String(email || '').split('@')[0].replace(/[._\d-]+/g, ' ').trim().split(/\s+/)[0] || '';
  return n ? n.charAt(0).toUpperCase() + n.slice(1, 12) : '';
}

function Calendar({ level, compact }) {
  const rows = compact ? 2 : 3;
  return (
    <div className={cn('rounded-[18px] bg-white', compact ? 'p-2.5' : 'p-4 shadow-[0_1px_2px_rgba(27,38,86,0.04),0_10px_30px_-14px_rgba(27,38,86,0.18)]')}>
      {!compact ? (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-bold text-navy-900">לוח שנה · השבוע</p>
          <p className="text-[11px] font-medium text-ink-400 tabular-nums">{BOOKINGS.filter((b) => b[3] <= level && b[0] < rows).length} הזמנות</p>
        </div>
      ) : null}
      <div className="grid gap-x-1 gap-y-1.5" style={{ gridTemplateColumns: `${compact ? 44 : 64}px repeat(7, minmax(0, 1fr))` }}>
        <span />
        {DAYS.map((d) => <span key={d} className="text-center text-[10px] font-semibold text-ink-400">{d}</span>)}
        {UNITS.slice(0, rows).map((u, r) => (
          <React.Fragment key={u}>
            <span className={cn('truncate font-semibold text-navy-900', compact ? 'text-[10px] leading-[22px]' : 'text-[12px] leading-[30px]')}>{u}</span>
            <div className="relative col-span-7 grid grid-cols-7 gap-1">
              {DAYS.map((d) => <span key={d} className={cn('rounded-[7px] bg-[#F3F4F9]', compact ? 'h-[22px]' : 'h-[30px]')} />)}
              <AnimatePresence>
                {BOOKINGS.filter((b) => b[0] === r && b[3] <= level).map((b, k) => (
                  <motion.span
                    key={`${b[0]}-${b[1]}`}
                    initial={{ opacity: 0, scaleX: 0.6 }}
                    animate={{ opacity: 1, scaleX: 1, transition: { duration: 0.42, ease: EASE, delay: k * 0.06 } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    className={cn('absolute top-0 flex items-center overflow-hidden rounded-[7px] px-1.5 font-semibold', TONES[b[4]], compact ? 'h-[22px] text-[9px]' : 'h-[30px] text-[11px]')}
                    style={{ insetInlineStart: `calc(${(b[1] / 7) * 100}% + 1px)`, width: `calc(${(b[2] / 7) * 100}% - 4px)`, transformOrigin: 'right center' }}
                  >
                    <span className="truncate">{GUESTS[(b[0] * 2 + b[1]) % GUESTS.length]}</span>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function WhatsAppBubble({ name, guest = 'נועה', small }) {
  return (
    <div className={cn('flex items-end gap-2', small && 'scale-[0.92] origin-bottom-left')}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_16px_-6px_rgba(37,211,102,0.6)]">
        <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <div className="relative max-w-[260px] rounded-[16px] rounded-bl-[6px] bg-white px-3.5 py-2.5 shadow-[0_2px_6px_rgba(27,38,86,0.06),0_16px_36px_-14px_rgba(27,38,86,0.3)]">
        <p className="text-[11px] font-semibold text-[#075E54]">וואטסאפ · נשלח אוטומטית</p>
        <p className="mt-0.5 text-[13px] leading-[1.45] text-navy-900">היי {guest}, ההזמנה שלכם ב{name || 'מתחם'} אושרה. נתראה ביום ה׳ ב-15:00</p>
        <p className="mt-1 flex items-center justify-end gap-0.5 text-[10px] text-ink-400 tabular-nums">10:24 <Check className="h-3 w-3 text-[#34B7F1]" strokeWidth={3} /><Check className="-ms-2 h-3 w-3 text-[#34B7F1]" strokeWidth={3} /></p>
      </div>
    </div>
  );
}

/** Desktop side panel. */
export function LivePreviewFull({ business, email, level }) {
  const name = business.trim() || 'המתחם שלכם';
  const who = firstOfEmail(email);
  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-[32px] bg-[#EEF0F8] px-10 py-10 xl:px-14" aria-hidden>
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(62,43,241,0.16),rgba(62,43,241,0))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(62,43,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(62,43,241,0.04)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)]" />

      <div className="relative mx-auto w-full max-w-[600px]">
        <div className="mb-5 flex items-center gap-2 text-[13px] font-semibold text-brand-700">
          <span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-brand-600/50 motion-reduce:hidden" /><span className="relative h-2 w-2 rounded-full bg-brand-600" /></span>
          המערכת שלכם נבנית בזמן שאתם מקלידים
        </div>

        {/* the app window */}
        <div className="relative rounded-[24px] bg-[#F7F8FB] p-3 shadow-[0_0_0_1px_rgba(27,38,86,0.06),0_40px_80px_-32px_rgba(27,38,86,0.35)]">
          <div className="flex gap-3">
            <aside className="flex w-[136px] shrink-0 flex-col gap-3 rounded-[18px] bg-white p-3">
              <Wordmark size={14} />
              <div className="flex items-center gap-2 rounded-[12px] bg-[#F3F4F9] p-1.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-brand-600 text-[12px] font-extrabold text-white">{name.charAt(0)}</span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={name} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="min-w-0 truncate text-[11px] font-bold text-navy-900">{name}</motion.span>
                </AnimatePresence>
              </div>
              {[['היום', Home], ['לוח שנה', CalendarDays], ['הזמנות', Inbox], ['כספים', Wallet], ['הודעות', MessageCircle], ['הגדרות', Settings]].map(([t, Icon], i) => (
                <span key={t} className={cn('flex h-7 items-center gap-2 rounded-[9px] px-2 text-[11px] font-medium', i === 0 ? 'bg-brand-600 text-white' : 'text-ink-600')}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} />{t}</span>
              ))}
            </aside>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex h-[52px] items-center justify-between px-1">
                <div className="min-w-0">
                  <p className="truncate text-[20px] font-extrabold tracking-[-0.01em] text-navy-900">
                    {name}
                    <span className="ms-0.5 inline-block h-[18px] w-[2px] translate-y-[2px] bg-brand-600 [animation:atlas-caret_1s_steps(1)_infinite] motion-reduce:hidden" />
                  </p>
                  <p className="text-[12px] text-ink-400">{who ? `בוקר טוב, ${who}` : 'בוקר טוב'} · 3 יחידות</p>
                </div>
                <span className={cn('inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold transition-colors duration-300', level >= 4 ? 'bg-brand-600 text-white' : 'bg-white text-ink-400')}>
                  <Sparkles className="h-3 w-3" />{level >= 4 ? 'מוכן' : `${level}/4`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="v7-hero flex h-[104px] flex-col justify-between p-4">
                  <p className="text-[11px] font-medium text-white/80">הכנסות החודש</p>
                  <p className="text-[26px] font-extrabold leading-none tabular-nums" dir="ltr"><span className="me-0.5 text-[15px] text-white/70">₪</span>{['0', '2,480', '7,150', '12,940', '18,320'][level]}</p>
                </div>
                <div className="flex h-[104px] flex-col justify-between rounded-[18px] bg-white p-4">
                  <p className="text-[11px] font-medium text-ink-400">תפוסה השבוע</p>
                  <div>
                    <p className="text-[26px] font-extrabold leading-none text-navy-900 tabular-nums" dir="ltr">{[0, 14, 33, 62, 76][level]}%</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEF0F6]"><div className="h-full origin-right rounded-full bg-brand-600 transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${[0, 0.14, 0.33, 0.62, 0.76][level]})` }} /></div>
                  </div>
                </div>
              </div>
              <Calendar level={level} />
            </div>
          </div>

          {/* floating moments */}
          <div className="pointer-events-none absolute -left-10 -top-9 h-[60px] w-[220px]">
            <AnimatePresence>
              {level >= 3 ? (
                <motion.div {...pop} className="flex h-[60px] items-center gap-3 rounded-[16px] bg-white px-3.5 shadow-[0_2px_6px_rgba(27,38,86,0.06),0_18px_40px_-16px_rgba(27,38,86,0.35)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-brand-50 text-[12px] font-extrabold text-brand-700">B.</span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold text-navy-900">הזמנה חדשה מ-Booking</span>
                    <span className="block text-[11px] text-ink-400 tabular-nums">3 לילות · ₪2,340</span>
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <div className="pointer-events-none absolute -bottom-10 -left-6 h-[104px] w-[290px]">
            <AnimatePresence>
              {level >= 4 ? <motion.div {...pop} className="absolute bottom-0 left-0"><WhatsAppBubble name={business.trim()} /></motion.div> : null}
            </AnimatePresence>
          </div>
        </div>

        <ol className="mt-16 flex gap-2">
          {['שם המתחם', 'מייל', 'סיסמה', 'אישור'].map((t, k) => (
            <li key={t} className={cn('flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-colors duration-300', k < level ? 'bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.06)]' : 'text-ink-400')}>
              <span className={cn('flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-300', k < level ? 'bg-brand-600 text-white' : 'bg-[#DCE0EB]')}>{k < level ? <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> : null}</span>
              {t}
            </li>
          ))}
        </ol>
      </div>
      <style>{'@keyframes atlas-caret { 50% { opacity: 0 } }'}</style>
    </div>
  );
}

/** Phones: one fixed-height card above the form. */
export function LivePreviewCompact({ business, level }) {
  const name = business.trim() || 'המתחם שלכם';
  return (
    <div className="relative h-[148px] overflow-hidden rounded-[22px] bg-[#EEF0F8] p-3" aria-hidden>
      <div className="pointer-events-none absolute -top-20 left-1/2 h-[220px] w-[360px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(62,43,241,0.16),rgba(62,43,241,0))]" />
      <div className="relative flex h-[30px] items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-brand-600 text-[12px] font-extrabold text-white">{name.charAt(0)}</span>
          <span className="truncate text-[15px] font-extrabold text-navy-900">{name}</span>
        </div>
        <span className={cn('inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-bold transition-colors duration-300', level >= 4 ? 'bg-brand-600 text-white' : 'bg-white text-ink-400')}>
          <Sparkles className="h-3 w-3" />{level >= 4 ? 'מוכן' : `${level}/4`}
        </span>
      </div>
      <div className="relative mt-2 h-[94px]">
        <AnimatePresence initial={false} mode="popLayout">
          {level >= 4 ? (
            <motion.div key="wa" {...pop} className="absolute inset-0 flex items-center justify-end"><WhatsAppBubble name={business.trim()} small /></motion.div>
          ) : (
            <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} className="absolute inset-0"><Calendar level={level} compact /></motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
