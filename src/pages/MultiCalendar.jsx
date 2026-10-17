import React, { useState, useMemo, useCallback } from 'react';
import { addDays, subDays, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { CalendarRange, ChevronLeft, ChevronRight, Plus, RefreshCw, ArrowUpLeft, GanttChart, ListTodo } from 'lucide-react';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { SegmentedControl, EmptyState as DsEmptyState, fmtMoney } from '@/components/ds';
import { cn } from '@/lib/utils';
import { optimisticEntityClassName } from '@/lib/optimistic/entityVisualState';
import { createPageUrl } from '@/utils';
import { useBookings } from '@/data/entities';
import { useProperties } from '@/data/entities';
import { Button } from '@/components/ui/button';
import { ErrorFallback } from '@/components/common/ErrorFallback';
import { SkeletonCalendar } from '@/components/skeletons/atlas-skeletons';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useCalendarUrlState } from '@/hooks/url-state/useCalendarUrlState';
import { UnitPhoto, GuestAvatar, guestInitials } from '@/components/app/atoms';
import { DPage, DSplit, DTitle, Tag } from '@/components/app/DSplit';
import { isActiveBooking, checkOutOf } from '@/lib/stay/bookings';
import { nightsBetween, formatDayHe } from '@/lib/stay/format';
import { checkInTime, checkOutTime } from '@/components/today/TodayBoard';

const CHANNELS = {
  airbnb: { label: 'Airbnb', color: '#EF5B5B' },
  booking: { label: 'Booking.com', color: '#1B2656' },
  direct: { label: 'ישיר', color: '#3E2BF1' },
  blocked: { label: 'חסום', color: '#8C93AB' },
};

const DOTS = ['#3E2BF1'];

function mapSourceToChannel(source) {
  const s = (source || 'direct').toLowerCase();
  if (s.includes('airbnb')) return 'airbnb';
  if (s.includes('booking')) return 'booking';
  return 'direct';
}

function transformBookings(rawBookings, properties) {
  return rawBookings
    .filter(b => b.check_in_date && b.property_id)
    .map(b => {
      const startDate = new Date(b.check_in_date);
      const nights = b.nights || 1;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + nights);
      return {
        id: b.id,
        propertyId: b.property_id,
        guest: b.guest_name || '',
        channel: mapSourceToChannel(b.source || b.booking_source),
        startDate,
        endDate,
        nights,
        amount: parseFloat(b.total_price) || 0,
        status: b.status === 'CANCELLED' ? 'בוטל' : ['APPROVED','CONFIRMED','CHECKED_IN'].includes(b.status) ? 'מאושר' : 'ממתין',
      };
    });
}

const HEB_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function formatHebrewDate(d) {
  const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  return `${d.getDate()} ב${months[d.getMonth()]}`;
}

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function ChannelDot({ channel, size = 8 }) {
  const ch = CHANNELS[channel];
  if (!ch) return null;
  if (channel === 'blocked') {
    return (
      <span
        className="inline-block rounded-full flex-shrink-0"
        style={{
          width: size, height: size,
          background: `repeating-linear-gradient(45deg, #9CA3AF, #9CA3AF 2px, #D1D5DB 2px, #D1D5DB 4px)`,
        }}
      />
    );
  }
  return <span className="inline-block rounded-full flex-shrink-0" style={{ width: size, height: size, backgroundColor: ch.color }} />;
}

const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** What happens in every unit on one day: departures (morning), stays, arrivals (afternoon), free units. */
function buildAgenda(rawBookings, properties, day) {
  const rows = [];
  for (const prop of properties) {
    const mine = (rawBookings || []).filter((b) => b.property_id === prop.id && isActiveBooking(b) && b.check_in_date);
    const out = mine.find((b) => checkOutOf(b) === day);
    const inn = mine.find((b) => b.check_in_date === day);
    const stay = mine.find((b) => b.check_in_date < day && checkOutOf(b) > day);
    if (out) rows.push({ key: `o-${out.id}`, order: 0, time: checkOutTime(out, prop.raw), kind: 'out', booking: out, prop });
    if (stay) {
      const n = Math.max(1, nightsBetween(stay.check_in_date, checkOutOf(stay)));
      rows.push({ key: `s-${stay.id}`, order: 1, time: 'כל היום', kind: 'stay', booking: stay, prop, night: nightsBetween(stay.check_in_date, day) + 1, nights: n });
    }
    if (inn) rows.push({ key: `i-${inn.id}`, order: 2, time: checkInTime(inn, prop.raw), kind: 'in', booking: inn, prop });
    if (!stay && !inn) rows.push({ key: `f-${prop.id}`, order: 3, time: 'פנויה', kind: 'free', prop });
  }
  return rows.sort((a, b) => a.order - b.order || String(a.time).localeCompare(String(b.time)));
}

const KIND = {
  out: { tag: 'יציאה', tone: 'lilac' },
  stay: { tag: 'בשהייה', tone: 'indigo' },
  in: { tag: 'כניסה', tone: 'sky' },
  free: { tag: 'פנויה הלילה', tone: 'slate' },
};

function AgendaList({ rows, onAdd, dayLabel }) {
  if (!rows.length) return <p className="d-card px-5 py-8 text-center text-[15px] text-ink-600">אין יחידות להצגה.</p>;
  return (
    <ol className="space-y-3" aria-label={`מה קורה ב${dayLabel}`}>
      {rows.map((r) => {
        const k = KIND[r.kind];
        const b = r.booking;
        return (
          <li key={r.key} className="d-line flex gap-3">
            <div className="flex w-[56px] shrink-0 flex-col items-center pt-5">
              <span className={cn('text-center text-[14px] font-bold leading-tight', /^\d/.test(r.time) ? 'tabular text-navy-900' : 'text-[12px] font-medium text-ink-400')}>{r.time === 'פנויה' ? '' : r.time}</span>
            </div>
            {r.kind === 'free' ? (
              <div className="flex min-h-[76px] min-w-0 flex-1 items-center gap-3 rounded-[22px] border-2 border-dashed border-[#DDE0EC] px-4 py-3">
                <UnitPhoto property={r.prop.raw} className="h-11 w-11" rounded="rounded-[14px]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-navy-900">{r.prop.name}</p>
                  <p className="text-[13px] text-ink-400">{k.tag}</p>
                </div>
                <Button variant="secondary" className="h-11 px-4 text-[14px]" onClick={() => onAdd(r.prop)}><Plus />הזמנה</Button>
              </div>
            ) : (
              <Link to={`${createPageUrl('BookingDetail')}/${b.id}`} className="press d-card d-lift flex min-w-0 flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2">
                  <Tag tone={k.tone}>{k.tag}</Tag>
                  <span aria-hidden className="v7-arrow inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F9] text-navy-900"><ArrowUpLeft className="h-4 w-4" strokeWidth={1.9} /></span>
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <GuestAvatar name={b.guest_name || 'אורח'} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-bold text-navy-900">{b.guest_name || 'אורח'}</p>
                    <p className="truncate text-[13px] text-ink-400">{r.prop.name}{r.kind === 'stay' ? ` · לילה ${r.night} מתוך ${r.nights}` : b.nights ? ` · ${b.nights} לילות` : ''}</p>
                  </div>
                </div>
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function MultiCalendar({ selectedPropertyId }) {
  const { view: viewMode, date: urlDate, propertyId: urlPropertyId, setUrlState } = useCalendarUrlState();
  const [channelFilter, setChannelFilter] = useState('all');
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [syncing, setSyncing] = useState(false);
  const [selDay, setSelDay] = useState(() => isoOf(startOfDay(new Date())));
  const [phoneGrid, setPhoneGrid] = useState(false);

  const effectivePropertyId = urlPropertyId ?? selectedPropertyId ?? null;
  const filters = useMemo(
    () => (effectivePropertyId ? { property_id: effectivePropertyId } : {}),
    [effectivePropertyId],
  );

  const anchorDate = useMemo(
    () => (urlDate ? startOfDay(urlDate) : startOfDay(new Date())),
    [urlDate],
  );
  const { data: rawBookings = [], isLoading: bookingsLoading, isError: bookingsError } = useBookings(
    filters,
    '-created_at',
    300,
  );
  const { data: rawProperties = [], isLoading: propertiesLoading } = useProperties();

  const properties = useMemo(() => rawProperties.map((p, i) => ({
    id: p.id,
    name: p.name || `נכס ${i + 1}`,
    dot: DOTS[i % DOTS.length],
    type: p.type || 'דירה',
    beds: p.beds || 2,
    raw: p,
  })), [rawProperties]);

  const agenda = useMemo(() => buildAgenda(rawBookings, properties, selDay), [rawBookings, properties, selDay]);
  const selLabel = formatDayHe(selDay);

  const totalDays = viewMode === 'week' ? 14 : viewMode === 'day' ? 7 : 30;

  const baseDate = useMemo(() => new Date(anchorDate), [anchorDate]);

  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [baseDate, totalDays]);

  const bookings = useMemo(() => transformBookings(rawBookings, properties), [rawBookings, properties]);
  const stripDays = useMemo(() => {
    const t = startOfDay(new Date());
    return Array.from({ length: 14 }, (_, i) => addDays(t, i));
  }, []);

  const filteredBookings = useMemo(() => {
    if (channelFilter === 'all') return bookings;
    return bookings.filter(b => b.channel === channelFilter);
  }, [bookings, channelFilter]);

  const goToday = useCallback(() => {
    void setUrlState({ date: null });
  }, [setUrlState]);
  const goPrev = useCallback(() => {
    void setUrlState({ date: subDays(anchorDate, totalDays) });
  }, [anchorDate, setUrlState, totalDays]);
  const goNext = useCallback(() => {
    void setUrlState({ date: addDays(anchorDate, totalDays) });
  }, [anchorDate, setUrlState, totalDays]);

  const handleSync = useCallback(() => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  }, []);

  const isToday = (d) => {
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  function getBookingsForProperty(propertyId) {
    return filteredBookings.filter(b => b.propertyId === propertyId);
  }

  function getBookingPosition(booking) {
    const startDiff = daysBetween(baseDate, booking.startDate);
    const endDiff = daysBetween(baseDate, booking.endDate);
    const clampStart = Math.max(0, startDiff);
    const clampEnd = Math.min(totalDays, endDiff);
    if (clampStart >= totalDays || clampEnd <= 0) return null;
    return { start: clampStart, span: clampEnd - clampStart };
  }

  function handleBookingHover(e, booking) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredBooking(booking);
  }

  const gaps = useMemo(() => {
    const result = [];
    properties.forEach(prop => {
      const propBookings = bookings
        .filter(b => b.propertyId === prop.id && b.channel !== 'blocked')
        .sort((a, b) => a.startDate - b.startDate);

      for (let i = 0; i < propBookings.length - 1; i++) {
        const gapStart = propBookings[i].endDate;
        const gapEnd = propBookings[i + 1].startDate;
        const nights = daysBetween(gapStart, gapEnd);
        // Only windows that can still be sold: they end after today (the part from today on counts).
        const today0 = startOfDay(new Date());
        if (gapEnd <= today0) continue;
        if (nights > 0 && nights <= 5) {
          result.push({
            id: `${prop.id}-${i}`,
            property: prop.name,
            startDate: gapStart,
            endDate: gapEnd,
            nights,
            potentialRevenue: nights * 450,
          });
        }
      }
    });
    return result
      .map((g) => {
        const today0 = startOfDay(new Date());
        if (g.startDate >= today0) return g;
        const n = daysBetween(today0, g.endDate);
        return { ...g, startDate: today0, nights: n, potentialRevenue: n * 450 };
      })
      .filter((g) => g.nights > 0)
      .sort((a, b) => a.startDate - b.startDate);
  }, [bookings, properties]);

  const totalGapRevenue = gaps.reduce((s, g) => s + g.potentialRevenue, 0);

  const channelMix = useMemo(() => {
    const counts = { airbnb: 0, booking: 0, direct: 0 };
    bookings.filter(b => b.channel !== 'blocked').forEach(b => { counts[b.channel] = (counts[b.channel] || 0) + 1; });
    const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
    return [
      { key: 'airbnb', pct: Math.round((counts.airbnb / total) * 100) },
      { key: 'booking', pct: Math.round((counts.booking / total) * 100) },
      { key: 'direct', pct: Math.round((counts.direct / total) * 100) },
    ];
  }, [bookings]);

  const quick = useQuickBooking();
  const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const openNewAt = (prop, d) => {
    const out = new Date(d);
    out.setDate(out.getDate() + 1);
    quick.open({ property_id: prop.id, property_name: prop.name, check_in_date: isoDay(d), check_out_date: isoDay(out) });
  };
  const COL_W = viewMode === 'month' ? 'minmax(40px, 1fr)' : 'minmax(60px, 1fr)';
  const UNIT_W = 'var(--cal-unit-w)';
  const minW = viewMode === 'month' ? 104 + totalDays * 40 : 104 + totalDays * 60;
  const rangeLabel = `${formatHebrewDate(days[0])} – ${formatHebrewDate(days[days.length - 1])}`;

  return (
    <DPage className="[--cal-unit-w:104px] md:[--cal-unit-w:156px]">
      <DTitle
        sub={<span className="hidden md:inline">נוגעים במשבצת פנויה כדי להוסיף הזמנה.</span>}
        action={(
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPhoneGrid((v) => !v)} aria-pressed={phoneGrid} className="press inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-semibold text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.05)] lg:hidden">
              {phoneGrid ? <ListTodo className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <GanttChart className="h-[18px] w-[18px]" strokeWidth={1.75} />}
              {phoneGrid ? 'יומן' : 'ציר זמן'}
            </button>
            <Button variant="outline" onClick={handleSync} aria-label="סנכרון ערוצים" className="h-11 w-11 rounded-full border-0 bg-white px-0 shadow-[0_1px_2px_rgba(27,38,86,0.05)] lg:w-auto lg:px-5">
              <RefreshCw className={cn(syncing && 'animate-spin')} />
              <span className="hidden lg:inline">סנכרון ערוצים</span>
            </Button>
          </div>
        )}
      >
        לוח<br className="lg:hidden" /> שנה
      </DTitle>

      {!bookingsLoading && !propertiesLoading && properties.length === 0 ? (
        <div className="d-card">
          <DsEmptyState
            icon={CalendarRange}
            title="הוסיפו את הנכס הראשון"
            description="אחרי שתוסיפו יחידות, כל הזמנה מכל ערוץ תופיע כאן על ציר אחד."
            action={<Button asChild><Link to={createPageUrl('Onboarding')}><Plus />הוספת נכס</Link></Button>}
          />
        </div>
      ) : null}

      <DSplit
        asideLabel={`יומן ${selLabel}`}
        asideOnPhone={false}
        aside={properties.length ? (
          <section className="px-1">
            <h2 className="text-[19px] font-extrabold text-navy-900">{selDay === isoOf(startOfDay(new Date())) ? 'היום ביחידות' : selLabel}</h2>
            <p className="mb-4 text-[13px] text-ink-400">יציאות, שהיות וכניסות לפי שעה</p>
            <AgendaList rows={agenda} dayLabel={selLabel} onAdd={(p) => openNewAt(p, new Date(`${selDay}T12:00:00`))} />
          </section>
        ) : null}
        main={(
          <>
      {/* date chip strip: picks the day for the agenda (phones: the list below, desktop: the side panel) */}
      <div role="group" aria-label="בחירת יום" className="d-strip -mx-5 mb-4 flex scroll-px-5 gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        {stripDays.map((d) => {
          const iso = isoOf(d);
          const on = iso === selDay;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelDay(iso)}
              aria-pressed={on}
              aria-label={`${isToday(d) ? 'היום, ' : ''}${formatDayHe(iso)}`}
              className={cn(
                'press flex h-[78px] w-[56px] shrink-0 flex-col items-center justify-center gap-1 rounded-full transition-colors duration-150',
                on ? 'bg-brand-600 text-white shadow-[0_12px_22px_-10px_rgba(62,43,241,0.75)]' : 'bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.05)] hover:bg-[#FAFAFD]',
              )}
            >
              <span className={cn('text-[12px] font-medium', on ? 'text-white/80' : 'text-ink-400')}>{isToday(d) ? 'היום' : HEB_DAYS[d.getDay()]}</span>
              <span className="text-[19px] font-bold leading-none tabular">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {properties.length > 1 ? (
        <div role="group" aria-label="יחידה" className="d-strip -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
          {[{ id: null, name: 'כל היחידות' }, ...properties].map((p) => {
            const on = (urlPropertyId ?? null) === p.id;
            return (
              <button
                key={p.id ?? 'all'}
                type="button"
                aria-pressed={on}
                onClick={() => void setUrlState({ propertyId: p.id })}
                className={cn('press inline-flex h-11 shrink-0 items-center gap-2 rounded-full text-[14px] font-semibold', p.id ? 'pe-4 ps-1.5' : 'px-4', on ? 'bg-navy-900 text-white' : 'bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.05)]')}
              >
                {p.id ? <UnitPhoto property={p.raw} className="h-8 w-8" rounded="rounded-full" /> : null}
                {p.name}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* phones: the day's agenda (default) */}
      {properties.length && !phoneGrid ? (
        <div className="lg:hidden">
          <AgendaList rows={agenda} dayLabel={selLabel} onAdd={(p) => openNewAt(p, new Date(`${selDay}T12:00:00`))} />
        </div>
      ) : null}

      <div className={cn(!phoneGrid && 'hidden lg:block')}>
      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={goPrev} aria-label="הקודם" className="press inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900 ring-1 ring-inset ring-[#E8EAF2] hover:bg-[#F7F8FC]">
              <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
            <button type="button" onClick={goToday} className="press h-11 rounded-full bg-white px-4 text-[14px] font-semibold text-navy-900 ring-1 ring-inset ring-[#E8EAF2] hover:bg-[#F7F8FC]">היום</button>
            <button type="button" onClick={goNext} aria-label="הבא" className="press inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900 ring-1 ring-inset ring-[#E8EAF2] hover:bg-[#F7F8FC]">
              <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </div>
          <span className="truncate ps-1 text-[16px] font-bold text-navy-900 tabular">{rangeLabel}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            ariaLabel="טווח תצוגה"
            value={viewMode}
            onChange={(v) => void setUrlState({ view: v, date: null })}
            options={[
              { value: 'day', label: 'שבוע' },
              { value: 'week', label: 'שבועיים' },
              { value: 'month', label: 'חודש' },
            ]}
          />
        </div>
      </div>

      {bookingsError ? (
        <div className="mb-6 v7-card p-4"><ErrorFallback /></div>
      ) : bookingsLoading || propertiesLoading ? (
        <SkeletonCalendar className="mb-6" totalDays={totalDays} viewMode={viewMode === 'month' ? 'month' : 'week'} propertyRowCount={Math.max(properties.length, 3)} />
      ) : properties.length ? (
        <ErrorBoundary section="calendar-view" variant="inline" resetKey={`${viewMode}-${anchorDate.toISOString()}-${totalDays}-${effectivePropertyId ?? 'all'}`}>
          <div className="v5-rise mb-4 overflow-hidden d-card">
            <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div style={{ minWidth: minW, display: 'grid', gridTemplateColumns: `${UNIT_W} repeat(${totalDays}, ${COL_W})` }}>
                <div className="sticky right-0 z-20 flex items-end border-b border-l border-line bg-white px-4 pb-2.5 pt-3 text-[13px] font-medium text-ink-400">יחידה</div>
                {days.map((d, i) => {
                  const today = isToday(d);
                  const weekend = d.getDay() === 5 || d.getDay() === 6;
                  return (
                    <div key={i} className={cn('flex flex-col items-center border-b border-line pb-2.5 pt-3', weekend && !today && 'bg-[#FAFBFC]', today && 'v4-today-col')}>
                      <span className={cn('text-[12px]', today ? 'font-semibold text-brand-600' : 'text-ink-400')}>{today ? 'היום' : HEB_DAYS[d.getDay()]}</span>
                      <span className={cn('mt-1 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-[14px] font-semibold tabular', today ? 'bg-brand-600 text-white' : 'text-navy-900')}>
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}

                {properties.map((prop) => {
                  const propBookings = getBookingsForProperty(prop.id);
                  return (
                    <React.Fragment key={prop.id}>
                      <div className="sticky right-0 z-10 flex min-h-[68px] items-center gap-3 border-b border-l border-line bg-white px-2.5 md:px-3">
                        <UnitPhoto property={prop.raw} className="hidden h-10 w-10 md:block" rounded="rounded-[12px]" />
                        <div className="min-w-0">
                          <div className="truncate text-[15px] font-medium text-navy-900">{prop.name}</div>
                          <div className="hidden truncate text-[12px] text-ink-400 md:block">{prop.raw?.max_guests ? `עד ${prop.raw.max_guests} אורחים` : prop.type}</div>
                        </div>
                      </div>
                      <div
                        className="relative border-b border-line"
                        style={{ gridColumn: '2 / -1', display: 'grid', gridTemplateColumns: `repeat(${totalDays}, ${COL_W})`, minHeight: 68 }}
                      >
                        {days.map((d, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => openNewAt(prop, d)}
                            aria-label={`הזמנה חדשה ב${prop.name}, ${formatHebrewDate(d)}`}
                            className={cn(
                              'group/cell relative h-full border-l border-line/60 hover:bg-[#F7F6FF] focus-visible:bg-[#F7F6FF]',
                              (d.getDay() === 5 || d.getDay() === 6) && !isToday(d) && 'bg-[#FAFBFC]',
                              isToday(d) && 'v4-today-col',
                            )}
                          >
                            <Plus aria-hidden className="absolute inset-0 m-auto h-4 w-4 text-brand-600 opacity-0 group-hover/cell:opacity-100" />
                          </button>
                        ))}
                        {propBookings.map((booking) => {
                          const pos = getBookingPosition(booking);
                          if (!pos) return null;
                          const ch = CHANNELS[booking.channel];
                          const isBlocked = booking.channel === 'blocked';
                          const pending = booking.status === 'ממתין';
                          return (
                            <Link
                              key={booking.id}
                              to={`${createPageUrl('BookingDetail')}/${booking.id}`}
                              className={cn('press absolute top-[12px] z-10 block', optimisticEntityClassName(booking.id))}
                              style={{ right: `calc(${(pos.start / totalDays) * 100}% + 2px)`, width: `calc(${(pos.span / totalDays) * 100}% - 4px)` }}
                              onMouseEnter={(e) => handleBookingHover(e, booking)}
                              onMouseLeave={() => setHoveredBooking(null)}
                              aria-label={`${booking.guest || 'הזמנה'}, ${ch.label}, ${booking.nights} לילות`}
                            >
                              {/* v5: indigo-tint bar; the channel is only the thin coloured start edge */}
                              <span
                                className={cn(
                                  'relative flex h-[44px] flex-col justify-center overflow-hidden rounded-[10px] pe-2.5 ps-3.5 text-[13px] leading-tight transition-[background-color,box-shadow] duration-150 hover:shadow-[0_2px_8px_rgba(62,43,241,0.12)]',
                                  isBlocked ? 'bg-[repeating-linear-gradient(45deg,#F1F2F6,#F1F2F6_6px,#E9EBF1_6px,#E9EBF1_12px)] text-ink-400'
                                    : pending ? 'border border-dashed border-brand-300 bg-white text-navy-900'
                                      : 'border border-[rgba(62,43,241,0.10)] bg-[#EEF0FF] text-navy-900 hover:bg-[#E6E8FF]',
                                )}
                              >
                                {isBlocked ? null : <span aria-hidden className="absolute inset-y-[6px] start-[5px] w-[3px] rounded-full" style={{ background: ch?.color }} />}
                                <span className="truncate font-semibold">{isBlocked ? 'חסום' : pos.span > 1 || viewMode !== 'month' ? booking.guest : guestInitials(booking.guest)}</span>
                                {!isBlocked && pos.span > 1 ? <span className="truncate text-[12px] text-ink-400">{pending ? 'ממתינה לאישור' : `${booking.nights} לילות`}</span> : null}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3">
              {['booking', 'airbnb', 'direct'].map((key) => (
                <span key={key} className="inline-flex items-center gap-1.5 text-[13px] text-ink-600">
                  <ChannelDot channel={key} size={8} />
                  {CHANNELS[key].label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-600">
                <span className="h-3.5 w-6 rounded-[5px] border border-dashed border-brand-300" />
                ממתינה לאישור
              </span>
            </div>
          </div>
        </ErrorBoundary>
      ) : null}

      </div>

      {hoveredBooking && (
        <div className="pointer-events-none fixed z-50 hidden md:block" style={{ left: tooltipPos.x, top: tooltipPos.y - 8, transform: 'translate(-50%, -100%)' }}>
          <div className="min-w-[200px] rounded-[12px] border border-line bg-white px-4 py-3 text-right text-navy-900 shadow-[var(--shadow-pop)]" dir="rtl">
            <div className="mb-1.5 flex items-center gap-2 text-[13px] text-ink-400">
              <ChannelDot channel={hoveredBooking.channel} size={8} />
              {CHANNELS[hoveredBooking.channel]?.label} · {hoveredBooking.status}
            </div>
            <div className="text-[15px] font-semibold">{hoveredBooking.channel === 'blocked' ? 'תאריכים חסומים' : hoveredBooking.guest}</div>
            <div className="mt-1 text-[13px] text-ink-400">
              {formatHebrewDate(hoveredBooking.startDate)} – {formatHebrewDate(hoveredBooking.endDate)} · {daysBetween(hoveredBooking.startDate, hoveredBooking.endDate)} לילות
            </div>
            {hoveredBooking.amount > 0 && <div className="mt-1 text-[15px] font-bold tabular">{fmtMoney(hoveredBooking.amount)}</div>}
          </div>
        </div>
      )}

      {properties.length ? (
        <div>
          <section className="v5-rise mt-4 overflow-hidden d-card lg:mt-0">
            <div className="flex items-center justify-between px-5 pt-5">
              <div>
                <h2 className="text-[15px] font-semibold text-navy-900">לילות פנויים בין הזמנות</h2>
                <p className="text-[13px] text-ink-400">{gaps.length ? 'הקרובים שאפשר עוד למלא' : 'אין חלונות קצרים'}</p>
              </div>
            </div>
            {gaps.length === 0 ? (
              <p className="px-5 pb-5 pt-3 text-[15px] text-ink-600">כל היחידות רצופות. אין לילות בודדים שנשארו באמצע.</p>
            ) : (
              <ul className="px-2 pb-2 pt-2">
                {gaps.slice(0, 3).map((gap) => {
                  const prop = properties.find((p) => p.name === gap.property);
                  return (
                    <li key={gap.id} className="v5-row flex min-h-[64px] items-center gap-3 rounded-[10px] px-3">
                      <UnitPhoto property={prop?.raw} className="h-11 w-11" rounded="rounded-[14px]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-medium text-navy-900">{gap.property}</div>
                        <div className="text-[13px] text-ink-400">{formatHebrewDate(gap.startDate)} – {formatHebrewDate(gap.endDate)} · {gap.nights} לילות</div>
                      </div>
                      {prop ? (
                        <Button variant="ghost" size="sm" onClick={() => openNewAt(prop, gap.startDate)}>
                          <Plus />
                          הזמנה
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

        </div>
      ) : null}
          </>
        )}
      />
    </DPage>
  );
}
