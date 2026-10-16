/**
 * Data access for the public (no-login) guest page and direct-booking page.
 *
 * Supabase: SECURITY DEFINER RPCs from migration 008 expose only the fields a guest
 * may see (never the whole bookings table to anon).
 * Local demo / REST: reads through the regular entity client.
 */
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { guestInfoOf } from './guestInfo';
import { balanceOf, isActiveBooking, checkOutOf } from './bookings';
import { todayISO, addDays, nightsBetween } from './format';
import { DB_FEATURES } from '@/config/dbFeatures';

export class PublicNotFoundError extends Error {
  constructor(msg = 'not_found') { super(msg); this.code = 'not_found'; }
}

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}

async function orgForLocal(orgId) {
  try {
    const raw = localStorage.getItem('atlas_current_user');
    const u = raw ? JSON.parse(raw) : null;
    if (u && (!orgId || u.organization_id === orgId)) {
      return { name: u.organization_name || '', phone: u.phone || '' };
    }
  } catch { /* ignore */ }
  return { name: '', phone: '' };
}

/** Shape: { booking:{guest_name,check_in_date,check_out_date,nights,adults,children,status}, property:{name,address,guest_info}, host:{name,phone}, money:{total,paid,balance,dueDate} } */
export async function fetchGuestStay(token) {
  if (!token || !DB_FEATURES.guestPages) throw new PublicNotFoundError();
  if (isSupabaseConfigured) {
    const data = await rpc('get_guest_stay', { p_token: token });
    if (!data) throw new PublicNotFoundError();
    return { ...data, property: { ...data.property, guest_info: guestInfoOf(data.property) } };
  }
  const bookings = await base44.entities.Booking.filter({}, '-created_date', 2000);
  const b = bookings.find((x) => x.guest_token === token) || bookings.find((x) => x.id === token);
  if (!b || ['CANCELLED', 'CANCELED'].includes(b.status)) throw new PublicNotFoundError();
  let property = {};
  if (b.property_id) {
    try { property = await base44.entities.Property.get(b.property_id); } catch { property = { name: b.property_name }; }
  }
  const payments = await base44.entities.Payment.filter({ booking_id: b.id }, '-created_date', 100).catch(() => []);
  const money = balanceOf(b, payments);
  const org = await orgForLocal(b.org_id);
  const info = guestInfoOf(property);
  return {
    booking: {
      guest_name: b.guest_name, check_in_date: b.check_in_date, check_out_date: checkOutOf(b),
      nights: b.nights || nightsBetween(b.check_in_date, checkOutOf(b)), adults: b.adults, children: b.children, status: b.status,
    },
    property: { name: property.name || b.property_name || '', address: property.address || '', guest_info: info, images: property.images || [] },
    host: { name: info.host_name || org.name, phone: info.host_phone || org.phone },
    money: { total: money.total, paid: money.paid, balance: money.balance, dueDate: money.dueDate },
  };
}

/** Shape: { property:{id,name,address,description,max_guests,bedrooms,base_price,images,check_in_time,check_out_time}, host:{name}, busy:[{from,to}] } */
export async function fetchPublicProperty(slug) {
  if (!slug || !DB_FEATURES.directBooking) throw new PublicNotFoundError();
  if (isSupabaseConfigured) {
    const data = await rpc('get_public_property', { p_slug: slug });
    if (!data) throw new PublicNotFoundError();
    return data;
  }
  const props = await base44.entities.Property.list({}, { limit: 500 });
  const p = props.find((x) => x.public_slug === slug) || props.find((x) => x.id === slug);
  if (!p || p.booking_page_enabled === false) throw new PublicNotFoundError();
  const today = todayISO();
  const horizon = addDays(today, 365);
  const bookings = (await base44.entities.Booking.filter({ property_id: p.id }, 'check_in_date', 2000))
    .filter(isActiveBooking)
    .map((b) => ({ from: b.check_in_date, to: checkOutOf(b) }))
    .filter((r) => r.to > today && r.from < horizon);
  const info = guestInfoOf(p);
  const org = await orgForLocal(p.org_id);
  return {
    property: {
      id: p.id, name: p.name, address: p.address || '', description: p.description || '',
      max_guests: p.max_guests || null, bedrooms: p.bedrooms || null, base_price: p.base_price || null,
      images: Array.isArray(p.images) ? p.images : [], check_in_time: info.check_in_time, check_out_time: info.check_out_time,
      org_id: p.org_id,
    },
    host: { name: info.host_name || org.name },
    busy: bookings,
  };
}

/** Creates a Lead from the public inquiry form. Returns { ok: true }. */
export async function submitDirectInquiry(slug, form) {
  const payload = {
    full_name: String(form.full_name || '').trim().slice(0, 120),
    phone: String(form.phone || '').trim().slice(0, 30),
    email: String(form.email || '').trim().slice(0, 160),
    check_in_date: form.check_in_date || null,
    check_out_date: form.check_out_date || null,
    adults: Math.max(1, Math.min(30, Number(form.adults) || 2)),
    children: Math.max(0, Math.min(30, Number(form.children) || 0)),
    notes: String(form.notes || '').trim().slice(0, 1000),
  };
  if (!payload.full_name || !payload.phone) throw new Error('missing_fields');
  if (!DB_FEATURES.directBooking) throw new PublicNotFoundError();
  if (isSupabaseConfigured) {
    await rpc('submit_direct_inquiry', {
      p_slug: slug, p_full_name: payload.full_name, p_phone: payload.phone, p_email: payload.email || null,
      p_check_in: payload.check_in_date, p_check_out: payload.check_out_date,
      p_adults: payload.adults, p_children: payload.children, p_notes: payload.notes || null,
    });
    return { ok: true };
  }
  const { property } = await fetchPublicProperty(slug);
  await base44.entities.Lead.create({
    ...payload,
    org_id: property.org_id,
    property_id: property.id,
    nights: nightsBetween(payload.check_in_date, payload.check_out_date) || null,
    source: 'website',
    status: 'NEW',
    notes: [`פנייה מדף ההזמנה הישירה (${property.name})`, payload.notes].filter(Boolean).join('\n'),
    created_at: new Date().toISOString(),
  });
  return { ok: true };
}

