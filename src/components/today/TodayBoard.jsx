/**
 * "היום": the premium home screen (v5, brand/direction-v5.md).
 *   1. greeting + date + one calm line of the day's counts
 *   2. three numbers max: הכנסות החודש (mini indigo sparkline), תפוסה, יתרות פתוחות
 *   3. one elegant revenue chart (indigo line + soft area) beside the "היום" list
 *      (arrivals / departures / cleaning, one action per row)
 * variant "a" = Mercury: flat white cards, initials tiles, no icons.
 * variant "b" = Stripe: indigo header band, icon squares on KPIs, cool unit thumbnails, card header rules.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, Plus, Wallet, BedDouble, Receipt, LogIn, LogOut, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { buildDayBoard } from '@/lib/stay/today';
import { todayISO, addDays, formatDayHe, formatMoney, firstName } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf, balanceOf } from '@/lib/stay/bookings';
import { templateByKey } from '@/lib/stay/whatsapp';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { UnitPhoto, UnitTile, CountUp, Rise, dayPart } from '@/components/app/atoms';
import RevenueChart, { Sparkline, monthlyRevenue } from '@/components/today/RevenueChart';
import { Button } from '@/components/ui/button';
import { SegmentedControl, SkelLine } from '@/components/ds';
import { cn } from '@/lib/utils';

const CHECK_IN = '15:00';
const CHECK_OUT = '11:00';

function Done({ children = 'בוצע' }) {
  return (
    <span className="inline-flex h-10 items-center gap-1.5 px-1 text-[14px] font-medium text-ink-400">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-50 text-success-600">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      {children}
    </span>
  );
}

/* ── KPI cards ─────────────────────────────────────────────────────────────── */
function Kpi({ i, label, icon: Icon, stripe, attention, to, children, className, footer }) {
  const body = (
    <>
      <p className="flex items-center gap-2 text-[13px] font-medium text-ink-400">
        {stripe && Icon ? (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#EEF0FF] text-brand-600">
            <Icon className="h-4 w-4" strokeWidth={1.5} />
          </span>
        ) : null}
        <span>{label}</span>
        {attention ? <span aria-label="דורש תשומת לב" className="h-1.5 w-1.5 rounded-full bg-attention" /> : null}
        {to ? <ChevronLeft className="ms-auto h-4 w-4 text-ink-300 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={1.5} /> : null}
      </p>
      {children}
      {stripe && footer ? (
        <p className="-mx-5 mt-4 flex items-center justify-between gap-2 border-t border-line px-5 pt-3 text-[13px] text-ink-400 md:-mx-6 md:px-6">{footer}</p>
      ) : null}
    </>
  );
  const cls = cn(
    'v5-rise group relative flex min-w-0 flex-col rounded-[14px] border border-line bg-white px-5 py-4 shadow-card md:px-6 md:py-5',
    to && 'press v4-lift',
    className,
  );
  return to
    ? <Link to={to} className={cls} style={{ '--i': i }}>{body}</Link>
    : <div className={cls} style={{ '--i': i }}>{body}</div>;
}

function Money({ value, className }) {
  return (
    <span className={cn('v5-num inline-flex items-baseline font-bold text-navy-900', className)} dir="ltr">
      <span className="me-0.5 text-[0.62em] font-semibold text-ink-400">₪</span>
      <CountUp value={Math.round(value)} format={(n) => n.toLocaleString('en-US')} />
    </span>
  );
}

function Delta({ pct }) {
  if (pct == null || !Number.isFinite(pct)) return null;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[13px] font-medium', up ? 'text-success-600' : 'text-danger-600')}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      <span className="tabular" dir="ltr">{Math.abs(Math.round(pct))}%</span>
    </span>
  );
}

/* ── Today list ────────────────────────────────────────────────────────────── */
function DayRow({ stripe, property, time, title, detail, attention, action, i }) {
  return (
    <Rise as="li" i={i} className="v5-row flex min-h-[68px] items-center gap-3 px-4 py-3 md:px-5">
      <span className="w-11 shrink-0 text-[13px] font-medium tabular text-ink-400">{time}</span>
      {stripe
        ? <UnitPhoto property={property} className="h-10 w-10" rounded="rounded-[10px]" />
        : <UnitTile property={property} className="h-10 w-10 text-[15px]" rounded="rounded-[10px]" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-navy-900">{title}</p>
        <p className="flex items-center gap-1.5 truncate text-[13px] text-ink-400">
          {attention ? <span aria-label="דחוף" className="h-1.5 w-1.5 shrink-0 rounded-full bg-attention" /> : null}
          <span className="truncate">{detail}</span>
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </Rise>
  );
}

function GroupLabel({ icon: Icon, children, count }) {
  return (
    <li className="flex h-9 items-center gap-2 bg-[#FAFBFC] px-4 text-[12px] font-semibold text-ink-400 md:px-5" aria-hidden>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
      {children}
      <span className="tabular font-medium text-ink-300">{count}</span>
    </li>
  );
}

function FoldLine({ label, to, onClick, open }) {
  const cls = 'press v5-row flex min-h-[52px] w-full items-center gap-3 px-4 text-right md:px-5';
  const inner = (
    <>
      <span className="flex-1 truncate text-[14px] text-ink-600">{label}</span>
      <ChevronLeft className={cn('h-4 w-4 shrink-0 text-ink-300 transition-transform duration-200', open && '-rotate-90')} strokeWidth={1.5} />
    </>
  );
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} aria-expanded={open} className={cls}>{inner}</button>;
}

export default function TodayBoard({ user, orgId, variant = 'a' }) {
  const day = todayISO();
  const tomorrow = addDays(day, 1);
  const data = useStayData();
  const { updateBooking, createCleaning, updateCleaning } = useStayMutations();
  const quick = useQuickBooking();
  const [composer, setComposer] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [range, setRange] = useState('6');
  const name = firstName(user?.full_name || '') || '';
  const part = dayPart();
  const stripe = variant === 'b';

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
  const chartBookings = useMemo(() => {
    const keys = new Set(chartData.map((m) => m.key));
    return (data.bookings || []).filter((b) => isActiveBooking(b) && keys.has(String(b.check_in_date).slice(0, 7))).length;
  }, [chartData, data.bookings]);

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
    { label: 'כניסות', value: board.arrivals.length },
    { label: 'יציאות', value: board.departures.length },
    { label: 'ניקיון', value: openCleanings },
  ];
  const sm = 'h-10 px-4 text-[14px]';

  const groups = [
    {
      key: 'in', label: 'כניסות', icon: LogIn,
      rows: board.arrivals.map(({ booking, unit }) => ({
        key: `in-${booking.id}`, property: prop(booking.property_id), time: CHECK_IN,
        title: booking.guest_name || 'אורח', detail: [unit, booking.nights ? `${booking.nights} לילות` : null].filter(Boolean).join(' · '),
        action: booking.status === 'CHECKED_IN'
          ? <Done>נכנסו</Done>
          : <Button variant="outline" className={sm} onClick={() => setStatus(booking, 'CHECKED_IN', `${booking.guest_name || 'האורחים'} נכנסו`)}>נכנסו</Button>,
      })),
    },
    {
      key: 'out', label: 'יציאות', icon: LogOut,
      rows: board.departures.map(({ booking, unit }) => ({
        key: `out-${booking.id}`, property: prop(booking.property_id), time: CHECK_OUT,
        title: booking.guest_name || 'אורח', detail: unit,
        action: booking.status === 'CHECKED_OUT'
          ? <Done>יצאו</Done>
          : <Button variant="outline" className={sm} onClick={() => setStatus(booking, 'CHECKED_OUT', `${booking.guest_name || 'האורחים'} יצאו`)}>יצאו</Button>,
      })),
    },
    {
      key: 'clean', label: 'ניקיון', icon: Sparkles,
      rows: board.cleanings.map((c) => ({
        key: `clean-${c.key}`, property: prop(c.departure.property_id), time: c.sameDayTurnover ? 'עד 15' : '—',
        title: c.unit, attention: c.sameDayTurnover && !c.done,
        detail: c.sameDayTurnover ? 'אורחים חדשים נכנסים היום' : c.nextArrival ? `הכניסה הבאה ${formatDayHe(c.nextArrival.check_in_date, { weekday: false })}` : 'אין כניסה קרובה',
        action: c.done ? <Done /> : <Button variant="outline" className={sm} onClick={() => markCleaned(c)}>בוצע</Button>,
      })),
    },
  ].filter((g) => g.rows.length);

  const nothingToday = groups.length === 0;
  const composerProperty = composer ? data.propertyById.get(composer.booking.property_id) : null;
  let rowIdx = 0;

  /* ── blocks ── */
  const header = (
    <section className={cn('v5-rise flex items-end justify-between gap-4', stripe && 'v5-band pb-7')}>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink-400">
          {formatDayHe(day)}{user?.organization_name ? ` · ${user.organization_name}` : ''}
        </p>
        <h1 className="mt-1.5 text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-navy-900 md:text-[28px]">
          {part.greeting}{name ? `, ${name}` : ''}
        </h1>
        {data.isLoading ? null : (
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[15px] text-ink-600">
            {counts.map((c, idx) => (
              <React.Fragment key={c.label}>
                {idx > 0 ? <span aria-hidden className="text-ink-300">·</span> : null}
                <span><span className="tabular font-semibold text-navy-900">{c.value}</span> {c.label}</span>
              </React.Fragment>
            ))}
          </p>
        )}
      </div>
      <Button onClick={() => quick.open()} className="hidden lg:inline-flex">
        <Plus className="h-[18px] w-[18px]" strokeWidth={2} />הזמנה חדשה
      </Button>
    </section>
  );

  const kpis = (
    <section aria-label="מספרים" className="mt-6 grid grid-cols-2 gap-3 md:mt-7 md:grid-cols-3 md:gap-4">
      <Kpi
        i={1}
        label="הכנסות החודש"
        icon={Wallet}
        stripe={stripe}
        to="/payments"
        className="col-span-2 md:col-span-1"
        footer={<><span>{kpi.months[kpi.months.length - 2]?.long?.split(' ')[0]}</span><span className="tabular font-medium text-ink-600">{formatMoney(kpi.months[kpi.months.length - 2]?.value || 0)}</span></>}
      >
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <Money value={kpi.thisMonth} className="text-[26px] leading-none md:text-[28px]" />
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-400">
              <Delta pct={kpi.pct} />
              {kpi.pct != null ? <span>מהחודש שעבר</span> : <span>החודש הראשון</span>}
            </p>
          </div>
          <Sparkline values={kpi.spark} width={stripe ? 112 : 104} height={40} className="shrink-0" />
        </div>
      </Kpi>
      <Kpi
        i={2}
        label="תפוסה"
        icon={BedDouble}
        stripe={stripe}
        to="/calendar"
        footer={<><span>לילות שהוזמנו</span><span className="font-medium text-ink-600"><span className="tabular">{kpi.nights}</span> מתוך <span className="tabular">{kpi.units * kpi.daysInMonth}</span></span></>}
      >
        <span className="v5-num mt-2 text-[26px] font-bold leading-none text-navy-900 md:text-[28px]" dir="ltr">
          <CountUp value={kpi.occupancy} />
          <span className="text-[0.62em] font-semibold text-ink-400">%</span>
        </span>
        <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-[#EEF0FF]" aria-hidden>
          <span className="block h-full rounded-full bg-brand-600 transition-[width] duration-700 ease-out" style={{ width: `${kpi.occupancy}%` }} />
        </span>
        {stripe ? null : <span className="mt-2 hidden text-[13px] text-ink-400 md:block">{kpi.nights} לילות החודש</span>}
      </Kpi>
      <Kpi
        i={3}
        label="יתרות פתוחות"
        icon={Receipt}
        stripe={stripe}
        attention={kpi.overdue}
        to="/balances"
        footer={<><span>התקבל החודש</span><span className="tabular font-medium text-ink-600">{formatMoney(kpi.paidThisMonth)}</span></>}
      >
        <Money value={kpi.openTotal} className="mt-2 text-[26px] leading-none md:text-[28px]" />
        <span className="mt-2 text-[13px] text-ink-400">{kpi.openCount ? `${kpi.openCount} הזמנות` : 'הכל שולם'}</span>
      </Kpi>
    </section>
  );

  const chart = (
    <Rise i={4} as="section" aria-label="הכנסות" className="flex h-full min-w-0 flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
      <div className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6', stripe && 'border-b border-line pb-4')}>
        <div>
          <h2 className="text-[15px] font-semibold text-navy-900">הכנסות</h2>
          <p className="mt-1 flex items-baseline gap-2">
            <Money value={chartTotal} className="text-[22px] leading-none" />
            <span className="text-[13px] text-ink-400">{range === '12' ? '12 החודשים האחרונים' : '6 החודשים האחרונים'}</span>
          </p>
        </div>
        <SegmentedControl
          ariaLabel="טווח"
          value={range}
          onChange={setRange}
          options={[{ value: '6', label: '6 חודשים' }, { value: '12', label: 'שנה' }]}
        />
      </div>
      <div className="flex min-h-[260px] flex-1 flex-col px-1 pb-3 pt-2 md:px-2">
        {hasHistory ? (
          <div className="relative min-h-[240px] flex-1"><div className="absolute inset-0"><RevenueChart data={chartData} axis={stripe} /></div></div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <p className="text-[15px] font-medium text-navy-900">הגרף יתמלא עם ההזמנות הבאות</p>
            <p className="mt-1 text-[13px] text-ink-400">אחרי חודשיים של הזמנות תראו כאן את המגמה.</p>
          </div>
        )}
      </div>
      {stripe && hasHistory ? (
        <dl className="grid grid-cols-3 divide-x divide-x-reverse divide-line border-t border-line">
          {[
            { k: 'ממוצע לחודש', v: formatMoney(Math.round(chartTotal / chartData.length)) },
            { k: 'החודש החזק', v: (() => { const best = chartData.reduce((a, b) => (b.value > a.value ? b : a), chartData[0]); return best.long.split(' ')[0]; })() },
            { k: 'הזמנות בתקופה', v: String(chartBookings) },
          ].map((x) => (
            <div key={x.k} className="px-5 py-3.5 md:px-6">
              <dt className="text-[12px] text-ink-400">{x.k}</dt>
              <dd className="mt-0.5 text-[15px] font-semibold tabular text-navy-900">{x.v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Rise>
  );

  const today = (
    <Rise i={5} as="section" aria-label="היום" className="flex h-full min-w-0 flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
      <div className={cn('flex items-center justify-between gap-3 px-4 pb-3 pt-5 md:px-5', stripe && 'border-b border-line pb-4')}>
        <h2 className="text-[15px] font-semibold text-navy-900">היום</h2>
        <Link to="/calendar" className="press inline-flex h-10 items-center gap-1 rounded-[8px] px-2 text-[13px] font-medium text-brand-600 hover:bg-[#F4F3FF]">
          ללוח השנה
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </div>
      {nothingToday ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-success-50 text-success-600">
            <Check className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="mt-3 text-[15px] font-semibold text-navy-900">הכל מוכן להיום</p>
          <p className="mt-1 text-[13px] text-ink-400">אין כניסות, יציאות או ניקיונות.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {groups.map((g) => (
            <React.Fragment key={g.key}>
              <GroupLabel icon={g.icon} count={g.rows.length}>{g.label}</GroupLabel>
              {g.rows.map((r) => {
                rowIdx += 1;
                return <DayRow key={r.key} i={5 + rowIdx} stripe={stripe} {...r} />;
              })}
            </React.Fragment>
          ))}
        </ul>
      )}
      <ul className="mt-auto divide-y divide-line border-t border-line">
        {board.messages.length > 0 ? (
          <li>
            <FoldLine open={showMessages} onClick={() => setShowMessages((v) => !v)} label={`${board.messages.length} הודעות מחכות לשליחה`} />
            {showMessages ? (
              <ul className="divide-y divide-line border-t border-line">
                {board.messages.map(({ booking, template, balance }, idx) => (
                  <DayRow
                    key={`msg-${booking.id}`}
                    i={idx}
                    stripe={stripe}
                    property={prop(booking.property_id)}
                    time="—"
                    title={booking.guest_name || 'אורח'}
                    detail={templateByKey(template)?.label}
                    action={<Button variant="outline" className={sm} onClick={() => setComposer({ booking, template, balance })}>שליחה</Button>}
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
    <div aria-busy="true" aria-label="טוען">
      <div className="mt-6 grid grid-cols-2 gap-3 md:mt-7 md:grid-cols-3 md:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn('rounded-[14px] border border-line bg-white px-5 py-5', i === 0 && 'col-span-2 md:col-span-1')}>
            <SkelLine className="h-3 w-20" />
            <SkelLine className="mt-3 h-7 w-28" />
            <SkelLine className="mt-3 h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <SkelLine className="h-[330px] rounded-[14px]" />
        <SkelLine className="h-[330px] rounded-[14px]" />
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 pb-16 pt-6 md:px-10 md:pt-9" dir="rtl">
      {header}
      {data.isError ? (
        <div className="mt-8 rounded-[14px] border border-line bg-white p-6">
          <p className="text-[15px] font-semibold text-navy-900">לא הצלחנו לטעון את היום</p>
          <p className="mt-1 text-[14px] text-ink-400">בדקו את החיבור ונסו שוב.</p>
          <Button variant="outline" className="mt-4" onClick={() => data.refetch?.()}>לנסות שוב</Button>
        </div>
      ) : data.isLoading ? skeleton : (
        <>
          {kpis}
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="order-2 min-w-0 lg:order-1 lg:self-stretch">{chart}</div>
            <div className="order-1 min-w-0 lg:order-2">{today}</div>
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
