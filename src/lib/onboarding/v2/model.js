/**
 * Onboarding v2 (19.10.2026): the answers, their defaults, and the setup checklist.
 * Pure functions only (no React, no '@/…' imports) so tests/unit can run them in plain node.
 *
 * Deen's rule for v2: ask only what's truly needed. Nothing here assumes a fixed value that isn't fixed:
 *   - guests are a min–max range (a villa for groups can be 10–30), or "changes per unit, set later";
 *   - the nightly price can be fixed, "changes with the group and the season", or "set later";
 *   - check-in / check-out are the usual times, with "changes by day / season" as a real answer.
 * Every question has a pre-filled default and can be skipped; everything is editable later.
 */

/** The three kinds most owners pick, then the rest behind "משהו אחר". `value` goes to properties.type. */
export const KINDS = [
  { value: 'zimmer', g: 'm', label: 'צימר', unit: 'צימר', units: 'צימרים', photo: '/demo/units/unit-6.webp', line: 'לזוגות ומשפחות קטנות', guests: [2, 6], count: 1 },
  { value: 'villa', g: 'f', label: 'וילה', unit: 'וילה', units: 'וילות', photo: '/demo/units/unit-3.webp', line: 'בית שלם לקבוצות', guests: [10, 20], count: 1 },
  { value: 'complex', g: 'f', label: 'מתחם אירוח', unit: 'יחידה', units: 'יחידות', photo: '/demo/complex-pool.webp', line: 'כמה יחידות במקום אחד', guests: [10, 30], count: 3 },
];
export const MORE_KINDS = [
  { value: 'zimmer_complex', g: 'm', label: 'מתחם צימרים', unit: 'צימר', units: 'צימרים', guests: [2, 6], count: 3 },
  { value: 'guesthouse', g: 'm', label: 'בית הארחה', unit: 'חדר', units: 'חדרים', guests: [2, 4], count: 4 },
  { value: 'boutique', g: 'm', label: 'מלון בוטיק', unit: 'חדר', units: 'חדרים', guests: [2, 4], count: 6 },
  { value: 'apartments', g: 'f', label: 'דירות נופש', unit: 'דירה', units: 'דירות', guests: [2, 6], count: 2 },
  { value: 'other', g: 'f', label: 'סוג אחר', unit: 'יחידה', units: 'יחידות', guests: [2, 6], count: 1 },
];
/** Kinds no longer offered (atlas is built for zimmers, not hotels) but still readable in saved answers. */
const LEGACY_KINDS = [{ value: 'hotel', g: 'm', label: 'מלון', unit: 'חדר', units: 'חדרים', guests: [2, 4], count: 10 }];
export const ALL_KINDS = [...KINDS, ...MORE_KINDS, ...LEGACY_KINDS];

export function kindInfo(value) {
  return ALL_KINDS.find((k) => k.value === value) || KINDS[0];
}

/** "צימר אחד", "וילה אחת", "3 יחידות". */
export function unitsLabel(kind, n) {
  const k = kindInfo(kind);
  return n === 1 ? `${k.unit} ${k.g === 'm' ? 'אחד' : 'אחת'}` : `${n} ${k.units}`;
}

/** The word in "איך קוראים ל…?" */
export function placeWord(kind) {
  return { complex: 'מתחם', zimmer: 'צימר', villa: 'וילה', zimmer_complex: 'מתחם' }[kind] || 'מקום';
}

export const GUESTS_LIMIT = 60;
export const UNITS_LIMIT = 30;

/** Price answers. 'varies' is the honest default for villas and complexes (Deen 19.10). */
export const PRICE_MODES = [
  { value: 'varies', label: 'משתנה לפי ההרכב והעונה', line: 'כל הזמנה מקבלת מחיר משלה' },
  { value: 'fixed', label: 'מחיר קבוע ללילה', line: 'אותו מחיר כמעט תמיד' },
  { value: 'later', label: 'אגדיר אחר כך', line: 'משאירים ריק בינתיים' },
];

export const CHECKIN_TIMES = ['14:00', '15:00', '16:00'];
export const CHECKOUT_TIMES = ['10:00', '11:00', '12:00'];

/** Where bookings come from. Booking / Airbnb decide which calendar steps the setup leads with. */
export const CHANNELS = [
  { value: 'phone', label: 'טלפון ווואטסאפ' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'portals', label: 'אתרי צימרים' },
  { value: 'website', label: 'האתר שלכם' },
  { value: 'social', label: 'פייסבוק ואינסטגרם' },
];

export function defaultAnswers(kind = '') {
  const k = kind ? kindInfo(kind) : null;
  return {
    v: 2,
    step: 0,
    kind,
    name: '',
    unitCount: k ? k.count : 1,
    guestsMin: k ? k.guests[0] : 2,
    guestsMax: k ? k.guests[1] : 6,
    guestsVary: false,
    priceMode: 'varies',
    price: '',
    priceFrom: '',
    checkIn: '15:00',
    checkOut: '11:00',
    timesVary: false,
    channels: [],
    plan: 'trial',
    skipped: [],
  };
}

/** Changing the kind re-fills the defaults that depend on it, unless the owner already changed them. */
export function applyKind(a, kind) {
  const prev = a.kind ? kindInfo(a.kind) : null;
  const next = kindInfo(kind);
  const out = { ...a, kind };
  const untouched = (field, prevVal) => !prev ? true : a[field] === prevVal;
  if (untouched('unitCount', prev?.count)) out.unitCount = next.count;
  if (untouched('guestsMin', prev?.guests[0]) && untouched('guestsMax', prev?.guests[1])) {
    out.guestsMin = next.guests[0];
    out.guestsMax = next.guests[1];
  }
  return out;
}

export function clampInt(v, min, max) {
  const n = Math.round(Number(String(v ?? '').replace(/[^\d]/g, '')) || 0);
  return Math.max(min, Math.min(max, n));
}

/** min ≤ max, both within 1..GUESTS_LIMIT. */
export function normalizeGuests(min, max) {
  let lo = clampInt(min, 1, GUESTS_LIMIT);
  let hi = clampInt(max, 1, GUESTS_LIMIT);
  if (hi < lo) [lo, hi] = [hi, lo];
  return [lo, hi];
}

export function guestsLabel(a) {
  if (a.guestsVary) return 'משתנה בין היחידות';
  const [lo, hi] = normalizeGuests(a.guestsMin, a.guestsMax);
  return lo === hi ? `${hi} אורחים` : `${lo}–${hi} אורחים`;
}

export function money(n) {
  const v = Number(n) || 0;
  return `₪${v.toLocaleString('he-IL')}`;
}

export function priceLabel(a) {
  if (a.priceMode === 'fixed') return Number(a.price) > 0 ? `${money(a.price)} ללילה` : 'מחיר קבוע ללילה';
  if (a.priceMode === 'varies') return Number(a.priceFrom) > 0 ? `משתנה, החל מ-${money(a.priceFrom)}` : 'משתנה לפי ההרכב והעונה';
  return 'יוגדר אחר כך';
}

export function timesLabel(a) {
  const base = `כניסה ${a.checkIn} · יציאה ${a.checkOut}`;
  return a.timesVary ? `בדרך כלל ${base}, משתנה לפי יום ועונה` : base;
}

/** The properties row for one unit. base_price is only a number the owner actually gave. */
export function unitRow(a, index) {
  const k = kindInfo(a.kind);
  const [, hi] = normalizeGuests(a.guestsMin, a.guestsMax);
  const price = a.priceMode === 'fixed' ? Number(a.price) || 0 : a.priceMode === 'varies' ? Number(a.priceFrom) || 0 : 0;
  const count = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const single = count === 1;
  return {
    name: single && a.name.trim() ? a.name.trim().slice(0, 40) : `${k.unit} ${index + 1}`,
    max_guests: a.guestsVary ? Math.max(hi, 2) : hi,
    base_price: price > 0 ? price : null,
    type: a.kind || null,
  };
}

/** What we keep per unit in organizations.settings.unit_profiles (no column for min guests / price mode). */
export function unitProfile(a) {
  const [lo, hi] = normalizeGuests(a.guestsMin, a.guestsMax);
  return {
    guests_min: a.guestsVary ? null : lo,
    guests_max: a.guestsVary ? null : hi,
    guests_vary: !!a.guestsVary,
    price_mode: a.priceMode,
    price_from: a.priceMode === 'varies' && Number(a.priceFrom) > 0 ? Number(a.priceFrom) : null,
  };
}

/* ───────────────────────── setup journey ───────────────────────── */

/**
 * The guided setup after onboarding. Each step is real: it is "done" because the data exists
 * (a unit, a calendar link, a WhatsApp number), never because a timer ran out.
 * `soon` steps are shown honestly as "בקרוב" and never count toward progress.
 */
export const SETUP_STEPS = [
  { id: 'units', title: 'היחידות שלכם', line: 'שם, כמה אורחים ומחיר לכל יחידה', minutes: 1 },
  { id: 'booking', title: 'חיבור Booking.com', line: 'ההזמנות מ-Booking נכנסות ללוח לבד', minutes: 3 },
  { id: 'airbnb', title: 'חיבור Airbnb', line: 'ההזמנות מ-Airbnb נכנסות ללוח לבד', minutes: 3 },
  { id: 'whatsapp', title: 'וואטסאפ לאורחים', line: 'הודעות מוכנות, שולחים בלחיצה', minutes: 1 },
  { id: 'plan', title: 'השלמת המסלול', line: 'המסלול שבחרתם, מתי שנוח', minutes: 1 },
  { id: 'payments', title: 'תשלומים וקבלות', line: 'סליקה וקבלות אוטומטיות', soon: true },
];

/**
 * facts: { units: number, syncs: [{provider}], hostPhone: string, planChoice: {kind, key}|null,
 *          channels: string[], setup: { done: {}, skipped: {} } }
 * → [{ ...step, status: 'done' | 'skipped' | 'todo' | 'soon' }]
 */
export function setupStatus(facts) {
  const f = facts || {};
  const setup = f.setup || {};
  const done = setup.done || {};
  const skipped = setup.skipped || {};
  const syncs = Array.isArray(f.syncs) ? f.syncs : [];
  const has = {
    units: (Number(f.units) || 0) > 0 && !!done.units,
    booking: syncs.some((s) => s.provider === 'BOOKING_COM'),
    airbnb: syncs.some((s) => s.provider === 'AIRBNB'),
    whatsapp: !!String(f.hostPhone || '').replace(/[^\d]/g, '') && !!done.whatsapp,
    plan: !!done.plan,
  };
  const channels = Array.isArray(f.channels) ? f.channels : [];
  const steps = SETUP_STEPS.filter((s) => s.id !== 'plan' || f.planChoice?.kind === 'plan');
  // lead with the channels the owner said they use; the others stay, one tap to say "not for me"
  const rank = (s) => {
    if (s.soon) return 9;
    if (s.id === 'units') return 0;
    if (s.id === 'booking' && channels.includes('booking')) return 1;
    if (s.id === 'airbnb' && channels.includes('airbnb')) return 2;
    if (s.id === 'whatsapp') return 3;
    if (s.id === 'plan') return 6;
    return 5;
  };
  return steps
    .map((s, i) => ({ ...s, used: s.id === 'booking' ? channels.includes('booking') : s.id === 'airbnb' ? channels.includes('airbnb') : true, order: rank(s) * 10 + i }))
    .sort((x, y) => x.order - y.order)
    .map((s) => ({
      ...s,
      status: s.soon ? 'soon' : has[s.id] ? 'done' : skipped[s.id] ? 'skipped' : 'todo',
    }));
}

export function setupProgress(steps) {
  const real = steps.filter((s) => s.status !== 'soon');
  const handled = real.filter((s) => s.status === 'done' || s.status === 'skipped').length;
  const next = real.find((s) => s.status === 'todo') || null;
  return { handled, total: real.length, complete: real.length > 0 && handled === real.length, next, pct: real.length ? Math.round((handled / real.length) * 100) : 0 };
}

/* ───────────────────────── calendar links ───────────────────────── */

/**
 * Plain-Hebrew check of a pasted calendar link. Booking.com export links contain /ical/ or ical.booking.com
 * and often do not end in .ics (Booking's own help page says so); Airbnb's end in .ics.
 * → { ok, message }
 */
export function checkIcalLink(provider, raw) {
  const v = String(raw || '').trim();
  if (!v) return { ok: false, message: '' };
  let url;
  try { url = new URL(v.replace(/^webcal:\/\//i, 'https://')); } catch { return { ok: false, message: 'זה לא קישור. מעתיקים את כל הכתובת, מ-https ועד הסוף.' }; }
  if (!/^https?:$/.test(url.protocol)) return { ok: false, message: 'הקישור צריך להתחיל ב-https.' };
  const host = url.hostname.toLowerCase();
  const path = (url.pathname + url.search).toLowerCase();
  if (provider === 'BOOKING_COM') {
    if (/airbnb\./.test(host)) return { ok: false, message: 'זה קישור של Airbnb. כאן מדביקים את הקישור מ-Booking.com.' };
    if (!/booking\.com$/.test(host)) return { ok: false, message: 'זה לא נראה כמו קישור של Booking.com. הוא מתחיל בדרך כלל ב-https://ical.booking.com' };
    if (/^(www\.)?booking\.com$/.test(host) && /\/hotel\//.test(path)) return { ok: false, message: 'זה הקישור לדף המודעה. צריך את קישור הייצוא מ"סנכרון לוחות שנה".' };
    if (/admin\.booking\.com/.test(host)) return { ok: false, message: 'זה הקישור לאקסטרא-נט עצמו. צריך את קישור הייצוא שמופיע אחרי "העתקת קישור".' };
    return { ok: true, message: 'קישור תקין של Booking.com' };
  }
  if (provider === 'AIRBNB') {
    if (/booking\.com$/.test(host)) return { ok: false, message: 'זה קישור של Booking.com. כאן מדביקים את הקישור מ-Airbnb.' };
    if (!/airbnb\./.test(host)) return { ok: false, message: 'זה לא נראה כמו קישור של Airbnb. הוא מתחיל ב-https://www.airbnb.' };
    if (/\/rooms\//.test(path)) return { ok: false, message: 'זה הקישור לדף המודעה. צריך את קישור לוח השנה, שנגמר ב-ics.' };
    if (!/\.ics/.test(path) && !/\/ical\//.test(path)) return { ok: false, message: 'חסר סוף הקישור. קישור לוח שנה של Airbnb נגמר ב-ics.' };
    return { ok: true, message: 'קישור תקין של Airbnb' };
  }
  return { ok: true, message: 'קישור תקין' };
}

/** wa.me link for an Israeli or international number ('' when unusable). */
export function waLink(phone, text = '') {
  let d = String(phone || '').replace(/[^\d]/g, '');
  if (d.startsWith('0')) d = `972${d.slice(1)}`;
  if (d.length < 11 || d.length > 15) return '';
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function phoneValid(v) {
  const d = String(v || '').replace(/[^\d]/g, '');
  return d.length >= 9 && d.length <= 13;
}
