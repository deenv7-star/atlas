import React, { useState, useMemo, useCallback } from 'react';
import { addDays, subDays, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { CalendarRange, ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
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
import { UnitPhoto, GuestAvatar } from '@/components/app/atoms';
import { partnerPhoto } from '@/lib/stay/guestPhoto';

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
        raw: b,
        inHouse: b.status === 'CHECKED_IN' || (['APPROVED', 'CONFIRMED'].includes(b.status) && b.check_in_date <= todayKey() && (b.check_out_date || '') > todayKey()),
        done: b.status === 'CHECKED_OUT',
        status: b.status === 'CANCELLED' ? 'בוטל' : ['APPROVED','CONFIRMED','CHECKED_IN'].includes(b.status) ? 'מאושר' : 'ממתין',
      };
    });
}

const todayKey = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };

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

export default function MultiCalendar({ selectedPropertyId }) {
  const { view: viewMode, date: urlDate, propertyId: urlPropertyId, setUrlState } = useCalendarUrlState();
  const [channelFilter, setChannelFilter] = useState('all');
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [syncing, setSyncing] = useState(false);

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
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-2 lg:px-8 lg:pt-4 [--cal-unit-w:112px] md:[--cal-unit-w:180px]" dir="rtl">
      <header className={cn('v5-rise mb-5 flex flex-row items-end justify-between gap-3 md:mb-6')}>
        <div>
          <h1 className="text-[36px] font-extrabold leading-[1.06] tracking-[-0.03em] text-navy-900 md:text-[44px]">לוח שנה</h1>
          <p className="mt-2 hidden text-[15px] text-ink-600 md:block">נוגעים במשבצת פנויה כדי להוסיף הזמנה.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleSync} aria-label="סנכרון ערוצים" className="w-11 px-0 sm:w-auto sm:px-5">
            <RefreshCw className={cn(syncing && 'animate-spin')} />
            <span className="hidden sm:inline">סנכרון ערוצים</span>
          </Button>
        </div>
      </header>

      {!bookingsLoading && !propertiesLoading && properties.length === 0 ? (
        <div className="v7-card">
          <DsEmptyState
            photo="/demo/units/unit-2.webp"
            icon={CalendarRange}
            title="הוסיפו את הנכס הראשון"
            description="אחרי שתוסיפו יחידות, כל הזמנה מכל ערוץ תופיע כאן על ציר אחד."
            action={<Button asChild><Link to={createPageUrl('Onboarding')}><Plus />הוספת נכס</Link></Button>}
          />
        </div>
      ) : null}

      {/* Phones: date chip strip. Tapping a day starts the view there. */}
      <nav aria-label="בחירת יום" className="v7-strip -mx-5 mb-3 flex scroll-px-5 gap-2 overflow-x-auto px-5 pb-3 md:hidden">
        {stripDays.map((d) => {
          const on = isToday(d);
          const first = d.toDateString() === anchorDate.toDateString();
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => void setUrlState({ date: on ? null : d })}
              aria-pressed={first}
              aria-label={`${HEB_DAYS[d.getDay()]} ${d.getDate()}`}
              className={cn(
                'press flex h-[64px] w-[50px] shrink-0 flex-col items-center justify-center gap-1 rounded-full',
                on ? 'bg-brand-600 text-white shadow-[0_10px_20px_-8px_rgba(62,43,241,0.6)]'
                  : first ? 'bg-navy-900 text-white' : 'bg-white text-navy-900 ring-1 ring-inset ring-[#E8EAF2]',
              )}
            >
              <span className={cn('text-[12px] font-medium', on || first ? 'text-white/80' : 'text-ink-400')}>{HEB_DAYS[d.getDay()]}</span>
              <span className="text-[17px] font-bold leading-none tabular">{d.getDate()}</span>
            </button>
          );
        })}
      </nav>

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
          <div className="v5-rise mb-5 overflow-hidden v7-card">
            <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div style={{ minWidth: minW, display: 'grid', gridTemplateColumns: `${UNIT_W} repeat(${totalDays}, ${COL_W})` }}>
                <div className="sticky right-0 z-20 flex items-end border-b border-l border-[#E9EAF6] bg-[#FAFAFF] px-4 pb-3 pt-3 text-[13px] font-medium text-ink-600">יחידה</div>
                {days.map((d, i) => {
                  const today = isToday(d);
                  const weekend = d.getDay() === 5 || d.getDay() === 6;
                  return (
                    <div key={i} className="flex items-center justify-center border-b border-[#E9EAF6] px-1 py-2.5">
                      <span className={cn('flex w-full max-w-[52px] flex-col items-center justify-center rounded-full py-1.5', today ? 'bg-brand-600 text-white shadow-[0_8px_18px_-8px_rgba(62,43,241,0.7)]' : weekend ? 'bg-white/70 text-navy-900' : 'text-navy-900')}>
                        <span className={cn('text-[11px] font-medium', today ? 'text-white/85' : 'text-ink-600')}>{today ? 'היום' : HEB_DAYS[d.getDay()]}</span>
                        <span className="text-[15px] font-bold leading-tight tabular">{d.getDate()}</span>
                      </span>
                    </div>
                  );
                })}

                {properties.map((prop) => {
                  const propBookings = getBookingsForProperty(prop.id);
                  return (
                    <React.Fragment key={prop.id}>
                      <div className="sticky right-0 z-10 flex min-h-[72px] items-center gap-3 border-b border-l border-[#E9EAF6] bg-[#FAFAFF] px-2.5 md:px-3.5">
                        <UnitPhoto property={prop.raw} className="hidden h-11 w-11 md:block" rounded="rounded-full" />
                        <div className="min-w-0">
                          <div className="truncate text-[15px] font-medium text-navy-900">{prop.name}</div>
                          <div className="hidden truncate text-[12px] text-ink-400 md:block">{prop.raw?.max_guests ? `עד ${prop.raw.max_guests} אורחים` : prop.type}</div>
                        </div>
                      </div>
                      <div
                        className="relative border-b border-line"
                        style={{ gridColumn: '2 / -1', display: 'grid', gridTemplateColumns: `repeat(${totalDays}, ${COL_W})`, minHeight: 72 }}
                      >
                        {days.map((d, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => openNewAt(prop, d)}
                            aria-label={`הזמנה חדשה ב${prop.name}, ${formatHebrewDate(d)}`}
                            className={cn(
                              'group/cell relative h-full border-l border-[#EDEEF8] hover:bg-white/70 focus-visible:bg-white/70',
                              (d.getDay() === 5 || d.getDay() === 6) && !isToday(d) && 'bg-white/30',
                              isToday(d) && 'bg-[rgba(62,43,241,0.05)]',
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
                              className={cn('press f-bar absolute top-[13px] z-10 block rounded-full', optimisticEntityClassName(booking.id))}
                              style={{ right: `calc(${(pos.start / totalDays) * 100}% + 2px)`, width: `calc(${(pos.span / totalDays) * 100}% - 4px)` }}
                              onMouseEnter={(e) => handleBookingHover(e, booking)}
                              onMouseLeave={() => setHoveredBooking(null)}
                              aria-label={`${booking.guest || 'הזמנה'}, ${ch.label}, ${booking.nights} לילות`}
                            >
                              {/* v8 F: rounded pill bars. In house = solid indigo, confirmed = indigo tint, pending = dashed glass. Faces on the bar. */}
                              <span
                                className={cn(
                                  'relative flex h-[46px] items-center gap-2 overflow-hidden rounded-full pe-3 ps-1.5 text-[13px] leading-tight',
                                  isBlocked ? 'bg-[repeating-linear-gradient(45deg,#F1F2F6,#F1F2F6_6px,#E9EBF1_6px,#E9EBF1_12px)] ps-3 text-ink-600'
                                    : pending ? 'border border-dashed border-[#A99CF6] bg-white/80 text-navy-900'
                                      : booking.inHouse ? 'bg-brand-600 text-white shadow-[0_10px_20px_-12px_rgba(62,43,241,0.8)]'
                                        : booking.done ? 'bg-[#E9EBF3] text-ink-600'
                                          : 'bg-[#E4E1FD] text-navy-900',
                                )}
                              >
                                {isBlocked ? null : (
                                  <span className="relative inline-flex shrink-0 items-center">
                                    <GuestAvatar name={booking.guest} record={booking.raw} size={pos.span > 1 || viewMode !== 'month' ? 34 : 28} ring={!booking.inHouse} className={booking.inHouse ? 'ring-[2px] ring-white/60' : ''} />
                                    {pos.span > 2 && partnerPhoto(booking.guest) ? <GuestAvatar name={`${booking.guest}·2`} photo={partnerPhoto(booking.guest)} size={34} ring={!booking.inHouse} className={cn('-ms-3', booking.inHouse && 'ring-[2px] ring-white/60')} /> : null}
                                  </span>
                                )}
                                {isBlocked || pos.span > 1 || viewMode !== 'month' ? (
                                  <span className="flex min-w-0 flex-col">
                                    <span className="truncate font-bold">{isBlocked ? 'חסום' : booking.guest}</span>
                                    {!isBlocked && pos.span > 1 ? <span className={cn('truncate text-[12px]', booking.inHouse ? 'text-white/85' : 'text-ink-600')}>{pending ? 'ממתינה לאישור' : booking.inHouse ? 'בשהייה עכשיו' : `${booking.nights} לילות`}</span> : null}
                                  </span>
                                ) : null}
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
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#E9EAF6] px-4 py-3">
              {['booking', 'airbnb', 'direct'].map((key) => (
                <span key={key} className="inline-flex items-center gap-1.5 text-[13px] text-ink-600">
                  <ChannelDot channel={key} size={8} />
                  {CHANNELS[key].label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-600">
                <span className="h-3.5 w-6 rounded-full border border-dashed border-[#A99CF6]" />
                ממתינה לאישור
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-600">
                <span className="h-3.5 w-6 rounded-full bg-brand-600" />
                בשהייה
              </span>
            </div>
          </div>
        </ErrorBoundary>
      ) : null}

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
          <section className="v5-rise overflow-hidden v7-card">
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
                      <UnitPhoto property={prop?.raw} className="h-11 w-11" rounded="rounded-full" />
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
    </div>
  );
}
