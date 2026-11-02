/**
 * One read of "what is happening today" for the Today screen, shared by every UI direction.
 * Everything comes from the account (useStayData + Lead entity), nothing invented:
 *   arrivals / departures / cleanings / pending payments / new leads / money in this month,
 *   plus the ONE next thing that needs the owner (a WhatsApp message ready, a cleaning to close,
 *   a balance to chase), so every direction can put it one tap away.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { buildDayBoard } from '@/lib/stay/today';
import { todayISO, addDays, nightsBetween, firstName } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf, balanceOf, channelOf } from '@/lib/stay/bookings';
import { monthlyRevenue } from '@/components/today/RevenueChart';
import { checkInTime, checkOutTime } from '@/components/today/TodayBoard';
import { heCount } from '@/lib/hebrewCount';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';

export const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

export function guestLabel(b) {
  if (!b) return '';
  if (b.guest_name) return b.guest_name;
  const ch = channelOf(b);
  if (ch.key === 'booking') return 'הזמנה מ\u2011Booking';
  if (ch.key === 'airbnb') return 'הזמנה מ\u2011Airbnb';
  return 'אורח';
}
export function guestsOf(b) {
  const n = (Number(b?.adults) || 0) + (Number(b?.children) || 0) || Number(b?.guests) || Number(b?.guest_count) || 0;
  return n ? heCount(n, 'guest') : '';
}
export const money = (n) => `₪${Math.round(Number(n) || 0).toLocaleString('he-IL')}`;
export const moneyNum = (n) => Math.round(Number(n) || 0).toLocaleString('he-IL');

export function useTodayModel({ orgId } = {}) {
  const day = todayISO();
  const tomorrow = addDays(day, 1);
  const data = useStayData({ withExpenses: false });
  const { updateCleaning, createCleaning } = useStayMutations();
  const leadsQ = useQuery({
    queryKey: ['leads-today', orgId],
    queryFn: async () => { try { return await base44.entities.Lead.filter({}, '-created_at', 200); } catch { return []; } },
    staleTime: 60_000,
  });
  const [sentNow, setSentNow] = useState(() => new Set());

  const boardOf = (d) => buildDayBoard({
    day: d, bookings: data.bookings, paymentsByBooking: data.paymentsByBooking, sentByBooking: data.sentByBooking,
    cleaningTasks: data.cleaningTasks, propertyById: data.propertyById,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const board = useMemo(() => boardOf(day), [day, data.bookings, data.paymentsByBooking, data.sentByBooking, data.cleaningTasks, data.propertyById]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const boardT = useMemo(() => boardOf(tomorrow), [tomorrow, data.bookings, data.paymentsByBooking, data.sentByBooking, data.cleaningTasks, data.propertyById]);

  const prop = (id) => data.propertyById.get(id) || null;
  const paysOf = (b) => data.paymentsByBooking.get(b.id) || [];
  const sentOf = (b) => data.sentByBooking.get(b.id) || new Set();

  const messages = board.messages.filter((m) => !sentNow.has(`${m.booking.id}:${m.template}`));
  const openCleanings = board.cleanings.filter((c) => !c.done);
  const leads = (leadsQ.data || []).filter((l) => String(l.status || 'NEW').toUpperCase() === 'NEW');

  const money_ = useMemo(() => {
    const now = new Date();
    const months = monthlyRevenue(data.bookings, 6, now, data.paymentsByBooking);
    const y = now.getFullYear(); const m = now.getMonth();
    const first = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const nextM = `${m === 11 ? y + 1 : y}-${String(m === 11 ? 1 : m + 2).padStart(2, '0')}-01`;
    const days = new Date(y, m + 1, 0).getDate();
    const units = Math.max(1, (data.properties || []).length);
    let nights = 0;
    for (const b of data.bookings || []) {
      if (!isActiveBooking(b)) continue;
      const s = b.check_in_date > first ? b.check_in_date : first;
      const e = checkOutOf(b) < nextM ? checkOutOf(b) : nextM;
      if (e > s) nights += nightsBetween(s, e);
    }
    const cur = months[months.length - 1] || { value: 0, expected: 0 };
    return {
      months, received: cur.value || 0, expected: (cur.value || 0) + (cur.expected || 0),
      occupancy: Math.min(100, Math.round((nights / (units * days)) * 100)), month: MONTHS[m],
    };
  }, [data.bookings, data.properties, data.paymentsByBooking]);

  const pending = board.balances;
  const next = messages[0]
    ? { kind: 'message', ...messages[0] }
    : openCleanings[0] ? { kind: 'cleaning', c: openCleanings[0] }
      : pending[0] ? { kind: 'balance', ...pending[0] } : null;

  /** The day as a time-ordered list of rows (arrivals, departures, cleanings). */
  const rowsFor = (b, d) => {
    const out = [];
    for (const { booking, unit, balance } of b.departures) {
      const st = String(booking.status || '').toUpperCase();
      out.push({ key: `out-${booking.id}`, kind: 'out', booking, unit, balance, time: checkOutTime(booking, prop(booking.property_id)), done: st === 'CHECKED_OUT', status: st === 'CHECKED_OUT' ? 'יצאו' : 'יציאה' });
    }
    for (const c of b.cleanings) {
      out.push({ key: `cl-${c.key}`, kind: 'clean', c, unit: c.unit, booking: c.departure, time: checkOutTime(c.departure, prop(c.departure.property_id)), done: c.done, status: c.done ? 'נוקתה' : 'ניקיון', after: true });
    }
    for (const { booking, unit, balance } of b.arrivals) {
      const st = String(booking.status || '').toUpperCase();
      out.push({ key: `in-${booking.id}`, kind: 'in', booking, unit, balance, time: checkInTime(booking, prop(booking.property_id)), done: st === 'CHECKED_IN', status: st === 'CHECKED_IN' ? 'נכנסו' : 'הגעה' });
    }
    return out.sort((a, z) => a.time.localeCompare(z.time) || Number(!!a.after) - Number(!!z.after));
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

  const activeCount = (data.bookings || []).filter(isActiveBooking).length;
  return {
    day, tomorrow, data, board, boardT, prop, paysOf, sentOf, messages, openCleanings, leads, pending,
    pendingTotal: board.openBalanceTotal, money: money_, next, rowsFor, markCleaned,
    markSent: (bid, key) => setSentNow((s) => new Set(s).add(`${bid}:${key}`)),
    balanceFor: (b) => balanceOf(b, paysOf(b), day),
    isEmpty: !data.isLoading && activeCount === 0,
    isLoading: data.isLoading,
  };
}

export function ownerFirst(user) { return firstName(user?.full_name || '') || ''; }
