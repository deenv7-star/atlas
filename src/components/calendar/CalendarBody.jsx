/**
 * Calendar: ONE calendar per screen (Deen 05.11.2026), with a one-line status above it (CalendarBrief).
 * Desktop: the unit timeline is the calendar, month or week: one row per unit, stays as bars with Booking / Airbnb
 * badges, short gaps highlighted, today marker. An empty cell opens a new booking for that unit and night.
 * Phones: the compact month (tap a day) and an agenda list (arrivals, departures, gaps) below it.
 * Every number is counted from real stays.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Lock, Moon, Plus } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { heCount } from '@/lib/hebrewCount';
import { optimisticEntityClassName } from '@/lib/optimistic/entityVisualState';
import { useIsMobile } from '@/hooks/use-mobile';
import { UnitPhoto } from '@/components/app/atoms';
import {
  HE_DAYS_LONG, HE_DAYS_SHORT, longDay, monthDays, monthKey, monthMatrix, parseIso, rangeSegment, shortDay,
} from '@/lib/calendar/calendarModel';
import { SourceBadge, stayBarDetails, stayLabel } from './shared';
import CalendarBrief from './CalendarBrief';

/* ── compact month: one dot per unit per night ───────────────────────────── */

function CompactMonth({ month, today, units, occ, gapSet, holidays, onDay, selected }) {
  const weeks = useMemo(() => monthMatrix(month), [month]);
  const mk = monthKey(month);
  const many = units.length > 6;
  return (
    <div>
      <div className="grid grid-cols-7 pb-1">
        {HE_DAYS_SHORT.map((d) => (
          <div key={d} className={cn('py-1.5 text-center text-[12px] font-semibold text-navy-900/70')}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 max-md:gap-0.5 max-[359px]:gap-0">
        {weeks.flat().map((d) => {
          const inMonth = d.slice(0, 7) === mk;
          if (!inMonth) return <span key={d} aria-hidden className="h-[52px]" />;
          const isToday = d === today;
          const past = d < today;
          const hol = holidays.get(d);
          const booked = units.filter((u) => occ.get(u.id)?.has(d)).length;
          const free = units.length - booked;
          const dt = parseIso(d);
          const label = `${HE_DAYS_LONG[dt.getDay()]} ${shortDay(d)}${hol ? `, ${hol.map((h) => h.title).join(', ')}` : ''}, ${free === 0 ? 'הכל תפוס' : units.length > 1 ? (free === 1 ? 'יחידה אחת פנויה' : `${free} יחידות פנויות`) : 'פנוי'}`;
          return (
            <button
              key={d}
              type="button"
              data-day={d}
              onClick={() => onDay(d)}
              aria-label={label}
              className={cn(
                'press relative flex h-[52px] min-w-0 flex-col items-center justify-center gap-1 rounded-[16px]',
                isToday ? 'bg-brand-600 text-white' : 'bg-[#F7F8FB] text-navy-900 hover:bg-brand-600/[0.07]',
                selected === d && 'ring-2 ring-navy-900 ring-offset-1',
              )}
              aria-current={selected === d ? 'date' : undefined}
            >
              <span className={cn('text-[15px] leading-none tabular', past && !isToday ? 'font-normal text-navy-900/70' : 'font-semibold')}>{dt.getDate()}</span>
              {many ? (
                <span aria-hidden className={cn('h-1 w-6 overflow-hidden rounded-full', isToday ? 'bg-white/30' : 'bg-navy-900/10')}>
                  <span className={cn('block h-full rounded-full', isToday ? 'bg-white' : 'bg-navy-900')} style={{ width: `${(booked / Math.max(1, units.length)) * 100}%` }} />
                </span>
              ) : (
                <span aria-hidden className="flex items-center gap-[3px]">
                  {units.map((u) => {
                    const on = occ.get(u.id)?.has(d);
                    const gap = gapSet.has(`${u.id}|${d}`);
                    return (
                      <span
                        key={u.id}
                        className={cn('h-[6px] w-[6px] rounded-full',
                          isToday ? (on ? 'bg-white' : 'bg-white/35') : on ? 'bg-navy-900' : gap ? 'bg-white ring-[1.5px] ring-brand-600' : 'bg-navy-900/15')}
                      />
                    );
                  })}
                </span>
              )}
              {hol ? <span aria-hidden className={cn('absolute end-1.5 top-1.5 h-1.5 w-1.5 rounded-full', isToday ? 'bg-white' : 'bg-brand-600/60')} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-navy-900/70', className)}>
      <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-[7px] w-[7px] rounded-full bg-navy-900" />לילה תפוס</span>
      <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-[7px] w-[7px] rounded-full bg-navy-900/15" />פנוי</span>
      <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-[7px] w-[7px] rounded-full bg-white ring-[1.5px] ring-brand-600" />לילה פנוי בין הזמנות</span>
      <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-[7px] w-[7px] rounded-full bg-brand-600/60" />חג</span>
    </div>
  );
}

/* ── timeline: one tall row per unit ─────────────────────────────────────── */

function Timeline({ days, today, units, stays, gapSet, holidays, onCell, focusDay, week = false }) {
  const n = days.length;
  const colMin = week ? 120 : 46;
  const cols = `repeat(${n}, minmax(${colMin}px, 1fr))`;
  const scroller = useRef(null);
  const reduce = useReducedMotion();
  const first = useRef(true);
  useEffect(() => {
    const c = scroller.current;
    const target = focusDay && days.includes(focusDay) ? focusDay : null;
    if (!c || !target) return;
    const cell = c.querySelector(`[data-col="${target}"]`);
    if (!cell) return;
    const cr = c.getBoundingClientRect(); const r = cell.getBoundingClientRect();
    // keep the day a little after the sticky unit column (RTL: the column is on the right)
    const want = cr.right - 196 - cr.width * 0.18;
    c.scrollBy({ left: r.right - want, behavior: first.current || reduce ? 'auto' : 'smooth' });
    first.current = false;
  }, [focusDay, days, reduce]);
  const byUnit = useMemo(() => {
    const m = new Map(units.map((u) => [u.id, []]));
    for (const s of stays) m.get(s.propertyId)?.push(s);
    return m;
  }, [units, stays]);
  const todayIdx = days.indexOf(today);
  return (
    <div className="v7-card overflow-hidden" data-timeline>
      <div ref={scroller} className="overflow-x-auto overscroll-x-contain" tabIndex={-1}>
        <div className="grid" style={{ gridTemplateColumns: '196px minmax(0,1fr)', minWidth: 196 + n * colMin }}>
          {/* header */}
          <div className="sticky right-0 z-20 flex items-end border-b border-l border-navy-900/[0.08] bg-white px-4 pb-2 text-[13px] font-semibold text-navy-900/70">יחידה</div>
          <div className="relative grid border-b border-navy-900/[0.08]" style={{ gridTemplateColumns: cols }}>
            {days.map((d, i) => {
              const dt = parseIso(d);
              const hol = holidays.get(d);
              const wk = dt.getDay() === 5 || dt.getDay() === 6;
              return (
                <div key={d} data-col={d} title={hol ? hol.map((h) => h.title).join(' · ') : undefined} className={cn('flex flex-col items-center pb-2 pt-2.5', wk && 'bg-[#F7F8FB]', focusDay === d && focusDay !== today && 'bg-navy-900/[0.06]')}>
                  <span className={cn('text-[12px]', i === todayIdx ? 'font-semibold text-brand-600' : 'text-navy-900/70')}>{week ? HE_DAYS_LONG[dt.getDay()] : HE_DAYS_SHORT[dt.getDay()]}</span>
                  <span className={cn('mt-1 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-[13px] font-semibold tabular', i === todayIdx ? 'bg-brand-600 text-white' : 'text-navy-900')}>{dt.getDate()}</span>
                  <span aria-hidden className={cn('mt-1 h-1 w-1 rounded-full', hol ? 'bg-brand-600/60' : 'bg-transparent')} />
                </div>
              );
            })}
          </div>

          {units.map((u) => (
            <React.Fragment key={u.id}>
              <div className="sticky right-0 z-10 flex min-h-[84px] items-center gap-3 border-b border-l border-navy-900/[0.08] bg-white px-3">
                <UnitPhoto property={u.raw} className="h-11 w-11 shrink-0" rounded="rounded-[16px]" />
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold text-navy-900">{u.name}</div>
                  <div className="truncate text-[12px] text-navy-900/70">{u.raw?.max_guests ? `עד ${u.raw.max_guests} אורחים` : ''}</div>
                </div>
              </div>
              <div className="relative grid overflow-hidden border-b border-navy-900/[0.08]" style={{ gridTemplateColumns: cols }}>
                {days.map((d) => {
                  const dt = parseIso(d);
                  const wk = dt.getDay() === 5 || dt.getDay() === 6;
                  const gap = gapSet.has(`${u.id}|${d}`);
                  // Deen 05.11: an empty cell opens a new booking for THIS unit and night straight away (no in-between
                  // sheet); a night that is taken opens that booking. Past nights are not offered for new bookings.
                  const stay = (byUnit.get(u.id) || []).find((st) => st.start <= d && st.end > d) || null;
                  const past = d < today;
                  const label = stay
                    ? `${u.name}, ${shortDay(d)}: ${stayLabel(stay)}. פתיחת ההזמנה`
                    : past ? `${u.name}, ${shortDay(d)}: עבר` : `${u.name}, ${shortDay(d)}: פנוי${gap ? ' בין הזמנות' : ''}. הזמנה חדשה`;
                  return (
                    <button
                      key={d}
                      type="button"
                      data-cell=""
                      data-day={d}
                      data-unit={u.id}
                      disabled={past && !stay}
                      onClick={() => onCell(u, d, stay)}
                      aria-label={label}
                      title={stay || past ? undefined : 'הזמנה חדשה'}
                      className={cn('group/cell relative h-full border-l border-navy-900/[0.05]', !past || stay ? 'hover:bg-brand-600/[0.06] cursor-pointer' : 'cursor-default', wk && 'bg-[#F7F8FB]', d === today && 'bg-brand-600/[0.05]')}
                    >
                      {stay || past ? null : (
                        <span aria-hidden className="absolute inset-x-0 bottom-2 mx-auto flex w-max items-center gap-1 text-[12px] font-semibold text-brand-600 opacity-0 transition-opacity duration-150 group-hover/cell:opacity-100 group-focus-visible/cell:opacity-100">
                          <Plus className="h-3.5 w-3.5" />{week ? 'הזמנה' : null}
                        </span>
                      )}
                    </button>
                  );
                })}
                {/* gap nights: dashed pills from mid check-out day to mid next day */}
                {days.map((d, i) => (gapSet.has(`${u.id}|${d}`) ? (
                  <span
                    key={`g-${d}`}
                    aria-hidden
                    className="pointer-events-none absolute top-[8px] flex h-[44px] items-center justify-center rounded-[16px] border border-dashed border-brand-600/60 bg-brand-600/[0.04] text-[12px] font-semibold text-brand-600"
                    style={{ right: `calc(${((i + 0.5) / n) * 100}% + 2px)`, width: `calc(${100 / n}% - 4px)` }}
                  >
                    פנוי
                  </span>
                ) : null))}
                {todayIdx >= 0 ? <span aria-hidden className="pointer-events-none absolute inset-y-0 w-[2px] bg-brand-600/70" style={{ right: `calc(${((todayIdx + 0.5) / n) * 100}% - 1px)` }} /> : null}
                {(byUnit.get(u.id) || []).map((s) => {
                  const seg = rangeSegment(s, days);
                  if (!seg) return null;
                  const w = seg.to - seg.from;
                  const inHouse = s.start <= today && s.end > today && !s.isBlock && !s.pending;
                  // a half-day sliver at the month edge is too narrow to be a target: draw it, let taps reach the day cell
                  const sliver = w < 1;
                  const Bar = sliver ? 'span' : Link;
                  const barProps = sliver
                    ? { 'aria-hidden': true }
                    : { to: `${createPageUrl('BookingDetail')}/${s.id}`, title: `${stayLabel(s)} · ${shortDay(s.start)}–${shortDay(s.end)}` };
                  return (
                    <Bar
                      key={s.id}
                      {...barProps}
                      className={cn('absolute top-[8px] z-10 block h-[44px]', sliver && 'pointer-events-none', optimisticEntityClassName(s.id))}
                      // 05.11 corners: the link spans the full day columns (≥44px at 1440 for a 1-night stay); the drawn bar keeps its 1px inset
                      style={{ right: `${(seg.from / n) * 100}%`, width: `${(w / n) * 100}%` }}
                    >
                      <span className={cn(
                        'press mx-px flex h-full flex-col justify-center gap-0.5 overflow-hidden px-2.5 text-[13px] leading-tight',
                        seg.startsHere ? 'rounded-s-[14px]' : 'rounded-s-[4px]',
                        seg.endsHere ? 'rounded-e-[14px]' : 'rounded-e-[4px]',
                        s.isBlock ? 'bg-[repeating-linear-gradient(135deg,rgba(27,38,86,0.06),rgba(27,38,86,0.06)_5px,rgba(27,38,86,0.11)_5px,rgba(27,38,86,0.11)_10px)] text-navy-900/70'
                          : s.pending ? 'border border-dashed border-brand-600/60 bg-white text-navy-900'
                            : inHouse ? 'bg-brand-600 text-white' : 'bg-[#E9E6FE] text-navy-900 hover:bg-[#DEDAFD]',
                      )}>
                        {w >= 1 ? (
                          <>
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span className="min-w-0 truncate font-semibold">{stayLabel(s)}</span>
                              {w >= 3 && !s.isBlock ? <SourceBadge channel={s.channel} onDark={inHouse} /> : null}
                            </span>
                            {w >= 2 ? (
                              <span className={cn('truncate text-[12px]', inHouse ? 'text-white/80' : 'text-navy-900/70')}>
                                {s.pending ? 'ממתינה לאישור' : s.isBlock ? `עד ${shortDay(s.end)}` : heCount(s.nights, 'night')}
                              </span>
                            ) : null}
                          </>
                        ) : null}
                      </span>
                      {!sliver ? <span className="sr-only">{stayBarDetails(s, u.name, w)}</span> : null}
                    </Bar>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-navy-900/[0.08] px-4 py-3 text-[13px] text-navy-900/70">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-6 rounded-full bg-brand-600" />שוהים עכשיו</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-6 rounded-full bg-[#E9E6FE]" />הזמנה</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-6 rounded-full border border-dashed border-brand-600/60" />ממתינה לאישור</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-6 rounded-full bg-[repeating-linear-gradient(135deg,rgba(27,38,86,0.08),rgba(27,38,86,0.08)_4px,rgba(27,38,86,0.16)_4px,rgba(27,38,86,0.16)_8px)]" />חסום</span>
        <span className="inline-flex items-center gap-1.5"><SourceBadge channel="booking" /><SourceBadge channel="airbnb" />מקור ההזמנה</span>
      </div>
    </div>
  );
}

/* ── agenda (phones) ─────────────────────────────────────────────────────── */

function Agenda({ month, today, units, stays, gaps, holidays, onDay, onNewBooking }) {
  const mk = monthKey(month);
  const from = today.slice(0, 7) === mk ? today : `${mk}-01`;
  const name = (id) => units.find((u) => u.id === id)?.name || '';
  const groups = useMemo(() => {
    const m = new Map();
    const add = (d, item) => { if (d.slice(0, 7) !== mk || d < from) return; if (!m.has(d)) m.set(d, []); m.get(d).push(item); };
    for (const s of stays) {
      if (s.isBlock) { add(s.start, { kind: 'block', s }); continue; }
      add(s.end, { kind: 'out', s });
      add(s.start, { kind: 'in', s });
    }
    for (const g of gaps) add(g.start, { kind: 'gap', g });
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [stays, gaps, mk, from]);
  if (!groups.length) {
    return <p className="v7-card p-5 text-[15px] text-navy-900/70">אין הגעות או יציאות מכאן ועד סוף החודש. נוגעים ביום כדי להוסיף הזמנה.</p>;
  }
  const order = { out: 0, in: 1, block: 2, gap: 3 };
  return (
    <div className="space-y-3">
      <h3 className="px-1 text-[17px] font-bold text-navy-900">{today.slice(0, 7) === mk ? 'מהיום ועד סוף החודש' : 'החודש'}</h3>
      {groups.map(([d, items]) => {
        const hol = holidays.get(d);
        return (
          <section key={d} className="v7-card overflow-hidden" aria-label={longDay(d)}>
            <button type="button" onClick={() => onDay(d)} className="flex min-h-[48px] w-full items-center justify-between gap-2 border-b border-navy-900/[0.06] px-4 text-start">
              <span className="text-[15px] font-semibold text-navy-900">{d === today ? `היום · ${shortDay(d)}` : longDay(d)}</span>
              {hol ? <span className="truncate text-[12px] text-brand-600">{hol[0].title}</span> : null}
            </button>
            <ul>
              {items.sort((a, b) => order[a.kind] - order[b.kind]).map((it) => {
                if (it.kind === 'gap') {
                  const u = units.find((x) => x.id === it.g.propertyId);
                  return (
                    <li key={`gap-${it.g.propertyId}`} className="flex min-h-[60px] items-center gap-3 px-4 py-2">
                      <span aria-hidden className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-brand-600/60 text-brand-600"><Moon className="h-4 w-4" strokeWidth={1.75} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-medium text-navy-900">{heCount(it.g.nights, 'night')} פנויים · {name(it.g.propertyId)}</div>
                        <div className="text-[13px] text-navy-900/70">עד {shortDay(it.g.end)}, בין שתי הזמנות</div>
                      </div>
                      {u ? <button type="button" onClick={() => onNewBooking(u, it.g.start)} className="press inline-flex h-11 shrink-0 items-center gap-1 rounded-full px-3 text-[14px] font-semibold text-brand-600 hover:bg-brand-600/[0.06]"><Plus className="h-4 w-4" aria-hidden />הזמנה</button> : null}
                    </li>
                  );
                }
                const s = it.s;
                const Icon = it.kind === 'in' ? ArrowDownLeft : it.kind === 'out' ? ArrowUpRight : Lock;
                const verb = it.kind === 'in' ? 'מגיעים' : it.kind === 'out' ? 'יוצאים' : 'חסום';
                return (
                  <li key={`${it.kind}-${s.id}`}>
                    <Link to={`${createPageUrl('BookingDetail')}/${s.id}`} className="flex min-h-[60px] items-center gap-3 px-4 py-2 hover:bg-[#F7F8FB]">
                      <span aria-hidden className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full', it.kind === 'in' ? 'bg-brand-600 text-white' : 'bg-[#F7F8FB] text-navy-900')}>
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-[15px] font-medium text-navy-900">{s.isBlock ? `חסום עד ${shortDay(s.end)}` : stayLabel(s)}</span>
                          {!s.isBlock ? <SourceBadge channel={s.channel} /> : null}
                        </div>
                        <div className="truncate text-[13px] text-navy-900/70">
                          {verb === 'חסום' ? name(s.propertyId) : `${verb} · ${name(s.propertyId)} · ${heCount(s.nights, 'night')}`}{s.pending ? ' · ממתינה לאישור' : ''}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default function CalendarBody({ month, days: daysIn, view = 'month', briefVariant = 'a', today, units, stays, occ, gaps, gapSet, holidays, onDay, onNewBooking, onOpenStay }) {
  const mobile = useIsMobile();
  const monthList = useMemo(() => monthDays(month), [month]);
  const days = !mobile && view === 'week' && daysIn?.length ? daysIn : monthList;
  const focusDay = days.includes(today) ? today : days[0];
  const brief = (
    <CalendarBrief variant={briefVariant} view={mobile ? 'month' : view} days={days} today={today} units={units} stays={stays} occ={occ} gaps={gaps} onNewBooking={onNewBooking} />
  );
  // one unit and a free night from today on: straight to the booking form, no sheet in between
  const onMonthDay = (d) => {
    if (units.length === 1 && d >= today && !occ.get(units[0].id)?.has(d)) onNewBooking(units[0], d);
    else onDay(d);
  };
  if (mobile) {
    // phones: one calendar (the month), the status line above it, the month's arrivals and departures below
    return (
      <div className="space-y-4">
        {brief}
        <div className="v7-card p-3 px-1.5 max-[359px]:-mx-5 max-[359px]:rounded-none max-[359px]:px-1">
          <CompactMonth month={month} today={today} units={units} occ={occ} gapSet={gapSet} holidays={holidays} onDay={onMonthDay} />
          <Legend className="mt-3 px-1" />
        </div>
        <Agenda month={month} today={today} units={units} stays={stays} gaps={gaps} holidays={holidays} onDay={onDay} onNewBooking={onNewBooking} />
      </div>
    );
  }
  // desktop (Deen 05.11): ONE calendar. The small month grid and the facts card are gone; the status line sits above
  // the unit timeline, which is the calendar (month or week).
  const onCell = (u, d, stay) => {
    if (stay) onOpenStay(stay);
    else if (d >= today) onNewBooking(u, d);
  };
  return (
    <div className="space-y-4">
      {brief}
      <Timeline days={days} today={today} units={units} stays={stays} gapSet={gapSet} holidays={holidays} onCell={onCell} focusDay={focusDay} week={view === 'week'} />
    </div>
  );
}
