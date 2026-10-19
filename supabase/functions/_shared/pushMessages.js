// What a push notification says, from the row that triggered it. Pure functions (no I/O), shared by
// supabase/functions/send-push (Deno) and tests/unit/push-messages.test.mjs (Node).
//
// Kinds:
//   booking  a booking someone else created (direct-booking page, a team member, the API)
//   ical     a booking that arrived from a connected calendar (Booking.com / Airbnb / iCal)
//   lead     a new lead (contact form, guest page, a team member)
//
// Copy rules (brand voice): short, concrete, no exclamation marks, lowercase "atlas", Hebrew dates.

const MONTHS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
const CHANNEL = { airbnb: 'Airbnb', booking: 'Booking.com', google: 'Google', outlook: 'Outlook', ical: 'יומן מחובר', website: 'דף ההזמנות' };

/** "12 בנוב׳" from YYYY-MM-DD (no time zone maths: a check-in date is a calendar date) */
export function heDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!m) return '';
  return `${Number(m[3])} ב${MONTHS[Number(m[2]) - 1]}`;
}

function nightsBetween(a, b) {
  const x = Date.parse(`${a}T00:00:00Z`); const y = Date.parse(`${b}T00:00:00Z`);
  if (!Number.isFinite(x) || !Number.isFinite(y) || y <= x) return null;
  return Math.round((y - x) / 86400000);
}

export function dateRange(checkIn, checkOut) {
  const a = heDate(checkIn); const b = heDate(checkOut);
  if (!a) return '';
  if (!b) return a;
  // same month: "12–14 בנוב׳"
  if (String(checkIn).slice(0, 7) === String(checkOut).slice(0, 7)) return `${Number(String(checkIn).slice(8, 10))}–${b}`;
  return `${a} – ${b}`;
}

const clean = (s, n = 60) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const isPlaceholderGuest = (name) => /^(אורח|תפוס|חסום) /.test(String(name || ''));

/** iCal rows (external_sync_id) and channel sources are "ical"; everything else is a plain booking. */
export function bookingKind(row) {
  return row && (row.external_sync_id || row.external_uid) ? 'ical' : 'booking';
}

export function bookingMessage(row, { unitName = '', propertyName = '' } = {}) {
  const kind = bookingKind(row);
  const nights = row.nights || nightsBetween(row.check_in_date, row.check_out_date);
  const where = clean(unitName || row.property_name || propertyName, 40);
  const dates = dateRange(row.check_in_date, row.check_out_date);
  const channel = CHANNEL[String(row.source || '').toLowerCase()] || '';
  const guest = isPlaceholderGuest(row.guest_name) ? '' : clean(row.guest_name, 40);
  const bits = [guest, dates, nights ? (nights === 1 ? 'לילה אחד' : `${nights} לילות`) : '', kind === 'ical' ? where : ''].filter(Boolean);
  return {
    kind,
    title: kind === 'ical' ? `הזמנה חדשה${channel ? ` מ-${channel}` : ''}` : (row.source === 'website' ? 'הזמנה חדשה מדף ההזמנות' : 'הזמנה חדשה'),
    body: bits.join(' · ') || 'פרטי ההזמנה מחכים לכם באפליקציה',
    url: `/booking/${row.id}`,
    // one notification per booking; iCal imports of the same calendar replace each other instead of piling up
    tag: kind === 'ical' ? `ical-${row.external_sync_id || 'feed'}` : `booking-${row.id}`,
  };
}

export function leadMessage(row) {
  const name = clean(row.full_name, 40);
  const dates = dateRange(row.check_in_date, row.check_out_date);
  const guests = (Number(row.adults) || 0) + (Number(row.children) || 0);
  const bits = [name, dates, guests > 0 ? `${guests} אורחים` : ''].filter(Boolean);
  return {
    kind: 'lead',
    title: 'ליד חדש',
    body: bits.join(' · ') || 'פנייה חדשה מחכה לתשובה',
    url: `/lead/${row.id}`,
    tag: `lead-${row.id}`,
  };
}

/** Which preference switch on a device covers this kind (push_subscriptions.prefs). */
export const PREF_FOR_KIND = { booking: 'bookings', ical: 'ical', lead: 'leads' };

/** Payload the service worker (public/push-sw.js) reads. Kept small: push services cap it at 4 KB. */
export function toPayload(msg) {
  return JSON.stringify({ v: 1, title: msg.title, body: msg.body, url: msg.url, tag: msg.tag, kind: msg.kind });
}
