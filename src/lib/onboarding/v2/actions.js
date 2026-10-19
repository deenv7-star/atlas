/**
 * Onboarding v2 writes. No new columns: everything lands in tables / JSON that already exist.
 *
 *   place name                 → organizations.name (same path as v1 saveBusiness)
 *   kind                       → properties.type on each new unit, orgSettings.complex_type
 *   units                      → properties rows (name, max_guests = top of the range, base_price only if given)
 *   guests range / price mode  → orgSettings.unit_profiles[propertyId] (+ guests_default / price_mode for new units)
 *   check-in / out, "varies"   → orgSettings.check_in_time / check_out_time / times_vary
 *   channels                   → orgSettings.channels_today
 *   trial or plan              → orgSettings.plan_choice; the 14-day trial always starts (finishOnboarding → start_my_trial)
 *   setup journey              → orgSettings.setup { started_at, done: {}, skipped: {} }
 *   Booking / Airbnb links     → calendar_syncs rows (IMPORT), like Integrations
 *   WhatsApp number            → orgSettings.host_phone (what the guest templates already read)
 *
 * orgSettings is organizations.settings (migration 010, live) with the per-device copy as fallback.
 */
import { base44 } from '@/api/base44Client';
import { isSupabaseConfigured } from '@/api/supabaseClient';
import { readOrgSettings, writeOrgSettings, setActiveOrg } from '@/lib/onboarding/orgSettings';
import { finishOnboarding } from '@/lib/onboarding/store';
import { DB_FEATURES } from '@/config/dbFeatures';
import { callEdge } from '@/lib/real/edge';
import { unitRow, unitProfile, clampInt, UNITS_LIMIT, defaultAnswers } from './model';

const DRAFT = (uid) => `atlas.onboarding.v2.${uid || 'local'}`;

export function loadAnswers(uid) {
  try {
    const raw = localStorage.getItem(DRAFT(uid));
    const d = raw ? JSON.parse(raw) : null;
    return d && d.v === 2 ? { ...defaultAnswers(), ...d } : null;
  } catch { return null; }
}
export function saveAnswers(uid, a) {
  try { localStorage.setItem(DRAFT(uid), JSON.stringify(a)); } catch { /* private mode */ }
}
export function clearAnswers(uid) {
  try { localStorage.removeItem(DRAFT(uid)); } catch { /* ignore */ }
}

async function listProperties() {
  try { const r = await base44.entities.Property.list({}, { limit: 200 }); return Array.isArray(r) ? r : []; } catch { return []; }
}
async function listSyncs() {
  try { const r = await base44.entities.CalendarSync.list({}, { limit: 200 }); return Array.isArray(r) ? r : []; } catch { return []; }
}

/** 1. the business profile (organization name + kind). */
export async function commitProfile(user, a) {
  const orgId = user?.organization_id;
  setActiveOrg(orgId);
  const name = (a.name.trim() || 'העסק שלי').slice(0, 50);
  if (orgId) {
    try {
      await base44.entities.Organization.update(orgId, { name });
    } catch (e) {
      if (isSupabaseConfigured) throw e;
      await base44.entities.Organization.create({ id: orgId, name }); // local demo: the first save creates the org
    }
  }
  if (!isSupabaseConfigured) await base44.auth.updateMe({ organization_name: name });
  await writeOrgSettings(orgId, { complex_type: a.kind || '', channels_today: a.channels || [] });
}

/** 2. the booking calendar: one properties row per unit. Never deletes; a re-run only adds what's missing. */
export async function commitUnits(user, a) {
  const orgId = user?.organization_id;
  const existing = await listProperties();
  const want = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const profiles = { ...(readOrgSettings(orgId).unit_profiles || {}) };
  const profile = unitProfile(a);
  const ids = [];
  for (let i = existing.length; i < want; i += 1) {
    const res = await base44.entities.Property.create({ ...unitRow(a, i), bedrooms: 1 });
    if (res?.id) { ids.push(res.id); profiles[res.id] = profile; }
  }
  await writeOrgSettings(orgId, {
    unit_profiles: profiles,
    guests_default: { min: profile.guests_min, max: profile.guests_max, vary: profile.guests_vary },
    price_mode: a.priceMode,
  });
  return { created: ids.length, total: existing.length + ids.length };
}

/** 3. guest messages: the times every template already reads. */
export async function commitTimes(user, a) {
  await writeOrgSettings(user?.organization_id, {
    check_in_time: a.checkIn,
    check_out_time: a.checkOut,
    times_vary: !!a.timesVary,
  });
}

/** 4. the plan choice + the setup journey, then the account is marked set up (trial, tour). */
export async function commitStart(user, a) {
  const orgId = user?.organization_id;
  const cur = readOrgSettings(orgId);
  await writeOrgSettings(orgId, {
    plan_choice: a.plan && a.plan !== 'trial' ? { kind: 'plan', key: a.plan, at: new Date().toISOString() } : { kind: 'trial', at: new Date().toISOString() },
    setup: {
      started_at: cur.setup?.started_at || new Date().toISOString(),
      done: { ...(cur.setup?.done || {}), units: true },
      skipped: { ...(cur.setup?.skipped || {}) },
    },
  });
  await finishOnboarding(user);
  clearAnswers(user?.id);
}

/* ───────────────────────── setup journey ───────────────────────── */

export async function loadSetupFacts(user) {
  const orgId = user?.organization_id;
  setActiveOrg(orgId);
  const [props, syncs] = await Promise.all([listProperties(), listSyncs()]);
  const s = readOrgSettings(orgId);
  return {
    orgId,
    properties: props,
    units: props.length,
    syncs: syncs.map((x) => ({ id: x.id, provider: x.provider, property_id: x.property_id, ical_url: x.ical_url })),
    hostPhone: s.host_phone || '',
    hostName: s.host_name || '',
    planChoice: s.plan_choice || null,
    channels: Array.isArray(s.channels_today) ? s.channels_today : [],
    setup: s.setup || null,
    unitProfiles: s.unit_profiles || {},
    checkIn: s.check_in_time || '15:00',
    checkOut: s.check_out_time || '11:00',
    timesVary: !!s.times_vary,
    kind: s.complex_type || '',
  };
}

export async function markSetup(orgId, id, how /* 'done' | 'skipped' | 'todo' */) {
  const cur = readOrgSettings(orgId).setup || {};
  const done = { ...(cur.done || {}) };
  const skipped = { ...(cur.skipped || {}) };
  delete done[id]; delete skipped[id];
  if (how === 'done') done[id] = true;
  if (how === 'skipped') skipped[id] = true;
  return writeOrgSettings(orgId, { setup: { started_at: cur.started_at || new Date().toISOString(), done, skipped } });
}

/** One calendar_syncs row (IMPORT) for one unit; an identical link is not saved twice. */
export async function saveCalendarLink(provider, propertyId, url, existing = []) {
  const link = String(url || '').trim();
  if (existing.some((s) => s.provider === provider && s.property_id === propertyId && s.ical_url === link)) return null;
  const created = await base44.entities.CalendarSync.create({
    provider, property_id: propertyId, ical_url: link, is_active: true, sync_status: 'ACTIVE', sync_direction: 'IMPORT',
  });
  // same as Integrations: pull the bookings right away (server real core); the 15-minute job takes over after
  if (DB_FEATURES.realCore && created?.id) {
    try { await callEdge('ical-sync', { sync_id: created.id }); } catch { /* the scheduled sync will retry */ }
  }
  return created;
}

export async function saveWhatsApp(orgId, phone, hostName) {
  const patch = { host_phone: String(phone || '').trim().slice(0, 20) };
  if (hostName != null) patch.host_name = String(hostName).trim().slice(0, 60);
  await writeOrgSettings(orgId, patch);
  return markSetup(orgId, 'whatsapp', 'done');
}

/** Units step: update a unit, or add one. Range / price mode go to unit_profiles. */
export async function saveUnit(orgId, unit) {
  const row = {
    name: (String(unit.name || '').trim() || 'יחידה').slice(0, 100),
    max_guests: unit.guestsVary ? Math.max(2, Number(unit.guestsMax) || 2) : Math.max(1, Number(unit.guestsMax) || 2),
    base_price: unit.priceMode === 'fixed' && Number(unit.price) > 0 ? Number(unit.price)
      : unit.priceMode === 'varies' && Number(unit.priceFrom) > 0 ? Number(unit.priceFrom) : null,
  };
  let id = unit.id;
  if (id) await base44.entities.Property.update(id, row);
  else {
    const res = await base44.entities.Property.create({ ...row, bedrooms: 1, type: unit.type || null });
    id = res?.id;
  }
  if (id) {
    const profiles = { ...(readOrgSettings(orgId).unit_profiles || {}) };
    profiles[id] = {
      guests_min: unit.guestsVary ? null : Math.max(1, Number(unit.guestsMin) || 1),
      guests_max: unit.guestsVary ? null : row.max_guests,
      guests_vary: !!unit.guestsVary,
      price_mode: unit.priceMode,
      price_from: unit.priceMode === 'varies' && Number(unit.priceFrom) > 0 ? Number(unit.priceFrom) : null,
    };
    await writeOrgSettings(orgId, { unit_profiles: profiles });
  }
  return id;
}

/** A unit as the setup editor sees it (properties row + its profile). */
export function unitView(p, profiles = {}) {
  const pr = profiles[p.id] || {};
  const mode = pr.price_mode || (Number(p.base_price) > 0 ? 'fixed' : 'later');
  return {
    id: p.id,
    name: p.name || '',
    type: p.type || '',
    guestsMin: pr.guests_min ?? Math.min(2, Number(p.max_guests) || 2),
    guestsMax: pr.guests_max ?? (Number(p.max_guests) || 2),
    guestsVary: !!pr.guests_vary,
    priceMode: mode,
    price: mode === 'fixed' ? Number(p.base_price) || '' : '',
    priceFrom: mode === 'varies' ? pr.price_from || '' : '',
  };
}

/**
 * Version B: calendar links pasted during onboarding (a.links = [{ provider, url, ok }], in unit order).
 * Link i goes to unit i. Runs after commitUnits, so the units exist. Same writes as the setup journey.
 */
export async function commitLinks(user, a) {
  const links = (Array.isArray(a.links) ? a.links : []).filter((l) => l && l.ok && String(l.url || '').trim());
  if (!links.length) return { saved: 0 };
  const ts = (p) => Date.parse(p.created_date || p.created_at || '') || 0;
  const props = (await listProperties()).slice().sort((x, y) => ts(x) - ts(y)); // unit 1 first
  const existing = await listSyncs();
  let saved = 0;
  for (let i = 0; i < links.length && i < props.length; i += 1) {
    const r = await saveCalendarLink(links[i].provider, props[i].id, links[i].url, existing);
    if (r) saved += 1;
  }
  const orgId = user?.organization_id;
  const cur = readOrgSettings(orgId).setup || {};
  const done = { ...(cur.done || {}) };
  if (links.some((l) => l.provider === 'BOOKING_COM')) done.booking = true;
  if (links.some((l) => l.provider === 'AIRBNB')) done.airbnb = true;
  await writeOrgSettings(orgId, { setup: { started_at: cur.started_at || new Date().toISOString(), done, skipped: { ...(cur.skipped || {}) } } });
  return { saved };
}
