/**
 * iOS app notifications: the pure parts, unit tested (tests/unit/notify.test.mjs).
 *
 *   - Check-in morning reminder (local notification, no server): 09:00 Asia/Jerusalem on the day guests
 *     arrive, whatever time zone the phone is set to. One notification per day (several arrivals share it).
 *     Scheduled from booking data every time the app opens, diffed against what iOS already holds, so a
 *     moved, renamed or cancelled booking updates / cancels its reminder.
 *   - When to show the Hebrew pre-prompt before the iOS permission dialog (never on first launch).
 *   - Push token save errors: a missing device_tokens table (migration 029 not applied yet) is expected.
 */

export const TZ = 'Asia/Jerusalem';
export const REMINDER_TIME = '09:00';
export const REMINDER_KIND = 'checkin-morning';
/** iOS keeps at most 64 pending local notifications per app; stay well under it. */
export const MAX_REMINDERS = 40;
export const NOTIFY_PREF_KEY = 'atlas.notify.v1';

const INACTIVE = new Set(['CANCELLED', 'CANCELED', 'WAITLIST', 'DECLINED', 'NO_SHOW']);

// ── Asia/Jerusalem wall clock ⇄ UTC (same method as supabase/functions/automation-runner) ──────────────
function ilParts(d) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, minute: Number(p.minute) };
}

/** Today's date in Israel, YYYY-MM-DD. */
export function ilDate(d = new Date()) {
  return ilParts(d).date;
}

/** YYYY-MM-DD + HH:MM on the Israeli wall clock → the real instant (handles IST / IDT). */
export function ilToUtc(dateISO, hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  const [Y, M, D] = String(dateISO).split('-').map(Number);
  const want = Date.UTC(Y, M - 1, D, h, m);
  let guess = want;
  for (let i = 0; i < 3; i++) {
    const p = ilParts(new Date(guess));
    const [y2, m2, d2] = p.date.split('-').map(Number);
    const shown = Date.UTC(y2, m2 - 1, d2, p.hour, p.minute);
    if (shown === want) break;
    guess += want - shown;
  }
  return new Date(guess);
}

/** Stable numeric id per day (iOS / the plugin need an int32): 2026-11-05 → 20261105. */
export function reminderId(dateISO) {
  return Number(String(dateISO).replace(/-/g, ''));
}

const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '').slice(0, 10));
const day = (s) => String(s).slice(0, 10);

function isReminderBooking(b) {
  if (!b || !isDay(b.check_in_date)) return false;
  if (INACTIVE.has(String(b.status || '').toUpperCase())) return false;
  if (/^חסום/.test(String(b.guest_name || '').trim())) return false; // owner's blocked dates, not guests
  return true;
}

function joinNames(names) {
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return `${names[0]} ו${names[1]}`;
  return `${names[0]}, ${names[1]} ועוד ${names.length - 2}`;
}

/** Notification text for one day's arrivals. */
export function reminderText(list, propsById = new Map()) {
  if (list.length === 1) {
    const b = list[0];
    const guest = String(b.guest_name || '').trim();
    const p = propsById.get(b.unit_id) || propsById.get(b.property_id) || null;
    const unit = String(b.unit_name || p?.name || '').trim();
    const time = String(b.check_in_time || p?.check_in_time || p?.guest_info?.check_in_time || '').slice(0, 5);
    const title = guest ? `הגעה היום: ${guest}` : 'אורחים מגיעים היום';
    const parts = [unit, time ? `כניסה מ-${time}` : ''].filter(Boolean);
    return { title, body: parts.length ? parts.join(', ') : 'פרטי ההזמנה מחכים ב-atlas' };
  }
  const names = list.map((b) => String(b.guest_name || '').trim()).filter(Boolean);
  return { title: `${list.length} הגעות היום`, body: names.length ? joinNames(names) : 'פרטי ההזמנות מחכים ב-atlas' };
}

/**
 * Bookings → the reminders iOS should hold right now.
 * [{ id, at (ISO), title, body, extra: { kind, date, bookingId? } }], soonest first, only future instants.
 */
export function planCheckinReminders(bookings, { now = new Date(), properties = [], max = MAX_REMINDERS } = {}) {
  const propsById = new Map((properties || []).filter(Boolean).map((p) => [p.id, p]));
  const byDay = new Map();
  for (const b of bookings || []) {
    if (!isReminderBooking(b)) continue;
    const d = day(b.check_in_date);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d).push(b);
  }
  const t = new Date(now).getTime();
  const out = [];
  for (const d of [...byDay.keys()].sort()) {
    const at = ilToUtc(d, REMINDER_TIME);
    if (at.getTime() <= t) continue;
    const list = byDay.get(d).sort((a, b) => String(a.guest_name || '').localeCompare(String(b.guest_name || ''), 'he'));
    const { title, body } = reminderText(list, propsById);
    const extra = { kind: REMINDER_KIND, date: d };
    if (list.length === 1 && list[0].id) extra.bookingId = String(list[0].id);
    out.push({ id: reminderId(d), at: at.toISOString(), title, body, extra });
    if (out.length >= max) break;
  }
  return out;
}

/** A pending iOS notification is one of ours (check-in reminders)? Older ones without extra: by id range. */
export function isOurReminder(n) {
  if (n?.extra?.kind) return n.extra.kind === REMINDER_KIND;
  const id = Number(n?.id);
  return Number.isInteger(id) && id >= 20000101 && id <= 29991231;
}

const pendingAt = (n) => {
  const v = n?.schedule?.at ?? n?.at;
  const ms = v ? new Date(v).getTime() : NaN;
  return Number.isFinite(ms) ? ms : null;
};
const same = (p, w) => p.title === w.title && p.body === w.body && pendingAt(p) === new Date(w.at).getTime();

/**
 * What to cancel and what to (re)schedule so iOS holds exactly `wanted`. Notifications that are not
 * check-in reminders are never touched. A changed reminder is cancelled and scheduled again.
 */
export function diffReminders(pending, wanted) {
  const ours = (pending || []).filter(isOurReminder);
  const byId = new Map(ours.map((n) => [Number(n.id), n]));
  const wantIds = new Set(wanted.map((w) => w.id));
  const cancel = ours.filter((n) => !wantIds.has(Number(n.id))).map((n) => Number(n.id));
  const schedule = [];
  for (const w of wanted) {
    const p = byId.get(w.id);
    if (p && same(p, w)) continue;
    if (p) cancel.push(w.id);
    schedule.push(w);
  }
  return { cancel, schedule };
}

// ── pre-prompt ───────────────────────────────────────────────────────────────────────────────────
export function readNotifyPrefs(storage) {
  try {
    const p = JSON.parse(storage?.getItem(NOTIFY_PREF_KEY) || 'null') || {};
    return {
      asked: Number(p.asked) || 0,
      lastAskedAt: Number(p.lastAskedAt) || 0,
      outcome: ['granted', 'denied', 'later'].includes(p.outcome) ? p.outcome : '',
      remindersOff: Boolean(p.remindersOff),
    };
  } catch {
    return { asked: 0, lastAskedAt: 0, outcome: '', remindersOff: false };
  }
}

export function writeNotifyPrefs(storage, patch) {
  const next = { ...readNotifyPrefs(storage), ...patch };
  try { storage?.setItem(NOTIFY_PREF_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export const PRE_PROMPT_MAX = 3;
export const PRE_PROMPT_GAP_MS = 7 * 24 * 60 * 60 * 1000;
/** App screens where the question makes sense (the owner is looking at their guests). */
const PROMPT_PATH = /^\/(dashboard|today|bookings|calendar|booking)(\/|$)/i;

/**
 * The meaningful moment: signed in, on Today / bookings / calendar, at least one upcoming arrival (so the
 * reminder means something), iOS has not been asked yet, no other one-time sheet this session (the Face ID
 * offer right after the first sign-in), not asked in the last 7 days, at most 3 times ever.
 */
export function shouldPrePrompt({ native, signedIn, locked, permission, prefs, path, hasUpcoming, sheetShownThisSession, now = Date.now() }) {
  if (!native || !signedIn || locked || !hasUpcoming || sheetShownThisSession) return false;
  if (!['prompt', 'prompt-with-rationale'].includes(String(permission || ''))) return false;
  if (!prefs || prefs.outcome === 'granted' || prefs.outcome === 'denied') return false;
  if (prefs.asked >= PRE_PROMPT_MAX) return false;
  if (prefs.lastAskedAt && now - prefs.lastAskedAt < PRE_PROMPT_GAP_MS) return false;
  return PROMPT_PATH.test(String(path || ''));
}

/** At least one active arrival today-or-later (Israel date)? */
export function hasUpcomingArrival(bookings, now = new Date()) {
  const t = ilDate(now);
  return (bookings || []).some((b) => isReminderBooking(b) && day(b.check_in_date) >= t);
}

// ── push token save ────────────────────────────────────────────────────────────────────────────────
/**
 * Supabase / PostgREST says device_tokens or its RPC is not there (migration 029 not applied yet): expected,
 * stay quiet and retry on the next open.
 */
export function isMissingTableError(err) {
  const code = String(err?.code || '');
  const msg = `${err?.message || ''} ${err?.details || ''} ${err?.hint || ''}`;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(code)) return true;
  return /relation .*device_tokens.* does not exist|could not find the (table|function)|register_device_token/i.test(msg);
}

/** Only in-app paths from a notification payload (never an outside URL). */
export function safeAppPath(v) {
  const s = String(v || '');
  return /^\/(?!\/)[A-Za-z0-9/_\-?=&.%]*$/.test(s) ? s : '';
}
