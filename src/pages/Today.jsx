/**
 * "היום" board: the whole day on one screen with a one-tap action per line.
 * Arrivals, departures, cleanings between them, open balances and guests to message.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LogIn, LogOut, Sparkles, Wallet, MessageCircle, Check, BedDouble, ChevronLeft, FileBarChart, Globe,
} from 'lucide-react';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { buildDayBoard } from '@/lib/stay/today';
import { todayISO, addDays, formatDayHe, formatMoney, formatRangeHe, nightsBetween } from '@/lib/stay/format';
import { checkOutOf } from '@/lib/stay/bookings';
import { templateByKey } from '@/lib/stay/whatsapp';
import {
  StayPage, PageHeader, SectionCard, Row, EmptyLine, ChannelTag, BalancePill, Btn, Pill, Segmented, StatTile, Money,
} from '@/components/stay/StayUI';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { RecordPaymentSheet } from '@/components/stay/RecordPaymentSheet';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { Skeleton } from '@/components/ui/skeleton';

function GuestCell({ booking, unit, extra }) {
  const guests = (Number(booking.adults) || 0) + (Number(booking.children) || 0);
  const nights = booking.nights || nightsBetween(booking.check_in_date, checkOutOf(booking));
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <Link to={`/booking/${booking.id}`} className="font-bold truncate hover:underline underline-offset-4" style={{ color: 'var(--ink-900)' }}>
          {booking.guest_name || 'אורח'}
        </Link>
        {extra}
      </div>
      <p className="ab-meta mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="font-semibold" style={{ color: 'var(--ink-900)' }}>{unit}</span>
        <span aria-hidden>·</span>
        <span className="ab-num">{nights} לילות</span>
        {guests > 0 ? (<><span aria-hidden>·</span><span className="ab-num">{guests} אורחים</span></>) : null}
        <span aria-hidden>·</span>
        <ChannelTag booking={booking} />
      </p>
    </div>
  );
}

function Actions({ children }) {
  return <div className="flex flex-wrap gap-2 sm:justify-end sm:flex-nowrap">{children}</div>;
}

function BoardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[84px] rounded-[14px]" />)}</div>
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-[14px]" />)}
    </div>
  );
}

export default function TodayPage({ user, orgId }) {
  const [which, setWhich] = useState('today');
  const day = which === 'today' ? todayISO() : addDays(todayISO(), 1);
  const data = useStayData();
  const { updateBooking, createCleaning, updateCleaning } = useStayMutations();
  const [composer, setComposer] = useState(null); // { booking, template, balance }
  const [payment, setPayment] = useState(null); // { booking, balance }
  const orgName = user?.organization_name || '';
  const location = useLocation();

  useEffect(() => {
    if (data.isLoading || !location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [data.isLoading, location.hash]);

  const board = useMemo(() => buildDayBoard({
    day,
    bookings: data.bookings,
    paymentsByBooking: data.paymentsByBooking,
    sentByBooking: data.sentByBooking,
    cleaningTasks: data.cleaningTasks,
    propertyById: data.propertyById,
  }), [day, data.bookings, data.paymentsByBooking, data.sentByBooking, data.cleaningTasks, data.propertyById]);

  const isToday = which === 'today';
  const openComposer = (booking, template, balance) => setComposer({ booking, template, balance });

  const setStatus = async (booking, status, msg) => {
    try {
      await updateBooking.mutateAsync({ id: booking.id, data: { status } });
      atlasToastApi.success(msg);
    } catch {
      atlasToastApi.error('לא הצלחנו לעדכן את ההזמנה');
    }
  };

  const markCleaned = async (c) => {
    try {
      if (c.task) {
        await updateCleaning.mutateAsync({ id: c.task.id, data: { status: 'DONE' } });
      } else {
        await createCleaning.mutateAsync({
          ...(orgId ? { org_id: orgId } : {}),
          title: `ניקיון ${c.unit}`,
          property_id: c.departure.property_id || null,
          booking_id: c.departure.id,
          scheduled_date: day,
          status: 'DONE',
          created_at: new Date().toISOString(),
        });
      }
      atlasToastApi.success(`${c.unit} מוכנה לאורחים הבאים`);
    } catch {
      atlasToastApi.error('לא הצלחנו לעדכן את הניקיון');
    }
  };

  const createCleaningTask = async (c) => {
    try {
      await createCleaning.mutateAsync({
        ...(orgId ? { org_id: orgId } : {}),
        title: `ניקיון ${c.unit}`,
        property_id: c.departure.property_id || null,
        booking_id: c.departure.id,
        scheduled_date: day,
        status: 'OPEN',
        created_at: new Date().toISOString(),
      });
      atlasToastApi.success('נוצרה משימת ניקיון');
    } catch {
      atlasToastApi.error('לא הצלחנו ליצור משימה');
    }
  };

  const summaryParts = [
    `${board.arrivals.length} הגעות`,
    `${board.departures.length} עזיבות`,
    `${board.cleanings.filter((c) => !c.done).length} ניקיונות`,
  ];

  const composerProperty = composer ? data.propertyById.get(composer.booking.property_id) : null;

  return (
    <StayPage>
      <PageHeader
        eyebrow={formatDayHe(day)}
        title={isToday ? 'היום' : 'מחר'}
        subtitle={data.isLoading ? 'טוען את היום…' : summaryParts.join(', ')}
        actions={(
          <Segmented
            label="בחירת יום"
            value={which}
            onChange={setWhich}
            options={[{ value: 'today', label: 'היום' }, { value: 'tomorrow', label: 'מחר' }]}
          />
        )}
      />

      {data.isError ? (
        <div className="ab-card p-5">
          <p className="font-bold">לא הצלחנו לטעון את הנתונים.</p>
          <p className="ab-meta mt-1">בדקו את החיבור ונסו שוב.</p>
          <Btn variant="primary" className="mt-3" onClick={() => data.refetch()}>טעינה מחדש</Btn>
        </div>
      ) : data.isLoading ? <BoardSkeleton /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="הגעות" value={board.arrivals.length} hint={board.arrivals.length ? board.arrivals.map((a) => a.unit).join(', ') : 'אין הגעות'} />
            <StatTile label="עזיבות" value={board.departures.length} hint={board.departures.length ? board.departures.map((a) => a.unit).join(', ') : 'אין עזיבות'} />
            <StatTile label="בשהייה" value={board.inHouse.length} hint="יחידות תפוסות הלילה" />
            <StatTile label="יתרות פתוחות" value={formatMoney(board.openBalanceTotal)} hint={`${board.balances.length} הזמנות`} tone={board.balances.some((b) => b.balance.overdue) ? 'danger' : undefined} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Arrivals */}
            <SectionCard title="הגעות" icon={LogIn} count={board.arrivals.length} id="arrivals">
              {board.arrivals.length === 0 ? (
                <EmptyLine>{isToday ? 'אין הגעות היום.' : 'אין הגעות מחר.'}</EmptyLine>
              ) : board.arrivals.map(({ booking, balance, unit }) => {
                const checkedIn = booking.status === 'CHECKED_IN';
                return (
                  <Row key={booking.id}>
                    <GuestCell booking={booking} unit={unit} extra={<BalancePill balance={balance} />} />
                    <Actions>
                      <Btn size="sm" variant="secondary" icon={MessageCircle} onClick={() => openComposer(booking, isToday ? 'welcome' : 'arrival_eve', balance)}>
                        {isToday ? 'ברוכים הבאים' : 'הוראות הגעה'}
                      </Btn>
                      {isToday ? (
                        checkedIn
                          ? <Pill tone="brand"><Check size={14} strokeWidth={2} /> נכנסו</Pill>
                          : <Btn size="sm" variant="primary" icon={LogIn} onClick={() => setStatus(booking, 'CHECKED_IN', `${booking.guest_name || 'האורח'} סומנו כנכנסו`)}>כניסה</Btn>
                      ) : null}
                    </Actions>
                  </Row>
                );
              })}
            </SectionCard>

            {/* Departures */}
            <SectionCard title="עזיבות" icon={LogOut} count={board.departures.length} id="departures">
              {board.departures.length === 0 ? (
                <EmptyLine>{isToday ? 'אין עזיבות היום.' : 'אין עזיבות מחר.'}</EmptyLine>
              ) : board.departures.map(({ booking, balance, unit }) => {
                const out = booking.status === 'CHECKED_OUT';
                return (
                  <Row key={booking.id}>
                    <GuestCell booking={booking} unit={unit} extra={<BalancePill balance={balance} />} />
                    <Actions>
                      <Btn size="sm" variant="secondary" icon={MessageCircle} onClick={() => openComposer(booking, 'thanks_review', balance)}>תודה וביקורת</Btn>
                      {isToday ? (
                        out
                          ? <Pill tone="muted"><Check size={14} strokeWidth={2} /> יצאו</Pill>
                          : <Btn size="sm" variant="primary" icon={LogOut} onClick={() => setStatus(booking, 'CHECKED_OUT', `${booking.guest_name || 'האורח'} סומנו כיצאו`)}>יציאה</Btn>
                      ) : null}
                    </Actions>
                  </Row>
                );
              })}
            </SectionCard>

            {/* Cleanings */}
            <SectionCard title="ניקיון בין אורחים" icon={Sparkles} count={board.cleanings.filter((c) => !c.done).length} id="cleanings">
              {board.cleanings.length === 0 ? (
                <EmptyLine>אין ניקיונות מתוכננים, כי אין עזיבות ביום הזה.</EmptyLine>
              ) : board.cleanings.map((c) => (
                <Row key={c.key}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold" style={{ color: c.done ? 'var(--ink-400)' : 'var(--ink-900)' }}>{c.unit}</span>
                      {c.done ? <Pill tone="success">מוכנה</Pill>
                        : c.sameDayTurnover ? <Pill tone="amber">כניסה באותו יום</Pill>
                          : c.task?.status === 'IN_PROGRESS' ? <Pill tone="brand">בתהליך</Pill> : null}
                    </div>
                    <p className="ab-meta mt-0.5">
                      {`יוצאים: ${c.departure.guest_name || 'אורח'}`}
                      {c.nextArrival
                        ? ` · נכנסים: ${c.nextArrival.guest_name || 'אורח'}, ${c.sameDayTurnover ? 'היום' : formatDayHe(c.nextArrival.check_in_date)}`
                        : ' · אין הגעה קרובה'}
                      {c.task?.cleaner_name || c.task?.assigned_to ? ` · ${c.task.cleaner_name || c.task.assigned_to}` : ''}
                    </p>
                  </div>
                  <Actions>
                    {!c.done && !c.task ? <Btn size="sm" variant="secondary" onClick={() => createCleaningTask(c)}>משימה לצוות</Btn> : null}
                    {!c.done ? <Btn size="sm" variant="primary" icon={Check} onClick={() => markCleaned(c)}>ניקיון בוצע</Btn> : null}
                  </Actions>
                </Row>
              ))}
            </SectionCard>

            {/* Balances */}
            <SectionCard
              title="יתרות לגבייה"
              icon={Wallet}
              count={board.balances.length}
              id="balances"
              action={<Link to="/balances" className="ab-btn ab-btn-ghost ab-btn-sm">כל היתרות <ChevronLeft size={16} strokeWidth={1.75} /></Link>}
            >
              {board.balances.length === 0 ? (
                <EmptyLine>אין יתרות פתוחות להגעות הקרובות.</EmptyLine>
              ) : board.balances.map(({ booking, balance, unit }) => (
                <div key={booking.id} className="px-4 sm:px-5 py-3.5 border-t" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link to={`/booking/${booking.id}`} className="font-bold truncate hover:underline underline-offset-4">{booking.guest_name || 'אורח'}</Link>
                        {balance.overdue ? <Pill tone="danger">באיחור</Pill> : null}
                      </div>
                      <p className="ab-meta mt-0.5">
                        {unit} · {formatRangeHe(booking.check_in_date, checkOutOf(booking))} · שולם <Money value={balance.paid} /> מתוך <Money value={balance.total} />
                      </p>
                    </div>
                    <Money value={balance.balance} className="text-[17px] font-extrabold shrink-0" style={{ color: balance.overdue ? 'var(--status-danger)' : 'var(--ink-900)' }} />
                  </div>
                  <div className="flex gap-2 mt-2.5 sm:justify-end">
                    <Btn size="sm" variant="secondary" icon={MessageCircle} className="flex-1 sm:flex-none" onClick={() => openComposer(booking, 'balance_reminder', balance)}>תזכורת</Btn>
                    <Btn size="sm" variant="primary" className="flex-1 sm:flex-none" onClick={() => setPayment({ booking, balance })}>תשלום התקבל</Btn>
                  </div>
                </div>
              ))}
            </SectionCard>
          </div>

          {/* Messages */}
          <SectionCard title="הודעות לשליחה" icon={MessageCircle} count={board.messages.length} id="messages">
            {board.messages.length === 0 ? (
              <EmptyLine>כל האורחים קיבלו את ההודעות שלהם.</EmptyLine>
            ) : board.messages.map(({ booking, template, balance, unit }) => (
              <Row key={`${booking.id}-${template}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link to={`/booking/${booking.id}`} className="font-bold truncate hover:underline underline-offset-4">{booking.guest_name || 'אורח'}</Link>
                    <Pill tone="brand">{templateByKey(template).label}</Pill>
                  </div>
                  <p className="ab-meta mt-0.5">{unit} · {formatRangeHe(booking.check_in_date, checkOutOf(booking))}</p>
                </div>
                <Actions>
                  <Btn size="sm" variant="primary" icon={MessageCircle} onClick={() => openComposer(booking, template, balance)}>שליחה בוואטסאפ</Btn>
                </Actions>
              </Row>
            ))}
          </SectionCard>

          <nav aria-label="כלים נוספים" className="grid grid-cols-1 sm:grid-cols-3 gap-3 ab-no-print">
            {[
              { to: '/balances', icon: Wallet, title: 'מקדמות ויתרות', hint: 'מי שילם ומה נשאר' },
              { to: '/monthly-report', icon: FileBarChart, title: 'דוח חודשי לרואה החשבון', hint: 'הכנסות, הוצאות ותפוסה' },
              { to: '/guest-portal', icon: Globe, title: 'דף אורח והזמנה ישירה', hint: 'קישורים לשיתוף' },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="ab-card flex items-center gap-3 px-4 py-3.5 transition-[border-color] duration-150 hover:border-[var(--brand-100)]">
                <span className="ab-icon-tile"><l.icon size={20} strokeWidth={1.75} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold truncate">{l.title}</span>
                  <span className="block ab-meta truncate">{l.hint}</span>
                </span>
                <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--ink-400)' }} />
              </Link>
            ))}
          </nav>

          {board.inHouse.length > 0 ? (
            <p className="ab-meta flex items-center gap-2 px-1">
              <BedDouble size={16} strokeWidth={1.75} aria-hidden />
              בשהייה: {board.inHouse.map((b) => `${b.guest_name || 'אורח'} (${data.propertyById.get(b.property_id)?.name || b.property_name || ''})`).join(', ')}
            </p>
          ) : null}
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
        orgName={orgName}
      />
      <RecordPaymentSheet
        open={!!payment}
        onOpenChange={(o) => { if (!o) setPayment(null); }}
        booking={payment?.booking}
        balance={payment?.balance}
        orgId={orgId}
      />
    </StayPage>
  );
}
