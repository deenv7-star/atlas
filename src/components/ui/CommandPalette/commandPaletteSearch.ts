import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';

export type SearchHit = {
  id: string;
  title: string;
  subtitle: string;
  /** נכס לסינון בלוח שנה */
  propertyId?: string | null;
};

const LIMIT = 5;

function sanitizeIlike(q: string): string {
  return q.replace(/%/g, '').replace(/"/g, '').replace(/,/g, '').slice(0, 48);
}

async function searchBookingsFallback(orgId: string, q: string): Promise<SearchHit[]> {
  const rows = await base44.entities.Booking.filter({ org_id: orgId }, '-created_at', 120, {
    select: 'id,guest_name,guest_email',
  });
  const needle = q.toLowerCase();
  return (rows as { id: string; guest_name?: string | null; guest_email?: string | null }[])
    .filter((r) => {
      const idm = r.id.toLowerCase().includes(needle);
      const nm = (r.guest_name || '').toLowerCase().includes(needle);
      const em = (r.guest_email || '').toLowerCase().includes(needle);
      return idm || nm || em;
    })
    .slice(0, LIMIT)
    .map((r) => ({
      id: r.id,
      title: r.guest_name || 'הזמנה',
      subtitle: `${r.id.slice(0, 8)}… · ${r.guest_email || ''}`.trim(),
    }));
}

async function searchGuestsFallback(orgId: string, q: string): Promise<SearchHit[]> {
  const rows = await base44.entities.Lead.filter({ org_id: orgId }, '-created_at', 120, {
    select: 'id,full_name,email,phone',
  });
  const needle = q.toLowerCase();
  return (rows as { id: string; full_name?: string | null; email?: string | null; phone?: string | null }[])
    .filter((r) => {
      const nm = (r.full_name || '').toLowerCase().includes(needle);
      const em = (r.email || '').toLowerCase().includes(needle);
      const ph = (r.phone || '').includes(q);
      return nm || em || ph;
    })
    .slice(0, LIMIT)
    .map((r) => ({
      id: r.id,
      title: r.full_name || 'ליד',
      subtitle: [r.email, r.phone].filter(Boolean).join(' · ') || r.id.slice(0, 8),
    }));
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
      subtitle: propMap.get(u.property_id || '') || 'נכס',
      propertyId: u.property_id ?? null,
    }));
}

function mapBookingRows(
  rows: { id: string; guest_name?: string | null; guest_email?: string | null }[] | null,
): SearchHit[] {
  return (rows ?? []).slice(0, LIMIT).map((r) => ({
    id: r.id,
    title: r.guest_name || 'הזמנה',
    subtitle: `${String(r.id).slice(0, 8)}… · ${r.guest_email || ''}`.trim(),
  }));
}

function mapLeadRows(
  rows: { id: string; full_name?: string | null; email?: string | null; phone?: string | null }[] | null,
): SearchHit[] {
  return (rows ?? []).slice(0, LIMIT).map((r) => ({
    id: r.id,
    title: r.full_name || 'אורח',
    subtitle: [r.email, r.phone].filter(Boolean).join(' · ') || String(r.id).slice(0, 8),
  }));
}

function mapUnitRows(
  rows: { id: string; name?: string | null; property_id?: string | null }[] | null,
  propNames: Map<string, string>,
): SearchHit[] {
  return (rows ?? []).slice(0, LIMIT).map((r) => ({
    id: r.id,
    title: r.name || 'יחידה',
    subtitle: propNames.get(r.property_id || '') || 'נכס',
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

  const [bName, bEmail, lName, lEmail, lPhone, uName] = await Promise.all([
    supabase.from('bookings').select('id,guest_name,guest_email').eq('org_id', orgId).ilike('guest_name', p).limit(LIMIT),
    supabase.from('bookings').select('id,guest_name,guest_email').eq('org_id', orgId).ilike('guest_email', p).limit(LIMIT),
    supabase.from('leads').select('id,full_name,email,phone').eq('org_id', orgId).ilike('full_name', p).limit(LIMIT),
    supabase.from('leads').select('id,full_name,email,phone').eq('org_id', orgId).ilike('email', p).limit(LIMIT),
    supabase.from('leads').select('id,full_name,email,phone').eq('org_id', orgId).ilike('phone', p).limit(LIMIT),
    supabase.from('units').select('id,name,property_id').eq('org_id', orgId).ilike('name', p).limit(LIMIT),
  ]);

  const bookingMap = new Map<string, { id: string; guest_name?: string | null; guest_email?: string | null }>();
  for (const r of [...(bName.data ?? []), ...(bEmail.data ?? [])]) bookingMap.set(r.id, r);
  const bookings = mapBookingRows([...bookingMap.values()].slice(0, LIMIT));

  const leadMap = new Map<string, { id: string; full_name?: string | null; email?: string | null; phone?: string | null }>();
  for (const r of [...(lName.data ?? []), ...(lEmail.data ?? []), ...(lPhone.data ?? [])]) leadMap.set(r.id, r);
  const guests = mapLeadRows([...leadMap.values()].slice(0, LIMIT));

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
