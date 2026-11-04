// The brain's knowledge of atlas itself: the SAME knowledge base the help bot uses
// (supabase/functions/support-chat/kb, built from the code by scripts/support-kb/build-kb.mjs:
// curated how-tos + routes, navigation, prices and live features generated from src/).
// One source, so the assistant, the voice agent and the help bot can never disagree.
import kb from '../../support-chat/kb/kb.ts';
import { retrieve } from '../../support-chat/lib/prompt.ts';

export const KB = kb;
export const ROUTES = kb.routes;
export const ROUTE_SET = new Set(kb.routes.map((r) => r.path));

/** Apple 3.1.1: what the iOS app may not show (plan prices, paying for atlas, links to buy outside the app). */
const NATIVE_HIDDEN_FILES = new Set(['generated/pricing.md']);
const NATIVE_HIDDEN_HEADINGS = /המסלולים|איך משלמים על המנוי|החלפת מסלול|החזר כספי|אישור התקנון/;
const PRICE_LINE = /₪|מחיר.*מסלול|מסלול.*מחיר|atlas-il\.com\/(pricing|subscription|billing|register)/;
export const nativeSafe = (text) => String(text).split('\n').filter((l) => !PRICE_LINE.test(l)).join('\n');
const nativeOk = (c) => !NATIVE_HIDDEN_FILES.has(c.file) && !(c.file === 'curated/11-subscription.md' && NATIVE_HIDDEN_HEADINGS.test(c.heading));

/** Top sections for a question, trimmed so a tool result stays small (voice pays per token). `native`: iOS app. */
export function searchHelp(query, k = 4, maxChars = 3200, { native = false } = {}) {
  let hits = retrieve(kb, String(query || '').slice(0, 300), native ? k + 3 : k);
  if (native) hits = hits.filter(nativeOk).map((c) => ({ ...c, text: nativeSafe(c.text) })).filter((c) => c.text.trim()).slice(0, k);
  const out = [];
  let used = 0;
  for (const c of hits) {
    const text = c.text.length > 1400 ? `${c.text.slice(0, 1400)}…` : c.text;
    if (used + text.length > maxChars) break;
    used += text.length;
    out.push({ topic: c.heading.split(' › ').slice(-2).join(' › '), source: c.file, text });
  }
  return out;
}

const docText = (file) => kb.chunks.filter((c) => c.file === file).map((c) => c.text).join('\n');

/**
 * A short, always-present digest: where things are, what it costs, what does NOT work yet.
 * Text mode gets it in the system prompt; voice gets it in the session instructions.
 * Everything else is one search_help call away.
 */
export function kbDigest(maxChars = 5200, { native = false } = {}) {
  const parts = [
    ...(native ? [] : [['מחירים ומסלולים', docText('generated/pricing.md')]]),
    ['שאלו את atlas', docText('curated/16-assistant.md')],
    ['מה עוד לא עובד', docText('curated/13-limitations.md')],
    ['עזרה ונציג', docText('curated/15-support.md')],
    ['מפת המסכים', docText('generated/app-map.md')],
  ];
  let out = '';
  for (const [title, body] of parts) {
    // keep sub-headings (plan names, screen groups) as plain lines: dropping them once lost which price is which plan
    const clean = (native ? nativeSafe(body) : body).replace(/^#\s.*$/gm, '').replace(/^#{2,}\s+(.*)$/gm, '[$1]').replace(/\n{2,}/g, '\n').trim();
    const block = `## ${title}\n${clean}\n`;
    if (out.length + block.length > maxChars) { out += `## ${title}\n${clean.slice(0, Math.max(0, maxChars - out.length - 40))}…\n`; break; }
    out += block;
  }
  return out.trim();
}
