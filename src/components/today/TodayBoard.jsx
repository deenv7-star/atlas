/**
 * "היום", v8 C: the bento command center (brand/refs-app-deen.md: DealDeck / "Hello Barbara" / fitness bento).
 * The greeting with the owner's photo lives in the shell header. Bento on the lilac-grey canvas:
 *   row 1: ONE solid-indigo hero (הכנסות החודש + delta pill + ↗), תפוסה donut ring, a real photo tile of the complex
 *   row 2: revenue bars (one highlighted indigo bar + tooltip pill, יומי / שבועי / חודשי pill tabs) and
 *          today's arrivals / departures / cleaning with guest photos and one action pill per row.
 * Three numbers max on top. Check-in / check-out times: booking, then the unit's guest info, then 15:00 / 11:00.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, LogIn, LogOut, Sparkles, ArrowUpLeft } from 'lucide-react';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { buildDayBoard } from '@/lib/stay/today';
import { todayISO, addDays, formatDayHe, nightsBetween } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf, balanceOf } from '@/lib/stay/bookings';
import { templateByKey } from '@/lib/stay/whatsapp';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { UnitPhoto, CountUp, Rise, GuestAvatar, AvatarStack } from '@/components/app/atoms';
import { unitPhoto, uploadedPhoto } from '@/lib/stay/unitPhoto';
import { DEMO_PEOPLE } from '@/lib/demoPeople';
import { guestInfoOf } from '@/lib/stay/guestInfo';
import { monthlyRevenue } from '@/components/today/RevenueChart';
import BarChart from '@/components/today/BarChart';
import { Button } from '@/components/ui/button';
import { SegmentedControl, SkelLine, DeltaPill, CardArrow } from '@/components/ds';
import { cn } from '@/lib/utils';

const HHMM = /^([01]?\d|2[0-3]):([0-5]\d)/;
/** "15:00" from a booking/property time field ("15:00", "15:00:00", "1500"); '' when unusable. */
function hhmm(v) {
  const s = String(v || '').trim();
  const m = s.match(HHMM) || s.match(/^([01]\d|2[0-3])([0-5]\d)$/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
}
export function checkInTime(booking, property) {
  return hhmm(booking?.check_in_time) || hhmm(property?.check_in_time) || hhmm(guestInfoOf(property).check_in_time) || '15:00';
}
export function checkOutTime(booking, property) {
  return hhmm(booking?.check_out_time) || hhmm(property?.check_out_time) || hhmm(guestInfoOf(property).check_out_time) || '11:00';
}

function Done({ children = 'בוצע' }) {
  return (
    <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--st-mint-bg)] px-3 text-[13px] font-semibold text-[var(--st-mint-fg)]">
      <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      {children}
    </span>
  );
}


/* ── bento parts ───────────────────────────────────────────────────────────── */
function Tile({ i, to, ariaLabel, className, children, hero = false }) {
  const cls = cn('v5-rise group relative flex min-w-0 flex-col', hero ? 'v7-hero' : 'v7-card', to && 'press v7-lift', className);
  return to
    ? <Link to={to} className={cls} style={{ '--i': i }} aria-label={ariaLabel}>{children}</Link>
    : <div className={cls} style={{ '--i': i }}>{children}</div>;
}

function Money({ value, className, onHero = false }) {
  return (
    <span className={cn('v5-num inline-flex items-baseline font-extrabold', onHero ? 'text-white' : 'text-navy-900', className)} dir="ltr">
      <span className={cn('me-1 text-[0.5em] font-bold', onHero ? 'text-white/70' : 'text-ink-400')}>₪</span>
      <CountUp value={Math.round(value)} format={(n) => n.toLocaleString('en-US')} />
    </span>
  );
}

/** Occupancy donut: indigo booked arc on a lilac track, number in the middle. */
function Donut({ value, size = 128, stroke = 16, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ECEAFE" strokeWidth={stroke} />
        <circle className="c-arc" cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3E2BF1" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ '--c': c }} />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className="v5-num text-[28px] font-extrabold leading-none text-navy-900" dir="ltr">{Math.round(v)}<span className="text-[0.55em] text-ink-400">%</span></span>
        <span className="mt-1 text-[11px] font-medium text-ink-400">החודש</span>
      </span>
    </span>
  );
}

const DAY_LETTER = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
/** Revenue spread over the nights stayed: per day (last 7) or per week (last 8, weeks start Sunday). */
function nightlySeries(bookings, day, mode) {
  const buckets = [];
  if (mode === 'day') {
    for (let k = 6; k >= 0; k -= 1) {
      const d = addDays(day, -k);
      const dt = new Date(`${d}T12:00:00`);
      buckets.push({ key: d, from: d, to: addDays(d, 1), label: DAY_LETTER[dt.getDay()], long: formatDayHe(d), value: 0 });
    }
  } else {
    const dt = new Date(`${day}T12:00:00`);
    const sunday = addDays(day, -dt.getDay());
    for (let k = 7; k >= 0; k -= 1) {
      const from = addDays(sunday, -7 * k);
      const f = new Date(`${from}T12:00:00`);
      buckets.push({ key: from, from, to: addDays(from, 7), label: `${f.getDate()}.${f.getMonth() + 1}`, long: `השבוע של ${formatDayHe(from, { weekday: false })}`, value: 0 });
    }
  }
  const first = buckets[0].from;
  const last = buckets[buckets.length - 1].to;
  for (const b of bookings || []) {
    if (!isActiveBooking(b) || !b.check_in_date) continue;
    const out = checkOutOf(b);
    if (out <= first || b.check_in_date >= last) continue;
    const n = Math.max(1, nightsBetween(b.check_in_date, out));
    const perNight = (Number(b.total_price) || 0) / n;
    for (const bk of buckets) {
      const s = b.check_in_date > bk.from ? b.check_in_date : bk.from;
      const e = out < bk.to ? out : bk.to;
      if (e > s) bk.value += perNight * nightsBetween(s, e);
    }
  }
  return buckets.map((x) => ({ ...x, value: Math.round(x.value) }));
}

/* ── Today list ────────────────────────────────────────────────────────────── */
function DayRow({ property, guest, time, title, detail, attention, action, i }) {
  return (
    <Rise as="li" i={i} className="c-row flex min-h-[68px] items-center gap-3 rounded-[18px] px-3 py-2">
      {guest
        ? <GuestAvatar name={guest} size={44} />
        : <UnitPhoto property={property} className="h-11 w-11" rounded="rounded-[14px]" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-navy-900">{title}</p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink-400">
          {attention ? <span aria-label="דחוף" className="h-1.5 w-1.5 shrink-0 rounded-full bg-attention" /> : null}
          {time && time !== '—' ? <span className="tabular font-semibold text-ink-600">{time}</span> : null}
          {time && time !== '—' && detail ? <span aria-hidden className="text-ink-300">·</span> : null}
          <span className="truncate">{detail}</span>
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </Rise>
  );
}

function GroupLabel({ icon: Icon, children }) {
  return (
    <li className="flex h-8 items-center gap-1.5 px-3 pt-1.5 text-[12px] font-semibold text-ink-400" aria-hidden>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {children}
    </li>
  );
}

function FoldLine({ label, to, onClick, open }) {
  const cls = 'press c-row flex min-h-[48px] w-full items-center gap-3 rounded-[16px] px-3 text-right';
  const inner = (
    <>
      <span className="flex-1 truncate text-[14px] font-medium text-ink-600">{label}</span>
      <ChevronLeft className={cn('h-4 w-4 shrink-0 text-ink-300 transition-transform duration-200', open && '-rotate-90')} strokeWidth={1.75} />
    </>
  );
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} aria-expanded={open} className={cls}>{inner}</button>;
}

export default function TodayBoard({ user, orgId }) {
  const day = todayISO();
  const tomorrow = addDays(day, 1);
  const data = useStayData();
  const { updateBooking, createCleaning, updateCleaning } = useStayMutations();
  const quick = useQuickBooking();
  const [composer, setComposer] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [range, setRange] = useState('month');

  const board = useMemo(() => buildDayBoard({
    day, bookings: data.bookings, paymentsByBooking: data.paymentsByBooking, sentByBooking: data.sentByBooking,
    cleaningTasks: data.cleaningTasks, propertyById: data.propertyById,
  }), [day, data.bookings, data.paymentsByBooking, data.sentByBooking, data.cleaningTasks, data.propertyById]);

  const tomorrowArrivals = useMemo(
    () => (data.bookings || []).filter((b) => isActiveBooking(b) && b.check_in_date === tomorrow).length,
    [data.bookings, tomorrow],
  );

  /* numbers */
  const kpi = useMemo(() => {
    const now = new Date();
    const months = monthlyRevenue(data.bookings, 12, now);
    const thisMonth = months[months.length - 1]?.value || 0;
    const lastMonth = months[months.length - 2]?.value || 0;
    const pct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;
    // occupancy: booked nights inside this month / (units × days)
    const y = now.getFullYear();
    const m = now.getMonth();
    const first = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const next = `${m === 11 ? y + 1 : y}-${String(m === 11 ? 1 : m + 2).padStart(2, '0')}-01`;
    const units = Math.max(1, (data.properties || []).length);
    let nights = 0;
    for (const b of data.bookings || []) {
      if (!isActiveBooking(b)) continue;
      const s = b.check_in_date > first ? b.check_in_date : first;
      const e = checkOutOf(b) < next ? checkOutOf(b) : next;
      if (e > s) nights += Math.round((new Date(e) - new Date(s)) / 86400000);
    }
    const occupancy = Math.min(100, Math.round((nights / (units * daysInMonth)) * 100));
    // open balances across upcoming / current stays
    let openTotal = 0;
    let openCount = 0;
    let overdue = false;
    for (const b of data.bookings || []) {
      if (!isActiveBooking(b) || b.status === 'CHECKED_OUT') continue;
      const bal = balanceOf(b, data.paymentsByBooking.get(b.id) || [], day);
      if (bal.balance > 0) { openTotal += bal.balance; openCount += 1; if (bal.overdue) overdue = true; }
    }
    const monthKey = first.slice(0, 7);
    const paidThisMonth = (data.payments || [])
      .filter((p) => String(p.status).toUpperCase() === 'PAID' && String(p.paid_date || p.paid_at || '').slice(0, 7) === monthKey)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return { paidThisMonth, months, thisMonth, pct, occupancy, nights, units, daysInMonth, openTotal, openCount, overdue, spark: months.slice(-7).map((x) => x.value) };
  }, [data.bookings, data.properties, data.payments, data.paymentsByBooking, day]);

  const chartData = useMemo(
    () => (range === 'month' ? kpi.months.slice(-6) : nightlySeries(data.bookings, day, range)),
    [range, kpi.months, data.bookings, day],
  );
  const chartTotal = chartData.reduce((s, x) => s + x.value, 0);
  const hasHistory = chartData.filter((x) => x.value > 0).length >= 2;
  const rangeLabel = { day: 'ב־7 הימים האחרונים', week: 'ב־8 השבועות האחרונים', month: 'ב־6 החודשים האחרונים' }[range];

  const setStatus = async (booking, status, msg) => {
    try { await updateBooking.mutateAsync({ id: booking.id, data: { status } }); atlasToastApi.success(msg); }
    catch { atlasToastApi.error('לא הצלחנו לעדכן את ההזמנה'); }
  };
  const markCleaned = async (c) => {
    try {
      if (c.task) await updateCleaning.mutateAsync({ id: c.task.id, data: { status: 'DONE' } });
      else {
        await createCleaning.mutateAsync({
          ...(orgId ? { org_id: orgId } : {}), title: `ניקיון ${c.unit}`, property_id: c.departure.property_id || null,
          booking_id: c.departure.id, scheduled_date: day, status: 'DONE', created_at: new Date().toISOString(),
        });
      }
      atlasToastApi.success(`${c.unit} מוכנה לאורחים הבאים`);
    } catch { atlasToastApi.error('לא הצלחנו לעדכן את הניקיון'); }
  };

  const prop = (id) => data.propertyById.get(id) || null;
  const openCleanings = board.cleanings.filter((c) => !c.done).length;
  const counts = [
    { label: board.arrivals.length === 1 ? 'כניסה' : 'כניסות', value: board.arrivals.length },
    { label: board.departures.length === 1 ? 'יציאה' : 'יציאות', value: board.departures.length },
    { label: 'ניקיון', value: openCleanings },
  ];
  const sm = 'h-11 px-4 text-[14px]';
  const pill = (label, onClick) => <Button variant="secondary" className={sm} onClick={onClick}>{label}</Button>;

  const groups = [
    {
      key: 'in', label: 'כניסות', icon: LogIn,
      rows: board.arrivals.map(({ booking, unit }) => ({
        key: `in-${booking.id}`, guest: booking.guest_name || 'אורח', property: prop(booking.property_id), time: checkInTime(booking, prop(booking.property_id)),
        title: booking.guest_name || 'אורח', detail: [unit, booking.nights ? `${booking.nights} לילות` : null].filter(Boolean).join(' · '),
        action: booking.status === 'CHECKED_IN'
          ? <Done>נכנסו</Done>
          : pill('נכנסו', () => setStatus(booking, 'CHECKED_IN', `${booking.guest_name || 'האורחים'} נכנסו`)),
      })),
    },
    {
      key: 'out', label: 'יציאות', icon: LogOut,
      rows: board.departures.map(({ booking, unit }) => ({
        key: `out-${booking.id}`, guest: booking.guest_name || 'אורח', property: prop(booking.property_id), time: checkOutTime(booking, prop(booking.property_id)),
        title: booking.guest_name || 'אורח', detail: unit,
        action: booking.status === 'CHECKED_OUT'
          ? <Done>יצאו</Done>
          : pill('יצאו', () => setStatus(booking, 'CHECKED_OUT', `${booking.guest_name || 'האורחים'} יצאו`)),
      })),
    },
    {
      key: 'clean', label: 'ניקיון', icon: Sparkles,
      rows: board.cleanings.map((c) => ({
        key: `clean-${c.key}`, property: prop(c.departure.property_id), time: c.sameDayTurnover ? `עד ${checkInTime(c.nextArrival, prop(c.departure.property_id))}` : '—',
        title: c.unit, attention: c.sameDayTurnover && !c.done,
        detail: c.sameDayTurnover ? 'אורחים חדשים נכנסים היום' : c.nextArrival ? `הכניסה הבאה ${formatDayHe(c.nextArrival.check_in_date, { weekday: false })}` : 'אין כניסה קרובה',
        action: c.done ? <Done /> : pill('בוצע', () => markCleaned(c)),
      })),
    },
  ].filter((g) => g.rows.length);

  const nothingToday = groups.length === 0;
  const composerProperty = composer ? data.propertyById.get(composer.booking.property_id) : null;
  let rowIdx = 0;

  /* occupied tonight, for the photo tile */
  const tonight = useMemo(() => {
    const act = (data.bookings || []).filter((b) => isActiveBooking(b) && b.check_in_date <= day && checkOutOf(b) > day);
    const units = (data.properties || []).length;
    return { guests: act.map((b) => b.guest_name || 'אורח'), occupied: new Set(act.map((b) => b.property_id)).size, units };
  }, [data.bookings, data.properties, day]);
  const monthGuests = (data.bookings || []).filter((b) => isActiveBooking(b) && String(b.check_in_date).slice(0, 7) === day.slice(0, 7)).map((b) => b.guest_name || 'אורח');
  const firstProp = (data.properties || [])[0];
  // demo workspace: an aerial pool in a green garden (cool, calm). Real workspaces: their own first photo.
  const photo = DEMO_PEOPLE ? '/demo/complex-pool.webp' : (uploadedPhoto(firstProp) || unitPhoto(firstProp) || '/demo/complex-pool.webp');
  const free = Math.max(0, tonight.units - tonight.occupied);

  /* ── blocks ── */
  const hero = (
    <Tile i={1} hero to="/payments" ariaLabel="הכנסות החודש, למסך הכספים" className="col-span-2 min-h-[196px] p-5 md:p-6 lg:col-span-5 lg:min-h-[214px]">
      <div className="flex items-start justify-between gap-2">
        <p className="pt-2 text-[15px] font-medium text-white/85">הכנסות החודש</p>
        <CardArrow onHero />
      </div>
      <div className="mt-auto pt-4">
        <Money onHero value={kpi.thisMonth} className="text-[44px] leading-none tracking-[-0.035em] md:text-[48px]" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[13px] text-white/85">
            {kpi.pct != null ? <DeltaPill onHero pct={kpi.pct} /> : null}
            <span>{kpi.pct != null ? 'מהחודש שעבר' : 'החודש הראשון שלכם'}</span>
          </p>
          {monthGuests.length ? (
            <span className="flex items-center gap-2 text-[13px] text-white/85">
              <AvatarStack names={monthGuests} size={30} max={3} showRest={false} ringClass="ring-brand-600" />
              <span><span className="tabular font-bold text-white">{monthGuests.length}</span> הזמנות</span>
            </span>
          ) : null}
        </div>
      </div>
    </Tile>
  );

  const donut = (
    <Tile i={2} to="/calendar" ariaLabel={`תפוסה ${kpi.occupancy}% החודש, ללוח השנה`} className="min-h-[196px] p-4 md:p-5 lg:col-span-3 lg:min-h-[214px]">
      <div className="flex items-start justify-between gap-2">
        <p className="pt-2 text-[15px] font-semibold text-navy-900">תפוסה</p>
        <CardArrow />
      </div>
      <div className="mt-auto flex flex-col items-center gap-3 pt-1 lg:flex-row lg:items-center lg:justify-between lg:gap-2">
        <Donut value={kpi.occupancy} size={118} stroke={15} label={`תפוסה ${kpi.occupancy}% החודש`} />
        <ul className="w-full space-y-1.5 text-[13px] lg:w-auto" aria-hidden>
          <li className="flex items-center justify-between gap-3 lg:justify-start"><span className="inline-flex items-center gap-1.5 text-ink-400"><span className="h-2 w-2 rounded-full bg-brand-600" />מוזמנות</span><span className="tabular font-bold text-navy-900">{kpi.nights}</span></li>
          <li className="flex items-center justify-between gap-3 lg:justify-start"><span className="inline-flex items-center gap-1.5 text-ink-400"><span className="h-2 w-2 rounded-full bg-[#ECEAFE] ring-1 ring-inset ring-[#D9D5FB]" />פנויות</span><span className="tabular font-bold text-navy-900">{Math.max(0, kpi.units * kpi.daysInMonth - kpi.nights)}</span></li>
        </ul>
      </div>
    </Tile>
  );

  const photoTile = (
    <Link
      to="/calendar"
      aria-label={`${user?.organization_name || 'המתחם'}: ${tonight.occupied} יחידות מאוכלסות הלילה, ${free} פנויות. ללוח השנה`}
      className="v5-rise c-photo press v7-lift flex min-h-[196px] flex-col justify-between p-3.5 text-white md:p-4 lg:col-span-4 lg:min-h-[214px]"
      style={{ '--i': 3 }}
    >
      <img src={photo} alt="" loading="eager" decoding="async" draggable={false} />
      <div className="flex items-start justify-between gap-2">
        <span className="c-glass inline-flex h-8 items-center rounded-full px-3 text-[12px] font-semibold">{tonight.units} יחידות</span>
        <span aria-hidden className="v7-arrow c-glass inline-flex h-10 w-10 items-center justify-center rounded-full">
          <ArrowUpLeft className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-bold leading-tight md:text-[19px]">{user?.organization_name || firstProp?.name || 'המתחם שלי'}</p>
          <p className="mt-1 truncate text-[12px] text-white/90 md:text-[13px]">
            {tonight.occupied} מאוכלסות הלילה<span className="hidden sm:inline"> · {free} {free === 1 ? 'פנויה' : 'פנויות'}</span>
          </p>
        </div>
        {tonight.guests.length ? <AvatarStack names={tonight.guests} size={30} max={3} showRest={false} className="hidden shrink-0 sm:inline-flex" /> : null}
      </div>
    </Link>
  );

  const chart = (
    <Rise i={4} as="section" aria-label="הכנסות" className="v7-card flex h-full min-w-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
        <div>
          <h2 className="text-[17px] font-bold text-navy-900">הכנסות</h2>
          <p className="mt-1.5 flex items-baseline gap-2">
            <Money value={chartTotal} className="text-[26px] leading-none" />
            <span className="text-[13px] text-ink-400">{rangeLabel}</span>
          </p>
        </div>
        <SegmentedControl
          ariaLabel="טווח"
          size="sm"
          value={range}
          onChange={setRange}
          className="rounded-full bg-[#F1F1F8] p-1 [&_button]:ring-0 [&_button[aria-selected=false]]:bg-transparent [&_button[aria-selected=true]]:bg-white [&_button[aria-selected=true]]:text-navy-900 [&_button[aria-selected=true]]:shadow-[0_1px_2px_rgba(27,38,86,0.08),0_4px_10px_-4px_rgba(27,38,86,0.18)]"
          options={[{ value: 'day', label: 'יומי' }, { value: 'week', label: 'שבועי' }, { value: 'month', label: 'חודשי' }]}
        />
      </div>
      <div className="flex min-h-[260px] flex-1 flex-col px-4 pb-5 pt-6 md:px-6">
        {hasHistory ? (
          <BarChart key={range} data={chartData} height="fill" barClass="rounded-[14px]" idleClass="bg-[#ECECF5]" />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <p className="text-[15px] font-semibold text-navy-900">הגרף יתמלא עם ההזמנות הבאות</p>
            <p className="mt-1 text-[13px] text-ink-400">אחרי כמה הזמנות תראו כאן את המגמה.</p>
          </div>
        )}
      </div>
    </Rise>
  );

  const today = (
    <Rise i={5} as="section" aria-label="היום" className="v7-card flex h-full min-w-0 flex-col overflow-hidden">
      <div className="flex min-h-[64px] items-center justify-between gap-3 px-5 pt-3 md:px-6">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-navy-900">היום במתחם</h2>
          {!data.isLoading ? (
            <p className="mt-0.5 truncate text-[13px] text-ink-400">
              {counts.map((c, idx) => (
                <React.Fragment key={c.label}>
                  {idx > 0 ? <span aria-hidden className="text-ink-300"> · </span> : null}
                  <span><span className="tabular font-semibold text-ink-600">{c.value}</span> {c.label}</span>
                </React.Fragment>
              ))}
            </p>
          ) : null}
        </div>
        <Link to="/calendar" className="press inline-flex h-11 shrink-0 items-center gap-1 rounded-full bg-[#F1F1F8] px-3.5 text-[13px] font-semibold text-navy-900 hover:bg-[#E8E8F2]">
          לוח שנה
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>
      {nothingToday ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--st-mint-bg)] text-[var(--st-mint-fg)]">
            <Check className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <p className="mt-3 text-[15px] font-semibold text-navy-900">הכל מוכן להיום</p>
          <p className="mt-1 text-[13px] text-ink-400">אין כניסות, יציאות או ניקיונות.</p>
        </div>
      ) : (
        <ul className="px-2 pb-1 md:px-3">
          {groups.map((g) => (
            <React.Fragment key={g.key}>
              <GroupLabel icon={g.icon}>{g.label}</GroupLabel>
              {g.rows.map((r) => {
                rowIdx += 1;
                return <DayRow key={r.key} i={5 + rowIdx} {...r} />;
              })}
            </React.Fragment>
          ))}
        </ul>
      )}
      <ul className="mt-auto space-y-0.5 border-t border-[#F0F0F6] px-2 py-2 md:px-3">
        {board.messages.length > 0 ? (
          <li>
            <FoldLine open={showMessages} onClick={() => setShowMessages((v) => !v)} label={`${board.messages.length} הודעות מחכות לשליחה`} />
            {showMessages ? (
              <ul>
                {board.messages.map(({ booking, template, balance }, idx) => (
                  <DayRow
                    key={`msg-${booking.id}`}
                    i={idx}
                    guest={booking.guest_name || 'אורח'}
                    property={prop(booking.property_id)}
                    time="—"
                    title={booking.guest_name || 'אורח'}
                    detail={templateByKey(template)?.label}
                    action={pill('שליחה', () => setComposer({ booking, template, balance }))}
                  />
                ))}
              </ul>
            ) : null}
          </li>
        ) : null}
        <li>
          <FoldLine to="/calendar" label={tomorrowArrivals ? `מחר: ${tomorrowArrivals} ${tomorrowArrivals === 1 ? 'כניסה' : 'כניסות'}` : 'מחר: אין כניסות'} />
        </li>
      </ul>
    </Rise>
  );

  const skeleton = (
    <div role="status" aria-busy="true" aria-label="טוען">
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-12">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn('v7-card min-h-[196px] p-6 lg:min-h-[214px]', i === 0 ? 'col-span-2 lg:col-span-5' : i === 1 ? 'lg:col-span-3' : 'lg:col-span-4')}>
            <SkelLine className="h-3 w-20" />
            <SkelLine className="mt-16 h-8 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <SkelLine className="h-[380px] rounded-[24px] lg:col-span-7" />
        <SkelLine className="h-[380px] rounded-[24px] lg:col-span-5" />
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[var(--page-max,1200px)] px-5 pb-16 pt-2 md:px-10 md:pt-3" dir="rtl">
      <h1 className="sr-only">היום</h1>
      {data.isError ? (
        <div className="v7-card mt-4 p-6">
          <p className="text-[15px] font-semibold text-navy-900">לא הצלחנו לטעון את היום</p>
          <p className="mt-1 text-[14px] text-ink-400">בדקו את החיבור ונסו שוב.</p>
          <Button variant="outline" className="mt-4" onClick={() => data.refetch?.()}>לנסות שוב</Button>
        </div>
      ) : data.isLoading ? skeleton : (
        <>
          <section aria-label="מספרים" className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-12">
            {hero}
            {donut}
            {photoTile}
          </section>
          <div className="mt-3 grid gap-3 md:mt-4 md:gap-4 lg:grid-cols-12">
            <div className="order-2 min-w-0 lg:order-1 lg:col-span-7">{chart}</div>
            <div className="order-1 min-w-0 lg:order-2 lg:col-span-5">{today}</div>
          </div>
        </>
      )}

      <WhatsAppComposer
        open={!!composer}
        onOpenChange={(o) => { if (!o) setComposer(null); }}
        booking={composer?.booking}
        property={composerProperty}
        balance={composer?.balance}
        initialTemplate={composer?.template}
        orgId={orgId}
        orgName={user?.organization_name || ''}
      />
    </div>
  );
}
