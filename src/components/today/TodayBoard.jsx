/**
 * "היום": the warm home screen (v4). Who arrives today leads, with the unit's photo, then the rest of
 * the day (departures, cleanings) as one-line rows with one action each. Balances and messages stay
 * folded into one line each (simplicity rules). Max three numbers on top.
 *   variant "a" = Airbnb warm: white, photo-led arrival cards.
 *   variant "b" = playful light: tinted sections (indigo-50 / amber-50), bolder type, rounder chips.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, Plus, Sparkles } from 'lucide-react';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { buildDayBoard } from '@/lib/stay/today';
import { todayISO, addDays, formatDayHe, formatMoney, firstName } from '@/lib/stay/format';
import { isActiveBooking } from '@/lib/stay/bookings';
import { templateByKey } from '@/lib/stay/whatsapp';
import { WELCOME_PHOTO } from '@/lib/stay/unitPhoto';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { UnitPhoto, GuestAvatar, CountUp, Rise, dayPart } from '@/components/app/warm';
import { Button } from '@/components/ui/button';
import { SkelLine } from '@/components/ds';
import { cn } from '@/lib/utils';

const CHECK_IN = '15:00';
const CHECK_OUT = '11:00';

function Done({ children = 'בוצע' }) {
  return (
    <span className="inline-flex h-11 items-center gap-1.5 px-2 text-[15px] font-medium text-success-600">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success-50">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
      {children}
    </span>
  );
}

/** One line of the day: unit photo (+ guest initials), what + who, one quiet action. */
function DayRow({ property, guest, kind, title, detail, attention, action, i }) {
  return (
    <Rise as="li" i={i} className="flex min-h-[80px] items-center gap-4 px-4 py-3 md:px-5">
      <span className="relative shrink-0">
        <UnitPhoto property={property} className="h-14 w-14" rounded="rounded-[16px]" />
        {guest ? <GuestAvatar name={guest} size={26} ring className="absolute -bottom-1.5 -left-1.5" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('flex items-center gap-1.5 text-[13px] font-medium', attention ? 'text-[color:var(--today-ink)]' : 'text-ink-400')}>
          {attention ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--today)]" /> : null}
          {kind}
        </p>
        <p className="truncate text-[17px] font-bold text-navy-900">{title}</p>
        {detail ? <p className="truncate text-[14px] text-ink-600">{detail}</p> : null}
      </div>
      <div className="shrink-0">{action}</div>
    </Rise>
  );
}

/** A big photo card per arrival (A) or a compact photo card on an amber section (B). */
function ArrivalCard({ variant, property, booking, unit, action, i }) {
  const guest = booking.guest_name || 'אורח';
  const nights = booking.nights ? `${booking.nights} לילות` : null;
  if (variant === 'b') {
    return (
      <Rise i={i} className="v4-lift flex items-center gap-3 rounded-[22px] bg-white p-3 pe-3 shadow-card sm:gap-4 sm:pe-4">
        <UnitPhoto property={property} className="h-[76px] w-[76px] sm:h-[88px] sm:w-[88px]" rounded="rounded-[18px]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <GuestAvatar name={guest} size={28} className="hidden sm:inline-flex" />
            <p className="truncate text-[17px] font-extrabold text-navy-900">{guest}</p>
          </div>
          <p className="mt-1 truncate text-[14px] text-ink-600">{[unit, nights].filter(Boolean).join(' · ')}</p>
          <p className="mt-0.5 text-[13px] font-medium text-[color:var(--today-ink)]">כניסה {CHECK_IN}</p>
        </div>
        <div className="shrink-0">{action}</div>
      </Rise>
    );
  }
  return (
    <Rise i={i} className="v4-lift group flex w-[84%] shrink-0 flex-col overflow-hidden rounded-[22px] border border-line/70 bg-white shadow-card sm:w-auto">
      <div className="relative">
        <UnitPhoto property={property} className="aspect-[4/3] w-full" rounded="rounded-none" eager />
        <span className="absolute right-3 top-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/90 px-3 text-[13px] font-bold text-navy-900 shadow-[0_2px_8px_rgba(27,38,86,0.12)] backdrop-blur">
          <span aria-hidden className="h-2 w-2 rounded-full bg-[color:var(--today)]" />
          כניסה {CHECK_IN}
        </span>
      </div>
      <div className="flex items-center gap-3 p-4 md:p-5">
        <GuestAvatar name={guest} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-bold text-navy-900">{guest}</p>
          <p className="truncate text-[14px] text-ink-600">{[unit, nights].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </Rise>
  );
}

/** A folded line: "3 יתרות פתוחות · ₪2,415 ›". Links somewhere or unfolds a short list. */
function FoldLine({ label, to, onClick, open, attention }) {
  const cls = 'press flex min-h-[64px] w-full items-center gap-3 px-5 text-right md:px-6 hover:bg-canvas';
  const inner = (
    <>
      {attention ? <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--today)]" /> : null}
      <span className="flex-1 truncate text-[16px] font-medium text-navy-900">{label}</span>
      <ChevronLeft className={cn('h-5 w-5 shrink-0 text-ink-400 transition-transform duration-200', open && '-rotate-90')} strokeWidth={1.75} />
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
  const name = firstName(user?.full_name || '') || '';
  const part = dayPart();
  const playful = variant === 'b';

  const board = useMemo(() => buildDayBoard({
    day, bookings: data.bookings, paymentsByBooking: data.paymentsByBooking, sentByBooking: data.sentByBooking,
    cleaningTasks: data.cleaningTasks, propertyById: data.propertyById,
  }), [day, data.bookings, data.paymentsByBooking, data.sentByBooking, data.cleaningTasks, data.propertyById]);

  const tomorrowArrivals = useMemo(
    () => (data.bookings || []).filter((b) => isActiveBooking(b) && b.check_in_date === tomorrow).length,
    [data.bookings, tomorrow],
  );

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
  const btnCls = playful ? 'rounded-full px-5' : '';

  const arrivalAction = (booking) => (booking.status === 'CHECKED_IN'
    ? <Done>נכנסו</Done>
    : <Button variant="outline" className={btnCls} onClick={() => setStatus(booking, 'CHECKED_IN', `${booking.guest_name || 'האורחים'} נכנסו`)}>נכנסו</Button>);

  // The rest of today, in order: departures (11:00) then cleanings.
  const rows = [
    ...board.departures.map(({ booking, unit }) => ({
      key: `out-${booking.id}`, property: prop(booking.property_id), guest: booking.guest_name || 'אורח',
      kind: `יציאה · ${CHECK_OUT}`, title: booking.guest_name || 'אורח', detail: unit,
      action: booking.status === 'CHECKED_OUT'
        ? <Done>יצאו</Done>
        : <Button variant="outline" className={btnCls} onClick={() => setStatus(booking, 'CHECKED_OUT', `${booking.guest_name || 'האורחים'} יצאו`)}>יצאו</Button>,
    })),
    ...board.cleanings.map((c) => ({
      key: `clean-${c.key}`, property: prop(c.departure.property_id), guest: null,
      kind: 'ניקיון', title: c.unit, attention: c.sameDayTurnover && !c.done,
      detail: c.sameDayTurnover ? 'אורחים חדשים נכנסים היום' : c.nextArrival ? `הכניסה הבאה ${formatDayHe(c.nextArrival.check_in_date, { weekday: false })}` : 'אין כניסה קרובה',
      action: c.done ? <Done /> : <Button variant="outline" className={btnCls} onClick={() => markCleaned(c)}>בוצע</Button>,
    })),
  ];

  const nothingToday = board.arrivals.length === 0 && rows.length === 0;
  const overdue = board.balances.some((b) => b.balance.overdue);
  const composerProperty = composer ? data.propertyById.get(composer.booking.property_id) : null;
  const DayIcon = part.Icon;

  const header = (
    <Rise i={0} className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[15px] font-medium text-ink-600">
          <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-full', playful ? 'bg-white shadow-card' : 'bg-[color:var(--today-50)]')}>
            <DayIcon className="h-[18px] w-[18px] text-[#E39418]" strokeWidth={2} />
          </span>
          {formatDayHe(day)}
        </p>
        <h1 className={cn(
          'mt-3 font-extrabold leading-[1.05] tracking-[-0.025em] text-navy-900',
          playful ? 'text-[36px] md:text-[46px]' : 'text-[34px] md:text-[42px]',
        )}
        >
          {part.greeting}{name ? `, ${name}` : ''}
        </h1>
      </div>
      <Button onClick={() => quick.open()} className={cn('hidden lg:inline-flex', btnCls)}>
        <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />הזמנה חדשה
      </Button>
    </Rise>
  );

  const numbers = playful ? (
    <Rise i={1} as="dl" className="mt-7 grid grid-cols-3 gap-3 md:max-w-[560px]">
      {counts.map((c) => (
        <div key={c.label} className="rounded-[20px] bg-white px-4 py-3.5 shadow-card md:px-5 md:py-4">
          <dt className="text-[14px] font-medium text-ink-600">{c.label}</dt>
          <dd className="mt-1 text-[32px] font-extrabold leading-none text-navy-900 md:text-[36px]"><CountUp value={c.value} /></dd>
        </div>
      ))}
    </Rise>
  ) : (
    <Rise i={1} as="p" className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[17px] text-ink-600 md:text-[18px]">
      {counts.map((c, idx) => (
        <React.Fragment key={c.label}>
          {idx > 0 ? <span aria-hidden className="text-ink-400">·</span> : null}
          <span><CountUp value={c.value} className="font-extrabold text-navy-900" /> {c.label}</span>
        </React.Fragment>
      ))}
    </Rise>
  );

  const arrivalsBlock = board.arrivals.length ? (
    <section aria-label="מגיעים היום" className={cn(playful ? 'mt-6 rounded-[28px] bg-[color:var(--tint-amber)] p-4 md:p-6' : 'mt-10')}>
      <Rise i={2} as="h2" className={cn('mb-4 flex items-center gap-2 font-extrabold text-navy-900', playful ? 'px-1 text-[21px]' : 'text-[22px]')}>
        מגיעים היום
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[color:var(--today)] px-2 text-[14px] font-bold text-white tabular">{board.arrivals.length}</span>
      </Rise>
      <div className={cn(
        playful ? 'grid grid-cols-1 gap-3 md:grid-cols-2'
          : 'v4-rail -mx-5 flex scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0',
      )}
      >
        {board.arrivals.map(({ booking, unit }, idx) => (
          <ArrivalCard key={booking.id} variant={variant} i={3 + idx} property={prop(booking.property_id)} booking={booking} unit={unit} action={arrivalAction(booking)} />
        ))}
      </div>
    </section>
  ) : null;

  const restBlock = rows.length ? (
    <section className={cn(playful ? 'mt-6' : 'mt-10')} aria-label="עוד היום">
      <h2 className={cn('mb-3 font-extrabold text-navy-900', playful ? 'px-1 text-[21px]' : 'text-[20px]')}>{board.arrivals.length ? 'עוד היום' : 'מה קורה היום'}</h2>
      <ul className={cn('divide-y divide-line overflow-hidden bg-white shadow-card', playful ? 'rounded-[24px]' : 'rounded-[20px] border border-line/70')}>
        {rows.map((r, idx) => <DayRow key={r.key} i={4 + idx} {...r} />)}
      </ul>
    </section>
  ) : null;

  const quietDay = (
    <Rise i={2} as="section" className={cn('mt-10 overflow-hidden bg-white shadow-card', playful ? 'rounded-[28px]' : 'rounded-[22px] border border-line/70')} aria-label="יום שקט">
      <UnitPhoto src={WELCOME_PHOTO} className="aspect-[16/7] w-full" rounded="rounded-none" eager />
      <div className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-7">
        <div>
          <p className="flex items-center gap-2 text-[20px] font-extrabold text-navy-900">
            <Sparkles className="h-5 w-5 text-[#E39418]" strokeWidth={2} />הכל מוכן להיום
          </p>
          <p className="mt-1 text-[16px] text-ink-600">אין כניסות, יציאות או ניקיונות. יום שקט.</p>
        </div>
        <Button asChild variant="outline" className={btnCls}><Link to="/calendar">ללוח השנה</Link></Button>
      </div>
    </Rise>
  );

  return (
    <div className="mx-auto w-full max-w-[920px] px-5 pb-16 pt-6 md:px-10 md:pt-10" dir="rtl">
      {playful ? (
        <section className="rounded-[28px] bg-[color:var(--tint-brand)] p-5 md:p-8">{header}{data.isLoading ? null : numbers}</section>
      ) : (
        <section>{header}{data.isLoading ? null : numbers}</section>
      )}

      {data.isError ? (
        <div className="mt-10 rounded-[20px] border border-line bg-white p-6">
          <p className="text-[17px] font-bold text-navy-900">לא הצלחנו לטעון את היום</p>
          <p className="mt-1 text-[15px] text-ink-600">בדקו את החיבור ונסו שוב.</p>
          <Button variant="outline" className="mt-4" onClick={() => data.refetch?.()}>לנסות שוב</Button>
        </div>
      ) : data.isLoading ? (
        <div className="mt-10 space-y-3" aria-busy="true" aria-label="טוען">
          <SkelLine className="h-[220px] rounded-[22px]" />
          {[0, 1].map((i) => <SkelLine key={i} className="h-[80px] rounded-[18px]" />)}
        </div>
      ) : (
        <>
          {nothingToday ? quietDay : null}
          {arrivalsBlock}
          {restBlock}

          <section className={cn('overflow-hidden bg-white', playful ? 'mt-6 rounded-[24px] shadow-card' : 'mt-10 rounded-[20px] border border-line/70')} aria-label="עוד דברים">
            <ul className="divide-y divide-line">
              {board.balances.length > 0 ? (
                <li>
                  <FoldLine to="/balances" attention={overdue} label={`${board.balances.length} יתרות פתוחות · ${formatMoney(board.openBalanceTotal)}`} />
                </li>
              ) : null}
              {board.messages.length > 0 ? (
                <li>
                  <FoldLine open={showMessages} onClick={() => setShowMessages((v) => !v)} label={`${board.messages.length} הודעות מחכות לשליחה`} />
                  {showMessages ? (
                    <ul className="divide-y divide-line border-t border-line bg-canvas/60">
                      {board.messages.map(({ booking, template, balance }, idx) => (
                        <DayRow
                          key={`msg-${booking.id}`}
                          i={idx}
                          property={prop(booking.property_id)}
                          guest={booking.guest_name || 'אורח'}
                          kind="הודעה"
                          title={booking.guest_name || 'אורח'}
                          detail={templateByKey(template)?.label}
                          action={<Button variant="outline" className={btnCls} onClick={() => setComposer({ booking, template, balance })}>שליחה</Button>}
                        />
                      ))}
                    </ul>
                  ) : null}
                </li>
              ) : null}
              <li>
                <FoldLine to="/calendar" label={tomorrowArrivals ? `מחר: ${tomorrowArrivals} כניסות` : 'מחר: אין כניסות'} />
              </li>
            </ul>
          </section>
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
