/**
 * One inbox ("שיחות", 05.11.2026): every person who wrote or was written to, as ONE thread.
 *
 *   - a lead (פנייה) that has no booking yet          → kind 'lead'   (filter "פניות חדשות")
 *   - a booking guest (with or without a lead before) → kind 'guest'  (filter "אורחים")
 *   - message_logs rows (what the owner sent from atlas) are attached to the thread they belong to,
 *     by lead_id, booking_id, then by the recipient's phone.
 *
 * Pure (no React, no network) so the page variants and the tests share it. Nothing is written here.
 *
 * Channel model, ready for Meta (integrations hub, later): a lead or message carries `channel`
 * (whatsapp | messenger | instagram | link | form | webhook | email | phone | manual | booking | airbnb).
 * Until migration 037 adds leads.channel, the channel is derived from `source` and from the
 * "הגיעה דרך:" line the inquiry link writes into notes.
 */
import { rangesOverlap, checkOutOf, isActiveBooking } from '../stay/bookings.js';
import { todayISO, addDays, withPrefix } from '../stay/format.js';
import { toInternationalDigits } from '../phone.js';

/* ── Channels ───────────────────────────────────────────────────────────── */
export const INBOX_CHANNELS = {
  whatsapp: { key: 'whatsapp', label: 'וואטסאפ', latin: 'WhatsApp' },
  messenger: { key: 'messenger', label: 'מסנג׳ר', latin: 'Messenger' },
  instagram: { key: 'instagram', label: 'אינסטגרם', latin: 'Instagram' },
  facebook: { key: 'facebook', label: 'פייסבוק', latin: 'Facebook' },
  google: { key: 'google', label: 'גוגל', latin: 'Google' },
  link: { key: 'link', label: 'קישור הפניות', latin: '' },
  form: { key: 'form', label: 'טופס באתר', latin: '' },
  webhook: { key: 'webhook', label: 'חיבור אוטומטי', latin: '' },
  email: { key: 'email', label: 'אימייל', latin: '' },
  phone: { key: 'phone', label: 'טלפון', latin: '' },
  manual: { key: 'manual', label: 'נרשמה ידנית', latin: '' },
  booking: { key: 'booking', label: 'Booking', latin: 'Booking' },
  airbnb: { key: 'airbnb', label: 'Airbnb', latin: 'Airbnb' },
  direct: { key: 'direct', label: 'הזמנה ישירה', latin: '' },
};

/** `?src=` values the inquiry link accepts, and how each one is shown. */
export const LINK_SOURCES = {
  instagram: 'אינסטגרם',
  facebook: 'פייסבוק',
  google: 'גוגל',
  whatsapp: 'וואטסאפ',
  site: 'האתר שלכם',
  directory: 'אתר צימרים',
};
const LINK_LABEL_TO_KEY = Object.fromEntries(Object.entries(LINK_SOURCES).map(([k, v]) => [v, k]));

/** The line BookDirect adds to an inquiry's notes when it came through a tagged link. */
export const VIA_PREFIX = 'הגיעה דרך:';
export function viaLine(src) {
  const label = LINK_SOURCES[String(src || '').toLowerCase()];
  return label ? `${VIA_PREFIX} ${label}` : '';
}

export function leadChannel(lead) {
  const explicit = String(lead?.channel || '').toLowerCase();
  if (INBOX_CHANNELS[explicit]) return explicit;
  const notes = String(lead?.notes || '');
  const via = notes.match(new RegExp(`${VIA_PREFIX}\\s*([^\\n]+)`));
  if (via) {
    const k = LINK_LABEL_TO_KEY[via[1].trim()];
    if (k === 'site' || k === 'directory') return 'link';
    if (k) return k;
  }
  const s = String(lead?.source || '').toLowerCase();
  if (!s) return 'manual';
  if (s.includes('whatsapp') || s.includes('וואטסאפ')) return 'whatsapp';
  if (s.includes('messenger')) return 'messenger';
  if (s.includes('instagram') || s.includes('אינסטגרם')) return 'instagram';
  if (s.includes('facebook') || s.includes('פייסבוק')) return 'facebook';
  if (s.includes('webhook') || s.includes('zapier') || s.includes('make')) return 'webhook';
  if (s === 'website' || s.includes('direct_page') || s.includes('book')) return 'link';
  if (s.includes('form') || s.includes('site') || s.includes('אתר')) return 'form';
  if (s.includes('mail') || s.includes('מייל')) return 'email';
  if (s.includes('phone') || s.includes('טלפון')) return 'phone';
  return 'manual';
}

function bookingChannel(b) {
  const s = String(b?.booking_source || b?.source || '').toLowerCase();
  if (s.includes('airbnb')) return 'airbnb';
  if (s.includes('booking')) return 'booking';
  if (s.includes('whatsapp')) return 'whatsapp';
  return 'direct';
}

/* ── Lead status (4 owner-facing states) ────────────────────────────────── */
export const LEAD_STATES = {
  new: { key: 'new', label: 'חדשה', tone: 'brand' },
  replied: { key: 'replied', label: 'ענינו', tone: 'sky' },
  booked: { key: 'booked', label: 'הפכה להזמנה', tone: 'mint' },
  dropped: { key: 'dropped', label: 'לא רלוונטית', tone: 'slate' },
};
/** What each state writes to leads.status (the existing column; no migration). */
export const STATE_TO_STATUS = { new: 'NEW', replied: 'CONTACTED', booked: 'WON', dropped: 'REJECTED' };

export function leadState(lead) {
  const s = String(lead?.status || 'NEW').toUpperCase();
  if (s === 'WON' || s === 'CONFIRMED') return 'booked';
  if (s === 'REJECTED' || s === 'LOST') return 'dropped';
  if (s === 'CONTACTED' || s === 'OFFER_SENT') return 'replied';
  return 'new';
}

/* ── Availability ───────────────────────────────────────────────────────── */
/**
 * Are the requested dates free?
 *   { state: 'free' | 'busy' | 'partial' | 'nodates' | 'nounit', freeUnits, totalUnits }
 * With a unit on the lead: that unit only. Without: how many units are free.
 */
export function availabilityFor(lead, bookings = [], properties = [], { excludeBookingId } = {}) {
  const ci = lead?.check_in_date;
  if (!ci) return { state: 'nodates', freeUnits: 0, totalUnits: properties.length };
  const co = lead.check_out_date && lead.check_out_date > ci ? lead.check_out_date : addDays(ci, Math.max(1, Number(lead.nights) || 1));
  const busyIn = (pid) => bookings.some((b) => b.id !== excludeBookingId && isActiveBooking(b) && (b.property_id === pid)
    && rangesOverlap(ci, co, b.check_in_date, checkOutOf(b)));
  if (lead.property_id) {
    return busyIn(lead.property_id)
      ? { state: 'busy', freeUnits: 0, totalUnits: 1 }
      : { state: 'free', freeUnits: 1, totalUnits: 1 };
  }
  if (!properties.length) return { state: 'nounit', freeUnits: 0, totalUnits: 0 };
  const free = properties.filter((p) => !busyIn(p.id)).length;
  return {
    state: free === 0 ? 'busy' : free === properties.length ? 'free' : 'partial',
    freeUnits: free,
    totalUnits: properties.length,
  };
}

export function availabilityLabel(av) {
  if (!av) return '';
  if (av.state === 'free') return av.totalUnits > 1 ? 'כל היחידות פנויות' : 'התאריכים פנויים';
  if (av.state === 'partial') return `פנוי ב-${av.freeUnits} מתוך ${av.totalUnits} יחידות`;
  if (av.state === 'busy') return 'התאריכים תפוסים';
  if (av.state === 'nodates') return 'בלי תאריכים';
  return '';
}

/* ── Threads ────────────────────────────────────────────────────────────── */
const phoneKey = (raw) => {
  const d = toInternationalDigits(raw);
  return d ? `p:${d}` : '';
};
const ts = (v) => (v ? new Date(v).getTime() || 0 : 0);
const NEEDS_REPLY_AFTER_H = 2;

/**
 * Bookings that deserve a guest thread even with no message yet: stays in progress
 * and arrivals in the next 14 days (so the owner can write before they come).
 */
function isCurrentGuest(b, today) {
  if (!isActiveBooking(b)) return false;
  const co = checkOutOf(b);
  return co >= today && b.check_in_date <= addDays(today, 14);
}

/**
 * @returns {Array<Thread>} newest activity first.
 * Thread: { key, kind:'lead'|'guest', name, phone, channel, lead, booking, messages[], lastAt, preview,
 *           state (lead state or 'guest'), needsReply, waitingHours, propertyId }
 */
export function buildThreads({ leads = [], bookings = [], logs = [], now = new Date(), today = todayISO() } = {}) {
  const threads = new Map();
  const byLead = new Map();
  const byBooking = new Map();
  const byPhone = new Map();

  const add = (t) => {
    threads.set(t.key, t);
    if (t.lead) byLead.set(t.lead.id, t);
    if (t.booking) byBooking.set(t.booking.id, t);
    if (t.phoneKey && !byPhone.has(t.phoneKey)) byPhone.set(t.phoneKey, t);
    return t;
  };

  const leadById = new Map(leads.map((l) => [l.id, l]));
  const activeBookings = bookings.filter((b) => isActiveBooking(b));

  // 1) bookings linked to a lead, current guests, and bookings that have messages → guest threads
  const bookingIdsWithLogs = new Set(logs.map((m) => m.booking_id).filter(Boolean));
  for (const b of activeBookings) {
    const linkedLead = b.lead_id ? leadById.get(b.lead_id) : null;
    if (!linkedLead && !bookingIdsWithLogs.has(b.id) && !isCurrentGuest(b, today)) continue;
    const pk = phoneKey(b.guest_phone);
    add({
      key: `b:${b.id}`, kind: 'guest', name: b.guest_name || linkedLead?.full_name || 'אורח',
      phone: b.guest_phone || linkedLead?.phone || '', phoneKey: pk, channel: bookingChannel(b),
      lead: linkedLead || null, booking: b, messages: [], propertyId: b.property_id || null,
    });
    if (linkedLead) byLead.set(linkedLead.id, threads.get(`b:${b.id}`));
  }

  // 2) leads without a booking → lead threads (a WON lead whose booking is not loaded stays a lead thread)
  for (const l of leads) {
    if (byLead.has(l.id)) continue;
    const pk = phoneKey(l.phone);
    const sameGuest = pk && byPhone.get(pk);
    if (sameGuest && sameGuest.kind === 'guest' && leadState(l) === 'booked') {
      sameGuest.lead = sameGuest.lead || l; byLead.set(l.id, sameGuest); continue;
    }
    add({
      key: `l:${l.id}`, kind: 'lead', name: l.full_name || l.name || 'ללא שם', phone: l.phone || '', phoneKey: pk,
      channel: leadChannel(l), lead: l, booking: null, messages: [], propertyId: l.property_id || null,
    });
  }

  // 3) messages → their thread; a message nobody claims becomes its own guest thread (old logs, by name)
  for (const m of logs) {
    let t = (m.lead_id && byLead.get(m.lead_id)) || (m.booking_id && byBooking.get(m.booking_id))
      || (phoneKey(m.recipient) && byPhone.get(phoneKey(m.recipient)));
    if (!t) {
      const key = m.booking_id ? `b:${m.booking_id}` : `m:${phoneKey(m.recipient) || m.guest_name || m.id}`;
      t = threads.get(key) || add({
        key, kind: 'guest', name: m.guest_name || m.recipient_name || 'אורח', phone: m.recipient || '',
        phoneKey: phoneKey(m.recipient), channel: String(m.channel || 'whatsapp').toLowerCase(), lead: null, booking: null,
        messages: [], propertyId: m.property_id || null, propertyName: m.property_name || '',
      });
    }
    t.messages.push(m);
  }

  const nowMs = now.getTime();
  const out = [];
  for (const t of threads.values()) {
    t.messages.sort((a, b) => ts(a.created_at || a.created_date) - ts(b.created_at || b.created_date));
    const lastMsg = t.messages[t.messages.length - 1];
    const leadAt = t.lead ? ts(t.lead.created_at || t.lead.created_date) : 0;
    const bookingAt = t.booking ? ts(t.booking.created_at || t.booking.created_date) : 0;
    const msgAt = lastMsg ? ts(lastMsg.created_at || lastMsg.created_date) : 0;
    t.lastAt = Math.max(leadAt, bookingAt, msgAt) || 0;
    t.preview = lastMsg?.body ? String(lastMsg.body).split('\n')[0] : (t.lead?.notes ? String(t.lead.notes).split('\n').filter((x) => !x.startsWith(VIA_PREFIX)).pop() || '' : '');
    t.state = t.kind === 'lead' ? leadState(t.lead) : 'guest';
    const repliedAfter = t.messages.some((m) => (m.direction || 'outbound') === 'outbound' && ts(m.created_at || m.created_date) >= leadAt);
    t.needsReply = t.kind === 'lead' && t.state === 'new' && !repliedAfter;
    t.waitingHours = t.needsReply && leadAt ? Math.floor((nowMs - leadAt) / 3600000) : 0;
    t.overdue = t.needsReply && t.waitingHours >= NEEDS_REPLY_AFTER_H;
    out.push(t);
  }
  return out.sort((a, b) => (Number(b.needsReply) - Number(a.needsReply)) || (b.lastAt - a.lastAt));
}

/** Filter chips: 'leads' = פניות פתוחות (new + replied), 'guests', 'all' (everything but dropped/booked leads stay visible). */
export function filterThreads(threads, filter = 'leads', query = '') {
  const q = String(query || '').trim().toLowerCase();
  const digits = q.replace(/\D/g, '');
  return threads.filter((t) => {
    if (filter === 'leads' && !(t.kind === 'lead' && (t.state === 'new' || t.state === 'replied'))) return false;
    if (filter === 'guests' && t.kind !== 'guest') return false;
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || (digits.length >= 3 && String(t.phone || '').replace(/\D/g, '').includes(digits));
  });
}

export function countThreads(threads) {
  let leads = 0; let guests = 0; let waiting = 0;
  for (const t of threads) {
    if (t.kind === 'guest') guests += 1;
    else if (t.state === 'new' || t.state === 'replied') leads += 1;
    if (t.needsReply) waiting += 1;
  }
  return { leads, guests, all: threads.length, waiting };
}

/** "לפני 3 שעות" style, Hebrew, for the list. */
export function agoHe(ms, now = Date.now()) {
  if (!ms) return '';
  const m = Math.max(0, Math.round((now - ms) / 60000));
  if (m < 1) return 'עכשיו';
  if (m < 60) return m === 1 ? 'לפני דקה' : `לפני ${m} דק׳`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : h === 2 ? 'לפני שעתיים' : `לפני ${h} שעות`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'אתמול';
  if (d < 7) return `לפני ${d} ימים`;
  const dt = new Date(ms);
  return `${dt.getDate()}.${dt.getMonth() + 1}`;
}

/** First WhatsApp reply to a lead: warm, short, with the dates and whether they are free. */
export function leadReplyText(lead, { hostName = '', unitName = '', av } = {}, fmtDay = (d) => d) {
  const first = String(lead?.full_name || '').trim().split(/\s+/)[0] || '';
  const hello = first ? `שלום ${first}, ` : 'שלום, ';
  const place = unitName || hostName;
  const thanks = place ? `תודה שפניתם ${withPrefix('ל', place)}.` : 'תודה על הפנייה.';
  let dates = '';
  if (lead?.check_in_date) {
    const range = lead.check_out_date ? `${fmtDay(lead.check_in_date)} עד ${fmtDay(lead.check_out_date)}` : fmtDay(lead.check_in_date);
    if (av?.state === 'free' || av?.state === 'partial') dates = ` ${range} פנוי אצלנו.`;
    else if (av?.state === 'busy') dates = ` ${range} כבר תפוס, אבל נשמח להציע תאריכים קרובים.`;
    else dates = ` ביקשתם ${range}.`;
  }
  return `${hello}${thanks}${dates}`.trim();
}
