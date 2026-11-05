/** Links inside a WhatsApp preview bubble are shown short (host + '/…'), like WhatsApp's own link chips. Pure. */
// Any link: with a scheme, starting with www., or a bare domain with a path (waze.com/ul?…, atlas-il.com/g/…).
export const URL_RE = /((?:https?:\/\/|www\.)[^\s]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|co\.il|org\.il|il|app|io|me|ly|net|org)\/[^\s]*)/gi;
export const TRAIL = /[.,;:!?)\]"'׳״]+$/;
export function shortLink(raw) {
  const s = String(raw || '');
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./i, '');
    const more = u.pathname.length > 1 || u.search || u.hash;
    return host + (more ? '/…' : '');
  } catch {
    return s.length > 28 ? `${s.slice(0, 24)}…` : s;
  }
}

/**
 * Round 05.11.2026: a raw "waze.com/…" in a guest-message bubble means nothing to an older owner.
 * Known links read as what they do; anything else falls back to the short host. Pure.
 */
export function friendlyLink(raw) {
  const s = String(raw || '');
  let host = '';
  let path = '';
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    host = u.hostname.replace(/^www\./i, '').toLowerCase();
    path = u.pathname;
  } catch { /* fall through */ }
  if (host === 'waze.com' || host.endsWith('.waze.com')) return { label: 'ניווט בוויז', rtl: true };
  if ((host.startsWith('google.') || host === 'maps.google.com' || host === 'maps.app.goo.gl' || host === 'goo.gl') && (/maps/.test(host) || path.startsWith('/maps'))) return { label: 'ניווט במפות', rtl: true };
  if (/(^|\.)atlas-il\.com$/.test(host) && path.startsWith('/g/')) return { label: 'דף האורח', rtl: true };
  if (/(^|\.)atlas-il\.com$/.test(host) && (path.startsWith('/b/') || path.startsWith('/book'))) return { label: 'דף ההזמנה', rtl: true };
  return { label: shortLink(s), rtl: false };
}
