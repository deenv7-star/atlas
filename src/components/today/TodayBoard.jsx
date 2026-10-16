/**
 * "היום": the calm home screen. One short list of what happens today, one button per line.
 * Balances and messages stay folded into one line each until tapped (simplicity rules, 16.10.2026).
 * Direction A renders it on plain canvas; direction B opens with a navy day card.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, Plus } from 'lucide-react';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { buildDayBoard } from '@/lib/stay/today';
import { todayISO, addDays, formatDayHe, formatMoney, firstName } from '@/lib/stay/format';
import { isActiveBooking } from '@/lib/stay/bookings';
import { templateByKey } from '@/lib/stay/whatsapp';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { Button } from '@/components/ui/button';
import { SkelLine } from '@/components/ds';
import { cn } from '@/lib/utils';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}

/** One line: what + who, then a single quiet action. Row height ≥ 64. */
function Row({ kind, title, detail, action }) {
  return (
    <li className="flex min-h-[72px] items-center gap-4 px-5 py-3 md:px-6">
      <span className="w-14 shrink-0 text-[14px] font-medium text-ink-400">{kind}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-bold text-navy-900">{title}</p>
        {detail ? <p className="truncate text-[15px] text-ink-600">{detail}</p> : null}
      </div>
      <div className="shrink-0">{action}</div>
    </li>
  );
}

function Done({ children = 'בוצע' }) {
  return (
    <span className="inline-flex h-11 items-center gap-1.5 px-2 text-[15px] font-medium text-success-600">
      <Check className="h-[18px] w-[18px]" strokeWidth={2} />{children}
    </span>
  );
}

/** A folded line: "3 יתרות פתוחות · ₪2,415 ›". Links somewhere or unfolds a short list. */
function FoldLine({ label, to, onClick, open, attention }) {
  const cls = 'press flex min-h-[64px] w-full items-center gap-3 px-5 text-right md:px-6 hover:bg-canvas';
  const inner = (
    <>
      {attention ? <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[#F8B040]" /> : null}
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

  const openCleanings = board.cleanings.filter((c) => !c.done).length;
  const counts = [
    { label: 'כניסות', value: board.arrivals.length },
    { label: 'יציאות', value: board.departures.length },
    { label: 'ניקיון', value: openCleanings },
  ];

  // Today, in order of the day: departures (11:00), cleanings, arrivals (15:00).
  const rows = [
    ...board.departures.map(({ booking, unit }) => ({
      key: `out-${booking.id}`, kind: 'יציאה', title: booking.guest_name || 'אורח', detail: unit,
      action: booking.status === 'CHECKED_OUT'
        ? <Done>יצאו</Done>
        : <Button variant="outline" onClick={() => setStatus(booking, 'CHECKED_OUT', `${booking.guest_name || 'האורחים'} יצאו`)}>יצאו</Button>,
    })),
    ...board.cleanings.map((c) => ({
      key: `clean-${c.key}`, kind: 'ניקיון', title: c.unit,
      detail: c.sameDayTurnover ? 'אורחים חדשים נכנסים היום' : c.nextArrival ? `הכניסה הבאה ${formatDayHe(c.nextArrival.check_in_date, { weekday: false })}` : null,
      action: c.done ? <Done /> : <Button variant="outline" onClick={() => markCleaned(c)}>בוצע</Button>,
    })),
    ...board.arrivals.map(({ booking, unit }) => ({
      key: `in-${booking.id}`, kind: 'כניסה', title: booking.guest_name || 'אורח',
      detail: `${unit} · ${booking.nights || ''} לילות`.replace(' ·  לילות', ''),
      action: booking.status === 'CHECKED_IN'
        ? <Done>נכנסו</Done>
        : <Button variant="outline" onClick={() => setStatus(booking, 'CHECKED_IN', `${booking.guest_name || 'האורחים'} נכנסו`)}>נכנסו</Button>,
    })),
  ];

  const overdue = board.balances.some((b) => b.balance.overdue);
  const composerProperty = composer ? data.propertyById.get(composer.booking.property_id) : null;

  const header = (
    <div className={cn('flex items-end justify-between gap-4', variant === 'b' ? 'text-white' : '')}>
      <div className="min-w-0">
        <p className={cn('text-[15px]', variant === 'b' ? 'text-white/70' : 'text-ink-400')}>{formatDayHe(day)}</p>
        <h1 className={cn('mt-1 text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] md:text-[34px]', variant === 'b' ? 'text-white' : 'text-navy-900')}>
          {greeting()}{name ? `, ${name}` : ''}
        </h1>
      </div>
      <Button
        onClick={() => quick.open()}
        className={cn('hidden lg:inline-flex', variant === 'b' && 'bg-white text-navy-900 hover:bg-white/90')}
      >
        <Plus className="h-[18px] w-[18px]" strokeWidth={2} />הזמנה חדשה
      </Button>
    </div>
  );

  const numbers = (
    <dl className={cn('mt-8 grid grid-cols-3', variant === 'b' ? 'gap-3' : 'gap-4 md:max-w-xl')}>
      {counts.map((c) => (
        <div key={c.label} className={cn(variant === 'b' ? 'rounded-[14px] bg-white/10 px-4 py-3' : '')}>
          <dt className={cn('text-[15px]', variant === 'b' ? 'text-white/70' : 'text-ink-600')}>{c.label}</dt>
          <dd className={cn('tabular mt-1 text-[34px] font-extrabold leading-none', variant === 'b' ? 'text-white' : 'text-navy-900')}>{c.value}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <div className="mx-auto w-full max-w-[880px] px-5 pb-16 pt-6 md:px-10 md:pt-10" dir="rtl">
      {variant === 'b' ? (
        <section className="rounded-[20px] bg-navy-900 p-6 md:p-8">{header}{data.isLoading ? null : numbers}</section>
      ) : (
        <section>{header}{data.isLoading ? null : numbers}</section>
      )}

      {data.isError ? (
        <div className="mt-10 rounded-[14px] border border-line bg-white p-6">
          <p className="text-[17px] font-bold text-navy-900">לא הצלחנו לטעון את היום</p>
          <p className="mt-1 text-[15px] text-ink-600">בדקו את החיבור ונסו שוב.</p>
          <Button variant="outline" className="mt-4" onClick={() => data.refetch?.()}>לנסות שוב</Button>
        </div>
      ) : data.isLoading ? (
        <div className="mt-10 space-y-3" aria-busy="true" aria-label="טוען">
          {[0, 1, 2].map((i) => <SkelLine key={i} className="h-[72px] rounded-[14px]" />)}
        </div>
      ) : (
        <>
          <section className="mt-10" aria-label="מה קורה היום">
            <h2 className="mb-3 text-[20px] font-extrabold text-navy-900">מה קורה היום</h2>
            {rows.length === 0 ? (
              <div className="flex items-center gap-3 rounded-[14px] border border-line bg-white px-6 py-6">
                <Check className="h-6 w-6 shrink-0 text-success-600" strokeWidth={2} />
                <div>
                  <p className="text-[17px] font-bold text-navy-900">הכל מוכן להיום</p>
                  <p className="text-[15px] text-ink-600">אין כניסות, יציאות או ניקיונות. יום שקט.</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-white">
                {rows.map((r) => <Row key={r.key} {...r} />)}
              </ul>
            )}
          </section>

          <section className="mt-10 overflow-hidden rounded-[14px] border border-line bg-white" aria-label="עוד דברים">
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
                      {board.messages.map(({ booking, template, balance }) => (
                        <Row
                          key={`msg-${booking.id}`}
                          kind=""
                          title={booking.guest_name || 'אורח'}
                          detail={templateByKey(template)?.label}
                          action={<Button variant="outline" onClick={() => setComposer({ booking, template, balance })}>שליחה</Button>}
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

