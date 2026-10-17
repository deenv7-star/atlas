/**
 * Business settings that the live database (schema level 7) has no column for yet:
 * check-in / check-out times, the WhatsApp signature and greeting, the deposit preference,
 * the complex type and the complex cover photo.
 *
 * Until migration 010_org_settings.sql (organizations.settings jsonb) is applied they live on this
 * device (localStorage, per organization). With VITE_DB_SCHEMA_LEVEL >= 10 they are also written to
 * organizations.settings so every device sees them. Readers never care where they came from.
 */
import { DB_FEATURES } from '@/config/dbFeatures';
import { base44 } from '@/api/base44Client';

export const ORG_SETTINGS_DEFAULTS = {
  complex_type: '',
  check_in_time: '15:00',
  check_out_time: '11:00',
  host_name: '',
  host_phone: '',
  wa_greeting: '',
  deposit: 'none', // none | 30 | 50 | full
  cover_photo: '',
  owner_role: '',
  phone_verified: false,
  settlement: '',
  photos: [],
  channels_today: [],
  links: {},
  pay_methods: [],
};

const KEY = (orgId) => `atlas.org-settings.${orgId || 'local'}`;
const ACTIVE = 'atlas.active-org';

export function setActiveOrg(orgId) {
  try { if (orgId) localStorage.setItem(ACTIVE, String(orgId)); } catch { /* private mode */ }
}

export function activeOrgId() {
  try { return localStorage.getItem(ACTIVE) || ''; } catch { return ''; }
}

export function readOrgSettings(orgId = activeOrgId()) {
  try {
    const raw = localStorage.getItem(KEY(orgId));
    const v = raw ? JSON.parse(raw) : {};
    return { ...ORG_SETTINGS_DEFAULTS, ...(v && typeof v === 'object' ? v : {}) };
  } catch {
    return { ...ORG_SETTINGS_DEFAULTS };
  }
}

/** True once the owner saved anything here (so readers can tell "15:00 by default" from "15:00 chosen"). */
export function hasOrgSettings(orgId = activeOrgId()) {
  try { return !!localStorage.getItem(KEY(orgId)); } catch { return false; }
}

export async function writeOrgSettings(orgId, patch) {
  const next = { ...readOrgSettings(orgId), ...patch };
  try {
    localStorage.setItem(KEY(orgId), JSON.stringify(next));
  } catch {
    // a big cover photo can exceed the quota: keep everything else
    try { localStorage.setItem(KEY(orgId), JSON.stringify({ ...next, cover_photo: '' })); } catch { /* ignore */ }
  }
  setActiveOrg(orgId);
  if (DB_FEATURES.orgSettings && orgId) {
    try { await base44.entities.Organization.update(orgId, { settings: next }); } catch { /* local copy stays */ }
  }
  return next;
}
