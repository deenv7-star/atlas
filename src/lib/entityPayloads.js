/**
 * Map form values to the real Supabase column set before create/update.
 * Forms carry UI-only fields (guest_count, booking_source, payment_status, …)
 * that don't exist as columns; PostgREST rejects unknown columns with PGRST204.
 */
import { differenceInCalendarDays, parseISO } from 'date-fns';

const toNumberOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const toIntOrNull = (v) => {
  const n = toNumberOrNull(v);
  return n == null ? null : Math.trunc(n);
};
const emptyToNull = (v) => (v === '' || v === undefined ? null : v);

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  try {
    const n = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
    return n > 0 ? n : null;
  } catch {
    return null;
  }
}

/** Booking form values → `bookings` columns. */
export function bookingFormToPayload(data) {
  const nights = nightsBetween(data.check_in_date, data.check_out_date) ?? toIntOrNull(data.nights);
  return {
    guest_name: (data.guest_name || '').trim(),
    guest_email: emptyToNull((data.guest_email || '').trim()),
    guest_phone: emptyToNull((data.guest_phone || '').trim()),
    property_id: emptyToNull(data.property_id),
    check_in_date: emptyToNull(data.check_in_date),
    check_out_date: emptyToNull(data.check_out_date),
    nights,
    adults: toIntOrNull(data.adults) ?? 2,
    children: toIntOrNull(data.children) ?? 0,
    total_price: toNumberOrNull(data.total_price),
    status: data.status || 'PENDING',
    notes: data.notes ?? '',
    source: emptyToNull(data.booking_source ?? data.source),
  };
}

/** Guest/lead form values → `leads` columns. */
export function leadFormToPayload(data) {
  return {
    full_name: (data.full_name || '').trim(),
    email: emptyToNull((data.email || '').trim()),
    phone: emptyToNull((data.phone || '').trim()),
    property_id: emptyToNull(data.property_id),
    check_in_date: emptyToNull(data.check_in_date),
    check_out_date: emptyToNull(data.check_out_date),
    nights: nightsBetween(data.check_in_date, data.check_out_date),
    adults: toIntOrNull(data.adults) ?? 2,
    children: toIntOrNull(data.children) ?? 0,
    status: data.status || 'NEW',
    source: emptyToNull(data.source),
    notes: data.notes ?? '',
    budget: toNumberOrNull(data.budget),
  };
}

/** Payment form values → `payments` columns. */
export function paymentFormToPayload(data) {
  const out = {
    booking_id: emptyToNull(data.booking_id),
    amount: toNumberOrNull(data.amount) ?? 0,
    currency: data.currency || 'ILS',
    status: data.status || 'PENDING',
    method: emptyToNull(data.method),
    description: data.description ?? '',
    due_date: emptyToNull(data.due_date),
    paid_date: emptyToNull(data.paid_date),
  };
  if (data.type !== undefined) out.type = emptyToNull(data.type);
  return out;
}

/**
 * Integration setup dialog output → integration table columns.
 * Provider-specific toggles (auto_sync, sync_bookings, sync_guests, …) live in `config`.
 */
export function integrationToPayload(data) {
  const { provider, name, status, config, currency, ...extras } = data || {};
  const out = {
    provider,
    name: emptyToNull(name),
    status: status || 'INACTIVE',
    is_active: status === 'ACTIVE',
    config: { ...(config || {}), ...extras },
  };
  if (currency !== undefined) out.currency = currency || 'ILS';
  return out;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);
