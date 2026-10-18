/**
 * Guided tour state, per user (not per device).
 *
 *   - Supabase accounts: auth user_metadata.atlas_tour = { v, status, step, at }
 *     (status: 'pending' right after onboarding, 'done' / 'skipped' after). No migration needed.
 *   - Local demo accounts: the same object in localStorage, keyed by the user id.
 *   - A local copy is always kept too, so an offline / failed write never shows the tour twice.
 *
 * Starting the tour from anywhere (Settings, the account menu): startTour().
 */
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

/*
 * The account copy is read / written with a plain request to the auth API, not supabase.auth.updateUser():
 * updateUser fires USER_UPDATED, and the app's auth listener re-reads the user inside that event, which
 * locks supabase-js (a known deadlock) and would freeze sign-in for the rest of the visit.
 */
const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
function accessToken() {
  try {
    const key = supabase?.auth?.storageKey;
    const raw = key ? localStorage.getItem(key) : null;
    const s = raw ? JSON.parse(raw) : null;
    return s?.access_token || s?.currentSession?.access_token || null;
  } catch { return null; }
}
async function authUser(method, body) {
  const token = accessToken();
  if (!SB_URL || !token) throw new Error('no session');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(`${SB_URL.replace(/\/$/, '')}/auth/v1/user`, {
      method,
      headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`auth ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

export const TOUR_VERSION = 1;
const KEY = (uid) => `atlas.tour.v${TOUR_VERSION}.${uid || 'anon'}`;
const EVT = 'atlas:tour';
const VOICE_KEY = 'atlas.tour.voice';
let writes = Promise.resolve();

function readLocal(uid) {
  try { const v = JSON.parse(localStorage.getItem(KEY(uid)) || 'null'); return v && typeof v === 'object' ? v : null; } catch { return null; }
}
function writeLocal(uid, v) {
  try { localStorage.setItem(KEY(uid), JSON.stringify(v)); } catch { /* private mode */ }
}

/** { status: 'pending'|'done'|'skipped'|null, step } for this user. */
export async function getTourState(user) {
  const uid = user?.id;
  const local = readLocal(uid);
  // Finished / skipped on this device: nothing to show, so no account read on every screen load.
  if (local && (local.status === 'done' || local.status === 'skipped')) return local;
  if (isSupabaseConfigured && supabase) {
    try {
      const u = await authUser('GET');
      const meta = u?.user_metadata?.atlas_tour;
      if (meta && meta.v === TOUR_VERSION) {
        // the newest of the two wins (a local "done" written while the network was down)
        if (local?.at && meta.at && local.at > meta.at) return local;
        return meta;
      }
    } catch { /* offline: fall back to the local copy */ }
  }
  return local || { v: TOUR_VERSION, status: null, step: 0 };
}

export async function setTourState(user, patch) {
  const uid = user?.id;
  const next = { v: TOUR_VERSION, status: null, step: 0, ...(readLocal(uid) || {}), ...patch, at: Date.now() };
  writeLocal(uid, next);
  if (isSupabaseConfigured && supabase) {
    // one write at a time, in order: a slow "step 1" must never land after "step 2"
    writes = writes.then(() => authUser('PUT', { data: { atlas_tour: next } })).catch(() => { /* the local copy stays */ });
    await writes;
  }
  return next;
}

/** Called when onboarding finishes: the tour opens on the first visit to the app. */
export function markTourPending(user) {
  return setTourState(user, { status: 'pending', step: 0 });
}

/** Opens the tour now (from Settings or the account menu). */
export function startTour(step = 0) {
  try { window.dispatchEvent(new CustomEvent(EVT, { detail: { step } })); } catch { /* old browsers */ }
}
export function onTourStart(cb) {
  const h = (e) => cb(e?.detail?.step || 0);
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}

/** Voice-over preference (default off). Device-level on purpose: sound is about where you are. */
export function voicePref() {
  try { return localStorage.getItem(VOICE_KEY) === '1'; } catch { return false; }
}
export function setVoicePref(on) {
  try { localStorage.setItem(VOICE_KEY, on ? '1' : '0'); } catch { /* ignore */ }
}
