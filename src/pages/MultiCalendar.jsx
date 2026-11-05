/**
 * לוח שנה (calendar v2): a real month calendar instead of the thin two-week strip.
 * The page owns the month, unit filter, sync and the day / block dialogs; the body component draws the month.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarRange, Lock, Plus, RefreshCw } from 'lucide-react';
import { callEdge } from '@/lib/real/edge';
import { DB_FEATURES } from '@/config/dbFeatures';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { EmptyState as DsEmptyState } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { ErrorFallback } from '@/components/common/ErrorFallback';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SkelLine } from '@/components/ds';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { useCalendarUrlState } from '@/hooks/url-state/useCalendarUrlState';
import { useCalendarData } from '@/hooks/useCalendarData';
import { addDaysIso, iso, monthKey, monthStart, parseIso, shiftMonth, todayIso, HE_MONTHS } from '@/lib/calendar/calendarModel';
import { useIsMobile } from '@/hooks/use-mobile';
import { briefVariant } from '@/components/calendar/CalendarBrief';
import {
  BlockDialog, DaySheet, MonthToolbar, MonthTransition, UnitFilter, useDayActions, useMonthSwipe,
} from '@/components/calendar/shared';
import CalendarBody from '@/components/calendar/CalendarBody';

export default function MultiCalendar({ selectedPropertyId }) {
  const { date: urlDate, propertyId: urlPropertyId, setUrlState } = useCalendarUrlState();
  const propertyId = urlPropertyId ?? selectedPropertyId ?? null;
  const month = useMemo(() => monthStart(urlDate ? new Date(urlDate) : new Date()), [urlDate]);
  const isCurrent = monthKey(month) === monthKey(new Date());
  const [dir, setDir] = useState(1);

  const data = useCalendarData({ propertyId });
  const actions = useDayActions();
  const today = todayIso();
  const mobile = useIsMobile();
  const navigateTo = useNavigate();
  const brief = useMemo(() => briefVariant(), []);

  // Desktop shows one calendar, by month or by week (remembered on the device). Phones always show the month.
  const [view, setViewState] = useState(() => { try { return localStorage.getItem('atlas-cal-view') === 'week' ? 'week' : 'month'; } catch { return 'month'; } });
  const setView = (v) => { setViewState(v); try { localStorage.setItem('atlas-cal-view', v); } catch { /* private mode */ } };
  const weekOf = (isoDay) => { const d = parseIso(isoDay); d.setDate(d.getDate() - d.getDay()); return iso(d); };
  const [weekStart, setWeekStart] = useState(() => weekOf(today));
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i)), [weekStart]);
  const isWeek = view === 'week' && !mobile;
  const weekTitle = (() => {
    const a = parseIso(weekDays[0]); const z = parseIso(weekDays[6]);
    return a.getMonth() === z.getMonth()
      ? `${a.getDate()}–${z.getDate()} ב${HE_MONTHS[z.getMonth()]} ${z.getFullYear()}`
      : `${a.getDate()} ב${HE_MONTHS[a.getMonth()]}–${z.getDate()} ב${HE_MONTHS[z.getMonth()]}`;
  })();

  const go = useCallback((n) => {
    setDir(n);
    const next = shiftMonth(month, n);
    void setUrlState({ date: monthKey(next) === monthKey(new Date()) ? null : next });
  }, [month, setUrlState]);
  const goWeek = useCallback((n) => {
    setDir(n);
    setWeekStart((w) => {
      const next = addDaysIso(w, 7 * n);
      // keep the month in the address in step, so switching back to month view lands on the same month
      const m = monthStart(parseIso(addDaysIso(next, 3)));
      void setUrlState({ date: monthKey(m) === monthKey(new Date()) ? null : m });
      return next;
    });
  }, [setUrlState]);
  const goPrev = useCallback(() => (isWeek ? goWeek(-1) : go(-1)), [go, goWeek, isWeek]);
  const goNext = useCallback(() => (isWeek ? goWeek(1) : go(1)), [go, goWeek, isWeek]);
  const goToday = useCallback(() => {
    setDir(month < new Date() ? 1 : -1); setWeekStart(weekOf(today)); void setUrlState({ date: null });
  }, [month, setUrlState, today]);
  const switchView = (v) => {
    if (v === 'week') {
      // the week that holds today when this month is on screen, otherwise the month's first week
      setWeekStart(weekOf(isCurrent ? today : iso(month)));
    }
    setView(v);
  };
  const swipe = useMonthSwipe(goNext, goPrev);

  const qc = useQueryClient();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  // Real channel sync (014): pulls every connected iCal feed on the server, then reloads the calendar.
  const handleSync = useCallback(async () => {
    if (!DB_FEATURES.realCore) { navigate('/integrations'); return; }
    setSyncing(true);
    try {
      const res = await callEdge('ical-sync', {});
      const rs = res?.results || [];
      if (!rs.length) {
        atlasToastApi.success('עוד לא חיברתם ערוצים. מעבירים אתכם לחיבור Airbnb ו-Booking.com');
        navigate('/integrations');
        return;
      }
      const bad = rs.filter((r) => !r.ok).length;
      const conf = rs.reduce((n, r) => n + (r.conflicts || 0), 0);
      const added = rs.reduce((n, r) => n + (r.created || 0) + (r.updated || 0), 0);
      if (bad || conf) atlasToastApi.error(`עודכנו ${rs.length - bad} מתוך ${rs.length} ערוצים${conf ? `, ${conf} חפיפות` : ''}. הפרטים במסך החיבורים`);
      else atlasToastApi.success(added ? `הלוח עודכן: ${added} שינויים מהערוצים` : 'הלוח מעודכן. אין שינויים');
    } catch (e) {
      atlasToastApi.error(e.message || 'לא הצלחנו לעדכן את הלוח. נסו שוב.');
    } finally {
      setSyncing(false);
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['calendar-syncs'] });
    }
  }, [navigate, qc]);

  const empty = !data.isLoading && !data.loadFailed && data.allUnits.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 pb-16 pt-6 md:px-8 md:pt-9 xl:px-10" dir="rtl">
      <header className="v5-rise mb-5 flex flex-row items-end justify-between gap-3 md:mb-6">
        <div>
          <h1 className="flex items-center gap-1 text-[26px] font-extrabold leading-[1.2] tracking-[-0.02em] text-navy-900">יומן</h1>
          <p className="mt-2 hidden text-[15px] text-navy-900/70 md:block">לוחצים על יום פנוי כדי להוסיף הזמנה.</p>
        </div>
        <div className="flex items-center gap-2">
          {empty ? null : (
            <Button variant="outline" onClick={() => actions.newBlock(propertyId || (data.allUnits.length === 1 ? data.allUnits[0].id : null), today)} aria-label="חסימת תאריכים" className="w-11 px-0 sm:w-auto sm:px-5">
              <Lock aria-hidden />
              <span className="hidden sm:inline">חסימת תאריכים</span>
            </Button>
          )}
          <Button variant="outline" onClick={handleSync} disabled={syncing} aria-label="עדכון מהערוצים" className="w-11 px-0 sm:w-auto sm:px-5">
            <RefreshCw className={cn(syncing && 'animate-spin')} aria-hidden />
            <span className="hidden sm:inline">עדכון מהערוצים</span>
          </Button>
        </div>
      </header>

      {empty ? (
        <div className="v7-card">
          <DsEmptyState
            photo="/demo/units/unit-2.webp"
            icon={CalendarRange}
            title="הוסיפו את היחידה הראשונה"
            description="אחרי שתוסיפו יחידות, כל הזמנה מכל ערוץ תופיע כאן בלוח אחד."
            action={<Button asChild><Link to={createPageUrl('Onboarding')}><Plus aria-hidden />הוספת יחידה</Link></Button>}
          />
        </div>
      ) : (
        <>
          <MonthToolbar month={month} onPrev={goPrev} onNext={goNext} onToday={goToday}
            isCurrent={isWeek ? weekDays.includes(today) : isCurrent}
            title={isWeek ? weekTitle : null} unit={isWeek ? 'week' : 'month'}
            view={mobile ? null : view} onView={switchView}>
            <UnitFilter units={data.allUnits} value={propertyId} onChange={(id) => void setUrlState({ propertyId: id })} />
          </MonthToolbar>

          {data.loadFailed ? (
            <div className="v7-card p-4"><ErrorFallback onRetry={() => data.refetch()} /></div>
          ) : data.isLoading ? (
            <div role="status" className="v7-card space-y-3 p-5" aria-busy="true" aria-label="טוען את הלוח">
              {Array.from({ length: 6 }, (_, i) => <SkelLine key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <ErrorBoundary section="calendar-view" variant="inline" resetKey={`${monthKey(month)}-${propertyId ?? 'all'}`}>
              <div {...swipe} data-tour="calendar-grid">
                <MonthTransition monthKey={`${isWeek ? weekStart : monthKey(month)}-${propertyId ?? 'all'}`} dir={dir}>
                  <CalendarBody
                    month={month}
                    days={isWeek ? weekDays : null}
                    view={isWeek ? 'week' : 'month'}
                    briefVariant={brief}
                    onOpenStay={(st) => navigateTo(`${createPageUrl('BookingDetail')}/${st.id}`)}
                    today={today}
                    units={data.units}
                    stays={data.stays}
                    occ={data.occ}
                    gaps={data.gaps}
                    gapSet={data.gapSet}
                    holidays={data.holidays}
                    onDay={actions.openDay}
                    onNewBooking={actions.newBooking}
                  />
                </MonthTransition>
              </div>
            </ErrorBoundary>
          )}
        </>
      )}

      <DaySheet actions={actions} units={data.units} stays={data.stays} holidays={data.holidays} />
      <BlockDialog actions={actions} units={data.allUnits} />
    </div>
  );
}
