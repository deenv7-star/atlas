/**
 * persona-clarity (05.11.2026): ONE help entry, the labelled "עזרה" button in the top bar.
 *   'hub'  (default, recommended): the button opens the help panel, which starts with three clear blocks:
 *          שאלו את atlas (the assistant, voice or text) · דברו עם נציג (a person, 24/7) · מדריכים קצרים.
 *   'menu' (version B): the button opens a small menu with the same three rows; the help panel opens only for guides / a person.
 * Review override: ?help=menu|hub (kept in localStorage 'atlas_help_variant').
 */
const KEY = 'atlas_help_variant';
const VALID = ['hub', 'menu'];
export const HELP_VARIANT_DEFAULT = 'hub';

export function helpVariant() {
  if (typeof window === 'undefined') return HELP_VARIANT_DEFAULT;
  try {
    const q = new URLSearchParams(window.location.search).get('help');
    if (VALID.includes(q)) { localStorage.setItem(KEY, q); return q; }
    const v = localStorage.getItem(KEY);
    if (VALID.includes(v)) return v;
  } catch { /* ignore */ }
  return HELP_VARIANT_DEFAULT;
}
