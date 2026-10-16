/** Dashboard slot: what needs doing today, one tap into the "היום" board. */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, CalendarCheck } from 'lucide-react';
import { useStayData } from '@/hooks/useStayData';
import { buildDayBoard } from '@/lib/stay/today';
import { todayISO, formatDayHe, formatMoney } from '@/lib/stay/format';
import '@/styles/atlas-brand.css';

export default function TodaySummaryCard() {
  const data = useStayData();
  const day = todayISO();
  const board = useMemo(() => buildDayBoard({
    day, bookings: data.bookings, paymentsByBooking: data.paymentsByBooking, sentByBooking: data.sentByBooking,
    cleaningTasks: data.cleaningTasks, propertyById: data.propertyById,
  }), [day, data.bookings, data.paymentsByBooking, data.sentByBooking, data.cleaningTasks, data.propertyById]);

  if (data.isLoading || data.isError) return null;

  const items = [
    { label: 'הגעות', value: board.arrivals.length, hash: 'arrivals' },
    { label: 'עזיבות', value: board.departures.length, hash: 'departures' },
    { label: 'ניקיונות', value: board.cleanings.filter((c) => !c.done).length, hash: 'cleanings' },
    { label: 'הודעות לשליחה', value: board.messages.length, hash: 'messages' },
    { label: 'יתרות לגבייה', value: formatMoney(board.openBalanceTotal), hash: 'balances', alert: board.balances.some((b) => b.balance.overdue) },
  ];

  return (
    <section dir="rtl" className="ab-root ab-card overflow-hidden" aria-label="היום">
      <div className="flex items-center gap-3 px-4 sm:px-5 pt-4 pb-3">
        <span className="ab-icon-tile"><CalendarCheck size={20} strokeWidth={1.75} aria-hidden /></span>
        <div className="flex-1 min-w-0">
          <h2 className="ab-h3">היום</h2>
          <p className="ab-meta">{formatDayHe(day)}</p>
        </div>
        <Link to="/today" className="ab-btn ab-btn-primary ab-btn-sm">לוח היום <ChevronLeft size={16} strokeWidth={1.75} /></Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 border-t" style={{ borderColor: 'var(--line)' }}>
        {items.map((it, i) => (
          <Link
            key={it.label}
            to={`/today#${it.hash}`}
            className={`px-4 sm:px-5 py-3 transition-[background-color] duration-150 hover:bg-[var(--brand-50)] ${i % 2 === 1 ? 'border-r sm:border-r-0' : ''} ${i >= 2 ? 'border-t sm:border-t-0' : ''} ${i > 0 ? 'sm:border-r' : ''} ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
            style={{ borderColor: 'var(--line)' }}
          >
            <p className="ab-meta truncate">{it.label}</p>
            <p className="ab-num text-[22px] font-extrabold leading-tight" style={{ color: it.alert ? 'var(--status-danger)' : 'var(--ink-900)' }}>{it.value}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
