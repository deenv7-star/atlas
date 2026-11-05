/**
 * Channel connection kit (free iCal sync, no paid channel manager).
 *
 * Facts below were checked on the platforms' own help pages on 05.11.2026:
 *   Airbnb:      https://www.airbnb.com/help/article/99
 *                Calendar → listing → Availability → Connect calendars → Connect to another website.
 *                Export: copy the Airbnb calendar link. Import: paste a link ending in .ics, name it, "Add calendar".
 *                Airbnb refreshes imported calendars automatically every 3 hours (manual "Refresh" exists, rate limited).
 *   Booking.com: https://partner.booking.com/en-us/help/rates-availability/extranet-calendar/how-synchronize-your-calendars-across-channels
 *                Extranet → Rates & Availability → Sync calendars. Export: Add calendar connection → Skip to export →
 *                name → Copy link. Import: Add calendar connection → paste link → name → Next step → Done.
 *                Booking imports connected calendars every two hours ("Import now" exists). Only properties with
 *                one unit per room type, up to 20 room types and no connectivity provider can use it.
 *   atlas:       ical-sync runs every 15 minutes (pg_cron) and right after a link is added.
 */
import { checkIcalLink } from '@/lib/onboarding/v2/model';
import { LEGAL, WHATSAPP_URL } from '@/config/legal';

export const CHANNELS = {
  AIRBNB: {
    key: 'AIRBNB', name: 'Airbnb', exportChannel: 'airbnb',
    open: 'https://www.airbnb.com/hosting/calendar',
    help: 'https://www.airbnb.com/help/article/99',
    pullsEvery: 'בערך כל 3 שעות',
  },
  BOOKING_COM: {
    key: 'BOOKING_COM', name: 'Booking.com', exportChannel: 'booking',
    // The "Go to the Extranet" link on Booking's own help page: lands on Sync calendars after sign-in.
    open: 'https://admin.booking.com?page=%2Fhotel%2Fhoteladmin%2Fextranet_ng%2Fmanage%2Fsync%2Findex.html%3F',
    help: 'https://partner.booking.com/en-us/help/rates-availability/extranet-calendar/how-synchronize-your-calendars-across-channels',
    pullsEvery: 'בערך כל שעתיים',
  },
  ICAL: {
    key: 'ICAL', name: 'אתר אחר', exportChannel: '',
    open: '', help: '', pullsEvery: 'בקצב של האתר',
  },
};

export const ATLAS_EVERY = 'כל 15 דקות';

/** First link inside whatever was pasted (people paste whole sentences or two lines). */
export function extractLink(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/(?:https?|webcal):\/\/[^\s"'<>]+/i);
  return (m ? m[0] : s).replace(/[).,;]+$/, '');
}

/** Which channel a pasted link belongs to ('' when it is not a link at all). */
export function detectChannel(raw) {
  const v = extractLink(raw);
  if (!v) return '';
  let host = '';
  try { host = new URL(v.replace(/^webcal:\/\//i, 'https://')).hostname.toLowerCase(); } catch { return ''; }
  if (/(^|\.)airbnb\./.test(host)) return 'AIRBNB';
  if (/(^|\.)booking\.com$/.test(host)) return 'BOOKING_COM';
  return 'ICAL';
}

/**
 * One check for a pasted link: { ok, channel, url, message }.
 * The format check only. The live check (does the link open and is it a calendar) runs on the server
 * right after saving, in ical-sync, exactly as before.
 */
export function checkPasted(raw, { exportToken } = {}) {
  const url = extractLink(raw);
  if (!url) return { ok: false, channel: '', url: '', message: '' };
  const channel = detectChannel(url);
  if (!channel) return { ok: false, channel: '', url, message: 'זה לא קישור. העתיקו את כל הכתובת, מ-https ועד הסוף.' };
  if (/ical-export/i.test(url) || (exportToken && url.includes(exportToken))) {
    return { ok: false, channel, url, message: 'זה הקישור של atlas עצמו. כאן מדביקים את הקישור שהעתקתם מהערוץ.' };
  }
  if (channel === 'ICAL') {
    let u;
    try { u = new URL(url.replace(/^webcal:\/\//i, 'https://')); } catch { return { ok: false, channel, url, message: 'זה לא קישור. העתיקו את כל הכתובת, מ-https ועד הסוף.' }; }
    if (!/^https?:$/.test(u.protocol)) return { ok: false, channel, url, message: 'הקישור צריך להתחיל ב-https.' };
    return { ok: true, channel, url: url.replace(/^webcal:\/\//i, 'https://'), message: 'קישור יומן מאתר אחר. נבדוק אותו כשתלחצו "חברו".' };
  }
  const r = checkIcalLink(channel, url);
  // Booking's own Hebrew label is "סנכרון יומנים" (partner.booking.com/he, checked 05.11.2026).
  const message = channel === 'BOOKING_COM' ? String(r.message || '').replace('סנכרון לוחות שנה', 'סנכרון יומנים') : r.message;
  return { ok: r.ok, channel, url: url.replace(/^webcal:\/\//i, 'https://'), message };
}

/** Server result codes from ical-sync → one plain sentence (same meaning as hebrewError there). */
export function syncErrorHe(code) {
  const c = String(code || '');
  if (c === 'bad_url') return 'הקישור לא תקין. העתיקו אותו שוב מהערוץ.';
  if (c === 'not_ical') return 'הקישור נפתח, אבל הוא לא קישור יומן. בדקו שהעתקתם את הקישור מ"חיבור לוחות שנה" ולא את כתובת הדף.';
  if (c.startsWith('http_404') || c.startsWith('http_410')) return 'הערוץ אומר שהקישור הזה לא קיים. העתיקו קישור חדש מהערוץ.';
  if (c.startsWith('http_401') || c.startsWith('http_403')) return 'הערוץ חסם את הקישור. צרו קישור חדש בערוץ והדביקו אותו כאן.';
  if (/abort/i.test(c)) return 'הערוץ לא ענה בזמן. נסו שוב בעוד דקה.';
  return 'לא הצלחנו לקרוא את היומן מהקישור הזה. נסו שוב, או שלחו לנו אותו ונבדוק.';
}

export const SUPPORT = {
  phoneHref: `tel:+${LEGAL.WHATSAPP_NUMBER_INTL}`,
  phoneDisplay: LEGAL.BUSINESS_PHONE,
  line: 'תמיכה אנושית 24/7, גם בשבת',
  whatsapp(text) { return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`; },
};

/** Demo account only: a stand-in export link so the screens can be shown (never a real feed). */
export const DEMO_EXPORT = 'https://atlas-il.com/demo/ical-export-example.ics';
