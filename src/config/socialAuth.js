/**
 * Where the "המשך עם Google / Apple" buttons sit on /login and /register (Deen's A/B rule, 19.10.2026).
 *  'above' (A): the providers first, then "או", then the email form.
 *  'below' (B): the email form first, then "או", then the providers.
 * Which providers show is decided by env flags in src/lib/auth/socialAuth.js (VITE_AUTH_GOOGLE / VITE_AUTH_APPLE).
 */
export const SOCIAL_LAYOUT = 'below';
