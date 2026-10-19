/**
 * Calendar v2 shared pieces: month toolbar, unit filter, month transition + swipe, day sheet, block dialog.
 * Palette only (#3E2BF1, #1B2656, #F7F8FB, white and their tints). Motion is transform/opacity only and
 * collapses to an instant swap under prefers-reduced-motion.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Lock, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreateBooking } from '@/data/entities';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { heCount } from '@/lib/hebrewCount';
import {
  CHANNEL_LABEL, addDaysIso, dayAtUnit, diffDays, hebrewMonthsLabel, longDay, monthTitle, shortDay, todayIso,
} from '@/lib/calendar/calendarModel';

/* ── toolbar ─────────────────────────────────────────────────────────────── */

export function MonthToolbar({ month, onPrev, onNext, onToday, isCurrent, children }) {
  const heb = hebrewMonthsLabel(month);
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={onPrev} aria-label="החודש הקודם" className="press inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900 ring-1 ring-inset ring-navy-900/10 hover:bg-[#F7F8FB]">
            <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          </button>
          <button type="button" onClick={onNext} aria-label="החודש הבא" className="press inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900 ring-1 ring-inset ring-navy-900/10 hover:bg-[#F7F8FB]">
            <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold leading-tight text-navy-900 tabular md:text-[22px]" aria-live="polite">{monthTitle(month)}</h2>
          {heb ? <p className="text-[13px] text-navy-900/60">{heb}</p> : null}
        </div>
        {!isCurrent ? (
          <button type="button" onClick={onToday} className="press h-11 rounded-full bg-white px-4 text-[14px] font-semibold text-brand-600 ring-1 ring-inset ring-navy-900/10 hover:bg-[#F7F8FB]">היום</button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function UnitFilter({ units, value, onChange }) {
  if (units.length < 2) return null;
  const opts = [{ id: null, name: 'כל היחידות' }, ...units];
  return (
    <div role="group" aria-label="סינון לפי יחידה" className="v7-strip -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0">
      {opts.map((u) => {
        const on = (value ?? null) === u.id;
        return (
          <button
            key={u.id ?? 'all'}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(u.id)}
            className={cn('press h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-[14px] font-semibold',
              on ? 'bg-navy-900 text-white' : 'bg-white text-navy-900 ring-1 ring-inset ring-navy-900/10 hover:bg-[#F7F8FB]')}
          >
            {u.name}
          </button>
        );
      })}
    </div>
  );
}

/* ── month transition + swipe ────────────────────────────────────────────── */

/** dir: +1 next month, -1 previous. In RTL the next month enters from the left. */
export function MonthTransition({ monthKey, dir, children, className }) {
  const reduce = useReducedMotion();
  const x = reduce ? 0 : 28;
  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={monthKey}
          custom={dir}
          variants={{
            enter: (d) => ({ opacity: 0, x: d > 0 ? -x : x }),
            center: { opacity: 1, x: 0 },
            exit: (d) => ({ opacity: 0, x: d > 0 ? x : -x }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Horizontal swipe → month change. RTL: swiping toward the right (finger moves right) shows the next month. */
export function useMonthSwipe(onNext, onPrev) {
  const start = useRef(null);
  const onTouchStart = useCallback((e) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }, []);
  const onTouchEnd = useCallback((e) => {
    const s = start.current; start.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x; const dy = t.clientY - s.y;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.4 || Date.now() - s.t > 700) return;
    if (dx > 0) onNext(); else onPrev();
  }, [onNext, onPrev]);
  return { onTouchStart, onTouchEnd };
}

/* ── small atoms ─────────────────────────────────────────────────────────── */

export function SourceBadge({ channel, className, onDark = false }) {
  if (!channel || channel === 'direct') return null;
  return (
    <span className={cn('inline-flex h-[18px] shrink-0 items-center rounded-full px-1.5 text-[11px] font-semibold leading-none',
      onDark ? 'bg-white/20 text-white' : channel === 'booking' ? 'bg-navy-900 text-white' : channel === 'airbnb' ? 'bg-white text-navy-900 ring-1 ring-inset ring-navy-900/25' : 'bg-navy-900/10 text-navy-900', className)}
    >
      {CHANNEL_LABEL[channel]}
    </span>
  );
}

export function stayLabel(s) {
  if (s.isBlock) return 'חסום';
  return s.guest || 'הזמנה';
}

export function stayAria(s, unitName) {
  const who = s.isBlock ? 'תאריכים חסומים' : (s.guest || 'הזמנה');
  const ch = s.isBlock ? '' : `, ${CHANNEL_LABEL[s.channel]}`;
  return `${who}${unitName ? `, ${unitName}` : ''}${ch}, ${shortDay(s.start)} עד ${shortDay(s.end)}, ${heCount(s.nights, 'night')}${s.pending ? ', ממתינה לאישור' : ''}`;
}

/* ── day sheet: tap a day → what's there + add booking / block ───────────── */

export function useDayActions() {
  const quick = useQuickBooking();
  const [day, setDay] = useState(null); // { day, unitId }
  const [block, setBlock] = useState(null); // { start, end, unitId }
  const openDay = useCallback((d, unitId = null) => setDay({ day: d, unitId }), []);
  const newBooking = useCallback((unit, d) => {
    setDay(null);
    quick.open({
      ...(unit ? { property_id: unit.id, property_name: unit.name } : {}),
      check_in_date: d, check_out_date: addDaysIso(d, 1),
    });
  }, [quick]);
  const newBlock = useCallback((unitId, d) => { setDay(null); setBlock({ start: d, end: addDaysIso(d, 1), unitId }); }, []);
  return { day, setDay, openDay, block, setBlock, newBooking, newBlock };
}

export function DaySheet({ actions, units, stays, holidays }) {
  const { day, setDay, newBooking, newBlock } = actions;
  const d = day?.day;
  const list = useMemo(() => {
    if (!d) return [];
    const subset = day.unitId ? units.filter((u) => u.id === day.unitId) : units;
    return subset.map((u) => ({ unit: u, ...dayAtUnit(stays, u.id, d) }));
  }, [d, day, units, stays]);
  const hol = d ? holidays.get(d) : null;
  const singleUnit = list.length === 1 ? list[0].unit : null;
  const anyFree = list.some((r) => r.freeNight);
  return (
    <Dialog open={Boolean(d)} onOpenChange={(o) => { if (!o) setDay(null); }}>
      <DialogContent className="sm:max-w-md">
        {d ? (
          <>
            <DialogHeader className="text-right">
              <DialogTitle className="text-[22px] font-bold text-navy-900">{longDay(d)}</DialogTitle>
              <DialogDescription className="text-[15px] text-navy-900/70">
                {hol?.length ? hol.map((h) => h.title).join(' · ') : (d === todayIso() ? 'היום' : 'מה קורה ביום הזה')}
              </DialogDescription>
            </DialogHeader>
            <ul className="-mx-1 space-y-1">
              {list.map((r) => (
                <li key={r.unit.id} className="rounded-[16px] bg-[#F7F8FB] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-[15px] font-semibold text-navy-900">{r.unit.name}</span>
                    <span className={cn('shrink-0 text-[13px] font-semibold', r.freeNight ? 'text-brand-600' : 'text-navy-900/60')}>{r.freeNight ? 'הלילה פנוי' : 'הלילה תפוס'}</span>
                  </div>
                  {[...r.leaving.map((s) => ['יוצאים', s]), ...r.arriving.map((s) => ['מגיעים', s]), ...r.staying.map((s) => ['שוהים', s])].map(([k, s]) => (
                    <Link key={`${k}-${s.id}`} to={`${createPageUrl('BookingDetail')}/${s.id}`} className="mt-1 flex min-h-[44px] items-center gap-2 rounded-[12px] px-1 text-[14px] text-navy-900 hover:bg-white">
                      <span className="w-[52px] shrink-0 text-navy-900/60">{s.isBlock ? 'חסום' : k}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{s.isBlock ? `עד ${shortDay(s.end)}` : stayLabel(s)}</span>
                      {!s.isBlock ? <SourceBadge channel={s.channel} /> : null}
                    </Link>
                  ))}
                </li>
              ))}
            </ul>
            {anyFree ? (
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => newBooking(singleUnit || list.find((r) => r.freeNight)?.unit, d)} className="h-12">
                  <Plus aria-hidden />הזמנה חדשה
                </Button>
                <Button variant="outline" onClick={() => newBlock(singleUnit?.id || list.find((r) => r.freeNight)?.unit.id, d)} className="h-12">
                  <Lock aria-hidden />חסימת תאריכים
                </Button>
              </div>
            ) : (
              <p className="text-[14px] text-navy-900/70">כל היחידות תפוסות בלילה הזה.</p>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function BlockDialog({ actions, units }) {
  const { block, setBlock } = actions;
  const create = useCreateBooking();
  const [busy, setBusy] = useState(false);
  const v = block || {};
  const nights = v.start && v.end ? diffDays(v.start, v.end) : 0;
  const valid = v.unitId && nights >= 1;
  const save = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await create.mutateAsync({
        property_id: v.unitId, check_in_date: v.start, check_out_date: v.end, nights,
        is_block: true, status: 'CONFIRMED', source: 'manual', guest_name: 'חסום', notes: v.note || '',
        adults: 0, children: 0,
      });
      atlasToastApi.success(`התאריכים נחסמו, ${heCount(nights, 'night')}`);
      setBlock(null);
    } catch (e) {
      atlasToastApi.error(e?.message ? `לא הצלחנו לחסום: ${e.message}` : 'לא הצלחנו לחסום. נסו שוב.');
    } finally { setBusy(false); }
  };
  const field = 'mt-1.5 h-12 w-full rounded-[14px] border-0 bg-[#F7F8FB] px-3 text-[16px] text-navy-900 ring-1 ring-inset ring-navy-900/10 focus:ring-2 focus:ring-brand-600';
  return (
    <Dialog open={Boolean(block)} onOpenChange={(o) => { if (!o) setBlock(null); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-right">
          <DialogTitle className="text-[22px] font-bold text-navy-900">חסימת תאריכים</DialogTitle>
          <DialogDescription className="text-[15px] text-navy-900/70">אם חיברתם את Booking ו-Airbnb, התאריכים ייסגרו גם שם.</DialogDescription>
        </DialogHeader>
        {block ? (
          <div className="grid gap-3">
            {units.length > 1 ? (
              <label className="block text-[14px] font-semibold text-navy-900">יחידה
                <select className={field} value={v.unitId || ''} onChange={(e) => setBlock({ ...v, unitId: e.target.value })}>
                  <option value="" disabled>בחרו יחידה</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </label>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[14px] font-semibold text-navy-900">מתאריך
                <input type="date" className={field} value={v.start} onChange={(e) => { const s = e.target.value; setBlock({ ...v, start: s, end: v.end <= s ? addDaysIso(s, 1) : v.end }); }} />
              </label>
              <label className="block text-[14px] font-semibold text-navy-900">עד (לא כולל)
                <input type="date" className={field} value={v.end} min={v.start ? addDaysIso(v.start, 1) : undefined} onChange={(e) => setBlock({ ...v, end: e.target.value })} />
              </label>
            </div>
            <label className="block text-[14px] font-semibold text-navy-900">הערה <span className="font-normal text-navy-900/60">(לא חובה)</span>
              <input type="text" className={field} value={v.note || ''} placeholder="למשל: שיפוץ, משפחה" onChange={(e) => setBlock({ ...v, note: e.target.value })} />
            </label>
            <Button onClick={save} disabled={!valid || busy} className="h-12">
              {valid ? `חסימת ${heCount(nights, 'night')}` : 'בחרו יחידה ותאריכים'}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
