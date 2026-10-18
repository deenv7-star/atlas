/**
 * Business settings that the live database (schema level 7) has no column for yet:
 * check-in / check-out times, the WhatsApp signature and greeting, the deposit preference,
 * the complex type and the complex cover photo.
 *
 * They always live on this device (localStorage, per organization, read synchronously). When the
 * database has migration 010_org_settings.sql (organizations.settings jsonb) they are also written
 * there, and pulled back in after sign-in, so every device sees them. 010 is detected at runtime
 * (the first read or write tells us), independent of VITE_DB_SCHEMA_LEVEL. Readers never care where
 * they came from.
 */
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { isMissingSchemaError } from '@/config/dbFeatures';

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

/** null = not known yet, true = organizations.settings exists, false = migration 010 missing (stay local). */
let dbColumn = null;
const dbUsable = () => Boolean(isSupabaseConfigured && supabase && dbColumn !== false);
const isRealOrgId = (id) => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id);

function storeLocal(orgId, next) {
  try {
    localStorage.setItem(KEY(orgId), JSON.stringify(next));
  } catch {
    // a big cover photo can exceed the quota: keep everything else
    try { localStorage.setItem(KEY(orgId), JSON.stringify({ ...next, cover_photo: '' })); } catch { /* ignore */ }
  }
}

async function pushToDb(orgId, next) {
  if (!dbUsable() || !isRealOrgId(orgId)) return false;
  try {
    const { error } = await supabase.from('organizations').update({ settings: next }).eq('id', orgId);
    if (error) { if (isMissingSchemaError(error)) dbColumn = false; return false; }
    dbColumn = true;
    return true;
  } catch { return false; }
}

const pulled = new Set();
/**
 * After sign-in: bring this org's settings from the database onto this device (the database wins),
 * or, when the database has none yet but this device does (set up before 010), send them up once.
 * Never throws; without migration 010 it just leaves the local copy alone.
 */
export async function syncOrgSettingsFromDb(orgId) {
  if (!dbUsable() || !isRealOrgId(orgId) || pulled.has(orgId)) return;
  pulled.add(orgId);
  try {
    const { data, error } = await supabase.from('organizations').select('settings').eq('id', orgId).maybeSingle();
    if (error) { if (isMissingSchemaError(error)) dbColumn = false; else pulled.delete(orgId); return; }
    dbColumn = true;
    const remote = data?.settings && typeof data.settings === 'object' ? data.settings : {};
    if (Object.keys(remote).length) {
      let local = {};
      try { local = JSON.parse(localStorage.getItem(KEY(orgId)) || '{}') || {}; } catch { /* ignore */ }
      storeLocal(orgId, { ...local, ...remote });
    } else if (hasOrgSettings(orgId)) {
      await pushToDb(orgId, readOrgSettings(orgId));
    }
  } catch { pulled.delete(orgId); }
}
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
  storeLocal(orgId, next);
  setActiveOrg(orgId);
  await pushToDb(orgId, next); // local copy stays when the database can't take it
  return next;
}
