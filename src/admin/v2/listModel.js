/** Customer list: filters, sort and paging as pure functions (unit-tested in tests/unit/admin-v2-list.test.mjs). */
import { testInfo } from './testAccounts.js';

const DAY = 864e5;
export const PAGE_SIZE = 25;

export const DEFAULT_FILTERS = { q: '', status: 'all', plan: 'all', signup: 'any', active: 'any', units: 'any', tests: 'hide' };

export const SIGNUP = { any: 'כל זמן', '7': '7 ימים', '30': '30 יום', '90': '90 יום', older: 'לפני יותר מ-90 יום' };
export const ACTIVE = { any: 'כל פעילות', '1': 'היום', '7': 'השבוע', '30': '30 יום', stale: 'לא פעילים 30+ יום', never: 'לא נכנסו מעולם' };
/* Object keys like '7' are integer-like and JS lists them first, so the menu order lives here. */
export const SIGNUP_ORDER = ['any', '7', '30', '90', 'older'];
export const ACTIVE_ORDER = ['any', '1', '7', '30', 'stale', 'never'];
export const UNITS = { any: 'יחידות: הכל', yes: 'עם יחידות', no: 'בלי יחידות' };
export const TESTS = { hide: 'בלי חשבונות בדיקה', show: 'כולל בדיקה', only: 'רק בדיקה' };

export const SORTS = {
  created_at: { label: 'הצטרפות', type: 'date' },
  last_seen: { label: 'פעילות אחרונה', type: 'date' },
  org_name: { label: 'שם העסק', type: 'text' },
  units_count: { label: 'יחידות', type: 'num' },
  bookings_count: { label: 'הזמנות', type: 'num' },
  trial_ends_at: { label: 'סוף ניסיון', type: 'date' },
  mrr: { label: 'הכנסה חודשית', type: 'num' },
};

export const lastSeen = (c) => c.last_sign_in_at || c.last_active_at || null;

export function matches(c, f, now = Date.now()) {
  const t = testInfo(c).is_test;
  if (f.tests === 'hide' && t) return false;
  if (f.tests === 'only' && !t) return false;
  if (f.status !== 'all' && c.status !== f.status) return false;
  if (f.plan !== 'all' && c.plan_key !== f.plan) return false;
  if (f.units === 'yes' && !(c.units_count > 0)) return false;
  if (f.units === 'no' && c.units_count > 0) return false;
  if (f.signup !== 'any') {
    const age = (now - new Date(c.created_at).getTime()) / DAY;
    if (f.signup === 'older' ? age <= 90 : age > Number(f.signup)) return false;
  }
  if (f.active !== 'any') {
    const seen = lastSeen(c);
    const ago = seen ? (now - new Date(seen).getTime()) / DAY : Infinity;
    if (f.active === 'never') { if ('last_sign_in_at' in c ? c.last_sign_in_at : c.last_active_at) return false; }
    else if (f.active === 'stale') { if (ago < 30) return false; }
    else if (ago > Number(f.active)) return false;
  }
  const term = String(f.q || '').trim().toLowerCase();
  if (term) {
    const digits = term.replace(/\D/g, '');
    const hay = `${c.org_name || ''} ${c.owner_name || ''} ${c.owner_email || ''}`.toLowerCase();
    if (!hay.includes(term) && !(digits.length >= 3 && String(c.owner_phone || '').replace(/\D/g, '').includes(digits))) return false;
  }
  return true;
}

export function sortRows(rows, sort, valueOf = {}) {
  const spec = SORTS[sort.key] || SORTS.created_at;
  const dir = sort.dir === 'asc' ? 1 : -1;
  const get = valueOf[sort.key] || ((c) => (sort.key === 'last_seen' ? lastSeen(c) : c[sort.key]));
  return [...rows].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1; // empty values always last
    if (vb == null) return -1;
    if (spec.type === 'num') return (Number(va) - Number(vb)) * dir;
    if (spec.type === 'date') return (new Date(va).getTime() - new Date(vb).getTime()) * dir;
    return String(va).localeCompare(String(vb), 'he') * dir;
  });
}

export function paginate(rows, page, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const p = Math.min(Math.max(1, page), pages);
  return { page: p, pages, total: rows.length, from: rows.length ? (p - 1) * size + 1 : 0, to: Math.min(rows.length, p * size), rows: rows.slice((p - 1) * size, p * size) };
}

export function activeFilterCount(f) {
  return ['status', 'plan', 'signup', 'active', 'units'].filter((k) => f[k] !== DEFAULT_FILTERS[k]).length + (f.tests !== 'hide' ? 1 : 0);
}

/** URL <-> filters, so a filtered view can be shared or reloaded. */
export function filtersFromParams(sp) {
  const f = { ...DEFAULT_FILTERS };
  for (const k of Object.keys(DEFAULT_FILTERS)) { const v = sp.get(k); if (v != null && v !== '') f[k] = v; }
  return f;
}
export function filtersToParams(f, extra = {}) {
  const o = {};
  for (const [k, v] of Object.entries(f)) if (v !== DEFAULT_FILTERS[k] && v !== '') o[k] = v;
  for (const [k, v] of Object.entries(extra)) if (v != null && v !== '') o[k] = String(v);
  return o;
}
