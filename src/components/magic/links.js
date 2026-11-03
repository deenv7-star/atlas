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
