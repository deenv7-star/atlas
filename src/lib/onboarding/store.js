/**
 * Onboarding v1: one draft, autosaved on this device after every change, and written to the real
 * tables as each chapter is finished. Shared by both onboarding designs.
 *
 * Where each answer goes (live schema level 7):
 *   owner name, phone, photo      → profiles.full_name / phone / profile_image (photo as a small jpeg data url;
 *                                    there is no storage bucket yet)
 *   business name, phone, address → organizations.name / phone / address
 *   property type                 → properties.type on every unit
 *   units                         → properties rows (name, max_guests, base_price, bedrooms, images[0] photo)
 *   Booking / Airbnb links        → calendar_syncs rows (provider BOOKING_COM | AIRBNB, sync_direction IMPORT)
 *   times, WhatsApp, deposit,
 *   cover photo                   → orgSettings (this device until migration 010)
 *   progress                      → profiles.onboarding_step, onboarding_completed (+ 14-day trial like before)
 */
import { base44 } from '@/api/base44Client';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { readOrgSettings, writeOrgSettings, setActiveOrg } from './orgSettings';

export const COMPLEX_TYPES = [
  { value: 'zimmer', label: 'צימרים', unit: 'צימר', photo: '/demo/units/unit-6.webp', line: 'ג׳קוזי, שקט, זוגות' },
  { value: 'villa', label: 'וילה', unit: 'וילה', photo: '/demo/units/unit-3.webp', line: 'בית שלם, משפחות וקבוצות' },
  { value: 'cabin', label: 'בקתות', unit: 'בקתה', photo: '/demo/units/unit-2.webp', line: 'עץ, טבע, כמה בקתות' },
  { value: 'guesthouse', label: 'בית הארחה', unit: 'חדר', photo: '/demo/units/unit-4.webp', line: 'חדרים בבניין אחד' },
];
export const OTHER_TYPE = { value: 'other', label: 'משהו אחר', unit: 'יחידה', photo: '', line: '' };

export function typeInfo(value) {
  return COMPLEX_TYPES.find((t) => t.value === value) || OTHER_TYPE;
}

export const DEFAULT_PRICE = 800;
export const DEFAULT_GUESTS = 2;

let seq = 0;
export function newUnit(type, index) {
  seq += 1;
  return {
    key: `u${Date.now().toString(36)}${seq}`,
    id: null,
    name: `${typeInfo(type).unit} ${index + 1}`,
    guests: DEFAULT_GUESTS,
    price: DEFAULT_PRICE,
    photo: '',
  };
}

export const EMPTY_DRAFT = {
  v: 1,
  screen: 0,
  ownerName: '',
  ownerPhone: '',
  ownerPhoto: '',
  businessName: '',
  businessPhone: '',
  type: '',
  coverPhoto: '',
  units: [],
  createdUnitIds: [],
  checkIn: '15:00',
  checkOut: '11:00',
  hostName: '',
  waGreeting: '',
  deposit: 'none',
  channels: { BOOKING_COM: { on: false, links: {} }, AIRBNB: { on: false, links: {} } },
  savedSyncs: [],
};

const draftKey = (uid) => `atlas.onboarding.v1.${uid || 'local'}`;

export function loadDraft(uid) {
  try {
    const raw = localStorage.getItem(draftKey(uid));
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && d.v === 1 ? { ...EMPTY_DRAFT, ...d, channels: { ...EMPTY_DRAFT.channels, ...(d.channels || {}) } } : null;
  } catch {
    return null;
  }
}

export function saveDraft(uid, draft) {
  try {
    localStorage.setItem(draftKey(uid), JSON.stringify(draft));
  } catch {
    // quota (photos): keep the answers, drop the photos from the local copy
    try {
      localStorage.setItem(draftKey(uid), JSON.stringify({
        ...draft, ownerPhoto: '', coverPhoto: '', units: draft.units.map((u) => ({ ...u, photo: u.id ? u.photo : '' })),
      }));
    } catch { /* ignore */ }
  }
}

export function clearDraft(uid) {
  try { localStorage.removeItem(draftKey(uid)); } catch { /* ignore */ }
}

/** What is already in the account, so a reopened onboarding starts from the real data. */
export async function loadExisting(user) {
  const orgId = user?.organization_id || null;
  setActiveOrg(orgId);
  const out = { ...EMPTY_DRAFT };
  out.ownerName = user?.full_name || '';
  out.ownerPhone = user?.phone || '';
  out.ownerPhoto = user?.profile_image || '';
  try {
    const orgs = await base44.entities.Organization.list();
    const org = (Array.isArray(orgs) ? orgs : []).find((o) => !orgId || o.id === orgId) || null;
    if (org) {
      out.businessName = org.name && org.name !== 'My Organization' ? org.name : '';
      out.businessPhone = org.phone || '';
    }
  } catch { /* first run: nothing yet */ }
  try {
    const props = await base44.entities.Property.list({}, { limit: 200 });
    const list = Array.isArray(props) ? props : [];
    out.units = list.map((p) => ({
      key: `db-${p.id}`,
      id: p.id,
      name: p.name || '',
      guests: Number(p.max_guests) || DEFAULT_GUESTS,
      price: Number(p.base_price) || DEFAULT_PRICE,
      photo: Array.isArray(p.images) && p.images[0] ? (typeof p.images[0] === 'object' ? p.images[0].url : p.images[0]) : '',
      existing: true,
    }));
    const t = list.find((p) => p.type)?.type;
    if (t) out.type = COMPLEX_TYPES.some((c) => c.value === t) ? t : 'other';
  } catch { /* ignore */ }
  try {
    const syncs = await base44.entities.CalendarSync.list({}, { limit: 200 });
    out.savedSyncs = (Array.isArray(syncs) ? syncs : []).map((s) => ({ provider: s.provider, property_id: s.property_id, ical_url: s.ical_url }));
  } catch { /* ignore */ }
  const s = readOrgSettings(orgId);
  out.checkIn = s.check_in_time || '15:00';
  out.checkOut = s.check_out_time || '11:00';
  out.hostName = s.host_name || '';
  out.waGreeting = s.wa_greeting || '';
  out.deposit = s.deposit || 'none';
  out.coverPhoto = s.cover_photo || '';
  if (!out.type && s.complex_type) out.type = s.complex_type;
  return out;
}

/** Resize an image file into a jpeg data url (keeps rows small; no storage bucket on the live project). */
export function fileToDataUrl(file, max = 640, quality = 0.74) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) { reject(new Error('זה לא קובץ תמונה')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('לא הצלחנו לפתוח את התמונה')); };
    img.src = url;
  });
}

async function authUserId() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: { user } = {} } = await supabase.auth.getUser();
  return user?.id || null;
}

async function updateProfile(patch) {
  if (isSupabaseConfigured && supabase) {
    const uid = await authUserId();
    if (!uid) throw new Error('ההתחברות פגה. נא להתחבר מחדש.');
    const { error } = await supabase.from('profiles').update(patch).eq('id', uid);
    if (error) throw new Error(error.message);
    return;
  }
  await base44.auth.updateMe(patch.profile_image ? { ...patch, avatar_url: patch.profile_image } : patch);
}

/** Marks onboarding as started (step >= 2), so auth.me() no longer auto-completes it once units exist. */
export async function saveStep(step) {
  try { await updateProfile({ onboarding_step: Math.max(2, step) }); } catch { /* progress only */ }
}

export async function saveOwner(d) {
  const patch = { full_name: d.ownerName.trim().slice(0, 80) };
  if (d.ownerPhone.trim()) patch.phone = d.ownerPhone.trim().slice(0, 20);
  if (d.ownerPhoto && d.ownerPhoto.startsWith('data:')) patch.profile_image = d.ownerPhoto;
  await updateProfile(patch);
}

export async function saveBusiness(user, d) {
  const orgId = user?.organization_id;
  const patch = { name: (d.businessName.trim() || 'המתחם שלי').slice(0, 50) };
  const phone = (d.businessPhone || d.ownerPhone).trim();
  if (phone) patch.phone = phone.slice(0, 20);
  if (orgId) {
    try {
      await base44.entities.Organization.update(orgId, patch);
    } catch (e) {
      if (isSupabaseConfigured) throw e;
      await base44.entities.Organization.create({ id: orgId, ...patch }); // local demo: first save creates the org
    }
  }
  if (!isSupabaseConfigured) await base44.auth.updateMe({ organization_name: patch.name });
  await writeOrgSettings(orgId, { complex_type: d.type || '', cover_photo: d.coverPhoto || '' });
}

/**
 * Units are real properties rows. New ones are inserted, edited ones updated, and units this onboarding
 * created and the owner then removed are deleted. Units that existed before are never deleted here.
 * Returns the draft's units with their database ids.
 */
export async function saveUnits(d) {
  const created = new Set(d.createdUnitIds || []);
  const keep = new Set();
  const out = [];
  for (const u of d.units) {
    const row = {
      name: (u.name.trim() || 'יחידה').slice(0, 100),
      max_guests: Math.max(1, Math.min(40, Number(u.guests) || DEFAULT_GUESTS)),
      base_price: Math.max(0, Number(u.price) || 0) || null,
      type: d.type || null,
    };
    if (u.photo && u.photo.startsWith('data:')) row.images = [u.photo];
    if (u.id) {
      await base44.entities.Property.update(u.id, row);
      keep.add(u.id);
      out.push(u);
    } else {
      const res = await base44.entities.Property.create({ ...row, bedrooms: 1 });
      const id = res?.id;
      if (id) { created.add(id); keep.add(id); }
      out.push({ ...u, id });
    }
  }
  for (const id of created) {
    if (!keep.has(id)) {
      try { await base44.entities.Property.delete(id); } catch { /* already gone */ }
      created.delete(id);
    }
  }
  return { units: out, createdUnitIds: [...created] };
}

export async function saveHosting(user, d) {
  await writeOrgSettings(user?.organization_id, {
    check_in_time: d.checkIn,
    check_out_time: d.checkOut,
    host_name: d.hostName.trim(),
    host_phone: (d.businessPhone || d.ownerPhone).trim(),
    wa_greeting: d.waGreeting.trim(),
    deposit: d.deposit,
  });
}

export const PROVIDERS = {
  BOOKING_COM: { label: 'Booking.com', color: '#1B2656' },
  AIRBNB: { label: 'Airbnb', color: '#EF5B5B' },
};

export function isIcalUrl(v) {
  return /^(https?|webcal):\/\/\S+\.\S+/i.test(String(v || '').trim());
}

/** One calendar_syncs row per unit per channel the owner pasted a link for. Duplicates are skipped. */
export async function saveChannels(d) {
  const saved = [...(d.savedSyncs || [])];
  for (const provider of Object.keys(PROVIDERS)) {
    const ch = d.channels?.[provider];
    if (!ch?.on) continue;
    for (const u of d.units) {
      const link = String(ch.links?.[u.key] || '').trim();
      if (!u.id || !isIcalUrl(link)) continue;
      if (saved.some((s) => s.provider === provider && s.property_id === u.id && s.ical_url === link)) continue;
      await base44.entities.CalendarSync.create({
        provider, property_id: u.id, ical_url: link, is_active: true, sync_status: 'ACTIVE', sync_direction: 'IMPORT',
      });
      saved.push({ provider, property_id: u.id, ical_url: link });
    }
  }
  return saved;
}

export async function finishOnboarding(user) {
  const patch = { onboarding_completed: true, onboarding_step: 6 };
  if (!user?.trial_ends_at) {
    // same 14-day trial the previous onboarding started (only when none is set yet)
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);
    patch.trial_ends_at = trialEnd.toISOString();
    patch.subscription_status = 'trialing';
  }
  try {
    await updateProfile(patch);
  } catch (e) {
    console.warn('[Onboarding] finish:', e?.message);
  }
  try { localStorage.setItem('onboarding_just_completed', String(Date.now())); } catch { /* ignore */ }
  clearDraft(user?.id);
}

/** Hebrew-friendly phone check: 9-10 digits, Israeli mobile or landline, or an international number. */
export function phoneOk(v) {
  const d = String(v || '').replace(/[^\d]/g, '');
  return d.length >= 9 && d.length <= 13;
}
