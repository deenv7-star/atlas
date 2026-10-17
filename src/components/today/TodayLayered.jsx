/**
 * "היום" v8 F (soft layered glass). Calm bento on a lilac-sky canvas:
 *   1. greeting + a 14-day strip (pick a day; today is the filled indigo pill)
 *   2. three numbers max: the solid-indigo occupancy ring card, a photo tile of the complex with tonight's
 *      faces, two glass sparkline cards (הכנסות החודש, יתרות פתוחות)
 *   3. the chosen day's agenda (arrivals / departures / cleaning, one action each) beside "היחידות הלילה"
 * Same data, mutations and composer contracts as the v7 board.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, Plus, LogIn, LogOut, Sparkles } from 'lucide-react';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { buildDayBoard } from '@/lib/stay/today';
import { todayISO, addDays, formatDayHe, firstName } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf, balanceOf } from '@/lib/stay/bookings';
import { templateByKey } from '@/lib/stay/whatsapp';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { UnitPhoto, CountUp, Rise, GuestAvatar, AvatarStack, dayPart, usePrefersReducedMotion } from '@/components/app/atoms';
import { monthlyRevenue } from '@/components/today/RevenueChart';
import { Sparkline } from '@/components/today/Sparkline';
import { checkInTime, checkOutTime } from '@/components/today/TodayBoard';
import { Button } from '@/components/ui/button';
import { SkelLine, DeltaPill, CardArrow } from '@/components/ds';
import { cn } from '@/lib/utils';

const DAY_LETTER = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function Money({ value, className, sub = 'text-ink-400' }) {
  return (
    <span className={cn('v5-num inline-flex items-baseline font-extrabold', className)} dir="ltr">
      <span className={cn('me-1 text-[0.55em] font-bold', sub)}>₪</span>
      <CountUp value={Math.round(value)} format={(n) => n.toLocaleString('en-US')} />
    </span>
  );
}

function WhiteRing({ value, size = 156, stroke = 14 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <span className="f-breathe relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} aria-hidden>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={stroke} />
        <circle className="v7-ring" cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ '--c': c }} />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="v5-num text-[40px] font-extrabold leading-none" dir="ltr">{Math.round(v)}<span className="text-[0.5em] text-white/70">%</span></span>
        <span className="mt-1 text-[12px] font-medium text-white/80">תפוסה</span>
      </span>
    </span>
  );
}

function Done({ children = 'בוצע' }) {
  return (
    <span className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--st-mint-bg)] px-4 text-[14px] font-semibold text-[var(--st-mint-fg)]">
      <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />{children}
    </span>
  );
}

export default function TodayLayered({ user, orgId }) {
  const today = todayISO();
  const [day, setDay] = useState(today);
  const reduce = usePrefersReducedMotion();
  const data = useStayData();
  const { updateBooking, createCleaning, updateCleaning } = useStayMutations();
  const quick = useQuickBooking();
  const [composer, setComposer] = useState(null);

  const board = useMemo(() => buildDayBoard({
    day, bookings: data.bookings, paymentsByBooking: data.paymentsByBooking, sentByBooking: data.sentByBooking,
    cleaningTasks: data.cleaningTasks, propertyById: data.propertyById,
  }), [day, data.bookings, data.paymentsByBooking, data.sentByBooking, data.cleaningTasks, data.propertyById]);

  const strip = useMemo(() => {
    const active = (data.bookings || []).filter(isActiveBooking);
    return Array.from({ length: 14 }, (_, k) => {
      const d = addDays(today, k);
      return { d, arrivals: active.filter((b) => b.check_in_date === d).length, departures: active.filter((b) => checkOutOf(b) === d).length };
    });
  }, [data.bookings, today]);

  const kpi = useMemo(() => {
    const now = new Date();
    const months = monthlyRevenue(data.bookings, 12, now);
    const thisMonth = months[months.length - 1]?.value || 0;
    const lastMonth = months[months.length - 2]?.value || 0;
    const pct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;
    const y = now.getFullYear();
    const m = now.getMonth();
    const first = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const next = `${m === 11 ? y + 1 : y}-${String(m === 11 ? 1 : m + 2).padStart(2, '0')}-01`;
    const units = Math.max(1, (data.properties || []).length);
    let nights = 0;
    let openTotal = 0;
    let openCount = 0;
    let overdue = false;
    const openSpark = [];
    for (const b of data.bookings || []) {
      if (!isActiveBooking(b)) continue;
      const s = b.check_in_date > first ? b.check_in_date : first;
      const e = checkOutOf(b) < next ? checkOutOf(b) : next;
      if (e > s) nights += Math.round((new Date(e) - new Date(s)) / 86400000);
      if (b.status === 'CHECKED_OUT') continue;
      const bal = balanceOf(b, data.paymentsByBooking.get(b.id) || [], today);
      if (bal.balance > 0) { openTotal += bal.balance; openCount += 1; openSpark.push(bal.balance); if (bal.overdue) overdue = true; }
    }
    const occupancy = Math.min(100, Math.round((nights / (units * daysInMonth)) * 100));
    return { thisMonth, pct, spark: months.slice(-7).map((x) => x.value), occupancy, nights, units, daysInMonth, openTotal, openCount, overdue, openSpark };
  }, [data.bookings, data.properties, data.paymentsByBooking, today]);

  /* who sleeps where tonight */
  const tonight = useMemo(() => {
    const active = (data.bookings || []).filter((b) => isActiveBooking(b) && b.status !== 'CHECKED_OUT');
    return (data.properties || []).map((p) => {
      const b = active.find((x) => x.property_id === p.id && x.check_in_date <= day && checkOutOf(x) > day) || null;
      let night = 0;
      let total = 0;
      if (b) {
        total = Math.max(1, Math.round((new Date(checkOutOf(b)) - new Date(b.check_in_date)) / 86400000));
        night = Math.min(total, Math.round((new Date(day) - new Date(b.check_in_date)) / 86400000) + 1);
      }
      return { property: p, booking: b, night, total };
    });
  }, [data.bookings, data.properties, day]);
  const occupiedTonight = tonight.filter((t) => t.booking).length;

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
  const pill = (label, onClick) => <Button variant="secondary" className="h-11 rounded-full bg-white px-5 text-[14px] text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.08)] hover:bg-white/80" onClick={onClick}>{label}</Button>;
  const rows = [
    ...board.arrivals.map(({ booking, unit }) => ({
      key: `in-${booking.id}`, icon: LogIn, kind: 'כניסה', time: checkInTime(booking, prop(booking.property_id)), guest: booking.guest_name || 'אורח', record: booking,
      detail: [unit, booking.nights ? `${booking.nights} לילות` : null].filter(Boolean).join(' · '),
      action: booking.status === 'CHECKED_IN' ? <Done>נכנסו</Done> : pill('נכנסו', () => setStatus(booking, 'CHECKED_IN', `${booking.guest_name || 'האורחים'} נכנסו`)),
    })),
    ...board.departures.map(({ booking, unit }) => ({
      key: `out-${booking.id}`, icon: LogOut, kind: 'יציאה', time: checkOutTime(booking, prop(booking.property_id)), guest: booking.guest_name || 'אורח', record: booking,
      detail: unit,
      action: booking.status === 'CHECKED_OUT' ? <Done>יצאו</Done> : pill('יצאו', () => setStatus(booking, 'CHECKED_OUT', `${booking.guest_name || 'האורחים'} יצאו`)),
    })),
    ...board.cleanings.map((c) => ({
      key: `clean-${c.key}`, icon: Sparkles, kind: 'ניקיון', time: c.sameDayTurnover ? `עד ${checkInTime(c.nextArrival, prop(c.departure.property_id))}` : '', property: prop(c.departure.property_id),
      guest: null, title: `ניקיון ${c.unit}`, attention: c.sameDayTurnover && !c.done,
      detail: c.sameDayTurnover ? 'אורחים חדשים נכנסים היום' : c.nextArrival ? `הכניסה הבאה ${formatDayHe(c.nextArrival.check_in_date, { weekday: false })}` : 'אין כניסה קרובה',
      action: c.done ? <Done /> : pill('בוצע', () => markCleaned(c)),
    })),
  ];
  const name = firstName(user?.full_name || '');
  const heroProp = (data.properties || [])[1] || (data.properties || [])[0] || null;
  const complex = heroProp?.complex_name || user?.organization_name || 'המתחם שלכם';
  const composerProperty = composer ? data.propertyById.get(composer.booking.property_id) : null;
  const isToday = day === today;

  const dayStrip = (
    <nav aria-label="בחירת יום" className="v7-strip -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-5 pt-2 lg:mx-0 lg:px-1">
      {strip.map(({ d, arrivals, departures }, k) => {
        const dt = new Date(`${d}T12:00:00`);
        const on = d === day;
        return (
          <button
            key={d}
            type="button"
            onClick={() => setDay(d)}
            aria-pressed={on}
            aria-label={`${formatDayHe(d)}${arrivals ? `, ${arrivals} כניסות` : ''}${departures ? `, ${departures} יציאות` : ''}`}
            className={cn('press relative flex h-[76px] w-[58px] shrink-0 flex-col items-center justify-center gap-1 rounded-full lg:w-auto lg:flex-1', on ? 'text-white' : 'f-layer text-navy-900')}
          >
            {on ? (
              <motion.span layoutId={reduce ? undefined : 'f-day'} transition={{ type: 'spring', stiffness: 460, damping: 38 }} aria-hidden className="absolute inset-0 rounded-full bg-brand-600 shadow-[0_12px_24px_-10px_rgba(62,43,241,0.7)]" />
            ) : null}
            <span className={cn('relative text-[12px] font-medium', on ? 'text-white/85' : 'text-ink-600')}>{k === 0 ? 'היום' : DAY_LETTER[dt.getDay()]}</span>
            <span className="relative text-[19px] font-bold leading-none tabular">{dt.getDate()}</span>
            <span aria-hidden className="relative flex h-1.5 items-center gap-0.5">
              {Array.from({ length: Math.min(3, arrivals) }).map((_, i) => <span key={i} className={cn('h-1.5 w-1.5 rounded-full', on ? 'bg-white' : 'bg-brand-600')} />)}
            </span>
          </button>
        );
      })}
    </nav>
  );

  const ringCard = (
    <Rise i={1} as={Link} to="/calendar" aria-label={`תפוסה ${kpi.occupancy}% החודש, ללוח השנה`} className="f-indigo f-lift press group order-1 flex flex-col p-5 md:p-6 lg:order-none lg:col-span-4 lg:min-h-[300px]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[15px] font-semibold text-white/90">תפוסה החודש</p>
          <p className="mt-1 text-[13px] text-white/80">{kpi.nights} לילות מתוך {kpi.units * kpi.daysInMonth}</p>
        </div>
        <CardArrow onHero />
      </div>
      <div className="flex flex-1 items-center justify-center py-2 lg:py-3"><span className="lg:hidden"><WhiteRing value={kpi.occupancy} size={132} stroke={12} /></span><span className="hidden lg:inline-flex"><WhiteRing value={kpi.occupancy} /></span></div>
      <div className="flex items-center justify-between rounded-full bg-white/[0.14] py-1.5 pe-1.5 ps-4 text-[13px]">
        <span className="font-medium">{isToday ? 'הלילה' : formatDayHe(day, { weekday: false })}: {occupiedTonight} מתוך {kpi.units} יחידות</span>
        <AvatarStack names={tonight.filter((t) => t.booking).map((t) => t.booking.guest_name || 'אורח')} size={28} max={3} />
      </div>
    </Rise>
  );

  const photoTile = (
    <Rise i={2} as={Link} to="/calendar" aria-label={`${complex}, ללוח השנה`} className="f-photo f-lift press group relative order-3 block min-h-[220px] overflow-hidden rounded-[28px] shadow-[var(--f-shadow)] lg:order-none lg:col-span-5 lg:min-h-[300px]">
      <UnitPhoto property={heroProp} className="absolute inset-0 h-full w-full" rounded="rounded-[28px]" eager />
      <span className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-[22px] bg-white/75 p-3 ps-4 shadow-[0_10px_30px_-14px_rgba(27,38,86,0.4)] backdrop-blur-xl">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-bold text-navy-900">{complex}</span>
          <span className="block truncate text-[13px] text-ink-600">{kpi.units} יחידות · {kpi.units - occupiedTonight === 0 ? 'מלא הלילה' : `${kpi.units - occupiedTonight} פנויות ${isToday ? 'הלילה' : 'בלילה הזה'}`}</span>
        </span>
        <CardArrow className="bg-white" />
      </span>
    </Rise>
  );

  const sparkCards = (
    <div className="order-2 grid grid-cols-2 gap-3 md:gap-4 lg:order-none lg:col-span-3 lg:grid-cols-1">
      <Rise i={3} as={Link} to="/payments" aria-label="הכנסות החודש, למסך הכספים" className="f-glass f-lift press group flex min-h-[142px] flex-col p-5">
        <p className="flex items-center justify-between text-[14px] font-medium text-ink-600">הכנסות החודש <CardArrow className="bg-white/80" /></p>
        <Money value={kpi.thisMonth} className="mt-auto text-[26px] leading-none text-navy-900" />
        <span className="mt-2 flex items-center justify-between gap-2">
          {kpi.pct != null ? <DeltaPill pct={kpi.pct} /> : <span />}
          <Sparkline values={kpi.spark} width={84} height={30} className="f-spark" />
        </span>
      </Rise>
      <Rise i={4} as={Link} to="/balances" aria-label="יתרות פתוחות, למסך היתרות" className="f-glass f-lift press group flex min-h-[142px] flex-col p-5">
        <p className="flex items-center justify-between text-[14px] font-medium text-ink-600">
          <span className="flex items-center gap-2">יתרות פתוחות{kpi.overdue ? <span role="img" aria-label="יש באיחור" className="h-1.5 w-1.5 rounded-full bg-attention" /> : null}</span>
          <CardArrow className="bg-white/80" />
        </p>
        <Money value={kpi.openTotal} className="mt-auto text-[26px] leading-none text-navy-900" />
        <span className="mt-2 flex items-center justify-between gap-2">
          <span className={cn('inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[12px] font-semibold', kpi.openCount ? 'bg-[var(--st-lilac-bg)] text-[var(--st-lilac-fg)]' : 'bg-[var(--st-mint-bg)] text-[var(--st-mint-fg)]')}>{kpi.openCount ? `${kpi.openCount} הזמנות` : 'הכל שולם'}</span>
          {kpi.openSpark.length > 1 ? <Sparkline values={kpi.openSpark.slice(0, 7)} width={84} height={30} color="#7A5CF0" className="f-spark hidden sm:block" /> : null}
        </span>
      </Rise>
    </div>
  );

  const agenda = (
    <Rise i={5} as="section" aria-labelledby="f-agenda" className="f-glass flex min-w-0 flex-col p-4 md:p-5 lg:col-span-7">
      <div className="flex min-h-[48px] items-center justify-between gap-3 px-1">
        <h2 id="f-agenda" className="text-[19px] font-bold text-navy-900">{isToday ? 'מה קורה היום' : formatDayHe(day)}</h2>
        <span className="text-[13px] text-ink-600">{board.arrivals.length} כניסות · {board.departures.length} יציאות</span>
      </div>
      {rows.length === 0 ? (
        <div className="f-layer mt-2 flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--st-mint-bg)] text-[var(--st-mint-fg)]"><Check className="h-5 w-5" strokeWidth={2.25} /></span>
          <p className="mt-3 text-[16px] font-semibold text-navy-900">{isToday ? 'הכל מוכן להיום' : 'יום שקט'}</p>
          <p className="mt-1 text-[14px] text-ink-600">אין כניסות, יציאות או ניקיונות.</p>
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {rows.map((r, idx) => {
            const Icon = r.icon;
            return (
              <Rise as="li" i={6 + idx} key={r.key} className="f-layer flex min-h-[76px] flex-wrap items-center gap-x-3.5 gap-y-2 px-3.5 py-3 md:flex-nowrap">
                {r.guest ? <GuestAvatar name={r.guest} record={r.record} size={46} /> : <UnitPhoto property={r.property} className="h-[46px] w-[46px]" rounded="rounded-full" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-navy-900">{r.title || r.guest}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink-600">
                    {r.attention ? <span role="img" aria-label="דחוף" className="h-1.5 w-1.5 shrink-0 rounded-full bg-attention" /> : null}
                    <Icon className="h-3.5 w-3.5 shrink-0 text-brand-600" strokeWidth={2} aria-hidden />
                    <span className="font-semibold text-navy-900">{r.kind}</span>
                    {r.time ? <span className="tabular">{r.time}</span> : null}
                    <span aria-hidden className="text-ink-300">·</span>
                    <span className="truncate">{r.detail}</span>
                  </p>
                </div>
                <div className="flex basis-full justify-end md:basis-auto">{r.action}</div>
              </Rise>
            );
          })}
        </ul>
      )}
      {board.messages.length > 0 && isToday ? (
        <button type="button" onClick={() => setComposer(board.messages[0])} className="press mt-3 flex min-h-[56px] w-full items-center gap-3 rounded-[20px] px-3 text-start hover:bg-white/50">
          <AvatarStack names={board.messages.map((x) => x.booking.guest_name || 'אורח')} size={30} max={3} />
          <span className="flex-1 truncate text-[14px] font-medium text-ink-600">{board.messages.length} הודעות מחכות · {templateByKey(board.messages[0].template)?.label} ל{board.messages[0].booking.guest_name}</span>
          <ChevronLeft className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
    </Rise>
  );

  const units = (
    <Rise i={6} as="section" aria-labelledby="f-units" className="f-glass min-w-0 p-4 md:p-5 lg:col-span-5">
      <div className="flex min-h-[48px] items-center justify-between gap-3 px-1">
        <h2 id="f-units" className="text-[19px] font-bold text-navy-900">היחידות {isToday ? 'הלילה' : 'בלילה הזה'}</h2>
        <Link to="/calendar" className="press inline-flex h-11 items-center gap-1 rounded-full bg-white/70 px-4 text-[13px] font-semibold text-navy-900 hover:bg-white">לוח שנה<ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden /></Link>
      </div>
      <ul className="mt-2 space-y-2">
        {tonight.map(({ property, booking, night, total }) => (
          <li key={property.id}>
            <Link to={booking ? `/booking/${booking.id}` : '/calendar'} className="press f-layer flex min-h-[72px] items-center gap-3 px-3 py-2.5 hover:bg-white">
              <UnitPhoto property={property} className="h-12 w-12" rounded="rounded-[16px]" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[15px] font-bold text-navy-900">{property.name}</span>
                  {booking ? <span className="shrink-0 text-[12px] font-semibold tabular text-ink-600">לילה {night}/{total}</span> : <span className="shrink-0 rounded-full bg-[var(--st-mint-bg)] px-2.5 py-0.5 text-[12px] font-semibold text-[var(--st-mint-fg)]">פנויה</span>}
                </span>
                {booking ? (
                  <span className="mt-1.5 flex items-center gap-2">
                    <GuestAvatar name={booking.guest_name || 'אורח'} record={booking} size={22} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink-600">{booking.guest_name}</span>
                    <span className="f-prog block w-[72px] shrink-0" aria-hidden><span style={{ width: `${Math.round((night / total) * 100)}%` }} /></span>
                  </span>
                ) : <span className="mt-1 block text-[13px] text-ink-600">אפשר עוד למכור את הלילה</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Rise>
  );

  return (
    <div className="mx-auto w-full max-w-[var(--page-max,1240px)] px-4 pb-16 pt-2 lg:px-8 lg:pt-4" dir="rtl">
      <section className="v5-rise flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 px-1">
          <p className="text-[15px] font-medium text-ink-600">{formatDayHe(today)}</p>
          <h1 className="mt-1 text-[36px] font-extrabold leading-[1.06] tracking-[-0.03em] text-navy-900 md:text-[44px]">{dayPart().greeting}{name ? `, ${name}` : ''}</h1>
        </div>
        <Button onClick={() => quick.open()} className="hidden h-12 rounded-full px-6 lg:inline-flex">
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />הזמנה חדשה
        </Button>
      </section>
      {dayStrip}
      {data.isError ? (
        <div className="f-glass mt-6 p-6">
          <p className="text-[15px] font-semibold text-navy-900">לא הצלחנו לטעון את היום</p>
          <p className="mt-1 text-[14px] text-ink-600">בדקו את החיבור ונסו שוב.</p>
          <Button variant="outline" className="mt-4" onClick={() => data.refetch?.()}>לנסות שוב</Button>
        </div>
      ) : data.isLoading ? (
        <div role="status" aria-busy="true" aria-label="טוען" className="mt-5 grid gap-4 lg:grid-cols-12">
          <SkelLine className="h-[300px] rounded-[28px] lg:col-span-4" />
          <SkelLine className="h-[300px] rounded-[28px] lg:col-span-5" />
          <SkelLine className="h-[300px] rounded-[28px] lg:col-span-3" />
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 lg:grid-cols-12">
            {ringCard}
            {photoTile}
            {sparkCards}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-12">
            {agenda}
            {units}
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
