/**
 * Where inquiries (פניות) come from: the one catalog the inbox page and the integrations hub both read.
 *
 * For the integrations hub (feat/integrations-hub): import { LEAD_SOURCES, LEAD_SOURCES_HREF, leadSourceHref }
 * and link each card to leadSourceHref(id). The inbox opens the "חברו מקורות פניות" sheet on that source.
 * Do not copy the copy; read `title` / `line` from here so both screens stay identical.
 *
 * status:
 *   'live'         works today, nothing to approve
 *   'needs_deploy' code is ready (edge function lead-intake); turns live by itself once it is deployed
 *                  (the page probes it), see qa/leads-v2/DEPLOY.md
 *   'meta_review'  WhatsApp / Messenger / Instagram direct messages: need Meta's approval of the atlas app
 *   'soon'         not built yet (email capture)
 */

export const LEAD_SOURCES_HREF = '/leads?sources=1';
export const leadSourceHref = (id) => `${LEAD_SOURCES_HREF}&source=${encodeURIComponent(id)}`;

export const LEAD_SOURCES = [
  {
    id: 'link',
    channel: 'link',
    status: 'live',
    title: 'קישור לבדיקת תאריכים',
    line: 'אורחים בוחרים תאריכים פנויים ושולחים פנייה. היא נכנסת לכאן לבד.',
    where: ['אינסטגרם', 'פייסבוק', 'גוגל', 'אתרי צימרים'],
  },
  {
    id: 'whatsapp-reply',
    channel: 'whatsapp',
    status: 'live',
    title: 'הקישור בתשובה האוטומטית בוואטסאפ',
    line: 'מי שכותב לכם בוואטסאפ מקבל את הקישור, והפנייה שלו נרשמת כאן עם התאריכים.',
  },
  {
    id: 'site-button',
    channel: 'form',
    status: 'live',
    title: 'כפתור לאתר שלכם',
    line: 'מעתיקים קוד קצר לאתר. כל לחיצה פותחת את דף בדיקת התאריכים.',
  },
  {
    id: 'webhook',
    channel: 'webhook',
    status: 'needs_deploy',
    title: 'טפסים ומודעות לידים',
    line: 'כתובת אישית ל-Zapier או Make: טפסי אתר ומודעות לידים של פייסבוק נכנסים לכאן.',
  },
  {
    id: 'phone',
    channel: 'phone',
    status: 'live',
    title: 'שיחת טלפון',
    line: 'מישהו התקשר? רושמים שם וטלפון בפחות מדקה.',
  },
  { id: 'whatsapp', channel: 'whatsapp', status: 'meta_review', title: 'הודעות וואטסאפ', line: 'כל הודעה שתגיע לוואטסאפ העסקי תופיע כאן כשיחה.' },
  { id: 'instagram', channel: 'instagram', status: 'meta_review', title: 'הודעות אינסטגרם', line: 'הודעות ישירות מאינסטגרם, באותה רשימה.' },
  { id: 'messenger', channel: 'messenger', status: 'meta_review', title: 'הודעות מסנג׳ר', line: 'הודעות מעמוד הפייסבוק, באותה רשימה.' },
  { id: 'email', channel: 'email', status: 'soon', title: 'מיילים מאתר הצימר', line: 'פניות שמגיעות למייל ייכנסו לכאן.' },
];

export const SOURCE_STATUS_LABEL = {
  live: 'פעיל',
  needs_deploy: 'בקרוב',
  meta_review: 'בתהליך אישור מול Meta',
  soon: 'בקרוב',
};

/** Inquiry link for one unit, tagged with where it is posted (?src=instagram → "הגיעה דרך: אינסטגרם"). */
export function taggedLink(baseUrl, src) {
  if (!baseUrl) return '';
  return src ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}src=${encodeURIComponent(src)}` : baseUrl;
}

/** HTML for the owner's own website: a plain link styled as a button (no script, works on Wix/WordPress). */
export function siteButtonSnippet(url, label = 'בדיקת תאריכים פנויים') {
  return `<a href="${url}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#3E2BF1;color:#fff;font:600 16px/1 system-ui,sans-serif;text-decoration:none">${label}</a>`;
}

/** Ready text for WhatsApp Business "greeting / away message" with the tagged link. */
export function whatsappAutoReply(url, hostName = '') {
  const hi = hostName ? `שלום, כאן ${hostName}.` : 'שלום,';
  return `${hi} תודה שפניתם. לבדיקת תאריכים פנויים ושליחת בקשה: ${url}\nנחזור אליכם בהקדם.`;
}

/** Webhook URL for lead-intake (Zapier / Make / any form). */
export function webhookUrl(supabaseUrl, token) {
  if (!supabaseUrl || !token) return '';
  return `${String(supabaseUrl).replace(/\/$/, '')}/functions/v1/lead-intake?t=${token}`;
}
