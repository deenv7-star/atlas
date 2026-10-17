/**
 * "היום", v8 D: the phone-first task board (brand/refs-app-deen.md, the mobile task app ref).
 *   big bold title · ONE solid-indigo "today's progress" card with a ring · count chips
 *   (כניסות / יציאות / ניקיון) that filter · task cards with a tinted tag, time chip, guest photo and
 *   one action · the month in one quiet card (income + occupancy) · balances / messages as one line each.
 * Desktop: the same board in the centred column, progress + month in the right context panel.
 * Check-in / check-out times: booking, then the unit's guest info, then 15:00 / 11:00.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, Clock, ArrowUpLeft, ListChecks, Wallet, CalendarDays, MessageSquare } from 'lucide-react';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { buildDayBoard } from '@/lib/stay/today';
import { todayISO, addDays, formatDayHe } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf, balanceOf } from '@/lib/stay/bookings';
import { templateByKey } from '@/lib/stay/whatsapp';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { UnitPhoto, CountUp, Rise, GuestAvatar, AvatarStack } from '@/components/app/atoms';
import { DPage, DSplit, DTitle, CountChip, Tag, ProgressRing } from '@/components/app/DSplit';
import { createPageUrl } from '@/utils';
import { guestInfoOf } from '@/lib/stay/guestInfo';
import { monthlyRevenue } from '@/components/today/RevenueChart';
import { Button } from '@/components/ui/button';
import { SkelLine, DeltaPill } from '@/components/ds';
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


function Money({ value, className, onHero = false }) {
  return (
    <span className={cn('v5-num inline-flex items-baseline font-extrabold', onHero ? 'text-white' : 'text-navy-900', className)} dir="ltr">
      <span className={cn('me-1 text-[0.55em] font-bold', onHero ? 'text-white/70' : 'text-ink-400')}>₪</span>
      <CountUp value={Math.round(value)} format={(n) => n.toLocaleString('en-US')} />
    </span>
  );
}

/** One task: tinted tag + ↗ to the booking, bold title, time chip, guest photo and one action. */
function TaskCard({ t, i, showAction = true }) {
  return (
    <Rise as="li" i={i} className={cn('d-card d-lift flex flex-col p-4 md:p-5', t.done && 'opacity-[0.86]')}>
      <div className="flex items-center justify-between gap-2">
        <Tag tone={t.tone}>{t.tag}</Tag>
        {t.to ? (
          <Link to={t.to} aria-label={`${t.title}, לפרטי ההזמנה`} className="press v7-arrow inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#F3F4F9] text-navy-900 hover:bg-[#E9EBF3]">
            <ArrowUpLeft className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </Link>
        ) : <span className="h-11" />}
      </div>
      <p className="mt-2 truncate text-[18px] font-bold leading-tight text-navy-900">{t.title}</p>
      <p className="mt-1 truncate text-[14px] text-ink-400">{t.sub}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex h-9 min-w-0 items-center gap-1.5 truncate rounded-full bg-[#F3F4F9] px-3 text-[13px] font-semibold text-ink-600">
          <Clock className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.75} aria-hidden />
          <span className="tabular truncate">{t.time}</span>
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {t.guest ? <GuestAvatar name={t.guest} size={36} ring className="hidden min-[360px]:inline-flex" /> : <UnitPhoto property={t.property} className="h-9 w-9" rounded="rounded-full" />}
          {showAction ? t.action : null}
        </div>
      </div>
    </Rise>
  );
}

const DAY_LETTER = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
/** Seven-day chip strip: picks which day's tasks show. A dot marks days with arrivals or departures. */
function DayStrip({ day, sel, onSelect, bookings }) {
  const days = Array.from({ length: 7 }, (_, k) => addDays(day, k));
  const busy = new Set();
  for (const b of bookings || []) {
    if (!isActiveBooking(b)) continue;
    busy.add(b.check_in_date);
    busy.add(checkOutOf(b));
  }
  return (
    <div role="group" aria-label="בחירת יום" className="d-strip -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:grid lg:grid-cols-7 lg:px-0">
      {days.map((d, k) => {
        const dt = new Date(`${d}T12:00:00`);
        const on = d === sel;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onSelect(d)}
            aria-pressed={on}
            aria-label={`${k === 0 ? 'היום, ' : ''}${formatDayHe(d)}${busy.has(d) ? ', יש כניסות או יציאות' : ''}`}
            className={cn(
              'press flex h-[78px] w-[56px] shrink-0 flex-col items-center justify-center gap-1 rounded-full transition-colors duration-150 lg:w-auto lg:rounded-[22px]',
              on ? 'bg-brand-600 text-white shadow-[0_12px_22px_-10px_rgba(62,43,241,0.75)]' : 'bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.05)] hover:bg-[#FAFAFD]',
            )}
          >
            <span className={cn('text-[12px] font-medium', on ? 'text-white/80' : 'text-ink-400')}>{k === 0 ? 'היום' : DAY_LETTER[dt.getDay()]}</span>
            <span className="text-[19px] font-bold leading-none tabular">{dt.getDate()}</span>
            <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', busy.has(d) ? (on ? 'bg-white' : 'bg-brand-600') : 'bg-transparent')} />
          </button>
        );
      })}
    </div>
  );
}

function FoldLine({ label, to, onClick, open, icon: Icon }) {
  const cls = 'press flex min-h-[56px] w-full items-center gap-3 rounded-[20px] bg-white px-4 text-right shadow-[0_1px_2px_rgba(27,38,86,0.04)] hover:bg-[#FAFAFD]';
  const inner = (
    <>
      {Icon ? <Icon className="h-[18px] w-[18px] shrink-0 text-ink-400" strokeWidth={1.75} aria-hidden /> : null}
      <span className="flex-1 truncate text-[15px] font-medium text-navy-900">{label}</span>
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
  const [filter, setFilter] = useState('all');

  const [sel, setSel] = useState(day);
  const isToday = sel === day;
  const board = useMemo(() => buildDayBoard({
    day: sel, bookings: data.bookings, paymentsByBooking: data.paymentsByBooking, sentByBooking: data.sentByBooking,
    cleaningTasks: data.cleaningTasks, propertyById: data.propertyById,
  }), [sel, data.bookings, data.paymentsByBooking, data.sentByBooking, data.cleaningTasks, data.propertyById]);

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
          booking_id: c.departure.id, scheduled_date: sel, status: 'DONE', created_at: new Date().toISOString(),
        });
      }
      atlasToastApi.success(`${c.unit} מוכנה לאורחים הבאים`);
    } catch { atlasToastApi.error('לא הצלחנו לעדכן את הניקיון'); }
  };

  const prop = (id) => data.propertyById.get(id) || null;
  const sm = 'h-11 px-4 text-[14px]';
  const pill = (label, onClick) => <Button variant="secondary" className={sm} onClick={onClick}>{label}</Button>;

  /* tasks: one card per arrival, departure and cleaning */
  const link = (b) => `${createPageUrl('BookingDetail')}/${b.id}`;
  const tasks = [
    ...board.arrivals.map(({ booking, unit }) => ({
      key: `in-${booking.id}`, kind: 'in', tone: 'sky', tag: 'כניסה', guest: booking.guest_name || 'אורח', to: link(booking),
      title: booking.guest_name || 'אורח', sub: [unit, booking.nights ? `${booking.nights} לילות` : null].filter(Boolean).join(' · '),
      time: `מ־${checkInTime(booking, prop(booking.property_id))}`, done: booking.status === 'CHECKED_IN',
      action: booking.status === 'CHECKED_IN' ? <Done>נכנסו</Done> : pill('נכנסו', () => setStatus(booking, 'CHECKED_IN', `${booking.guest_name || 'האורחים'} נכנסו`)),
    })),
    ...board.departures.map(({ booking, unit }) => ({
      key: `out-${booking.id}`, kind: 'out', tone: 'lilac', tag: 'יציאה', guest: booking.guest_name || 'אורח', to: link(booking),
      title: booking.guest_name || 'אורח', sub: unit, time: `עד ${checkOutTime(booking, prop(booking.property_id))}`, done: booking.status === 'CHECKED_OUT',
      action: booking.status === 'CHECKED_OUT' ? <Done>יצאו</Done> : pill('יצאו', () => setStatus(booking, 'CHECKED_OUT', `${booking.guest_name || 'האורחים'} יצאו`)),
    })),
    ...board.cleanings.map((c) => ({
      key: `clean-${c.key}`, kind: 'clean', tone: c.sameDayTurnover && !c.done ? 'red' : 'mint', tag: c.sameDayTurnover && !c.done ? 'דחוף' : 'ניקיון',
      property: prop(c.departure.property_id), title: `ניקיון ${c.unit}`,
      sub: c.sameDayTurnover ? 'אורחים חדשים נכנסים היום' : c.nextArrival ? `הכניסה הבאה ${formatDayHe(c.nextArrival.check_in_date, { weekday: false })}` : 'אין כניסה קרובה',
      time: c.sameDayTurnover ? `עד ${checkInTime(c.nextArrival, prop(c.departure.property_id))}` : 'במהלך היום', done: c.done,
      action: c.done ? <Done /> : pill('בוצע', () => markCleaned(c)),
    })),
  ];
  const doneCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 100;
  const shown = tasks.filter((t) => filter === 'all' || t.kind === filter);
  const composerProperty = composer ? data.propertyById.get(composer.booking.property_id) : null;
  const openBalances = kpi.openCount;

  /* ── blocks ── */
  const progressCard = (
    <Rise i={1} as="section" aria-label="ההתקדמות של היום" className="v7-hero p-5 md:p-6">
      <p className="text-[16px] font-bold text-white">{isToday ? 'ההתקדמות של היום' : `המשימות של ${formatDayHe(sel)}`}</p>
      <div className="mt-4 flex items-center gap-5">
        <ProgressRing pct={progress} size={112} stroke={12} color="#FFFFFF" track="rgba(255,255,255,0.18)" label={`בוצעו ${progress}% מהמשימות של היום`}>
          <span className="v5-num text-[26px] font-extrabold text-white" dir="ltr">{progress}<span className="text-[0.55em] text-white/70">%</span></span>
        </ProgressRing>
        <ul className="min-w-0 flex-1 space-y-2.5 text-[14px]">
          {[
            { label: 'משימות היום', value: tasks.length },
            { label: 'בוצעו', value: doneCount },
            { label: 'נשארו', value: tasks.length - doneCount },
          ].map((r) => (
            <li key={r.label} className="flex items-center gap-2.5">
              <span aria-hidden className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/15"><ListChecks className="h-4 w-4 text-white" strokeWidth={1.75} /></span>
              <span className="tabular text-[17px] font-bold text-white">{r.value}</span>
              <span className="truncate text-white/80">{r.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </Rise>
  );

  const monthCard = (
    <Rise i={2} as="section" aria-label="החודש" className="d-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold text-navy-900">החודש</h2>
        <Link to="/payments" className="press inline-flex h-11 items-center gap-1 rounded-full bg-[#F3F4F9] px-3.5 text-[13px] font-semibold text-navy-900 hover:bg-[#E9EBF3]">כספים<ChevronLeft className="h-4 w-4" strokeWidth={1.75} /></Link>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] text-ink-400">הכנסות</p>
          <Money value={kpi.thisMonth} className="mt-1 text-[30px] leading-none tracking-[-0.02em]" />
          {kpi.pct != null ? <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-400"><DeltaPill pct={kpi.pct} />מהחודש שעבר</p> : null}
        </div>
        <Link to="/calendar" aria-label={`תפוסה ${kpi.occupancy}% החודש, ללוח השנה`} className="press flex shrink-0 flex-col items-center gap-1 rounded-[18px] p-1">
          <ProgressRing pct={kpi.occupancy} size={72} stroke={8}>
            <span className="v5-num text-[17px] font-extrabold text-navy-900" dir="ltr">{kpi.occupancy}<span className="text-[0.6em] text-ink-400">%</span></span>
          </ProgressRing>
          <span className="text-[12px] font-medium text-ink-400">תפוסה</span>
        </Link>
      </div>
    </Rise>
  );

  const folds = (
    <div className="space-y-2">
      {board.messages.length > 0 ? (
        <div>
          <FoldLine icon={MessageSquare} open={showMessages} onClick={() => setShowMessages((v) => !v)} label={`${board.messages.length} הודעות מחכות לשליחה`} />
          {showMessages ? (
            <ul className="mt-2 space-y-2">
              {board.messages.map(({ booking, template, balance }) => (
                <li key={`msg-${booking.id}`} className="flex min-h-[64px] items-center gap-3 rounded-[20px] bg-white px-3 py-2">
                  <GuestAvatar name={booking.guest_name || 'אורח'} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-navy-900">{booking.guest_name || 'אורח'}</p>
                    <p className="truncate text-[13px] text-ink-400">{templateByKey(template)?.label}</p>
                  </div>
                  {pill('שליחה', () => setComposer({ booking, template, balance }))}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {openBalances ? <FoldLine icon={Wallet} to="/balances" label={`${openBalances} יתרות פתוחות`} /> : null}
      <FoldLine icon={CalendarDays} to="/calendar" label={tomorrowArrivals ? `מחר: ${tomorrowArrivals} ${tomorrowArrivals === 1 ? 'כניסה' : 'כניסות'}` : 'מחר: אין כניסות'} />
    </div>
  );

  const counts = [
    { key: 'all', label: 'הכל', n: tasks.length },
    { key: 'in', label: 'כניסות', n: board.arrivals.length },
    { key: 'out', label: 'יציאות', n: board.departures.length },
    { key: 'clean', label: 'ניקיון', n: board.cleanings.length },
  ];

  const taskList = (
    <section aria-label="המשימות" className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-extrabold tracking-[-0.01em] text-navy-900">{isToday ? 'המשימות של היום' : formatDayHe(sel)}</h2>
        <Link to="/calendar" className="press inline-flex h-11 items-center rounded-full px-2 text-[14px] font-semibold text-brand-600 hover:text-brand-700">ללוח השנה</Link>
      </div>
      <div role="group" aria-label="סינון משימות" className="d-strip -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        {counts.map((c) => (
          <CountChip key={c.key} on={filter === c.key} count={c.n} onClick={() => setFilter(c.key)} aria-pressed={filter === c.key}>{c.label}</CountChip>
        ))}
      </div>
      {tasks.length === 0 ? (
        <div className="d-card flex flex-col items-center px-6 py-10 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--st-mint-bg)] text-[var(--st-mint-fg)]"><Check className="h-5 w-5" strokeWidth={2.25} /></span>
          <p className="mt-3 text-[16px] font-semibold text-navy-900">{isToday ? 'הכל מוכן להיום' : 'יום פנוי'}</p>
          <p className="mt-1 text-[14px] text-ink-400">אין כניסות, יציאות או ניקיונות{isToday ? '' : ' ביום הזה'}.</p>
        </div>
      ) : shown.length === 0 ? (
        <p className="d-card px-5 py-8 text-center text-[15px] text-ink-600">אין משימות מהסוג הזה היום.</p>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 md:gap-4">
          {shown.map((t, i) => <TaskCard key={t.key} t={t} i={3 + i} showAction={isToday} />)}
        </ul>
      )}
    </section>
  );

  const guestsNow = [...board.arrivals.map((a) => a.booking.guest_name), ...board.departures.map((a) => a.booking.guest_name)].filter(Boolean);

  return (
    <DPage>
      <DTitle
        sub={<span className="flex items-center gap-2"><span>{formatDayHe(day)}</span>{guestsNow.length ? <AvatarStack names={guestsNow} size={26} max={4} /> : null}</span>}
      >
        בואו נעבור<br className="lg:hidden" /> על היום
      </DTitle>
      {data.isError ? (
        <div className="d-card p-6">
          <p className="text-[15px] font-semibold text-navy-900">לא הצלחנו לטעון את היום</p>
          <p className="mt-1 text-[14px] text-ink-400">בדקו את החיבור ונסו שוב.</p>
          <Button variant="outline" className="mt-4" onClick={() => data.refetch?.()}>לנסות שוב</Button>
        </div>
      ) : data.isLoading ? (
        <div role="status" aria-busy="true" aria-label="טוען" className="space-y-4">
          <SkelLine className="h-[188px] rounded-[26px]" />
          <div className="grid gap-4 md:grid-cols-2"><SkelLine className="h-[170px] rounded-[26px]" /><SkelLine className="h-[170px] rounded-[26px]" /></div>
        </div>
      ) : (
        <DSplit
          asideLabel="תמונת מצב"
          main={(
            <>
              <div className="lg:hidden">{progressCard}</div>
              <div className="mt-5 lg:mt-0"><DayStrip day={day} sel={sel} onSelect={setSel} bookings={data.bookings} /></div>
              {taskList}
              <div className="mt-6 space-y-4 lg:hidden">{monthCard}{folds}</div>
            </>
          )}
          asideOnPhone={false}
          aside={<>{progressCard}{monthCard}{folds}</>}
        />
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
    </DPage>
  );
}
