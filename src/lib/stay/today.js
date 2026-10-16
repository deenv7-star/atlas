/** Builds the "היום" board for one calendar day from raw entities. Pure, testable. */
import { addDays } from './format';
import { isActiveBooking, checkOutOf, unitKeyOf, balanceOf } from './bookings';
import { dueTemplateFor } from './whatsapp';

export function buildDayBoard({ day, bookings, paymentsByBooking, sentByBooking, cleaningTasks, propertyById }) {
  const active = (bookings || []).filter(isActiveBooking);
  const bal = (b) => balanceOf(b, paymentsByBooking.get(b.id) || [], day);
  const unitName = (b) => propertyById.get(b.property_id)?.name || b.property_name || 'יחידה';

  const arrivals = active
    .filter((b) => b.check_in_date === day)
    .map((b) => ({ booking: b, balance: bal(b), unit: unitName(b) }));

  const departures = active
    .filter((b) => checkOutOf(b) === day)
    .map((b) => ({ booking: b, balance: bal(b), unit: unitName(b) }));

  const inHouse = active.filter((b) => b.check_in_date < day && checkOutOf(b) > day);

  const cleanings = departures.map(({ booking, unit }) => {
    const key = unitKeyOf(booking);
    const next = active
      .filter((b) => b.id !== booking.id && unitKeyOf(b) === key && b.check_in_date >= day)
      .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date))[0] || null;
    const task = (cleaningTasks || []).find((t) => t.booking_id === booking.id)
      || (cleaningTasks || []).find((t) => t.property_id === booking.property_id && String(t.scheduled_date || t.scheduled_for || '').slice(0, 10) === day);
    return {
      key: booking.id,
      unit,
      departure: booking,
      nextArrival: next,
      sameDayTurnover: !!next && next.check_in_date === day,
      task,
      done: task?.status === 'DONE',
    };
  }).sort((a, b) => Number(a.done) - Number(b.done) || Number(b.sameDayTurnover) - Number(a.sameDayTurnover));

  const horizon = addDays(day, 3);
  const balances = active
    .map((b) => ({ booking: b, balance: bal(b), unit: unitName(b) }))
    .filter(({ booking, balance }) => balance.balance > 0
      && (balance.overdue || (booking.check_in_date >= day && booking.check_in_date <= horizon) || (booking.check_in_date <= day && checkOutOf(booking) >= day)))
    .sort((a, b) => Number(b.balance.overdue) - Number(a.balance.overdue) || a.booking.check_in_date.localeCompare(b.booking.check_in_date));

  const messages = active
    .map((b) => ({ booking: b, template: dueTemplateFor(b, sentByBooking.get(b.id) || new Set(), day), balance: bal(b), unit: unitName(b) }))
    .filter((x) => x.template)
    .sort((a, b) => ORDER[a.template] - ORDER[b.template]);

  const openBalanceTotal = balances.reduce((s, x) => s + x.balance.balance, 0);

  return { arrivals, departures, inHouse, cleanings, balances, messages, openBalanceTotal };
}

const ORDER = { welcome: 0, arrival_eve: 1, thanks_review: 2, confirmation: 3, balance_reminder: 4 };
