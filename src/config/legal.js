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
  BUSINESS_NAME: 'דין וינוקור', // Deen approved publishing, 18.10.2026 (operating brand: atlas)
  BUSINESS_TYPE: 'עוסק פטור', // Deen, 18.10.2026
  BUSINESS_ID: '315492124', // Deen, 18.10.2026
  BUSINESS_ADDRESS: 'המעגן 3, דירה 21, נהריה 2221622', // Deen, 18.10.2026
  BUSINESS_PHONE: '052-597-9520', // Deen, 18.10.2026 (same number as WhatsApp)

  /* ---- Contact ---- */
  SUPPORT_EMAIL: 'support@atlas-il.com', // live since 18.10.2026: ImprovMX forwarding to deenv7@gmail.com (MX + SPF verified)
  PRIVACY_EMAIL: 'support@atlas-il.com', // same inbox as SUPPORT_EMAIL
  WHATSAPP_NUMBER_INTL: '972525979520', // Deen's number (confirmed, PR #93)
  WHATSAPP_DISPLAY: '052-597-9520',

  /* ---- Accessibility (תקנה 35ה) ---- */
  ACCESSIBILITY_COORDINATOR_NAME: 'דין וינוקור', // Deen, 18.10.2026
  ACCESSIBILITY_COORDINATOR_PHONE: '052-597-9520',
  ACCESSIBILITY_COORDINATOR_EMAIL: 'support@atlas-il.com',
  ACCESSIBILITY_LAST_REVIEW: '18 באוקטובר 2026', // automated axe-core + manual keyboard review of the public pages, see qa/pages-v1/report.md

  /* ---- Privacy officer (only if Amendment 13 requires one; leave null otherwise) ---- */
  DPO_NAME: null,

  /* ---- Dates ---- */
  LEGAL_LAST_UPDATED: '18 באוקטובר 2026',
  LEGAL_EFFECTIVE_DATE: '18 באוקטובר 2026', // go-live of these documents; update to the merge date if later

  /* ---- Cancellation (Deen's business decision) ---- */
  // One sentence, e.g. 'ATLAS לא גובה דמי ביטול.' or 'ATLAS גובה דמי ביטול בשיעור זה.'
  // Approved by Deen 18.10.2026: no cancellation fee at all.
  CANCELLATION_FEE_POLICY: 'atlas לא גובה דמי ביטול.',

  /* ---- Courts ---- */
  JURISDICTION_CITY: 'חיפה', // approved by Deen 18.10.2026 (district of the business address, Nahariya)

  /* ---- Founder (About page) ---- */
  FOUNDER_NAME: 'דין וינוקור',
  FOUNDER_NAME_EN: 'Deen Vinokur',
  FOUNDER_ROLE: 'מייסד',
  FOUNDER_BIO: null, // a few sentences in Deen's words (background, why atlas)
  FOUNDER_PHOTO: null, // path under /public, e.g. '/about/deen.webp'
};

/** Short business identity line for footers, contact and payment pages. */
export const BUSINESS_LINE = [LEGAL.BUSINESS_NAME, LEGAL.BUSINESS_TYPE && LEGAL.BUSINESS_ID ? `${LEGAL.BUSINESS_TYPE} ${LEGAL.BUSINESS_ID}` : null]
  .filter(Boolean).join(', ');

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
  // OpenAI: live since 20.10.2026 — the ai-chat edge function ("שאלו את atlas") sends the question plus the
  // business facts it needs to OpenAI; OPENAI_API_KEY is a Supabase secret (verified 19.10.2026).
  { name: 'OpenAI', role: 'מענה לשאלות בעוזר "שאלו את atlas" (השאלה ונתוני העסק הנדרשים לתשובה)', where: 'ארצות הברית', url: 'https://openai.com/policies/privacy-policy' },
];

/** Returns the value, or null when it still needs to be filled. */
export function legalValue(key) {
  const v = LEGAL[key];
  return v === undefined || v === null || v === '' ? null : v;
}

export function missingLegalKeys(keys = REQUIRED_FOR_LAUNCH) {
  return keys.filter((k) => legalValue(k) === null);
}
