/** Deposits and balances: deposit paid vs balance per booking, overdue badge, WhatsApp reminder. */
import FinanceTabs from '@/components/app/FinanceTabs';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Search, Wallet } from 'lucide-react';
import { useStayData } from '@/hooks/useStayData';
import { balanceOf, checkOutOf, isActiveBooking } from '@/lib/stay/bookings';
import { formatMoney, formatRangeHe, formatDayHe, todayISO, addDays } from '@/lib/stay/format';
import {
  StayPage, PageHeader, Btn, Pill, Segmented, StatTile, Money, ChannelTag,
} from '@/components/stay/StayUI';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { RecordPaymentSheet } from '@/components/stay/RecordPaymentSheet';
import { Skeleton } from '@/components/ui/skeleton';

const FILTERS = [
  { value: 'open', label: 'פתוחות' },
  { value: 'overdue', label: 'באיחור' },
  { value: 'paid', label: 'שולמו' },
  { value: 'all', label: 'הכול' },
];

function StatusPill({ b }) {
  if (b.overdue) return <Pill tone="danger">באיחור</Pill>;
  if (b.state === 'paid') return <Pill tone="success">שולם</Pill>;
  if (b.state === 'partial') return <Pill tone="amber">מקדמה שולמה</Pill>;
  if (b.state === 'no_price') return <Pill tone="muted">אין מחיר</Pill>;
  return <Pill tone="muted">טרם שולם</Pill>;
}

function ProgressBar({ paid, total }) {
  const ratio = total > 0 ? Math.min(1, paid / total) : 0;
  return (
    <div className="h-1.5 rounded-full overflow-hidden w-full" style={{ background: 'var(--line)' }} aria-hidden>
      <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: ratio >= 1 ? 'var(--status-success)' : 'var(--brand-600)' }} />
    </div>
  );
}

export default function BalancesPage({ user, orgId }) {
  const data = useStayData({ withCleaning: false });
  const [filter, setFilter] = useState('open');
  const [q, setQ] = useState('');
  const [composer, setComposer] = useState(null);
  const [payment, setPayment] = useState(null);
  const today = todayISO();

  const rows = useMemo(() => {
    const from = addDays(today, -60);
    return data.bookings
      .filter((b) => isActiveBooking(b) && checkOutOf(b) >= from)
      .map((b) => ({ booking: b, balance: balanceOf(b, data.paymentsByBooking.get(b.id) || [], today), unit: data.propertyById.get(b.property_id)?.name || b.property_name || '' }))
      .filter((r) => r.balance.state !== 'no_price')
      .sort((a, b) => Number(b.balance.overdue) - Number(a.balance.overdue) || a.booking.check_in_date.localeCompare(b.booking.check_in_date));
  }, [data.bookings, data.paymentsByBooking, data.propertyById, today]);

  const totals = useMemo(() => ({
    open: rows.reduce((s, r) => s + r.balance.balance, 0),
    overdue: rows.filter((r) => r.balance.overdue).reduce((s, r) => s + r.balance.balance, 0),
    overdueCount: rows.filter((r) => r.balance.overdue).length,
    deposits: rows.reduce((s, r) => s + r.balance.deposit, 0),
    upcoming: rows.filter((r) => r.balance.balance > 0 && r.booking.check_in_date >= today && r.booking.check_in_date <= addDays(today, 7)).length,
  }), [rows, today]);

  const visible = rows.filter((r) => {
    if (filter === 'open' && r.balance.balance <= 0) return false;
    if (filter === 'overdue' && !r.balance.overdue) return false;
    if (filter === 'paid' && r.balance.balance > 0) return false;
    if (q.trim()) {
      const s = q.trim();
      return [r.booking.guest_name, r.unit, r.booking.guest_phone].some((v) => String(v || '').includes(s));
    }
    return true;
  });

  return (
    <StayPage>
      <FinanceTabs />
      <PageHeader
        title="מקדמות ויתרות"
        subtitle="מה שולם, מה נשאר ומי באיחור. תזכורת יוצאת בוואטסאפ בלחיצה."
      />

      {data.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-[14px]" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-3 lg:grid-cols-3 gap-3 mb-4">
            <StatTile label="יתרות פתוחות" value={formatMoney(totals.open)} hint={`${rows.filter((r) => r.balance.balance > 0).length} הזמנות`} />
            <StatTile label="באיחור" value={formatMoney(totals.overdue)} hint={`${totals.overdueCount} הזמנות`} tone={totals.overdueCount ? 'danger' : undefined} />
            <StatTile label="מקדמות שהתקבלו" value={formatMoney(totals.deposits)} hint="בהזמנות פעילות" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-3">
            <Segmented label="סינון" value={filter} onChange={setFilter} options={FILTERS} />
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={18} strokeWidth={1.75} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} aria-hidden />
              <input className="ab-input" style={{ paddingRight: 40 }} placeholder="חיפוש אורח או יחידה" value={q} onChange={(e) => setQ(e.target.value)} aria-label="חיפוש" />
            </div>
          </div>

          <div className="ab-card overflow-hidden">
            {visible.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <span className="ab-icon-tile mx-auto"><Wallet size={20} strokeWidth={1.75} /></span>
                <p className="font-bold mt-3">{filter === 'overdue' ? 'אין יתרות באיחור.' : 'אין הזמנות שמתאימות לסינון.'}</p>
                <p className="ab-meta mt-1">יתרות מחושבות מהמחיר הכולל פחות התשלומים שנרשמו.</p>
              </div>
            ) : visible.map(({ booking, balance, unit }, i) => (
              <div key={booking.id} className={`px-4 sm:px-5 py-4 ${i ? 'border-t' : ''}`} style={{ borderColor: 'var(--line)' }}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/booking/${booking.id}`} className="font-bold hover:underline underline-offset-4">{booking.guest_name || 'אורח'}</Link>
                      <StatusPill b={balance} />
                    </div>
                    <p className="ab-meta mt-0.5 flex flex-wrap gap-x-2">
                      <span className="font-semibold" style={{ color: 'var(--ink-900)' }}>{unit}</span>
                      <span aria-hidden>·</span>
                      <span>{formatRangeHe(booking.check_in_date, checkOutOf(booking))}</span>
                      <span aria-hidden>·</span>
                      <ChannelTag booking={booking} />
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 lg:w-[360px] text-[13px]">
                    <div><p className="ab-faint">מקדמה</p><Money value={balance.deposit} className="font-bold text-[15px]" /></div>
                    <div><p className="ab-faint">שולם</p><Money value={balance.paid} className="font-bold text-[15px]" /></div>
                    <div><p className="ab-faint">יתרה</p><Money value={balance.balance} className="font-extrabold text-[15px]" style={{ color: balance.overdue ? 'var(--status-danger)' : 'var(--ink-900)' }} /></div>
                    <div className="col-span-3">
                      <ProgressBar paid={balance.paid} total={balance.total} />
                      <p className="ab-faint mt-1.5">
                        מחיר כולל {formatMoney(balance.total)}
                        {balance.balance > 0 && balance.dueDate ? ` · לתשלום עד ${formatDayHe(balance.dueDate, { weekday: false })}` : ''}
                      </p>
                    </div>
                  </div>
                  {balance.balance > 0 ? (
                    <div className="flex gap-2 lg:w-[250px] lg:justify-end">
                      <Btn size="sm" variant="secondary" icon={MessageCircle} className="flex-1 lg:flex-none" onClick={() => setComposer({ booking, balance })}>תזכורת</Btn>
                      <Btn size="sm" variant="primary" className="flex-1 lg:flex-none" onClick={() => setPayment({ booking, balance })}>תשלום התקבל</Btn>
                    </div>
                  ) : <div className="lg:w-[250px]" />}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <WhatsAppComposer
        open={!!composer}
        onOpenChange={(o) => { if (!o) setComposer(null); }}
        booking={composer?.booking}
        property={composer ? data.propertyById.get(composer.booking.property_id) : null}
        balance={composer?.balance}
        initialTemplate="balance_reminder"
        orgId={orgId}
        orgName={user?.organization_name || ''}
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
