import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { phoneMatches, phoneSearchCore, phoneIlikePattern, phoneDigits } from '@/lib/phone';
import { formatRangeHe } from '@/lib/stay/format';

export type SearchHit = {
  id: string;
  title: string;
  subtitle: string;
  /** נכס לסינון בלוח שנה */
  propertyId?: string | null;
  /** extra strings for cmdk's own filter (phone digits in every stored form) */
  keywords?: string[];
};

/** "+972-52-123 4567" → ["972521234567", "521234567", "0521234567"] so cmdk keeps the hit for any typed form. */
function phoneKeywords(raw?: string | null): string[] {
  const d = phoneDigits(raw);
  if (!d) return [];
  const core = d.startsWith('972') ? d.slice(3) : d.startsWith('0') ? d.slice(1) : d;
  return [...new Set([d, core, `0${core}`, `972${core}`])];
}

const LIMIT = 5;

function sanitizeIlike(q: string): string {
  return q.replace(/%/g, '').replace(/"/g, '').replace(/,/g, '').slice(0, 48);
}

type BookingRow = {
  id: string;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
};
type LeadRow = { id: string; full_name?: string | null; email?: string | null; phone?: string | null };

const BOOKING_COLS = 'id,guest_name,guest_email,guest_phone,check_in_date,check_out_date';
const LEAD_COLS = 'id,full_name,email,phone';

/** LTR isolate so a phone number or email keeps its order inside Hebrew text. */
const ltr = (v: string) => `\u2066${v}\u2069`;

function bookingMatches(r: BookingRow, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    (r.guest_name || '').toLowerCase().includes(needle) ||
    (r.guest_email || '').toLowerCase().includes(needle) ||
    phoneMatches(r.guest_phone, q)
  );
}

function leadMatches(r: LeadRow, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    (r.full_name || '').toLowerCase().includes(needle) ||
    (r.email || '').toLowerCase().includes(needle) ||
    phoneMatches(r.phone, q)
  );
}

async function searchBookingsFallback(orgId: string, q: string): Promise<SearchHit[]> {
  const rows = await base44.entities.Booking.filter({ org_id: orgId }, '-created_at', 300, { select: BOOKING_COLS });
  return mapBookingRows((rows as BookingRow[]).filter((r) => bookingMatches(r, q)), q);
}

async function searchGuestsFallback(orgId: string, q: string): Promise<SearchHit[]> {
  const rows = await base44.entities.Lead.filter({ org_id: orgId }, '-created_at', 300, { select: LEAD_COLS });
  return mapLeadRows((rows as LeadRow[]).filter((r) => leadMatches(r, q)), q);
}

async function searchUnitsFallback(orgId: string, q: string): Promise<SearchHit[]> {
  const rows = await base44.entities.Property.filter({ org_id: orgId }, 'name', 80, {
    select: 'id,name',
  });
  const units = await base44.entities.Unit.filter({ org_id: orgId }, 'name', 120, {
    select: 'id,name,property_id',
  });
  const props = rows as { id: string; name?: string | null }[];
  const propMap = new Map(props.map((p) => [p.id, p.name || '']));
  const needle = q.toLowerCase();
  return (units as { id: string; name?: string | null; property_id?: string | null }[])
    .filter((u) => {
      const un = (u.name || '').toLowerCase().includes(needle);
      const pn = (propMap.get(u.property_id || '') || '').toLowerCase().includes(needle);
      return un || pn;
    })
    .slice(0, LIMIT)
    .map((u) => ({
      id: u.id,
      title: u.name || 'יחידה',
      subtitle: propMap.get(u.property_id || '') || 'מתחם',
      propertyId: u.property_id ?? null,
    }));
}

/** APP-026: show what a host recognises (dates, phone), never an internal id. */
function mapBookingRows(rows: BookingRow[] | null, q = ''): SearchHit[] {
  return (rows ?? []).slice(0, LIMIT).map((r) => {
    const dates = r.check_in_date ? formatRangeHe(r.check_in_date, r.check_out_date) : '';
    const contact = r.guest_phone ? ltr(r.guest_phone) : r.guest_email ? ltr(r.guest_email) : '';
    return {
      id: r.id,
      title: r.guest_name || 'הזמנה',
      subtitle: [dates, contact].filter(Boolean).join(' · ') || 'הזמנה',
      // a phone match keeps the typed query itself, so cmdk's own fuzzy filter never hides it
      keywords: [r.guest_email || '', ...phoneKeywords(r.guest_phone), phoneMatches(r.guest_phone, q) ? q : ''].filter(Boolean),
    };
  });
}

function mapLeadRows(rows: LeadRow[] | null, q = ''): SearchHit[] {
  return (rows ?? []).slice(0, LIMIT).map((r) => ({
    id: r.id,
    title: r.full_name || 'אורח',
    subtitle: [r.phone, r.email].filter(Boolean).map((v) => ltr(String(v))).join(' · ') || 'פנייה',
    keywords: [r.email || '', ...phoneKeywords(r.phone), phoneMatches(r.phone, q) ? q : ''].filter(Boolean),
  }));
}

function mapUnitRows(
  rows: { id: string; name?: string | null; property_id?: string | null }[] | null,
  propNames: Map<string, string>,
): SearchHit[] {
  return (rows ?? []).slice(0, LIMIT).map((r) => ({
    id: r.id,
    title: r.name || 'יחידה',
    subtitle: propNames.get(r.property_id || '') || 'מתחם',
    propertyId: r.property_id ?? null,
  }));
}

async function searchViaSupabase(orgId: string, q: string): Promise<{
  bookings: SearchHit[];
  guests: SearchHit[];
  units: SearchHit[];
}> {
  const safe = sanitizeIlike(q);
  const p = `%${safe}%`;
  // APP-007: phones are stored as typed ("052-123 4567", "+972521234567"); match the digits in order,
  // ignoring separators and the 0 / 972 prefix, then confirm on the client.
  const core = phoneSearchCore(q);
  const pp = phoneIlikePattern(core);
  const none = Promise.resolve({ data: [] as never[] });

  const [bName, bEmail, bPhone, lName, lEmail, lPhone, uName] = await Promise.all([
    supabase.from('bookings').select(BOOKING_COLS).eq('org_id', orgId).ilike('guest_name', p).limit(LIMIT),
    supabase.from('bookings').select(BOOKING_COLS).eq('org_id', orgId).ilike('guest_email', p).limit(LIMIT),
    pp ? supabase.from('bookings').select(BOOKING_COLS).eq('org_id', orgId).ilike('guest_phone', pp).limit(25) : none,
    supabase.from('leads').select(LEAD_COLS).eq('org_id', orgId).ilike('full_name', p).limit(LIMIT),
    supabase.from('leads').select(LEAD_COLS).eq('org_id', orgId).ilike('email', p).limit(LIMIT),
    pp ? supabase.from('leads').select(LEAD_COLS).eq('org_id', orgId).ilike('phone', pp).limit(25) : none,
    supabase.from('units').select('id,name,property_id').eq('org_id', orgId).ilike('name', p).limit(LIMIT),
  ]);

  const bookingMap = new Map<string, BookingRow>();
  const phoneBookings = ((bPhone.data ?? []) as BookingRow[]).filter((r) => phoneMatches(r.guest_phone, q));
  for (const r of [...phoneBookings, ...((bName.data ?? []) as BookingRow[]), ...((bEmail.data ?? []) as BookingRow[])]) bookingMap.set(r.id, r);
  const bookings = mapBookingRows([...bookingMap.values()], q);

  const leadMap = new Map<string, LeadRow>();
  const phoneLeads = ((lPhone.data ?? []) as LeadRow[]).filter((r) => phoneMatches(r.phone, q));
  for (const r of [...phoneLeads, ...((lName.data ?? []) as LeadRow[]), ...((lEmail.data ?? []) as LeadRow[])]) leadMap.set(r.id, r);
  const guests = mapLeadRows([...leadMap.values()], q);

  const unitRows = uName.data ?? [];
  const propIds = [...new Set(unitRows.map((u) => u.property_id).filter(Boolean))] as string[];
  let propNames = new Map<string, string>();
  if (propIds.length) {
    const { data: props } = await supabase.from('properties').select('id,name').in('id', propIds);
    propNames = new Map((props ?? []).map((x: { id: string; name?: string | null }) => [x.id, x.name || '']));
  }
  const units = mapUnitRows(unitRows, propNames);

  return { bookings, guests, units };
}

/**
 * Live search: parallel Supabase ilike queries when configured; otherwise capped entity fetch + client filter.
 */
export async function searchCommandPaletteEntities(
  orgId: string | null,
  rawQuery: string,
): Promise<{ bookings: SearchHit[]; guests: SearchHit[]; units: SearchHit[] }> {
  const q = rawQuery.trim();
  const empty = { bookings: [] as SearchHit[], guests: [] as SearchHit[], units: [] as SearchHit[] };
  if (!orgId || q.length < 2) return empty;

  if (isSupabaseConfigured && supabase) {
    try {
      return await searchViaSupabase(orgId, q);
    } catch {
      /* fall through */
    }
  }

  const [bookings, guests, units] = await Promise.all([
    searchBookingsFallback(orgId, q),
    searchGuestsFallback(orgId, q),
    searchUnitsFallback(orgId, q),
  ]);
  return { bookings, guests, units };
}
