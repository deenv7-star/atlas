/**
 * Units created automatically at sign-up are named after the account ("Deen Vinokur's Organization").
 * That name is the account, not the unit: never show it as a unit. Fall back to a plain Hebrew name.
 */
const PLACEHOLDER_RE = /(['’]s\s+(organization|org|workspace|property)$)|^(organization|my organization|default|property|unit)\s*\d*$/i;

export function isPlaceholderUnitName(name, orgName = '') {
  const n = String(name || '').trim();
  if (!n) return true;
  if (orgName && n.toLowerCase() === String(orgName).trim().toLowerCase()) return true;
  return PLACEHOLDER_RE.test(n);
}

/** Name to show for a unit; `index` (0-based) numbers the fallback when there are several. */
export function unitDisplayName(name, { orgName = '', index = 0, total = 1 } = {}) {
  if (!isPlaceholderUnitName(name, orgName)) return String(name).trim();
  return total > 1 ? `יחידה ${index + 1}` : 'היחידה שלכם';
}

/** Map [{id,name}] → [{id,name}] with display names. */
export function displayUnits(units = [], orgName = '') {
  return units.map((u, i) => ({ ...u, name: unitDisplayName(u.name, { orgName, index: i, total: units.length }) }));
}
