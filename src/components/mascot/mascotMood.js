/**
 * The atlas glow face's mood: ONE small state machine for the whole app.
 * Screens emit events (emitMascot('success')), every live <AtlasFace live /> reads the same mood.
 * Pure: no React, no DOM at import time, so tests/unit/mascot-mood.test.mjs runs it with `node --test`.
 *
 * Priority (highest first):
 *   1. a reaction for a moment   happy (answer / success), concerned (error)
 *   2. what is happening now      thinking (waiting for an answer), typing (atlas writes), attentive (you type)
 *   3. rest                       sleepy after a long idle or late at night (23:00–05:59), else the face's own base
 *
 * Gaze: a point on screen the eyes turn to for a moment (the input while you type, a new toast).
 */

export const IDLE_MS = 90_000;
export const HOLD = {
  happy: 2400, // answer arrived / something saved
  concerned: 3600, // something failed
  attentive: 1400, // after the last keystroke
  gaze: 1600, // looking at a new toast / message
};

export function isLateNight(date) {
  const h = date.getHours();
  return h >= 23 || h < 6;
}

export function createMascotState(now = 0) {
  return { flash: null, flashUntil: 0, sustained: null, attentiveUntil: 0, lastActivity: now, gaze: null, gazeUntil: 0, bounce: 0, seq: 0 };
}

/**
 * @param {ReturnType<typeof createMascotState>} s
 * @param {{ type: string, at?: {x:number,y:number}|null }} ev
 * @param {number} now ms
 */
export function reduceMascot(s, ev, now) {
  const n = { ...s, seq: s.seq + 1, lastActivity: now };
  switch (ev.type) {
    case 'activity':
      return n;
    case 'user-typing':
      n.attentiveUntil = now + HOLD.attentive;
      if (ev.at) { n.gaze = ev.at; n.gazeUntil = now + HOLD.attentive; }
      return n;
    case 'waiting':
      n.sustained = 'thinking'; n.attentiveUntil = 0; n.flash = null; n.flashUntil = 0;
      return n;
    case 'responding':
      n.sustained = 'typing'; n.attentiveUntil = 0;
      return n;
    case 'answer':
      n.sustained = null; n.flash = 'happy'; n.flashUntil = now + HOLD.happy;
      return n;
    case 'success':
      n.flash = 'happy'; n.flashUntil = now + HOLD.happy; n.bounce = s.bounce + 1;
      return n;
    case 'error':
      n.sustained = null; n.flash = 'concerned'; n.flashUntil = now + HOLD.concerned;
      return n;
    case 'idle-reset':
      n.sustained = null;
      return n;
    case 'look':
      if (ev.at) { n.gaze = ev.at; n.gazeUntil = now + HOLD.gaze; }
      return n;
    default:
      return s;
  }
}

/**
 * The mood a face shows right now.
 * @param {ReturnType<typeof createMascotState>} s
 * @param {number} now ms
 * @param {{ base?: string, date?: Date }} [opts]
 */
export function moodOf(s, now, { base = 'neutral', date } = {}) {
  if (s.flash && s.flashUntil > now) return s.flash;
  if (s.sustained) return s.sustained;
  if (s.attentiveUntil > now) return 'attentive';
  if (now - s.lastActivity > IDLE_MS) return 'sleepy';
  if (date && isLateNight(date)) return 'sleepy';
  return base;
}

/** Where the eyes look now (screen point) or null. Thinking keeps its own upward drift. */
export function gazeOf(s, now) {
  if (s.sustained === 'thinking') return null;
  return s.gaze && s.gazeUntil > now ? s.gaze : null;
}

/** The next moment the derived mood can change by itself (so one timer is enough). */
export function nextChangeAt(s, now) {
  const t = [s.flashUntil, s.attentiveUntil, s.gazeUntil, s.lastActivity + IDLE_MS + 1].filter((x) => x > now);
  return t.length ? Math.min(...t) : null;
}

/** Eye offset (viewBox units) toward a screen point, from the face's own box. Max ±6 x, ±5 y. */
export function eyeOffset(rect, point) {
  if (!rect || !point) return { x: 0, y: 0 };
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = point.x - cx;
  const dy = point.y - cy;
  const d = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, d / 160); // close targets: a smaller turn
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return { x: 0, y: 0 };
  // original v3 range (face units): bounded, the eyes stay inside the face
  return { x: Math.round((dx / d) * 6 * k * 10) / 10, y: Math.round((dy / d) * 5 * k * 10) / 10 };
}
