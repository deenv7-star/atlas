/**
 * "היום": the home screen (v7, brand/refs-app-deen.md). The greeting lives in the shell header.
 *   1. title + one calm line of the day's counts (+ a 7-day chip strip on phones)
 *   2. three numbers max, bento: solid-indigo hero (הכנסות החודש), תפוסה (radial ring), יתרות פתוחות
 *   3. revenue bars with one highlighted indigo month + tooltip pill, beside the "היום" list
 *      (arrivals / departures with guest avatars, cleaning, one action pill per row)
 * Check-in / check-out times come from the booking, then the unit's guest info, then 15:00 / 11:00.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, Plus, LogIn, LogOut, Sparkles } from 'lucide-react';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { buildDayBoard } from '@/lib/stay/today';
import { todayISO, addDays, formatDayHe } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf, balanceOf } from '@/lib/stay/bookings';
import { templateByKey } from '@/lib/stay/whatsapp';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { UnitTile, CountUp, Rise, GuestAvatar } from '@/components/app/atoms';
import { guestInfoOf } from '@/lib/stay/guestInfo';
import { monthlyRevenue } from '@/components/today/RevenueChart';
import { Sparkline } from '@/components/today/Sparkline';
import BarChart, { Ring } from '@/components/today/BarChart';
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

/* ── KPI cards ─────────────────────────────────────────────────────────────── */
function Kpi({ i, label, attention, to, children, className, hero = false, ariaLabel }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className={cn('flex items-center gap-2 pt-1.5 text-[14px] font-medium', hero ? 'text-white/85' : 'text-ink-400')}>
          <span>{label}</span>
          {attention ? <span role="img" aria-label="דורש תשומת לב" className="h-1.5 w-1.5 rounded-full bg-attention" /> : null}
        </p>
        {to ? <CardArrow onHero={hero} /> : null}
      </div>
      {children}
    </>
  );
  const cls = cn(
    'v5-rise group relative flex min-w-0 flex-col p-5 md:p-6',
    hero ? 'v7-hero' : 'v7-card',
    to && 'press v7-lift',
    className,
  );
  return to
    ? <Link to={to} className={cls} style={{ '--i': i }} aria-label={ariaLabel}>{body}</Link>
    : <div className={cls} style={{ '--i': i }}>{body}</div>;
}

function Money({ value, className, onHero = false }) {
  return (
    <span className={cn('v5-num inline-flex items-baseline font-extrabold', onHero ? 'text-white' : 'text-navy-900', className)} dir="ltr">
      <span className={cn('me-1 text-[0.55em] font-bold', onHero ? 'text-white/70' : 'text-ink-400')}>₪</span>
      <CountUp value={Math.round(value)} format={(n) => n.toLocaleString('en-US')} />
    </span>
  );
}

/* ── Today list ────────────────────────────────────────────────────────────── */
function DayRow({ property, guest, time, title, detail, attention, action, i }) {
  return (
    <Rise as="li" i={i} className="v7-row flex min-h-[72px] items-center gap-3 rounded-[18px] px-3 py-2.5">
      {guest
        ? <GuestAvatar name={guest} size={44} />
        : <UnitTile property={property} className="h-11 w-11 text-[16px]" rounded="rounded-full" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-navy-900">{title}</p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink-400">
          {attention ? <span role="img" aria-label="דחוף" className="h-1.5 w-1.5 shrink-0 rounded-full bg-attention" /> : null}
          {time && time !== '—' ? <span className="tabular font-medium text-ink-600">{time}</span> : null}
          {time && time !== '—' && detail ? <span aria-hidden className="text-ink-300">·</span> : null}
          <span className="truncate">{detail}</span>
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </Rise>
  );
}

function GroupLabel({ icon: Icon, children, count }) {
  return (
    <li className="flex h-9 items-center gap-2 px-3 pt-2 text-[12px] font-semibold text-ink-400" aria-hidden>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {children}
      <span className="tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EEF0F6] px-1.5 text-[11px] font-semibold text-ink-600">{count}</span>
    </li>
  );
}

function FoldLine({ label, to, onClick, open }) {
  const cls = 'press v7-row flex min-h-[52px] w-full items-center gap-3 rounded-[16px] px-3 text-right';
  const inner = (
    <>
      <span className="flex-1 truncate text-[14px] font-medium text-ink-600">{label}</span>
      <ChevronLeft className={cn('h-4 w-4 shrink-0 text-ink-300 transition-transform duration-200', open && '-rotate-90')} strokeWidth={1.75} />
    </>
  );
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} aria-expanded={open} className={cls}>{inner}</button>;
}

const DAY_LETTER = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
/** Seven-day chip strip (phones): today filled indigo, a dot on days with arrivals. Opens the calendar there. */
function DayStrip({ day, bookings }) {
  const days = Array.from({ length: 7 }, (_, k) => addDays(day, k));
  const arrivals = new Set((bookings || []).filter((b) => isActiveBooking(b)).map((b) => b.check_in_date));
  return (
    <nav aria-label="הימים הקרובים" className="v7-strip -mx-5 mt-5 flex scroll-px-5 gap-2 overflow-x-auto px-5 pb-3 lg:hidden">
      {days.map((d, k) => {
        const dt = new Date(`${d}T12:00:00`);
        const on = k === 0;
        return (
          <Link
            key={d}
            to={`/calendar?view=day&date=${d}`}
            aria-label={`${formatDayHe(d)}${arrivals.has(d) ? ', יש כניסות' : ''}`}
            className={cn(
              'press flex h-[68px] w-[52px] shrink-0 flex-col items-center justify-center gap-1 rounded-full',
              on ? 'bg-brand-600 text-white shadow-[0_10px_20px_-8px_rgba(62,43,241,0.6)]' : 'bg-white text-navy-900 ring-1 ring-inset ring-[#E8EAF2]',
            )}
          >
            <span className={cn('text-[12px] font-medium', on ? 'text-white/80' : 'text-ink-400')}>{DAY_LETTER[dt.getDay()]}</span>
            <span className="text-[17px] font-bold tabular leading-none">{dt.getDate()}</span>
            <span aria-hidden className={cn('h-1 w-1 rounded-full', arrivals.has(d) ? (on ? 'bg-white' : 'bg-brand-600') : 'bg-transparent')} />
          </Link>
        );
      })}
    </nav>
  );
}

export default function TodayBoard({ user, orgId }) {
  const day = todayISO();
  const tomorrow = addDays(day, 1);
  const data = useStayData();
  const { updateBooking, createCleaning, updateCleaning } = useStayMutations();
  const quick = useQuickBooking();
  const [composer, setComposer] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [range, setRange] = useState('6');

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

  const chartData = useMemo(() => (range === '12' ? kpi.months : kpi.months.slice(-6)), [range, kpi.months]);
  const chartTotal = chartData.reduce((s, x) => s + x.value, 0);
  const hasHistory = chartData.filter((x) => x.value > 0).length >= 2;

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
  const sm = 'h-10 px-4 text-[14px]';
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

  /* ── blocks ── */
  const header = (
    <section className="v5-rise">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[32px] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy-900 md:text-[34px]">היום</h1>
          {data.isLoading ? <SkelLine className="mt-2.5 h-4 w-48" /> : (
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-[15px] text-ink-600">
              {counts.map((c, idx) => (
                <React.Fragment key={c.label}>
                  {idx > 0 ? <span aria-hidden className="text-ink-300">·</span> : null}
                  <span><span className="tabular font-bold text-navy-900">{c.value}</span> {c.label}</span>
                </React.Fragment>
              ))}
            </p>
          )}
        </div>
        <Button onClick={() => quick.open()} className="hidden h-12 px-6 lg:inline-flex">
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />הזמנה חדשה
        </Button>
      </div>
      <DayStrip day={day} bookings={data.bookings} />
    </section>
  );

  const kpis = (
    <section aria-label="מספרים" className="mt-6 grid grid-cols-2 gap-3 md:mt-7 md:gap-4 lg:grid-cols-12">
      <Kpi i={1} hero label="הכנסות החודש" to="/payments" ariaLabel="הכנסות החודש, למסך הכספים" className="col-span-2 min-h-[176px] md:min-h-[188px] lg:col-span-5">
        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div className="min-w-0">
            <Money onHero value={kpi.thisMonth} className="text-[40px] leading-none tracking-[-0.03em]" />
            <p className="mt-3 flex items-center gap-2 text-[13px] text-white/80">
              {kpi.pct != null ? <DeltaPill onHero pct={kpi.pct} /> : null}
              <span>{kpi.pct != null ? 'מהחודש שעבר' : 'החודש הראשון שלכם'}</span>
            </p>
          </div>
          <Sparkline values={kpi.spark} width={112} height={48} color="#FFFFFF" dot="#3E2BF1" className="mb-1 shrink-0 opacity-95" />
        </div>
      </Kpi>
      <Kpi i={2} label="תפוסה" to="/calendar" ariaLabel={`תפוסה ${kpi.occupancy}% החודש, ללוח השנה`} className="min-h-[164px] md:min-h-[188px] lg:col-span-4">
        <div className="mt-auto flex flex-col items-start gap-3 pt-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="order-2 min-w-0 sm:order-1">
            <p className="text-[13px] text-ink-400">{kpi.nights} לילות מתוך {kpi.units * kpi.daysInMonth}</p>
            <p className="mt-1 text-[13px] font-medium text-ink-600">{kpi.units} {kpi.units === 1 ? 'יחידה' : 'יחידות'}</p>
          </div>
          <span className="order-1 sm:order-2"><Ring value={kpi.occupancy} size={88} stroke={10} label={`תפוסה ${kpi.occupancy}%`} /></span>
        </div>
      </Kpi>
      <Kpi i={3} label="יתרות פתוחות" attention={kpi.overdue} to="/balances" ariaLabel="יתרות פתוחות, למסך היתרות" className="min-h-[164px] md:min-h-[188px] lg:col-span-3">
        <div className="mt-auto pt-4">
          <Money value={kpi.openTotal} className="text-[30px] leading-none md:text-[32px]" />
          <p className="mt-3">
            {kpi.openCount
              ? <span className={cn('inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-semibold', kpi.overdue ? 'bg-[var(--st-red-bg)] text-[var(--st-red-fg)]' : 'bg-[var(--st-lilac-bg)] text-[var(--st-lilac-fg)]')}>{kpi.openCount} הזמנות{kpi.overdue ? <span className="sr-only">, יש באיחור</span> : null}</span>
              : <span className="inline-flex h-7 items-center rounded-full bg-[var(--st-mint-bg)] px-3 text-[13px] font-semibold text-[var(--st-mint-fg)]">הכל שולם</span>}
          </p>
        </div>
      </Kpi>
    </section>
  );

  const chart = (
    <Rise i={4} as="section" aria-label="הכנסות" className="v7-card flex h-full min-w-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
        <div>
          <h2 className="text-[17px] font-bold text-navy-900">הכנסות</h2>
          <p className="mt-1.5 flex items-baseline gap-2">
            <Money value={chartTotal} className="text-[24px] leading-none" />
            <span className="text-[13px] text-ink-400">{range === '12' ? 'ב־12 החודשים האחרונים' : 'ב־6 החודשים האחרונים'}</span>
          </p>
        </div>
        <SegmentedControl
          ariaLabel="טווח"
          size="sm"
          value={range}
          onChange={setRange}
          options={[{ value: '6', label: '6 חודשים' }, { value: '12', label: 'שנה' }]}
        />
      </div>
      <div className="flex min-h-[280px] flex-1 flex-col px-4 pb-5 pt-6 md:px-6">
        {hasHistory ? (
          <BarChart key={range} data={chartData} height="fill" />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <p className="text-[15px] font-semibold text-navy-900">הגרף יתמלא עם ההזמנות הבאות</p>
            <p className="mt-1 text-[13px] text-ink-400">אחרי חודשיים של הזמנות תראו כאן את המגמה.</p>
          </div>
        )}
      </div>
    </Rise>
  );

  const today = (
    <Rise i={5} as="section" aria-label="היום" className="v7-card flex h-full min-w-0 flex-col overflow-hidden">
      <div className="flex min-h-[64px] items-center justify-between gap-3 px-5 pt-2 md:px-6">
        <h2 className="text-[17px] font-bold text-navy-900">כניסות ויציאות</h2>
        <Link to="/calendar" className="press inline-flex h-10 items-center gap-1 rounded-full bg-[#F1F2F7] px-3.5 text-[13px] font-semibold text-navy-900 hover:bg-[#E9EBF3]">
          ללוח השנה
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
              <GroupLabel icon={g.icon} count={g.rows.length}>{g.label}</GroupLabel>
              {g.rows.map((r) => {
                rowIdx += 1;
                return <DayRow key={r.key} i={5 + rowIdx} {...r} />;
              })}
            </React.Fragment>
          ))}
        </ul>
      )}
      <ul className="mt-auto space-y-0.5 border-t border-[#EEF0F5] px-2 py-2 md:px-3">
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
      <div className="mt-6 grid grid-cols-2 gap-3 md:mt-7 md:gap-4 lg:grid-cols-12">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn('v7-card min-h-[188px] p-6', i === 0 ? 'col-span-2 lg:col-span-5' : i === 1 ? 'lg:col-span-4' : 'lg:col-span-3')}>
            <SkelLine className="h-3 w-20" />
            <SkelLine className="mt-16 h-8 w-28" />
            <SkelLine className="mt-3 h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <SkelLine className="h-[360px] rounded-[22px] lg:col-span-7" />
        <SkelLine className="h-[360px] rounded-[22px] lg:col-span-5" />
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[var(--page-max,1200px)] px-5 pb-16 pt-3 md:px-10 md:pt-5" dir="rtl">
      {header}
      {data.isError ? (
        <div className="v7-card mt-8 p-6">
          <p className="text-[15px] font-semibold text-navy-900">לא הצלחנו לטעון את היום</p>
          <p className="mt-1 text-[14px] text-ink-400">בדקו את החיבור ונסו שוב.</p>
          <Button variant="outline" className="mt-4" onClick={() => data.refetch?.()}>לנסות שוב</Button>
        </div>
      ) : data.isLoading ? skeleton : (
        <>
          {kpis}
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
