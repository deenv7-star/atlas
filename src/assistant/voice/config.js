/**
 * Voice ("דברו עם atlas") switches. On by default; VITE_ASSISTANT_VOICE=off hides the mic everywhere
 * (e.g. if the App Store review needs it off, or before voice-session is deployed).
 */
export const VOICE_ENABLED = String(import.meta.env.VITE_ASSISTANT_VOICE || '').toLowerCase() !== 'off';
export const VOICE_DAILY_MINUTES = 30;
export const RENEW_BEFORE_S = 20; // ask for the next slice this long before the current one ends
