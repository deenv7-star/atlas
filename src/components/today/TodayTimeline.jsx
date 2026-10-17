/**
 * "היום" v8 E (guest-centric CRM). The day as one timeline: departures, cleaning, arrivals in clock order,
 * each with the guest's face, one line of detail (unit, nights, payment) and one action. A "now" marker
 * sits where the clock is. Beside it, three numbers at most: the indigo revenue card, open balances
 * (lilac, with who owes) and messages waiting (sky, one send button per guest).
 * Same data, mutations and composer as the v7 board (TodayBoard), only the composition changes.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, Plus, LogIn, LogOut, Sparkles, Send } from 'lucide-react';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { buildDayBoard } from '@/lib/stay/today';
import { todayISO, addDays, formatDayHe, firstName } from '@/lib/stay/format';
import { isActiveBooking, balanceOf } from '@/lib/stay/bookings';
import { templateByKey } from '@/lib/stay/whatsapp';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { UnitPhoto, CountUp, Rise, GuestAvatar, AvatarStack, dayPart } from '@/components/app/atoms';
import { partnerPhoto } from '@/lib/stay/guestPhoto';
import { monthlyRevenue } from '@/components/today/RevenueChart';
import { Sparkline } from '@/components/today/Sparkline';
import { checkInTime, checkOutTime } from '@/components/today/TodayBoard';
import { Button } from '@/components/ui/button';
import { SkelLine, DeltaPill, CardArrow, fmtMoney } from '@/components/ds';
import { cn } from '@/lib/utils';

const KIND = {
  out: { label: 'יציאה', icon: LogOut, dot: '#3E8BE0', tint: 'e-tint-sky' },
  clean: { label: 'ניקיון', icon: Sparkles, dot: '#8C93AB', tint: 'e-tint-slate' },
  in: { label: 'כניסה', icon: LogIn, dot: '#3E2BF1', tint: 'e-tint-indigo' },
};

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}
const minutes = (hm) => { const [h, m] = String(hm || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const pad = (n) => String(n).padStart(2, '0');

function Done({ children = 'בוצע' }) {
  return (
    <span className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--st-mint-bg)] px-4 text-[14px] font-semibold text-[var(--st-mint-fg)]">
      <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      {children}
    </span>
  );
}

function PayChip({ balance }) {
  if (!balance || balance.total <= 0) return null;
  if (balance.balance <= 0) return <span className="e-chip bg-[var(--st-mint-bg)] text-[var(--st-mint-fg)]">שולם</span>;
  return (
    <span className={cn('e-chip', balance.overdue ? 'bg-[var(--st-red-bg)] text-[var(--st-red-fg)]' : 'bg-[var(--st-lilac-bg)] text-[var(--st-lilac-fg)]')}>
      יתרה <span className="tabular" dir="ltr">{fmtMoney(balance.balance)}</span>
    </span>
  );
}

function Faces({ name, size = 48 }) {
  const partner = partnerPhoto(name);
  if (!partner) return <GuestAvatar name={name} size={size} />;
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size + 14, height: size }} aria-hidden>
      <GuestAvatar name={name} size={size} ring className="relative z-[1]" />
      <GuestAvatar name={`${name}·2`} photo={partner} size={size - 10} ring className="absolute bottom-[-4px] end-0 z-[2]" />
    </span>
  );
}

function Event({ ev, i }) {
  const k = KIND[ev.kind];
  return (
    <Rise as="li" i={i} className="e-ev relative grid grid-cols-[56px_minmax(0,1fr)] gap-3 md:grid-cols-[64px_minmax(0,1fr)] md:gap-4">
      <div className="pt-[22px] text-end">
        <span className="block text-[15px] font-bold tabular leading-none text-navy-900">{ev.time}</span>
        <span className="mt-1.5 block text-[12px] text-ink-600">{k.label}</span>
      </div>
      <div className="relative">
        <span aria-hidden className="e-ev-dot" style={{ '--dot': k.dot }} />
        <div className={cn('e-ev-card flex min-h-[84px] flex-wrap items-center gap-x-3.5 gap-y-3 rounded-[22px] px-4 py-3.5 md:flex-nowrap md:gap-x-4 md:px-5', k.tint)}>
          {ev.guest ? <Faces name={ev.guest} /> : <UnitPhoto property={ev.property} className="h-12 w-12" rounded="rounded-[16px]" />}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[16px] font-bold leading-snug text-navy-900 md:truncate">{ev.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-600">
              {ev.attention ? <span aria-label="דחוף" className="h-1.5 w-1.5 shrink-0 rounded-full bg-attention" /> : null}
              <span className="md:truncate">{ev.detail}</span>
              {ev.balance ? <PayChip balance={ev.balance} /> : null}
            </p>
          </div>
          <div className="flex basis-full justify-end md:ms-auto md:basis-auto md:shrink-0">{ev.action}</div>
        </div>
      </div>
    </Rise>
  );
}

function NowLine({ now }) {
  return (
    <li aria-label={`עכשיו ${pad(now.getHours())}:${pad(now.getMinutes())}`} className="relative grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3 py-1 md:grid-cols-[64px_minmax(0,1fr)] md:gap-4">
      <span className="text-end text-[12px] font-bold tabular text-brand-600">{pad(now.getHours())}:{pad(now.getMinutes())}</span>
      <span className="relative flex items-center">
        <span aria-hidden className="e-now-dot" />
        <span aria-hidden className="h-[2px] flex-1 rounded-full bg-gradient-to-l from-brand-600 to-brand-600/0" />
        <span className="ms-2 shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-700">עכשיו</span>
      </span>
    </li>
  );
}

export default function TodayTimeline({ user, orgId }) {
  const day = todayISO();
  const tomorrow = addDays(day, 1);
  const now = useNow();
  const data = useStayData();
  const { updateBooking, createCleaning, updateCleaning } = useStayMutations();
  const quick = useQuickBooking();
  const [composer, setComposer] = useState(null);

  const board = useMemo(() => buildDayBoard({
    day, bookings: data.bookings, paymentsByBooking: data.paymentsByBooking, sentByBooking: data.sentByBooking,
    cleaningTasks: data.cleaningTasks, propertyById: data.propertyById,
  }), [day, data.bookings, data.paymentsByBooking, data.sentByBooking, data.cleaningTasks, data.propertyById]);

  const tomorrowArrivals = useMemo(
    () => (data.bookings || []).filter((b) => isActiveBooking(b) && b.check_in_date === tomorrow),
    [data.bookings, tomorrow],
  );

  const kpi = useMemo(() => {
    const months = monthlyRevenue(data.bookings, 12, new Date());
    const thisMonth = months[months.length - 1]?.value || 0;
    const lastMonth = months[months.length - 2]?.value || 0;
    const pct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;
    const owers = [];
    let openTotal = 0;
    let overdue = false;
    for (const b of data.bookings || []) {
      if (!isActiveBooking(b) || b.status === 'CHECKED_OUT') continue;
      const bal = balanceOf(b, data.paymentsByBooking.get(b.id) || [], day);
      if (bal.balance > 0) { openTotal += bal.balance; owers.push(b.guest_name || 'אורח'); if (bal.overdue) overdue = true; }
    }
    return { thisMonth, pct, spark: months.slice(-7).map((x) => x.value), openTotal, owers, overdue };
  }, [data.bookings, data.paymentsByBooking, day]);

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
  const pill = (label, onClick) => <Button variant="secondary" className="h-11 bg-white px-5 text-[14px] text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.08)] hover:bg-white/80" onClick={onClick}>{label}</Button>;

  const events = useMemo(() => {
    const list = [];
    for (const { booking, unit, balance } of board.departures) {
      const p = prop(booking.property_id);
      list.push({
        key: `out-${booking.id}`, kind: 'out', time: checkOutTime(booking, p), guest: booking.guest_name || 'אורח', title: booking.guest_name || 'אורח',
        detail: `יוצאים מ${unit}`, balance: balance.balance > 0 ? balance : null,
        action: booking.status === 'CHECKED_OUT' ? <Done>יצאו</Done> : pill('יצאו', () => setStatus(booking, 'CHECKED_OUT', `${booking.guest_name || 'האורחים'} יצאו`)),
      });
    }
    for (const c of board.cleanings) {
      const p = prop(c.departure.property_id);
      const after = checkOutTime(c.departure, p);
      list.push({
        key: `clean-${c.key}`, kind: 'clean', time: after, sortAt: minutes(after) + 1, property: p, title: `ניקיון ${c.unit}`,
        attention: c.sameDayTurnover && !c.done,
        detail: [c.task?.cleaner_name || c.task?.assigned_to_name, c.sameDayTurnover ? `מוכן עד ${checkInTime(c.nextArrival, p)}` : c.nextArrival ? `הכניסה הבאה ${formatDayHe(c.nextArrival.check_in_date, { weekday: false })}` : 'אין כניסה קרובה'].filter(Boolean).join(' · '),
        action: c.done ? <Done /> : pill('בוצע', () => markCleaned(c)),
      });
    }
    for (const { booking, unit, balance } of board.arrivals) {
      const p = prop(booking.property_id);
      list.push({
        key: `in-${booking.id}`, kind: 'in', time: checkInTime(booking, p), guest: booking.guest_name || 'אורח', title: booking.guest_name || 'אורח',
        detail: [unit, booking.nights ? `${booking.nights} לילות` : null, booking.adults ? `${booking.adults + (booking.children || 0)} אורחים` : null].filter(Boolean).join(' · '),
        balance,
        action: booking.status === 'CHECKED_IN' ? <Done>נכנסו</Done> : pill('נכנסו', () => setStatus(booking, 'CHECKED_IN', `${booking.guest_name || 'האורחים'} נכנסו`)),
      });
    }
    return list.sort((a, b) => (a.sortAt ?? minutes(a.time)) - (b.sortAt ?? minutes(b.time)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, data.propertyById]);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowIdx = events.findIndex((e) => (e.sortAt ?? minutes(e.time)) > nowMin);
  const todayFaces = [...board.arrivals, ...board.departures].map((x) => x.booking.guest_name || 'אורח');
  const inHouseFaces = board.inHouse.map((b) => b.guest_name || 'אורח');
  const openCleanings = board.cleanings.filter((c) => !c.done).length;
  const counts = [
    [board.arrivals.length, board.arrivals.length === 1 ? 'כניסה' : 'כניסות'],
    [board.departures.length, board.departures.length === 1 ? 'יציאה' : 'יציאות'],
    [openCleanings, 'ניקיון'],
  ];
  const name = firstName(user?.full_name || '');
  const composerProperty = composer ? data.propertyById.get(composer.booking.property_id) : null;

  const greeting = (
    <section className="v5-rise flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-ink-400">{formatDayHe(day)}</p>
        <h1 className="mt-1 text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-navy-900 md:text-[40px]">
          {dayPart(now).greeting}{name ? `, ${name}` : ''}
        </h1>
        {data.isLoading ? <SkelLine className="mt-3 h-4 w-56" /> : (
          <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2 text-[16px] text-ink-600">
            {counts.map(([v, l], idx) => (
              <React.Fragment key={l}>
                {idx ? <span aria-hidden className="text-ink-300">·</span> : null}
                <span><span className="tabular font-bold text-navy-900">{v}</span> {l}</span>
              </React.Fragment>
            ))}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 empty:hidden">
        {inHouseFaces.length ? (
          <Link to="/bookings?tab=active" className="press inline-flex items-center gap-3 rounded-full bg-white py-1.5 pe-4 ps-1.5 shadow-[0_1px_2px_rgba(27,38,86,0.05)] ring-1 ring-inset ring-[#E8EAF2] hover:bg-[#F7F8FC]">
            <AvatarStack names={inHouseFaces} size={34} max={4} />
            <span className="text-[14px] font-semibold text-navy-900">{inHouseFaces.length} בשהייה עכשיו</span>
          </Link>
        ) : null}
        <Button onClick={() => quick.open()} className="hidden h-12 px-6 lg:inline-flex">
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />הזמנה חדשה
        </Button>
      </div>
    </section>
  );

  const timeline = (
    <Rise i={2} as="section" aria-labelledby="e-tl-title" className="v7-card flex min-w-0 flex-col p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 id="e-tl-title" className="text-[19px] font-bold text-navy-900">ציר היום</h2>
          {todayFaces.length ? <AvatarStack names={todayFaces} size={28} max={5} /> : null}
        </div>
        <Link to="/calendar" className="press inline-flex h-11 items-center gap-1 rounded-full bg-[#F1F2F7] px-4 text-[13px] font-semibold text-navy-900 hover:bg-[#E9EBF3]">
          לוח שנה<ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </Link>
      </div>
      {events.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-[22px] bg-[#F6F7FB] px-6 py-14 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--st-mint-bg)] text-[var(--st-mint-fg)]"><Check className="h-5 w-5" strokeWidth={2.25} /></span>
          <p className="mt-3 text-[16px] font-semibold text-navy-900">הכל מוכן להיום</p>
          <p className="mt-1 text-[14px] text-ink-400">אין כניסות, יציאות או ניקיונות.</p>
        </div>
      ) : (
        <ol className="e-tl relative flex flex-col gap-3">
          {events.map((ev, idx) => (
            <React.Fragment key={ev.key}>
              {idx === nowIdx ? <NowLine now={now} /> : null}
              <Event ev={ev} i={3 + idx} />
            </React.Fragment>
          ))}
          {nowIdx === -1 ? <NowLine now={now} /> : null}
        </ol>
      )}
      <Link to="/calendar" className="press v7-row mt-4 flex min-h-[60px] items-center gap-3 rounded-[18px] border border-dashed border-[#DCDFEA] px-4">
        {tomorrowArrivals.length ? <AvatarStack names={tomorrowArrivals.map((b) => b.guest_name || 'אורח')} size={30} max={3} /> : null}
        <span className="flex-1 text-[14px] font-medium text-ink-600">
          {tomorrowArrivals.length ? `מחר מגיעים ${tomorrowArrivals.length === 1 ? (tomorrowArrivals[0].guest_name || 'אורח') : `${tomorrowArrivals.length} הזמנות`}` : 'מחר: אין כניסות'}
        </span>
        <ChevronLeft className="h-4 w-4 text-ink-300" strokeWidth={1.75} aria-hidden />
      </Link>
    </Rise>
  );

  const side = (
    <div className="grid content-start gap-4">
      <Rise i={1} as={Link} to="/payments" aria-label="הכנסות החודש, למסך הכספים" className="v7-hero v7-lift press group block p-6">
        <div className="flex items-start justify-between">
          <p className="pt-1.5 text-[14px] font-medium text-white/85">הכנסות החודש</p>
          <CardArrow onHero />
        </div>
        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <p className="v5-num text-[40px] font-extrabold leading-none tracking-[-0.03em]" dir="ltr">
              <span className="me-1 text-[0.55em] font-bold text-white/70">₪</span>
              <CountUp value={Math.round(kpi.thisMonth)} format={(n) => n.toLocaleString('en-US')} />
            </p>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-white/80">
              {kpi.pct != null ? <DeltaPill onHero pct={kpi.pct} /> : null}
              <span>{kpi.pct != null ? 'מהחודש שעבר' : 'החודש הראשון שלכם'}</span>
            </p>
          </div>
          <Sparkline values={kpi.spark} width={104} height={46} color="#FFFFFF" dot="#3E2BF1" className="mb-1 shrink-0" />
        </div>
      </Rise>

      <Rise i={2} as={Link} to="/balances" aria-label="יתרות פתוחות, למסך היתרות" className="e-side e-tint-lilac v7-lift press group block p-5">
        <div className="flex items-start justify-between">
          <p className="flex items-center gap-2 pt-1.5 text-[14px] font-semibold text-[var(--st-lilac-fg)]">
            יתרות פתוחות
            {kpi.overdue ? <span aria-label="יש באיחור" className="h-1.5 w-1.5 rounded-full bg-attention" /> : null}
          </p>
          <CardArrow className="bg-white/70" />
        </div>
        <p className="v5-num mt-4 text-[30px] font-extrabold leading-none text-navy-900" dir="ltr">
          <span className="me-1 text-[0.55em] font-bold text-ink-400">₪</span>
          <CountUp value={Math.round(kpi.openTotal)} format={(n) => n.toLocaleString('en-US')} />
        </p>
        <div className="mt-4 flex items-center gap-3">
          {kpi.owers.length ? <AvatarStack names={kpi.owers} size={32} max={4} /> : null}
          <span className="text-[13px] font-medium text-ink-600">{kpi.owers.length ? `${kpi.owers.length} אורחים עוד לא שילמו הכל` : 'הכל שולם'}</span>
        </div>
      </Rise>

      <Rise i={3} as="section" aria-labelledby="e-msg-title" className="e-side e-tint-sky p-5">
        <div className="flex items-center justify-between">
          <h2 id="e-msg-title" className="text-[14px] font-semibold text-[var(--st-sky-fg)]">הודעות לשליחה</h2>
          <span className="tabular inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-[13px] font-bold text-navy-900">{board.messages.length}</span>
        </div>
        {board.messages.length === 0 ? (
          <p className="mt-3 text-[14px] text-ink-600">כל האורחים קיבלו את מה שצריך.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {board.messages.slice(0, 3).map(({ booking, template, balance }) => (
              <li key={booking.id} className="flex min-h-[60px] items-center gap-3 rounded-[18px] bg-white/80 px-3 py-2">
                <GuestAvatar name={booking.guest_name || 'אורח'} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-navy-900">{booking.guest_name || 'אורח'}</p>
                  <p className="truncate text-[12px] text-ink-400">{templateByKey(template)?.label}</p>
                </div>
                <button type="button" onClick={() => setComposer({ booking, template, balance })} aria-label={`שליחה ל${booking.guest_name || 'אורח'}`} className="press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-[0_1px_2px_rgba(27,38,86,0.08)] hover:bg-brand-50">
                  <Send className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </button>
              </li>
            ))}
            {board.messages.length > 3 ? (
              <li><Link to="/messages" className="press inline-flex h-11 items-center gap-1 px-1 text-[13px] font-semibold text-[var(--st-sky-fg)]">עוד {board.messages.length - 3}<ChevronLeft className="h-4 w-4" aria-hidden /></Link></li>
            ) : null}
          </ul>
        )}
      </Rise>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[var(--page-max,1280px)] px-5 pb-16 pt-3 md:px-8 md:pt-5" dir="rtl">
      {greeting}
      {data.isError ? (
        <div className="v7-card mt-8 p-6">
          <p className="text-[15px] font-semibold text-navy-900">לא הצלחנו לטעון את היום</p>
          <p className="mt-1 text-[14px] text-ink-400">בדקו את החיבור ונסו שוב.</p>
          <Button variant="outline" className="mt-4" onClick={() => data.refetch?.()}>לנסות שוב</Button>
        </div>
      ) : data.isLoading ? (
        <div role="status" aria-busy="true" aria-label="טוען" className="mt-7 grid gap-4 lg:grid-cols-12">
          <SkelLine className="h-[460px] rounded-[24px] lg:col-span-8" />
          <SkelLine className="h-[460px] rounded-[24px] lg:col-span-4" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:mt-7 lg:grid-cols-12 lg:gap-5">
          <div className="min-w-0 lg:col-span-8">{timeline}</div>
          <div className="min-w-0 lg:col-span-4">{side}</div>
        </div>
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
