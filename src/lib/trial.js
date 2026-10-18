/**
 * Trial day counting (pure, no imports so it can be unit-tested with `node --test`).
 *
 * Days are counted as CALENDAR days in the device's time zone, never as raw milliseconds / 24h.
 * Why: a trial that starts on 18 Oct and ends 14 calendar days later (setDate + 14) crosses the
 * end of Israeli summer time (25 Oct 2026), so it is 14 days + 1 hour long in absolute time.
 * The old `Math.ceil(ms / 86400000)` turned that extra hour into a 15th day right after signup.
 */
export const TRIAL_DAYS = 14;

const DAY_MS = 86400000;

function calendarIndex(d) {
  // Local Y/M/D mapped onto UTC midnights, so DST shifts never change the difference.
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS;
}

/** Trial end for an account that has no trial_ends_at yet: same wall-clock time, 14 calendar days later. */
export function defaultTrialEnd(start) {
  if (!start) return null;
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d;
}

/**
 * Whole calendar days left until the trial ends.
 * Signup day → 14, the day before the end → 1, the last day (end later today) → 0, after the end → 0.
 */
export function trialDaysLeft(trialEndsAt, now = new Date()) {
  if (!trialEndsAt) return 0;
  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime()) || end <= now) return 0;
  return Math.max(0, Math.round(calendarIndex(end) - calendarIndex(now)));
}

/** Banner line: "נשארו 14 ימים לתקופת הניסיון" … "נשאר יום אחד…" … "מסתיימת היום". */
export function trialBannerText(daysLeft, isExpired = false) {
  if (isExpired) return 'תקופת הניסיון הסתיימה';
  if (daysLeft <= 0) return 'תקופת הניסיון מסתיימת היום';
  if (daysLeft === 1) return 'נשאר יום אחד לתקופת הניסיון';
  if (daysLeft === 2) return 'נשארו יומיים לתקופת הניסיון';
  return `נשארו ${daysLeft} ימים לתקופת הניסיון`;
}

/** Short title for the sidebar trial card. */
export function trialShortText(daysLeft, isExpired = false) {
  if (isExpired) return 'הניסיון הסתיים';
  if (daysLeft <= 0) return 'הניסיון מסתיים היום';
  if (daysLeft === 1) return 'נשאר יום ניסיון אחד';
  if (daysLeft === 2) return 'נשארו יומיים לניסיון';
  return `נשארו ${daysLeft} ימי ניסיון`;
}
