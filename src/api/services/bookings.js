/**
 * /api/bookings — Booking service
 *
 * All methods automatically scope queries to the authenticated user's
 * organisation via the Supabase RLS policy `bookings: own org data`.
 */

import { base44 } from '@/api/base44Client';

const entity = () => base44.entities.Booking;

/**
 * Fetch all bookings.
 * @param {object} [filters]  Optional key/value filters (e.g. { property_id, status })
 */
export async function fetchBookings(filters = {}) {
  return entity().list(filters);
}

/**
 * Fetch bookings with sorting and an optional limit.
 * @param {object} [filters]
 * @param {string} [sort='-created_at']  Column name; prefix with '-' for descending.
 * @param {number} [limit]
 */
export async function filterBookings(filters = {}, sort = '-created_at', limit = null) {
  return entity().filter(filters, sort, limit);
}

/**
 * Fetch a single booking by id.
 */
export async function getBooking(id) {
  return entity().get(id);
}

/**
 * Create a new booking.
 * @param {object} data
 */
export async function createBooking(data) {
  return entity().create(data);
}

/**
 * Update an existing booking.
 * @param {string} id
 * @param {object} data  Partial update — only provided fields are changed.
 */
export async function updateBooking(id, data) {
  return entity().update(id, data);
}

/**
 * Delete a booking.
 * @param {string} id
 */
export async function deleteBooking(id) {
  return entity().delete(id);
}
