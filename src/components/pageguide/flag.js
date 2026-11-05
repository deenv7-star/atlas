/**
 * feat/pages-clarity (05.11.2026): two designs for the "what this page does for you" layer.
 *   a = guide card (text first: what, gain, 3 steps, actions, one small example row)
 *   b = example first (a realistic filled preview marked "דוגמה", then 3 steps and the actions)
 * Pick with ?clarity=a|b (remembered on this device) or VITE_PAGES_CLARITY at build time. Default = DEFAULT_VARIANT.
 */
export const DEFAULT_VARIANT = 'b';
const KEY = 'atlas_pages_clarity';
const ok = (v) => v === 'a' || v === 'b';

export function clarityVariant() {
  try {
    const u = new URLSearchParams(window.location.search).get('clarity');
    if (ok(u)) { localStorage.setItem(KEY, u); return u; }
    const s = localStorage.getItem(KEY);
    if (ok(s)) return s;
  } catch { /* private mode */ }
  const env = import.meta.env?.VITE_PAGES_CLARITY;
  return ok(env) ? env : DEFAULT_VARIANT;
}
