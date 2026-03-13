/**
 * /api/payments — Payment service
 */

import { base44 } from '@/api/base44Client';

const entity = () => base44.entities.Payment;

export async function fetchPayments(filters = {}) {
  return entity().list(filters);
}

export async function filterPayments(filters = {}, sort = '-created_at', limit = null) {
  return entity().filter(filters, sort, limit);
}

export async function getPayment(id) {
  return entity().get(id);
}

export async function createPayment(data) {
  return entity().create(data);
}

export async function updatePayment(id, data) {
  return entity().update(id, data);
}

export async function deletePayment(id) {
  return entity().delete(id);
}

/**
 * Convenience: fetch payments for a specific booking.
 */
export async function getPaymentsForBooking(bookingId) {
  return entity().list({ booking_id: bookingId });
}
