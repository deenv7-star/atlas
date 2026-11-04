/**
 * ייבוא מתחם (import v1): the client model shared by both versions (A conversational, B cards).
 * - links: instant, offline check of what the owner pasted (Booking / Airbnb / own site), before the server sees it
 * - found: what the import found, as friendly rows for the preview card (with "בדקו" on medium confidence)
 * - questions: ONLY what is missing or low confidence, in the order an owner can answer fastest
 * - profile: the confirmed draft → organizations.settings.property_profile (what the brain reads)
 * Pure functions (node --test).
 */
import { kindInfo, KINDS, MORE_KINDS, UNITS_LIMIT } from '../onboarding/v2/model.js';

export const MAX_LINKS = 3;

export function linkKind(raw) {
  const s = String(raw || '').trim();
  if (!s) return { kind: 'empty' };
  let u;
  try { u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`); } catch { return { kind: 'bad' }; }
  if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return { kind: 'bad' };
  const h = u.hostname.toLowerCase();
  if (/(^|\.)booking\.com$/.test(h)) return /\/hotel\//.test(u.pathname) ? { kind: 'booking', label: 'Booking.com' } : { kind: 'booking_other', label: 'Booking.com' };
  if (/(^|\.)airbnb\.[a-z.]+$/.test(h)) return /\/rooms\/(plus\/)?\d+/.test(u.pathname) ? { kind: 'airbnb', label: 'Airbnb' } : { kind: 'airbnb_other', label: 'Airbnb' };
  if (/(^|\.)(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl|facebook\.com|instagram\.com|wa\.me|whatsapp\.com)$/.test(h)) return { kind: 'unsupported', label: h };
  return { kind: 'site', label: h.replace(/^www\./, '') };
}

/** Pull every link out of a pasted blob (people paste a whole WhatsApp message). */
export function extractLinks(text) {
  const found = String(text || '').match(/(https?:\/\/[^\s<>"']+|(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|co\.il|org\.il|net|il|org|info|biz)(?:\/[^\s<>"']*)?)/gi) || [];
  return [...new Set(found.map((x) => x.replace(/[),.;!?]+$/, '')))].slice(0, MAX_LINKS);
}

/** Hebrew line under a link field, so the owner knows right away what we will read. */
export function linkHint(raw) {
  const k = linkKind(raw);
  return {
    empty: '',
    bad: 'זה לא נראה כמו קישור. העתיקו אותו מהדפדפן ונסו שוב.',
    booking: 'מודעת Booking.com. נקרא ממנה תמונות, יחידות, שעות וכללים.',
    booking_other: 'זה קישור לחיפוש ב-Booking. פתחו את המודעה של המתחם והעתיקו את הקישור שלה.',
    airbnb: 'מודעת Airbnb. נקרא ממנה תמונות, מתקנים וכללי הבית.',
    airbnb_other: 'זה לא קישור למודעה. פתחו את המודעה ב-Airbnb והעתיקו את הקישור שלה.',
    unsupported: 'מהקישור הזה אי אפשר לקרוא פרטי מתחם. הדביקו קישור ל-Booking, ל-Airbnb או לאתר שלכם.',
    site: `האתר ${k.label}. נקרא את הדף הראשי ועוד כמה עמודים.`,
  }[k.kind];
}

export const linkOk = (raw) => ['booking', 'airbnb', 'site'].includes(linkKind(raw).kind);

/* ── what was found ─────────────────────────────────────────────────────────────────────────── */

const conf = (r, k) => r?.confidence?.[k] || 'none';
const has = (v) => (Array.isArray(v) ? v.length > 0 : v != null && v !== '');

export function unitsLabelHe(kind, n) {
  const k = kindInfo(kind || 'complex');
  if (n === 1) return `${k.unit} ${k.g === 'f' ? 'אחת' : 'אחד'}`;
  return `${n} ${k.units}`;
}

/** The three to five chips on top of the preview card: "4 יחידות · 23 תמונות · ראש פינה". */
export function summaryChips(r) {
  if (!r) return [];
  const chips = [];
  if (r.unit_count) chips.push({ id: 'units', text: unitsLabelHe(r.property_type, r.unit_count) });
  if (r.photos?.length) chips.push({ id: 'photos', text: `${r.photos.length} תמונות` });
  if (r.location?.locality) chips.push({ id: 'place', text: r.location.locality });
  if (r.reviews?.score) chips.push({ id: 'rating', text: `${r.reviews.score} מתוך ${r.reviews.scale || 10}` });
  return chips;
}

/** Friendly rows for the preview: what we found, each tappable to fix. `check` = medium/low confidence. */
export function foundRows(r) {
  if (!r) return [];
  const rows = [];
  const add = (id, title, value, field = id) => { if (value) rows.push({ id, title, value, check: ['medium', 'low'].includes(conf(r, field)) }); };
  add('business_name', 'שם המתחם', r.business_name);
  if (r.property_type || r.unit_count) add('unit_count', 'יחידות', [r.property_type ? kindInfo(r.property_type).label : '', r.unit_count ? unitsLabelHe(r.property_type, r.unit_count) : ''].filter(Boolean).join(' · '));
  add('location', 'מיקום', [r.location?.address && !String(r.location.address).includes(r.location?.locality || '@@') ? r.location.address : '', r.location?.locality, r.location?.region].filter(Boolean).join(', ') || null);
  if (r.check_in_time || r.check_out_time) add('check_in_time', 'שעות', [r.check_in_time && `כניסה ${r.check_in_time}`, r.check_out_time && `יציאה ${r.check_out_time}`].filter(Boolean).join(' · '));
  add('parking', 'חניה', r.parking);
  add('arrival_instructions', 'כניסה למתחם', r.arrival_instructions);
  if (has(r.house_rules)) add('house_rules', 'כללי הבית', r.house_rules.length === 1 ? r.house_rules[0] : `${r.house_rules.length} כללים, כמו "${r.house_rules[0]}"`);
  add('cancellation_policy', 'ביטולים', r.cancellation_policy);
  if (has(r.amenities)) add('amenities', 'מתקנים', r.amenities.slice(0, 4).join(', ') + (r.amenities.length > 4 ? ` ועוד ${r.amenities.length - 4}` : ''));
  const wa = r.contact?.whatsapp || r.contact?.phone;
  add('contact', 'וואטסאפ לאורחים', wa);
  if (has(r.guest_faq)) add('guest_faq', 'שאלות של אורחים', `${r.guest_faq.length} תשובות מוכנות`);
  if (has(r.nearby)) add('nearby', 'באזור', r.nearby.slice(0, 3).map((x) => x.name).filter(Boolean).join(', '));
  return rows;
}

/* ── the questions (only what is missing) ───────────────────────────────────────────────────── */

export const RULE_CHOICES = ['בלי עישון בפנים', 'שקט אחרי 23:00', 'בלי חיות מחמד', 'בלי מסיבות ואירועים', 'רק האורחים שבהזמנה'];
export const CANCEL_CHOICES = [
  { value: 'ביטול חינם עד 7 ימים לפני ההגעה', label: 'עד 7 ימים לפני', line: 'החזר מלא' },
  { value: 'ביטול חינם עד 14 ימים לפני ההגעה', label: 'עד 14 ימים לפני', line: 'החזר מלא' },
  { value: 'ביטול חינם עד 30 ימים לפני ההגעה', label: 'עד 30 ימים לפני', line: 'החזר מלא' },
  { value: 'אין החזר אחרי ההזמנה', label: 'בלי החזר', line: 'המקדמה לא חוזרת' },
];
export const ARRIVAL_CHOICES = [
  { value: 'אנחנו מקבלים את האורחים בהגעה', label: 'אנחנו מקבלים אותם', line: 'פוגשים בהגעה' },
  { value: 'המפתח בתיבה עם קוד ליד הדלת', label: 'מפתח בתיבה עם קוד', line: 'שולחים את הקוד לפני' },
  { value: 'קוד בדלת, נשלח לאורחים לפני ההגעה', label: 'קוד בדלת', line: 'בלי מפתח' },
];
export const PARKING_CHOICES = [
  { value: 'חניה פרטית בחינם ליד היחידה', label: 'חניה צמודה', line: 'בחינם, ליד היחידה' },
  { value: 'חניה חינם ברחוב ליד המתחם', label: 'חניה ברחוב', line: 'בחינם, ליד המתחם' },
  { value: 'אין חניה במקום', label: 'אין חניה', line: 'נסביר לאורחים איפה' },
];
export const TIMES_IN = ['14:00', '15:00', '16:00'];
export const TIMES_OUT = ['10:00', '11:00', '12:00'];
export const KIND_CHOICES = [...KINDS, ...MORE_KINDS.filter((k) => ['zimmer_complex', 'apartments', 'guesthouse'].includes(k.value))];

/** One question per missing field. `why` = the owner's gain, ≤12 words. */
export const QUESTIONS = {
  business_name: { id: 'business_name', title: 'איך קוראים למתחם?', why: 'כך האורחים יראו אותו בהודעות', kind: 'text', placeholder: 'למשל: צימרי הגפן' },
  property_type: { id: 'property_type', title: 'מה סוג המתחם שלכם?', why: 'כדי להתאים את היומן ואת ההודעות', kind: 'kind' },
  unit_count: { id: 'unit_count', title: 'כמה יחידות יש לכם?', why: 'נפתח יומן נפרד לכל יחידה', kind: 'count' },
  check_in_time: { id: 'check_in_time', title: 'מתי נכנסים ומתי יוצאים?', why: 'נכתוב את השעות בהודעות לאורחים', kind: 'times' },
  check_out_time: null, // asked together with check-in
  arrival_instructions: { id: 'arrival_instructions', title: 'איך האורחים נכנסים?', why: 'atlas ישלח להם את זה ביום ההגעה', kind: 'choice', choices: ARRIVAL_CHOICES, other: 'אחרת, נכתוב' },
  parking: { id: 'parking', title: 'איפה האורחים חונים?', why: 'זו השאלה הכי נפוצה לפני הגעה', kind: 'choice', choices: PARKING_CHOICES, other: 'אחרת, נכתוב' },
  contact: { id: 'contact', title: 'לאיזה מספר אורחים כותבים?', why: 'המספר שיופיע בהודעות בוואטסאפ', kind: 'phone' },
  house_rules: { id: 'house_rules', title: 'מה חשוב לכם שאורחים יידעו?', why: 'סמנו כמה שרוצים. אפשר לדלג', kind: 'rules', choices: RULE_CHOICES },
  cancellation_policy: { id: 'cancellation_policy', title: 'עד מתי אפשר לבטל בחינם?', why: 'כדי לענות לאורחים על ביטולים', kind: 'choice', choices: CANCEL_CHOICES, other: 'אחרת, נכתוב' },
};

/** The server's `missing` list (or a local one) → the questions to ask, never more than needed. */
export function questionsFor(r, missing) {
  const want = new Set(Array.isArray(missing) ? missing : []);
  if (!r) return ['business_name', 'property_type', 'unit_count', 'check_in_time', 'arrival_instructions', 'parking', 'contact', 'house_rules', 'cancellation_policy'].map((k) => QUESTIONS[k]);
  if (want.has('check_out_time')) want.add('check_in_time');
  return Object.keys(QUESTIONS).filter((k) => QUESTIONS[k] && want.has(k)).map((k) => QUESTIONS[k]);
}

/** Apply one answer onto the draft (pure). Marks the field as owner-confirmed ("high"). */
export function applyAnswer(r0, id, value) {
  const r = { ...r0, confidence: { ...(r0?.confidence || {}) } };
  const mark = (...ks) => ks.forEach((k) => { r.confidence[k] = 'high'; });
  switch (id) {
    case 'business_name': r.business_name = String(value || '').trim().slice(0, 60) || null; mark('business_name'); break;
    case 'property_type': r.property_type = value; mark('property_type'); if (!r.unit_count) r.unit_count = kindInfo(value).count; break;
    case 'unit_count': r.unit_count = Math.max(1, Math.min(UNITS_LIMIT, Math.round(Number(value) || 1))); mark('unit_count', 'units'); break;
    case 'check_in_time': r.check_in_time = value?.in || r.check_in_time; r.check_out_time = value?.out || r.check_out_time; mark('check_in_time', 'check_out_time'); break;
    case 'arrival_instructions': case 'parking': case 'cancellation_policy': r[id] = String(value || '').trim().slice(0, 400) || null; mark(id); break;
    case 'contact': r.contact = { ...(r.contact || {}), whatsapp: String(value || '').trim() || null }; mark('contact'); break;
    case 'house_rules': r.house_rules = [...new Set((Array.isArray(value) ? value : []).map((x) => String(x).trim()).filter(Boolean))].slice(0, 15); mark('house_rules'); break;
    default: break;
  }
  return r;
}

/** Still missing after the owner's answers (for the done screen: "אפשר להשלים אחר כך"). */
export function stillMissing(r, skipped = []) {
  const s = new Set(skipped);
  return questionsFor(r, Object.keys(QUESTIONS).filter((k) => {
    const v = k === 'contact' ? (r?.contact?.whatsapp || r?.contact?.phone) : r?.[k];
    return !has(v) || s.has(k);
  })).map((q) => q.id);
}

/* ── the profile the brain reads ─────────────────────────────────────────────────────────────── */

/** organizations.settings.property_profile: the confirmed draft, small and without preview-only data. */
export function toProfile(r, { photos = [], missing = [] } = {}) {
  const { thumbs, confidence, sources, ...rest } = r || {};
  return {
    v: 1,
    ...rest,
    photos: photos.length ? photos : [],
    sources: (sources || []).filter((s) => s.ok).map((s) => ({ kind: s.kind, url: s.url })),
    confidence: confidence || {},
    missing,
    updated_at: new Date().toISOString(),
  };
}

/** Units to create: names from the listing when there are enough, else "צימר 1", "צימר 2"… */
export function unitRows(r) {
  const n = Math.max(1, Math.min(UNITS_LIMIT, Number(r?.unit_count) || 1));
  const k = kindInfo(r?.property_type || (n > 1 ? 'zimmer_complex' : 'zimmer'));
  const listed = Array.isArray(r?.units) ? r.units : [];
  const single = n === 1;
  return Array.from({ length: n }, (_, i) => {
    const u = listed.length === n ? listed[i] : (single ? listed[0] : null);
    const name = String((single ? r?.business_name || u?.name : u?.name) || `${k.unit} ${i + 1}`).trim().slice(0, 60);
    const guests = Number(u?.max_guests) || (single && listed.length === 0 ? null : null);
    return {
      name,
      type: r?.property_type || null,
      max_guests: guests ? Math.max(1, Math.min(40, Math.round(guests))) : k.guests[1],
      bedrooms: Number(u?.bedrooms) > 0 ? Math.round(u.bedrooms) : 1,
      bathrooms: Number(u?.bathrooms) > 0 ? Math.max(1, Math.round(u.bathrooms)) : 1,
      description: (u?.description || (single ? r?.description?.long || r?.description?.short : '') || null),
      amenities: (u?.amenities?.length ? u.amenities : r?.amenities || []).slice(0, 30),
      base_price: Number(u?.price_from) > 0 ? Number(u.price_from) : (single && Number(r?.prices?.from) > 0 ? Number(r.prices.from) : null),
      address: r?.location?.address || r?.location?.locality || null,
    };
  });
}
