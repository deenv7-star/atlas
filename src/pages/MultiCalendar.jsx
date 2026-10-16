import React, { useState, useMemo, useCallback } from 'react';
import { addDays, subDays, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { CalendarRange, ChevronLeft, ChevronRight, Home, Plus, RefreshCw } from 'lucide-react';
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
import { ShareViewButton } from '@/components/ui/ShareViewButton';

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
    return result;
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
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-10 pt-4 md:px-8 md:pt-7 [--cal-unit-w:104px] md:[--cal-unit-w:168px]" dir="rtl">
      <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-navy-900 md:text-[32px]">לוח שנה</h1>
          <p className="mt-1.5 text-[15px] text-ink-600">כל היחידות וכל הערוצים בתצוגה אחת. נוגעים במשבצת פנויה כדי להוסיף הזמנה.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ShareViewButton className="h-11 rounded-[10px]" />
          <Button variant="outline" onClick={handleSync}>
            <RefreshCw className={cn(syncing && 'animate-spin')} />
            סנכרון ערוצים
          </Button>
        </div>
      </header>

      {!bookingsLoading && !propertiesLoading && properties.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-white">
          <DsEmptyState
            icon={CalendarRange}
            title="הוסיפו את הנכס הראשון"
            description="אחרי שתוסיפו יחידות, כל הזמנה מכל ערוץ תופיע כאן על ציר אחד."
            action={<Button asChild><Link to={createPageUrl('Onboarding')}><Plus />הוספת נכס</Link></Button>}
          />
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-[10px] border border-line bg-white">
            <button type="button" onClick={goPrev} aria-label="הקודם" className="press inline-flex h-11 w-11 items-center justify-center rounded-s-[10px] text-navy-900 hover:bg-neutral-100">
              <ChevronRight className="h-5 w-5" />
            </button>
            <button type="button" onClick={goToday} className="press h-11 border-x border-line px-4 text-[15px] font-medium text-navy-900 hover:bg-neutral-100">היום</button>
            <button type="button" onClick={goNext} aria-label="הבא" className="press inline-flex h-11 w-11 items-center justify-center rounded-e-[10px] text-navy-900 hover:bg-neutral-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          <span className="truncate text-[15px] font-bold text-navy-900 tabular">{rangeLabel}</span>
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
          <SegmentedControl
            ariaLabel="ערוץ"
            value={channelFilter}
            onChange={setChannelFilter}
            options={[
              { value: 'all', label: 'כל הערוצים' },
              { value: 'booking', label: <span className="inline-flex items-center gap-1.5"><ChannelDot channel="booking" size={8} />Booking</span> },
              { value: 'airbnb', label: <span className="inline-flex items-center gap-1.5"><ChannelDot channel="airbnb" size={8} />Airbnb</span> },
              { value: 'direct', label: <span className="inline-flex items-center gap-1.5"><ChannelDot channel="direct" size={8} />ישיר</span> },
            ]}
          />
        </div>
      </div>

      {bookingsError ? (
        <div className="mb-6 rounded-[14px] border border-line bg-white p-4"><ErrorFallback /></div>
      ) : bookingsLoading || propertiesLoading ? (
        <SkeletonCalendar className="mb-6" totalDays={totalDays} viewMode={viewMode === 'month' ? 'month' : 'week'} propertyRowCount={Math.max(properties.length, 3)} />
      ) : properties.length ? (
        <ErrorBoundary section="calendar-view" variant="inline" resetKey={`${viewMode}-${anchorDate.toISOString()}-${totalDays}-${effectivePropertyId ?? 'all'}`}>
          <div className="mb-6 overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
            <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div style={{ minWidth: minW, display: 'grid', gridTemplateColumns: `${UNIT_W} repeat(${totalDays}, ${COL_W})` }}>
                <div className="sticky right-0 z-20 flex items-end border-b border-l border-line bg-white px-3 pb-2 pt-3 text-[13px] font-medium text-ink-400">יחידה</div>
                {days.map((d, i) => {
                  const today = isToday(d);
                  const weekend = d.getDay() === 5 || d.getDay() === 6;
                  return (
                    <div key={i} className={cn('flex flex-col items-center border-b border-l border-line pb-2 pt-3', weekend && 'bg-neutral-50')}>
                      <span className={cn('text-[12px]', today ? 'font-bold text-brand-600' : 'text-ink-400')}>{HEB_DAYS[d.getDay()]}</span>
                      <span className={cn('mt-1 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-[14px] font-bold tabular', today ? 'bg-brand-600 text-white' : 'text-navy-900')}>
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}

                {properties.map((prop) => {
                  const propBookings = getBookingsForProperty(prop.id);
                  return (
                    <React.Fragment key={prop.id}>
                      <div className="sticky right-0 z-10 flex min-h-[60px] items-center border-b border-l border-line bg-white px-3">
                        <div className="min-w-0">
                          <div className="truncate text-[15px] font-bold text-navy-900">{prop.name}</div>
                          <div className="hidden truncate text-[13px] text-ink-400 md:block">{getBookingsForProperty(prop.id).length} הזמנות</div>
                        </div>
                      </div>
                      <div
                        className="relative border-b border-line"
                        style={{ gridColumn: '2 / -1', display: 'grid', gridTemplateColumns: `repeat(${totalDays}, ${COL_W})`, minHeight: 60 }}
                      >
                        {days.map((d, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => openNewAt(prop, d)}
                            aria-label={`הזמנה חדשה ב${prop.name}, ${formatHebrewDate(d)}`}
                            className={cn(
                              'group/cell relative h-full border-l border-line/70 hover:bg-brand-50 focus-visible:bg-brand-50',
                              (d.getDay() === 5 || d.getDay() === 6) && 'bg-neutral-50',
                              isToday(d) && 'bg-brand-50/60',
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
                              className={cn('press absolute top-2 z-10 block', optimisticEntityClassName(booking.id))}
                              style={{ right: `calc(${(pos.start / totalDays) * 100}% + 2px)`, width: `calc(${(pos.span / totalDays) * 100}% - 4px)` }}
                              onMouseEnter={(e) => handleBookingHover(e, booking)}
                              onMouseLeave={() => setHoveredBooking(null)}
                              aria-label={`${booking.guest || 'הזמנה'}, ${ch.label}, ${booking.nights} לילות`}
                            >
                              <span
                                className={cn('flex h-11 items-center gap-1.5 overflow-hidden rounded-[8px] px-2 text-[13px] font-medium', pending ? 'border-2 border-dashed bg-white' : 'text-white')}
                                style={isBlocked ? { background: '#D7DBE8', color: '#4A5578' } : pending ? { borderColor: ch.color, color: ch.color } : { background: ch.color }}
                              >
                                <span className="truncate">{isBlocked ? 'חסום' : booking.guest}</span>
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
                <span className="h-3 w-4 rounded-[4px] border-2 border-dashed border-ink-400" />
                ממתינה לאישור
              </span>
            </div>
          </div>
        </ErrorBoundary>
      ) : null}

      {hoveredBooking && (
        <div className="pointer-events-none fixed z-50 hidden md:block" style={{ left: tooltipPos.x, top: tooltipPos.y - 8, transform: 'translate(-50%, -100%)' }}>
          <div className="min-w-[200px] rounded-[12px] bg-navy-900 px-4 py-3 text-right text-white shadow-raised" dir="rtl">
            <div className="mb-1.5 flex items-center gap-2 text-[13px] text-white/75">
              <ChannelDot channel={hoveredBooking.channel} size={8} />
              {CHANNELS[hoveredBooking.channel]?.label} · {hoveredBooking.status}
            </div>
            <div className="text-[15px] font-bold">{hoveredBooking.channel === 'blocked' ? 'תאריכים חסומים' : hoveredBooking.guest}</div>
            <div className="mt-1 text-[13px] text-white/75">
              {formatHebrewDate(hoveredBooking.startDate)} – {formatHebrewDate(hoveredBooking.endDate)} · {daysBetween(hoveredBooking.startDate, hoveredBooking.endDate)} לילות
            </div>
            {hoveredBooking.amount > 0 && <div className="mt-1 text-[15px] font-bold tabular">{fmtMoney(hoveredBooking.amount)}</div>}
          </div>
        </div>
      )}

      {properties.length ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="overflow-hidden rounded-[14px] border border-line bg-white shadow-card lg:col-span-2">
            <div className="flex items-center justify-between px-5 pt-4">
              <div>
                <h2 className="text-[17px] font-bold text-navy-900">לילות פנויים בין הזמנות</h2>
                <p className="text-[13px] text-ink-400">{gaps.length ? `${gaps.length} חלונות של עד 5 לילות` : 'אין חלונות קצרים'}</p>
              </div>
            </div>
            {gaps.length === 0 ? (
              <p className="px-5 pb-5 pt-3 text-[15px] text-ink-600">כל היחידות רצופות. אין לילות בודדים שנשארו באמצע.</p>
            ) : (
              <ul className="px-2 pb-2 pt-2">
                {gaps.map((gap) => {
                  const prop = properties.find((p) => p.name === gap.property);
                  return (
                    <li key={gap.id} className="flex min-h-[60px] items-center gap-3 rounded-[10px] px-3 hover:bg-neutral-50">
                      <span className="ds-icon-square bg-warning-50 text-warning-600"><Home className="h-5 w-5" strokeWidth={1.75} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold text-navy-900">{gap.property}</div>
                        <div className="text-[13px] text-ink-400">{formatHebrewDate(gap.startDate)} – {formatHebrewDate(gap.endDate)} · {gap.nights} לילות</div>
                      </div>
                      {prop ? (
                        <Button variant="secondary" size="sm" onClick={() => openNewAt(prop, gap.startDate)}>
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

          <section className="rounded-[14px] border border-line bg-white p-5 shadow-card">
            <h2 className="text-[17px] font-bold text-navy-900">התפלגות ערוצים</h2>
            <p className="text-[13px] text-ink-400">{bookings.filter((b) => b.channel !== 'blocked').length} הזמנות</p>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-neutral-100">
              {channelMix.map(({ key, pct }) => (
                <span key={key} style={{ width: `${pct}%`, background: CHANNELS[key].color }} />
              ))}
            </div>
            <ul className="mt-4 space-y-3">
              {channelMix.map(({ key, pct }) => (
                <li key={key} className="flex items-center gap-2.5 text-[15px]">
                  <ChannelDot channel={key} size={10} />
                  <span className="flex-1 text-navy-900">{CHANNELS[key].label}</span>
                  <span className="font-bold tabular text-navy-900">{pct}%</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
