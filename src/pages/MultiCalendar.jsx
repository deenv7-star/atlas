import React, { useState, useMemo, useCallback } from 'react';
import { CalendarRange, ChevronRight, ChevronLeft, RefreshCw, Filter, Home, Eye, AlertCircle, Plus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHANNELS = {
  airbnb: { label: 'Airbnb', color: '#FF5A5F', bg: 'bg-[#FF5A5F]', text: 'text-[#FF5A5F]', light: 'bg-red-50' },
  booking: { label: 'Booking.com', color: '#003580', bg: 'bg-[#003580]', text: 'text-[#003580]', light: 'bg-blue-50' },
  direct: { label: 'ישיר', color: '#10B981', bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
  blocked: { label: 'חסום', color: '#9CA3AF', bg: 'bg-gray-400', text: 'text-gray-500', light: 'bg-gray-50' },
};

const PROPERTIES = [
  { id: 1, name: 'דירת הים, תל אביב', dot: '#3B82F6', type: 'דירה', beds: 2 },
  { id: 2, name: 'פנטהאוז מרינה, הרצליה', dot: '#8B5CF6', type: 'פנטהאוז', beds: 4 },
  { id: 3, name: 'סטודיו נווה צדק, תל אביב', dot: '#F59E0B', type: 'סטודיו', beds: 1 },
  { id: 4, name: 'וילה כרמל, חיפה', dot: '#EC4899', type: 'וילה', beds: 5 },
  { id: 5, name: 'צימר משפחת לוי, צפת', dot: '#10B981', type: 'צימר', beds: 2 },
];

function buildDemoBookings(startDate) {
  const s = new Date(startDate);
  const base = new Date(s.getFullYear(), s.getMonth(), s.getDate());

  return [
    { id: 1, propertyId: 1, guest: 'דוד כהן', channel: 'airbnb', startOffset: -1, nights: 4, amount: 3200, status: 'מאושר' },
    { id: 2, propertyId: 1, guest: 'שרה מזרחי', channel: 'booking', startOffset: 5, nights: 3, amount: 2400, status: 'מאושר' },
    { id: 3, propertyId: 1, guest: '', channel: 'blocked', startOffset: 10, nights: 2, amount: 0, status: 'חסום' },
    { id: 4, propertyId: 2, guest: 'משפחת לוי', channel: 'direct', startOffset: 0, nights: 5, amount: 5500, status: 'מאושר' },
    { id: 5, propertyId: 2, guest: 'אורן אברהמי', channel: 'airbnb', startOffset: 7, nights: 4, amount: 4200, status: 'ממתין' },
    { id: 6, propertyId: 3, guest: 'מיכל גולן', channel: 'booking', startOffset: 1, nights: 3, amount: 1500, status: 'מאושר' },
    { id: 7, propertyId: 3, guest: 'רון אברהם', channel: 'airbnb', startOffset: 6, nights: 2, amount: 1100, status: 'מאושר' },
    { id: 8, propertyId: 3, guest: 'יעל שמש', channel: 'direct', startOffset: 10, nights: 3, amount: 1350, status: 'מאושר' },
    { id: 9, propertyId: 4, guest: 'משפחת גולדברג', channel: 'direct', startOffset: -2, nights: 7, amount: 9800, status: 'מאושר' },
    { id: 10, propertyId: 4, guest: 'דניאל ברק', channel: 'booking', startOffset: 8, nights: 5, amount: 7200, status: 'מאושר' },
    { id: 11, propertyId: 5, guest: 'נועה דוד', channel: 'airbnb', startOffset: 0, nights: 3, amount: 2100, status: 'מאושר' },
    { id: 12, propertyId: 5, guest: '', channel: 'blocked', startOffset: 3, nights: 1, amount: 0, status: 'חסום' },
    { id: 13, propertyId: 5, guest: 'עמית רוזן', channel: 'booking', startOffset: 6, nights: 4, amount: 2800, status: 'מאושר' },
    { id: 14, propertyId: 5, guest: 'ליאור כץ', channel: 'direct', startOffset: 12, nights: 2, amount: 1500, status: 'ממתין' },
  ].map(b => {
    const start = new Date(base);
    start.setDate(start.getDate() + b.startOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + b.nights);
    return { ...b, startDate: start, endDate: end };
  });
}

const HEB_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function formatHebrewDate(d) {
  const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
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

export default function MultiCalendar() {
  const [viewMode, setViewMode] = useState('week');
  const [dateOffset, setDateOffset] = useState(0);
  const [channelFilter, setChannelFilter] = useState('all');
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [syncing, setSyncing] = useState(false);

  const totalDays = viewMode === 'week' ? 14 : 30;

  const baseDate = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + dateOffset * (viewMode === 'week' ? 7 : 30));
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }, [dateOffset, viewMode]);

  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [baseDate, totalDays]);

  const bookings = useMemo(() => buildDemoBookings(baseDate), [baseDate]);

  const filteredBookings = useMemo(() => {
    if (channelFilter === 'all') return bookings;
    return bookings.filter(b => b.channel === channelFilter);
  }, [bookings, channelFilter]);

  const goToday = useCallback(() => setDateOffset(0), []);
  const goPrev = useCallback(() => setDateOffset(p => p - 1), []);
  const goNext = useCallback(() => setDateOffset(p => p + 1), []);

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
    PROPERTIES.forEach(prop => {
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
  }, [bookings]);

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

  const COL_W = viewMode === 'week' ? 'minmax(72px, 1fr)' : 'minmax(36px, 1fr)';

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <CalendarRange className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">לוח שנה מרכזי</h1>
            <span className="text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">PRO</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mr-[3.25rem]">
          תצוגה מאוחדת של כל הנכסים וכל ערוצי ההזמנות — Airbnb, Booking.com, ישיר ועוד. זהה חורים ביומן ומקסם תפוסה.
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={goToday}
            className="px-3 h-8 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            היום
          </button>
          <button
            onClick={goNext}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-800 mr-2 whitespace-nowrap">
            {formatHebrewDate(days[0])} — {formatHebrewDate(days[days.length - 1])}
          </span>
        </div>

        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {[{ key: 'week', label: 'שבועיים' }, { key: 'month', label: 'חודש' }].map(v => (
            <button
              key={v.key}
              onClick={() => { setViewMode(v.key); setDateOffset(0); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === v.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          {[
            { key: 'all', label: 'הכל' },
            { key: 'airbnb', label: 'Airbnb' },
            { key: 'booking', label: 'Booking' },
            { key: 'direct', label: 'ישיר' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setChannelFilter(f.key)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                channelFilter === f.key
                  ? f.key === 'all'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : `border-current ${CHANNELS[f.key]?.text || ''} bg-opacity-10`
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              )}
              style={channelFilter === f.key && f.key !== 'all' ? { backgroundColor: CHANNELS[f.key].color + '14' } : {}}
            >
              {f.key !== 'all' && <ChannelDot channel={f.key} size={6} />}
              <span className={f.key !== 'all' ? 'mr-1' : ''}>{f.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleSync}
          className="mr-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-medium hover:from-blue-600 hover:to-indigo-600 transition-all shadow-sm"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
          סנכרן עכשיו
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6 shadow-sm">
        <div className="overflow-x-auto">
          <div
            className="min-w-[900px]"
            style={{ display: 'grid', gridTemplateColumns: `180px repeat(${totalDays}, ${COL_W})` }}
          >
            {/* Header row */}
            <div className="sticky right-0 z-20 bg-gray-50 border-b border-l border-gray-200 px-3 py-2 flex items-center">
              <span className="text-xs font-semibold text-gray-500">נכס</span>
            </div>
            {days.map((d, i) => {
              const today = isToday(d);
              const isFriday = d.getDay() === 5;
              const isSaturday = d.getDay() === 6;
              return (
                <div
                  key={i}
                  className={cn(
                    'border-b border-l border-gray-200 px-1 py-2 text-center',
                    today && 'bg-blue-50',
                    (isFriday || isSaturday) && !today && 'bg-amber-50/40'
                  )}
                >
                  <div className={cn('text-[10px] font-medium', today ? 'text-blue-600' : 'text-gray-400')}>
                    {HEB_DAYS[d.getDay()]}
                  </div>
                  <div className={cn(
                    'text-sm font-bold mt-0.5 leading-none',
                    today ? 'text-blue-600' : 'text-gray-700'
                  )}>
                    {d.getDate()}
                  </div>
                  {today && (
                    <div className="mx-auto mt-1 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </div>
              );
            })}

            {/* Property rows */}
            {PROPERTIES.map((prop) => {
              const propBookings = getBookingsForProperty(prop.id);
              return (
                <React.Fragment key={prop.id}>
                  {/* Property label */}
                  <div className="sticky right-0 z-10 bg-white border-b border-l border-gray-200 px-3 py-3 flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: prop.dot }} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{prop.name}</div>
                      <div className="text-[10px] text-gray-400">{prop.type} · {prop.beds} חד׳</div>
                    </div>
                  </div>

                  {/* Day cells with booking blocks */}
                  <div
                    className="col-span-full border-b border-gray-200 relative"
                    style={{
                      gridColumn: `2 / -1`,
                      display: 'grid',
                      gridTemplateColumns: `repeat(${totalDays}, ${COL_W})`,
                      minHeight: 56,
                    }}
                  >
                    {/* Cell backgrounds */}
                    {days.map((d, i) => (
                      <div
                        key={i}
                        className={cn(
                          'border-l border-gray-100 h-full',
                          isToday(d) && 'bg-blue-50/30',
                          (d.getDay() === 5 || d.getDay() === 6) && !isToday(d) && 'bg-amber-50/20'
                        )}
                      />
                    ))}

                    {/* Booking blocks */}
                    {propBookings.map(booking => {
                      const pos = getBookingPosition(booking);
                      if (!pos) return null;
                      const ch = CHANNELS[booking.channel];
                      const isBlocked = booking.channel === 'blocked';

                      return (
                        <div
                          key={booking.id}
                          className="absolute top-2 z-10 cursor-pointer group"
                          style={{
                            right: `calc(${(pos.start / totalDays) * 100}%)`,
                            width: `calc(${(pos.span / totalDays) * 100}% - 4px)`,
                            marginRight: 2,
                          }}
                          onMouseEnter={(e) => handleBookingHover(e, booking)}
                          onMouseLeave={() => setHoveredBooking(null)}
                        >
                          <div
                            className={cn(
                              'rounded-lg px-2 py-1.5 h-9 flex items-center gap-1.5 transition-all text-white text-[11px] font-medium overflow-hidden shadow-sm',
                              'group-hover:shadow-md group-hover:scale-[1.02] group-hover:z-20',
                            )}
                            style={
                              isBlocked
                                ? {
                                    background: `repeating-linear-gradient(45deg, #9CA3AF, #9CA3AF 3px, #B0B5BC 3px, #B0B5BC 6px)`,
                                    color: '#fff',
                                  }
                                : { backgroundColor: ch.color }
                            }
                          >
                            <ChannelDot channel={booking.channel} size={0} />
                            <span className="truncate leading-tight">
                              {isBlocked ? 'חסום' : booking.guest}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Channel legend */}
        <div className="flex items-center gap-4 px-4 py-2.5 bg-gray-50 border-t border-gray-200">
          {Object.entries(CHANNELS).map(([key, ch]) => (
            <div key={key} className="flex items-center gap-1.5">
              <ChannelDot channel={key} size={8} />
              <span className="text-[11px] text-gray-600">{ch.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredBooking && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-gray-900 text-white rounded-xl px-4 py-3 shadow-2xl text-right min-w-[200px]" dir="rtl">
            <div className="flex items-center gap-2 mb-2">
              <ChannelDot channel={hoveredBooking.channel} size={8} />
              <span className="text-xs font-medium opacity-80">{CHANNELS[hoveredBooking.channel]?.label}</span>
            </div>
            <div className="font-semibold text-sm mb-1">
              {hoveredBooking.channel === 'blocked' ? 'תאריכים חסומים' : hoveredBooking.guest}
            </div>
            <div className="text-xs opacity-70 space-y-0.5">
              <div>{formatHebrewDate(hoveredBooking.startDate)} — {formatHebrewDate(hoveredBooking.endDate)}</div>
              <div>{daysBetween(hoveredBooking.startDate, hoveredBooking.endDate)} לילות</div>
              {hoveredBooking.amount > 0 && <div className="font-semibold text-emerald-400">₪{hoveredBooking.amount.toLocaleString()}</div>}
              <div className="flex items-center gap-1 mt-1">
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-medium',
                  hoveredBooking.status === 'מאושר' ? 'bg-emerald-500/20 text-emerald-300' :
                  hoveredBooking.status === 'ממתין' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-gray-500/20 text-gray-300'
                )}>
                  {hoveredBooking.status}
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
              <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 -mt-1.5" />
            </div>
          </div>
        </div>
      )}

      {/* Bottom: Gaps + Channel Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Gap Detection Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-gray-800">חורים ביומן</h2>
              <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {gaps.length} נמצאו
              </span>
            </div>
            <div className="text-xs text-gray-500">
              פוטנציאל הכנסה: <span className="font-bold text-amber-600">₪{totalGapRevenue.toLocaleString()}</span>
            </div>
          </div>

          {gaps.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">אין חורים ביומן — מצוין!</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {gaps.map(gap => (
                <div key={gap.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{gap.property}</div>
                    <div className="text-xs text-gray-400">
                      {formatHebrewDate(gap.startDate)} — {formatHebrewDate(gap.endDate)} · {gap.nights} לילות
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="text-sm font-bold text-amber-600">₪{gap.potentialRevenue.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400">פוטנציאל</div>
                  </div>
                  <button className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm">
                    <Plus className="w-3 h-3" />
                    פרסם הנחה
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channel Mix */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" />
            מיקס ערוצים
          </h2>

          {/* Donut visual */}
          <div className="flex justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  let cumulative = 0;
                  return channelMix.map(({ key, pct }) => {
                    const offset = cumulative;
                    cumulative += pct;
                    return (
                      <circle
                        key={key}
                        cx="18" cy="18" r="14"
                        fill="none"
                        stroke={CHANNELS[key].color}
                        strokeWidth="5"
                        strokeDasharray={`${pct * 0.88} ${88 - pct * 0.88}`}
                        strokeDashoffset={`${-offset * 0.88}`}
                        className="transition-all duration-500"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">
                    {bookings.filter(b => b.channel !== 'blocked').length}
                  </div>
                  <div className="text-[10px] text-gray-400">הזמנות</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {channelMix.map(({ key, pct }) => (
              <div key={key} className="flex items-center gap-2.5">
                <ChannelDot channel={key} size={10} />
                <span className="text-xs text-gray-700 flex-1">{CHANNELS[key].label}</span>
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: CHANNELS[key].color }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-800 w-8 text-left">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'תפוסה החודש', value: '87%', sub: '+5% מהחודש שעבר', color: 'from-blue-500 to-indigo-500', icon: CalendarRange },
          { label: 'הכנסה החודש', value: '₪45,200', sub: '+12% מהחודש שעבר', color: 'from-emerald-500 to-teal-500', icon: Home },
          { label: 'אורך שהייה ממוצע', value: '2.8 לילות', sub: 'ממוצע גלובלי: 3.2', color: 'from-violet-500 to-purple-500', icon: Eye },
          { label: 'הזמנות החודש', value: '34', sub: '+8 מהחודש שעבר', color: 'from-amber-500 to-orange-500', icon: ExternalLink },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', stat.color)}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
