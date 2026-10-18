/**
 * Terms + privacy consent (Upay / Bit / Diners requirement, 18.10.2026).
 * The checkbox is unchecked by default and blocks signup and every ATLAS payment step until ticked.
 * Bump TERMS_VERSION whenever terms.md / privacy.md change materially: it is stored with each signup.
 */
export const TERMS_VERSION = '2026-10-18';

/** Visual variant of the consent row: 'inline' (A, minimal) or 'card' (B, card-style). */
export const CONSENT_VARIANT = 'card';
