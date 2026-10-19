/**
 * לוח שנה (calendar v2): a real month calendar instead of the thin two-week strip.
 * The page owns the month, unit filter, sync and the day / block dialogs; the body component draws the month.
 */
import HelpHint from '@/components/help/HelpHint';
import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarRange, Plus, RefreshCw } from 'lucide-react';
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
import { monthKey, monthStart, shiftMonth, todayIso } from '@/lib/calendar/calendarModel';
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

  const go = useCallback((n) => {
    setDir(n);
    const next = shiftMonth(month, n);
    void setUrlState({ date: monthKey(next) === monthKey(new Date()) ? null : next });
  }, [month, setUrlState]);
  const goPrev = useCallback(() => go(-1), [go]);
  const goNext = useCallback(() => go(1), [go]);
  const goToday = useCallback(() => { setDir(month < new Date() ? 1 : -1); void setUrlState({ date: null }); }, [month, setUrlState]);
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
      if (bad || conf) atlasToastApi.error(`סונכרנו ${rs.length - bad} מתוך ${rs.length} ערוצים${conf ? `, ${conf} התנגשויות` : ''}. הפרטים במסך החיבורים`);
      else atlasToastApi.success(added ? `הערוצים סונכרנו, ${added} עדכונים ביומן` : 'הערוצים סונכרנו, אין שינויים');
    } catch (e) {
      atlasToastApi.error(e.message || 'לא הצלחנו לעדכן את הלוח. נסו שוב.');
    } finally {
      setSyncing(false);
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['calendar-syncs'] });
    }
  }, [navigate, qc]);

  const empty = !data.isLoading && data.allUnits.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 pb-16 pt-6 md:px-8 md:pt-9 xl:px-10" dir="rtl">
      <header className="v5-rise mb-5 flex flex-row items-end justify-between gap-3 md:mb-6">
        <div>
          <h1 className="flex items-center gap-1 text-[32px] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy-900 md:text-[34px]">לוח שנה<HelpHint id="calendar.page" /></h1>
          <p className="mt-2 hidden text-[15px] text-navy-900/60 md:block">נוגעים ביום כדי להוסיף הזמנה או לחסום תאריכים.</p>
        </div>
        <div className="flex items-center gap-1">
          <HelpHint id="calendar.sync" />
          <Button variant="outline" onClick={handleSync} disabled={syncing} aria-label="סנכרון ערוצים" className="w-11 px-0 sm:w-auto sm:px-5">
            <RefreshCw className={cn(syncing && 'animate-spin')} aria-hidden />
            <span className="hidden sm:inline">סנכרון ערוצים</span>
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
          <MonthToolbar month={month} onPrev={goPrev} onNext={goNext} onToday={goToday} isCurrent={isCurrent}>
            <UnitFilter units={data.allUnits} value={propertyId} onChange={(id) => void setUrlState({ propertyId: id })} />
          </MonthToolbar>

          {data.isError ? (
            <div className="v7-card p-4"><ErrorFallback /></div>
          ) : data.isLoading ? (
            <div className="v7-card space-y-3 p-5" aria-busy="true" aria-label="טוען את הלוח">
              {Array.from({ length: 6 }, (_, i) => <SkelLine key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <ErrorBoundary section="calendar-view" variant="inline" resetKey={`${monthKey(month)}-${propertyId ?? 'all'}`}>
              <div {...swipe} data-tour="calendar-grid">
                <MonthTransition monthKey={`${monthKey(month)}-${propertyId ?? 'all'}`} dir={dir}>
                  <CalendarBody
                    month={month}
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
