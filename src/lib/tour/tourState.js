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

export const TOUR_VERSION = 1;
const KEY = (uid) => `atlas.tour.v${TOUR_VERSION}.${uid || 'anon'}`;
const EVT = 'atlas:tour';
const VOICE_KEY = 'atlas.tour.voice';

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
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getUser();
      const meta = data?.user?.user_metadata?.atlas_tour;
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
    try { await supabase.auth.updateUser({ data: { atlas_tour: next } }); } catch { /* the local copy stays */ }
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
