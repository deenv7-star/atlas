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

/**
 * Business types (Deen 18.10: every kind of hospitality, not only zimmers). Wording downstream adapts:
 * unit / units = what one bookable thing is called; single = one bookable place (skips "how many").
 */
export const BUSINESS_TYPES = [
  { value: 'zimmer', label: 'צימר', unit: 'צימר', units: 'צימרים', single: true, photo: '/demo/units/unit-6.webp', line: 'צימר אחד' },
  { value: 'zimmer_complex', label: 'מתחם צימרים', unit: 'צימר', units: 'יחידות', photo: '/demo/units/unit-2.webp', line: 'כמה צימרים במקום אחד' },
  { value: 'villa', label: 'וילה', unit: 'וילה', units: 'וילות', single: true, photo: '/demo/units/unit-3.webp', line: 'בית שלם לאורחים' },
  { value: 'hotel', label: 'מלון', unit: 'חדר', units: 'חדרים', photo: '/demo/types/hotel.webp', line: 'חדרים, קבלה, צוות' },
  { value: 'boutique', label: 'מלון בוטיק', unit: 'חדר', units: 'חדרים', photo: '/demo/types/boutique.webp', line: 'מעט חדרים, הרבה אופי' },
  { value: 'guesthouse', label: 'בית הארחה', unit: 'חדר', units: 'חדרים', photo: '/demo/units/unit-4.webp', line: 'חדרים בבית אחד' },
  { value: 'apartments', label: 'דירות נופש', unit: 'דירה', units: 'דירות', photo: '/demo/types/apartments.webp', line: 'דירה אחת או כמה' },
];
export const OTHER_TYPE = { value: 'other', label: 'משהו אחר', unit: 'יחידה', units: 'יחידות', photo: '/demo/complex-pool.webp', line: 'כל סוג אירוח אחר' };
export const COMPLEX_TYPES = BUSINESS_TYPES; // older name

export function typeInfo(value) {
  return BUSINESS_TYPES.find((t) => t.value === value) || OTHER_TYPE;
}

export const OWNER_ROLES = [
  { value: 'owner', label: 'הבעלים', line: 'המקום שלי' },
  { value: 'manager', label: 'מנהל/ת', line: 'מנהל/ת בשביל הבעלים' },
  { value: 'family', label: 'בן/בת משפחה', line: 'עוזר/ת בעסק המשפחתי' },
  { value: 'staff', label: 'צוות', line: 'קבלה, ניקיון או תחזוקה' },
];

/** Where bookings come from today (characterization; also decides which links / connections to offer). */
export const CHANNELS_TODAY = [
  { value: 'phone', label: 'טלפון ווואטסאפ' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'website', label: 'אתר משלי' },
  { value: 'social', label: 'פייסבוק ואינסטגרם' },
  { value: 'portals', label: 'אתרי צימרים' },
];

export const LINK_FIELDS = [
  { key: 'website', label: 'אתר', placeholder: 'www.example.co.il' },
  { key: 'instagram', label: 'אינסטגרם', placeholder: 'instagram.com/…' },
  { key: 'facebook', label: 'פייסבוק', placeholder: 'facebook.com/…' },
  { key: 'maps', label: 'גוגל מפות', placeholder: 'maps.app.goo.gl/…' },
  { key: 'booking', label: 'הדף שלכם ב-Booking', placeholder: 'booking.com/hotel/il/…' },
  { key: 'airbnb', label: 'הדף שלכם ב-Airbnb', placeholder: 'airbnb.com/rooms/…' },
];

export const PAY_METHODS = [
  { value: 'bit', label: 'ביט / פייבוקס' },
  { value: 'transfer', label: 'העברה בנקאית' },
  { value: 'cash', label: 'מזומן' },
  { value: 'card', label: 'כרטיס אשראי' },
];

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
  ownerRole: '',
  phoneVerified: false,
  type: '',
  settlement: '',
  street: '',
  photos: [],
  coverPhoto: '',
  channelsToday: [],
  links: { website: '', instagram: '', facebook: '', maps: '', booking: '', airbnb: '' },
  payMethods: ['bit', 'transfer'],
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
      const addr = String(org.address || '').split(',').map((x) => x.trim()).filter(Boolean);
      if (addr.length) { out.settlement = addr[addr.length - 1]; out.street = addr.slice(0, -1).join(', '); }
      out.links = { ...out.links, website: org.website || '' };
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
    if (t) out.type = BUSINESS_TYPES.some((c) => c.value === t) ? t : 'other';
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
  out.photos = Array.isArray(s.photos) && s.photos.length ? s.photos : (s.cover_photo ? [s.cover_photo] : []);
  out.ownerRole = s.owner_role || '';
  out.phoneVerified = !!s.phone_verified;
  out.channelsToday = Array.isArray(s.channels_today) ? s.channels_today : [];
  out.links = { ...out.links, ...(s.links || {}), website: out.links.website || s.links?.website || '' };
  if (Array.isArray(s.pay_methods)) out.payMethods = s.pay_methods;
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

/**
 * Onboarding v1 progress lives in profiles.onboarding_step as 10 + chapter (the old wizard used 1-7), so
 * auth.me() can tell "started the new setup" from an old account and stop auto-completing it once units exist.
 */
export const STEP_BASE = 10;
export async function saveStep(chapter) {
  try { await updateProfile({ onboarding_step: STEP_BASE + Math.max(0, chapter) }); } catch { /* progress only */ }
}

export async function saveOwner(d) {
  const patch = { full_name: d.ownerName.trim().slice(0, 80) };
  if (d.ownerPhone.trim()) patch.phone = d.ownerPhone.trim().slice(0, 20);
  if (d.ownerPhoto && d.ownerPhoto.startsWith('data:')) patch.profile_image = d.ownerPhoto;
  await updateProfile(patch);
}

export function addressOf(d) {
  return [d.street.trim(), d.settlement.trim()].filter(Boolean).join(', ');
}

/** Name, phone, address, website → organizations; the rest of the business profile → orgSettings. */
export async function saveBusiness(user, d) {
  const orgId = user?.organization_id;
  const patch = { name: (d.businessName.trim() || 'העסק שלי').slice(0, 50) };
  const phone = (d.businessPhone || d.ownerPhone).trim();
  if (phone) patch.phone = phone.slice(0, 20);
  const address = addressOf(d);
  if (address) patch.address = address.slice(0, 255);
  if (d.links?.website?.trim()) patch.website = d.links.website.trim().slice(0, 255);
  if (orgId) {
    try {
      await base44.entities.Organization.update(orgId, patch);
    } catch (e) {
      if (isSupabaseConfigured) throw e;
      await base44.entities.Organization.create({ id: orgId, ...patch }); // local demo: first save creates the org
    }
  }
  if (!isSupabaseConfigured) await base44.auth.updateMe({ organization_name: patch.name });
  const photos = (d.photos || []).filter(Boolean).slice(0, 8);
  await writeOrgSettings(orgId, {
    complex_type: d.type || '',
    owner_role: d.ownerRole || '',
    phone_verified: !!d.phoneVerified,
    settlement: d.settlement.trim(),
    photos,
    cover_photo: photos[0] || d.coverPhoto || '',
    channels_today: d.channelsToday || [],
    links: { ...(d.links || {}) },
    pay_methods: d.payMethods || [],
  });
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
    const address = addressOf(d);
    if (address) row.address = address.slice(0, 255);
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
    pay_methods: d.payMethods || [],
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

import { markTourPending } from '@/lib/tour/tourState';

export async function finishOnboarding(user) {
  const patch = { onboarding_completed: true, onboarding_step: STEP_BASE + 9 };
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
  // Keyed to this user: a flag left by someone else in the same browser must never let a new account skip onboarding.
  try { localStorage.setItem('onboarding_just_completed', JSON.stringify({ uid: user?.id || '', ts: Date.now() })); } catch { /* ignore */ }
  clearDraft(user?.id);
  // the guided tour opens on the first visit to the app (per user, saved on the account)
  try { await markTourPending(user); } catch { /* the tour can always be opened from Settings */ }
}

/** Hebrew-friendly phone check: 9-10 digits, Israeli mobile or landline, or an international number. */
export function phoneOk(v) {
  const d = String(v || '').replace(/[^\d]/g, '');
  return d.length >= 9 && d.length <= 13;
}
