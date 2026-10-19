/**
 * Calendar v2 · version A: full month grid.
 * Sunday-first weeks (RTL), one lane per unit inside every week, stays as color-neutral bars that start
 * mid-cell on check-in and end mid-cell on check-out. Every day cell is a button (add booking / block).
 * Free units per night are counted from real stays; short gaps between stays get a dashed "פנוי" pill.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { heCount } from '@/lib/hebrewCount';
import { optimisticEntityClassName } from '@/lib/optimistic/entityVisualState';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  HE_DAYS_LONG, HE_DAYS_SHORT, HE_MONTHS, freeUnitsOn, monthMatrix, monthKey, parseIso, shortDay, weekSegment,
} from '@/lib/calendar/calendarModel';
import { SourceBadge, stayAria, stayLabel } from './shared';

function laneMetrics(n) {
  if (n <= 1) return { lane: 34, laneSm: 26 };
  if (n <= 3) return { lane: 30, laneSm: 22 };
  if (n <= 6) return { lane: 26, laneSm: 18 };
  return { lane: 22, laneSm: 15 };
}

export default function CalendarBody({ month, today, units, stays, occ, gaps, gapSet, holidays, onDay, onNewBooking }) {
  const weeks = useMemo(() => monthMatrix(month), [month]);
  const mobile = useIsMobile();
  const mk = monthKey(month);
  const multi = units.length > 1;
  const { lane, laneSm } = laneMetrics(units.length);
  const staysByUnit = useMemo(() => {
    const m = new Map(units.map((u) => [u.id, []]));
    for (const s of stays) m.get(s.propertyId)?.push(s);
    return m;
  }, [units, stays]);
  const monthGaps = useMemo(() => gaps.filter((g) => g.start.slice(0, 7) === mk || g.end.slice(0, 7) === mk), [gaps, mk]);
  const unitName = (id) => units.find((u) => u.id === id)?.name || '';

  return (
    <div className="space-y-4">
      <div
        className="v7-card overflow-hidden"
        style={{ '--lane': `${laneSm}px` }}
      >
        <div className="md:[--lane:var(--lane-md)]" style={{ '--lane-md': `${lane}px` }}>
          {/* weekday header */}
          <div className={cn('grid border-b border-navy-900/[0.08]', multi ? 'md:grid-cols-[132px_minmax(0,1fr)]' : '')}>
            {multi ? <div className="hidden md:block" /> : null}
            <div className="grid grid-cols-7">
              {HE_DAYS_LONG.map((d, i) => (
                <div key={d} className={cn('py-2.5 text-center text-[12px] font-semibold text-navy-900/70 md:text-[13px]', (i === 5 || i === 6) && 'bg-[#F7F8FB]')}>
                  <span className="md:hidden">{HE_DAYS_SHORT[i]}</span>
                  <span className="hidden md:inline">{d}</span>
                </div>
              ))}
            </div>
          </div>

          {multi ? (
            <p className="border-b border-navy-900/[0.08] px-3 py-2 text-[12px] text-navy-900/70 md:hidden">
              שורה לכל יחידה, מלמעלה למטה: {units.map((u) => u.name).join(' · ')}
            </p>
          ) : null}
          {weeks.map((week) => (
            <div key={week[0]} className={cn('grid border-b border-navy-900/[0.08] last:border-b-0', multi ? 'md:grid-cols-[132px_minmax(0,1fr)]' : '')}>
              {multi ? (
                <div aria-hidden className="hidden border-l border-navy-900/[0.08] bg-white pt-[34px] md:block">
                  {units.map((u) => (
                    <div key={u.id} className="flex items-center truncate pe-2 ps-4 text-[13px] text-navy-900/70" style={{ height: 'var(--lane)' }}>{u.name}</div>
                  ))}
                </div>
              ) : null}
              <div className="relative" style={{ minHeight: `calc(34px + ${units.length} * var(--lane) + 26px)` }}>
                {/* day cells (tap targets) */}
                <div className="absolute inset-0 grid grid-cols-7">
                  {week.map((d, i) => {
                    const inMonth = d.slice(0, 7) === mk;
                    const isToday = d === today;
                    const past = d < today;
                    const hol = holidays.get(d);
                    const yomtov = hol?.some((h) => h.yomtov);
                    const free = freeUnitsOn(occ, units, d);
                    const dt = parseIso(d);
                    const label = `${HE_DAYS_LONG[dt.getDay()]} ${shortDay(d)}${hol ? `, ${hol.map((h) => h.title).join(', ')}` : ''}${past ? '' : `, ${free === 0 ? 'אין יחידות פנויות' : multi ? `${heCount(free, 'unit')} פנויות` : 'פנוי'}`}`;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => onDay(d)}
                        data-day={d}
                        aria-label={label}
                        className={cn(
                          'group/cell relative flex flex-col items-stretch border-l border-navy-900/[0.06] text-start last:border-l-0 hover:bg-brand-600/[0.03] focus-visible:z-20',
                          (i === 5 || i === 6 || !inMonth) && 'bg-[#F7F8FB]',
                          yomtov && 'bg-brand-600/[0.035]',
                          isToday && 'bg-brand-600/[0.05]',
                        )}
                      >
                        <span className="flex h-[34px] items-center gap-1.5 px-1.5 md:px-2.5">
                          <span className={cn(
                            'inline-flex h-7 min-w-7 items-center justify-center rounded-full text-[14px] tabular',
                            isToday ? 'bg-brand-600 px-1 font-semibold text-white' : inMonth && !past ? 'font-semibold text-navy-900' : 'font-normal text-navy-900/70',
                          )}>{dt.getDate()}{!inMonth && dt.getDate() === 1 ? <span className="ms-1 hidden text-[12px] md:inline">{HE_MONTHS[dt.getMonth()]}</span> : null}</span>
                          {hol ? (
                            <>
                              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600/50 md:hidden" />
                              <span aria-hidden className={cn('hidden truncate text-[12px] md:inline', 'text-brand-600')}>{hol[0].title}</span>
                            </>
                          ) : null}
                          {isToday ? <span className="sr-only">היום</span> : null}
                        </span>
                        <span className="flex-1" />
                        <span aria-hidden className={cn('flex h-[26px] items-center px-1.5 text-[11px] font-semibold md:px-2.5 md:text-[12px]')}>
                          {past || !inMonth ? null : free === 0 ? <span className="text-navy-900/70">מלא</span> : (
                            <span className="text-brand-600">{multi ? <><span className="tabular">{free}</span><span className="hidden sm:inline"> פנויות</span></> : 'פנוי'}</span>
                          )}
                          <Plus className="ms-auto hidden h-4 w-4 text-brand-600 opacity-0 transition-opacity duration-150 group-hover/cell:opacity-100 md:block" />
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* lanes: one per unit */}
                <div className="pointer-events-none absolute inset-x-0 top-[34px]">
                  {units.map((u) => (
                    <div key={u.id} className="relative overflow-hidden" style={{ height: 'var(--lane)' }}>
                      {week.map((d, i) => (gapSet.has(`${u.id}|${d}`) && d.slice(0, 7) === mk ? (
                        <span
                          key={`g-${d}`}
                          aria-hidden
                          className="absolute inset-y-[3px] rounded-full border border-dashed border-brand-600/50 bg-white"
                          style={{ right: `calc(${((i + 0.5) / 7) * 100}% + 2px)`, width: `calc(${100 / 7}% - 4px)` }}
                        >
                          <span className="hidden h-full items-center justify-center text-[11px] font-semibold text-brand-600 md:flex">פנוי</span>
                        </span>
                      ) : null))}
                      {(staysByUnit.get(u.id) || []).map((s) => {
                        const seg = weekSegment(s, week);
                        if (!seg) return null;
                        const width = seg.to - seg.from;
                        const Bar = mobile ? 'span' : Link;
                        const barProps = mobile
                          ? { 'aria-hidden': true }
                          : { to: `${createPageUrl('BookingDetail')}/${s.id}`, 'aria-label': stayAria(s, multi ? u.name : ''), title: `${stayLabel(s)}${multi ? ` · ${u.name}` : ''}` };
                        const showText = width >= 1 || seg.startsHere;
                        return (
                          <Bar
                            key={s.id}
                            {...barProps}
                            className={cn('absolute inset-y-[2px] z-10 block', !mobile && 'pointer-events-auto', optimisticEntityClassName(s.id))}
                            style={{ right: `calc(${(seg.from / 7) * 100}% + 1px)`, width: `calc(${(width / 7) * 100}% - 2px)` }}
                          >
                            <span className={cn(
                              'press flex h-full items-center gap-1.5 overflow-hidden px-2 text-[12px] font-semibold leading-none md:text-[13px]',
                              seg.startsHere ? 'rounded-s-full' : 'rounded-s-[4px]',
                              seg.endsHere ? 'rounded-e-full' : 'rounded-e-[4px]',
                              s.isBlock ? 'bg-[repeating-linear-gradient(135deg,rgba(27,38,86,0.06),rgba(27,38,86,0.06)_5px,rgba(27,38,86,0.11)_5px,rgba(27,38,86,0.11)_10px)] text-navy-900/70'
                                : s.pending ? 'border border-dashed border-brand-600/60 bg-white text-navy-900'
                                  : s.start <= today && s.end > today ? 'bg-brand-600 text-white'
                                    : 'bg-[#E9E6FE] text-navy-900 hover:bg-[#DEDAFD]',
                            )}>
                              {showText ? <span className="min-w-0 truncate">{stayLabel(s)}</span> : null}
                              {width >= 2.5 && !s.isBlock ? <SourceBadge channel={s.channel} onDark={s.start <= today && s.end > today && !s.pending} className="hidden md:inline-flex" /> : null}
                            </span>
                          </Bar>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-navy-900/[0.08] px-4 py-3 text-[13px] text-navy-900/70">
          <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-6 rounded-full bg-brand-600" />שוהים עכשיו</span>
          <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-6 rounded-full bg-[#E9E6FE]" />הזמנה</span>
          <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-6 rounded-full border border-dashed border-brand-600/60" />ממתינה לאישור</span>
          <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-6 rounded-full bg-[repeating-linear-gradient(135deg,rgba(27,38,86,0.08),rgba(27,38,86,0.08)_4px,rgba(27,38,86,0.16)_4px,rgba(27,38,86,0.16)_8px)]" />חסום</span>
          <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-6 rounded-full border border-dashed border-brand-600/50 bg-white" />לילה פנוי בין הזמנות</span>
        </div>
      </div>

      <section className="v7-card p-5" aria-labelledby="gaps-a">
        <h2 id="gaps-a" className="text-[17px] font-bold text-navy-900">לילות פנויים בין הזמנות</h2>
        <p className="text-[14px] text-navy-900/70">{monthGaps.length ? 'חלונות קצרים שעוד אפשר למכור החודש' : 'אין החודש לילות בודדים שנשארו באמצע'}</p>
        {monthGaps.length ? (
          <ul className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {monthGaps.map((g) => {
              const u = units.find((x) => x.id === g.propertyId);
              return (
                <li key={`${g.propertyId}-${g.start}`} className="flex min-h-[64px] items-center gap-3 rounded-[16px] bg-[#F7F8FB] px-4 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-navy-900">{unitName(g.propertyId)}</div>
                    <div className="text-[13px] text-navy-900/70">{shortDay(g.start)} – {shortDay(g.end)} · {heCount(g.nights, 'night')}</div>
                  </div>
                  {u ? (
                    <Button variant="ghost" className="h-11 shrink-0" onClick={() => onNewBooking(u, g.start)} aria-label={`הזמנה חדשה ב${u.name} מ-${shortDay(g.start)}`}>
                      <Plus aria-hidden />הזמנה
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

