/** Pure helpers for the /early waitlist (no imports, unit-tested in tests/unit/early-phone.test.mjs). */
/** Israeli mobile → 05XXXXXXXX, or null. */
export function normalizePhone(raw) {
  let d = String(raw || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+972')) d = '0' + d.slice(4);
  else if (d.startsWith('972')) d = '0' + d.slice(3);
  d = d.replace(/\D/g, '');
  return /^05\d{8}$/.test(d) ? d : null;
}

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export function makeRefCode() {
  const a = new Uint8Array(6);
  (globalThis.crypto || window.crypto).getRandomValues(a);
  return Array.from(a, (n) => ALPHABET[n % ALPHABET.length]).join('');
}

