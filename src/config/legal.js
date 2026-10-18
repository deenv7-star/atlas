/**
 * Legal + business details for every public page (privacy, terms, accessibility,
 * cookies, cancellation, data processing, security, about, contact, footer, JSON-LD).
 *
 * ONE place to fill in. A value left as `null` is never invented and never shown as {{KEY}}:
 * the sentence or list line that needs it is left out, or it reads "יעודכן בקרוב"
 * (see src/site/lib/md.jsx for the {?…?} / {+KEY …+} / {!KEY …!} rules).
 * `npm run check:legal` lists what is still missing (it also runs after `npm run build`).
 *
 * Nothing here was guessed. Known facts carry a comment saying where they come from.
 */
export const LEGAL = {
  /* ---- Legal entity (operator of the service) ---- */
  BUSINESS_NAME: null, // e.g. 'אטלס מערכות בע"מ' or the owner's name if עוסק מורשה
  BUSINESS_TYPE: null, // 'חברה בע"מ' / 'עוסק מורשה' / 'עוסק פטור'
  BUSINESS_ID: null, // ח.פ. / ע.מ. number
  BUSINESS_ADDRESS: null, // street, city (required for cancellation notices by mail)
  BUSINESS_PHONE: null, // phone for cancellation / support calls (consumer law asks for one)

  /* ---- Contact ---- */
  SUPPORT_EMAIL: null, // atlas-il.com has no inbound mail (no MX record) as of 18.10.2026
  PRIVACY_EMAIL: null, // may be the same inbox as SUPPORT_EMAIL
  WHATSAPP_NUMBER_INTL: '972545380085', // number already published on the site (landing v5 content.js). Verify it is Deen's.
  WHATSAPP_DISPLAY: '054-538-0085',

  /* ---- Accessibility (תקנה 35ה) ---- */
  ACCESSIBILITY_COORDINATOR_NAME: null,
  ACCESSIBILITY_COORDINATOR_PHONE: null,
  ACCESSIBILITY_COORDINATOR_EMAIL: null,
  ACCESSIBILITY_LAST_REVIEW: '18 באוקטובר 2026', // automated axe-core + manual keyboard review of the public pages, see qa/pages-v1/report.md

  /* ---- Privacy officer (only if Amendment 13 requires one; leave null otherwise) ---- */
  DPO_NAME: null,

  /* ---- Dates ---- */
  LEGAL_LAST_UPDATED: '18 באוקטובר 2026',
  LEGAL_EFFECTIVE_DATE: null, // the date these documents go live

  /* ---- Cancellation (Deen's business decision) ---- */
  // One sentence, e.g. 'ATLAS לא גובה דמי ביטול.' or 'ATLAS גובה דמי ביטול בשיעור זה.'
  CANCELLATION_FEE_POLICY: null,

  /* ---- Courts ---- */
  JURISDICTION_CITY: null, // e.g. 'חיפה' or 'תל אביב-יפו'

  /* ---- Founder (About page) ---- */
  FOUNDER_NAME: 'דין וינוקור',
  FOUNDER_NAME_EN: 'Deen Vinokur',
  FOUNDER_ROLE: 'מייסד',
  FOUNDER_BIO: null, // a few sentences in Deen's words (background, why ATLAS)
  FOUNDER_PHOTO: null, // path under /public, e.g. '/about/deen.webp'
};

/** Placeholder keys that must be filled before the legal pages go live. */
export const REQUIRED_FOR_LAUNCH = [
  'BUSINESS_NAME',
  'BUSINESS_TYPE',
  'BUSINESS_ID',
  'BUSINESS_ADDRESS',
  'BUSINESS_PHONE',
  'SUPPORT_EMAIL',
  'PRIVACY_EMAIL',
  'ACCESSIBILITY_COORDINATOR_NAME',
  'ACCESSIBILITY_COORDINATOR_PHONE',
  'ACCESSIBILITY_COORDINATOR_EMAIL',
  'LEGAL_EFFECTIVE_DATE',
  'JURISDICTION_CITY',
  'CANCELLATION_FEE_POLICY',
];

export const WHATSAPP_URL = `https://wa.me/${LEGAL.WHATSAPP_NUMBER_INTL}`;

/** Service providers that process data for ATLAS (verified in code + Supabase Management API, 18.10.2026). */
export const SUBPROCESSORS = [
  { name: 'Supabase', role: 'מסד נתונים, התחברות לחשבון ואחסון קבצים', where: 'שרתי AWS באזור eu-central-1 (פרנקפורט, גרמניה)', url: 'https://supabase.com/privacy' },
  { name: 'Vercel', role: 'אירוח האתר והאפליקציה והגשתם לדפדפן', where: 'רשת שרתים גלובלית', url: 'https://vercel.com/legal/privacy-policy' },
  { name: 'Resend', role: 'שליחת מיילים של מערכת (אימות חשבון, איפוס סיסמה)', where: 'ארצות הברית', url: 'https://resend.com/legal/privacy-policy' },
  // OpenAI: the in-app help bot code can call OpenAI, but no OPENAI_API_KEY secret is set on the
  // live project (18.10.2026). Add it here the day an AI provider is switched on.
];

/** Returns the value, or null when it still needs to be filled. */
export function legalValue(key) {
  const v = LEGAL[key];
  return v === undefined || v === null || v === '' ? null : v;
}

export function missingLegalKeys(keys = REQUIRED_FOR_LAUNCH) {
  return keys.filter((k) => legalValue(k) === null);
}
