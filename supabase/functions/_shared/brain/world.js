// The brain's window to the world: live, local and general info a zimmer owner passes on to guests
// (restaurants, attractions, weather, driving times, events, opening hours, news, facts to verify).
//
// One OpenAI Responses API call with the built-in web_search tool, using the same OPENAI_API_KEY and
// BRAIN_MODEL as the text brain. It never touches business data and never receives any: only the owner's
// question and the business's area (organizations.address / properties.address, read with the owner's JWT).
// The answer comes back short, plain Hebrew (no links, no markdown), so voice can say it as is and text
// can use it as is. Plain JS on purpose (Deno + node --test); the fetch comes in so tests run offline.

export const WORLD = { timeoutMs: 15000, maxAnswerChars: 700, perMinute: 10, maxQueryChars: 300 };

const clip = (s, n) => String(s ?? '').slice(0, n);

/** Markdown and links out, so voice never reads "https" or asterisks aloud. */
export function plainAnswer(text) {
  return clip(String(text || '')
    .replace(/\(\[[^\]]*\]\([^)]*\)\)/g, '')       // ([site](url)) citation chips
    .replace(/\[([^\]]+)\]\((?:https?:)?[^)]*\)/g, '$1') // [text](url) → text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^#+\s*/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/ {2,}/g, ' ')
    .trim(), WORLD.maxAnswerChars);
}

/** Hostnames of the pages the search used (for the text answer; never full URLs to the model). */
export function sourcesOf(output) {
  const hosts = new Set();
  for (const o of Array.isArray(output) ? output : []) {
    for (const c of o?.content || []) for (const a of c?.annotations || []) {
      if (a?.type === 'url_citation' && a.url) { try { hosts.add(new URL(a.url).hostname.replace(/^www\./, '')); } catch { /* bad url */ } }
    }
  }
  return [...hosts].slice(0, 3);
}

/** The text of a Responses API result (output_text is SDK sugar; the raw API has output[].content[]). */
function textOf(j) {
  if (typeof j?.output_text === 'string' && j.output_text) return j.output_text;
  const parts = [];
  for (const o of Array.isArray(j?.output) ? j.output : []) {
    if (o?.type !== 'message') continue;
    for (const c of o.content || []) if (c?.type === 'output_text' && c.text) parts.push(c.text);
  }
  return parts.join('\n');
}

/** Where the business is, as the owner wrote it (organization first, then the first unit with an address). */
export async function businessArea(db, userId) {
  if (!db) return '';
  try {
    const { data: prof } = await db.from('profiles').select('organizations(address)').eq('id', userId).limit(1);
    const org = clip(String(prof?.[0]?.organizations?.address || '').trim(), 120);
    if (org) return org;
    const { data: units } = await db.from('properties').select('address').limit(20);
    return clip(String((units || []).map((u) => String(u.address || '').trim()).find(Boolean) || ''), 120);
  } catch {
    return '';
  }
}

export function worldInstructions({ today, area }) {
  return [
    'אתם עוזרי מחקר של atlas, אפליקציה לבעלי צימרים בישראל. בעל המתחם שואל, לרוב כדי לענות לאורחים שלו.',
    'חפשו ברשת ותנו תשובה עדכנית ומדויקת: מסעדות, אטרקציות, מזג אוויר, זמני נסיעה, אירועים, שעות פתיחה, חדשות, עובדות.',
    'צורה: עברית מדוברת וטבעית, 2 עד 4 משפטים קצרים, בלי קישורים, בלי כתובות אתרים, בלי רשימות ובלי סימני Markdown. התשובה תיקרא גם בקול.',
    'כשממליצים על מקומות: עד 3 שמות אמיתיים שמצאתם בחיפוש, ולכל אחד כמה מילים (סוג אוכל או מה יש שם, ואיפה). לא ממציאים מקום, שעה, מחיר או מספר טלפון.',
    'מזג אוויר: טמפרטורות בערך וגשם כן או לא, ליום שנשאל. זמן נסיעה: הערכה רגילה בלי פקקים, ולציין שזה תלוי בתנועה.',
    'אם לא מצאתם מידע אמין, אמרו את זה במשפט אחד והציעו מה כדאי לבדוק. כשמשהו עלול להשתנות (שעות, כשרות, פתוח בשבת), הוסיפו "כדאי לוודא לפני".',
    `היום: ${today}, ישראל.${area ? ` מיקום המתחם של השואל: ${area}. "באזור", "כאן" או שאלה בלי מקום = סביב המיקום הזה.` : ' מיקום המתחם לא ידוע; אם השאלה תלויה במקום ולא צוין מקום, ענו לפי המקום שבשאלה או בקשו בקצרה לציין אזור.'}`,
  ].join('\n');
}

/** Per-isolate sliding window: web searches cost money, so a stuck loop cannot run up a bill. */
const hits = new Map();
export function searchAllowed(key, now = Date.now(), perMinute = WORLD.perMinute) {
  const k = String(key || 'anon');
  const list = (hits.get(k) || []).filter((t) => now - t < 60_000);
  if (list.length >= perMinute) { hits.set(k, list); return false; }
  list.push(now); hits.set(k, list);
  if (hits.size > 5000) hits.delete(hits.keys().next().value);
  return true;
}

/**
 * askWorld({ apiKey, model, effort, query, near, area, today, fetchImpl, signal }) → { answer, sources, area } | { error, say }
 * Never throws.
 */
export async function askWorld({ apiKey, model, effort = 'none', query, near = '', area = '', today, fetchImpl = fetch, signal, timeoutMs = WORLD.timeoutMs, user }) {
  const q = clip(String(query || '').trim(), WORLD.maxQueryChars);
  if (!q) return { error: 'empty_query' };
  if (!apiKey) return { error: 'not_available', say: 'אמרו שחיפוש מידע עדכני לא זמין כרגע, וענו מהידע הכללי שלכם אם אפשר, עם הסתייגות.' };
  const where = clip(String(near || '').trim(), 80) || area;
  const input = where && near ? `${q}\n(המקום שעליו שואלים: ${where})` : q;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener?.('abort', onAbort, { once: true });
  try {
    const res = await fetchImpl('https://api.openai.com/v1/responses', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        instructions: worldInstructions({ today, area: where }),
        input,
        tools: [{ type: 'web_search', user_location: { type: 'approximate', country: 'IL', timezone: 'Asia/Jerusalem' } }],
        tool_choice: 'auto',
        reasoning: { effort },
        max_output_tokens: 700,
        store: false,
        ...(user ? { safety_identifier: String(user) } : {}),
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { error: 'search_failed', status: res.status, say: 'אמרו שהחיפוש לא הצליח כרגע. אם יש לכם ידע כללי בטוח, תנו אותו עם הסתייגות, והציעו לנסות שוב בעוד רגע.' };
    const answer = plainAnswer(textOf(j));
    if (!answer) return { error: 'no_answer', say: 'אמרו שלא נמצא מידע אמין, והציעו לשאול בניסוח אחר או על אזור מסוים.' };
    return { answer, sources: sourcesOf(j.output), area: where || null, note: 'ענו מזה במילים שלכם, בקצרה. אל תוסיפו מקומות או פרטים שלא מופיעים כאן.' };
  } catch {
    return { error: 'search_timeout', say: 'אמרו שהחיפוש לקח יותר מדי זמן, והציעו לנסות שוב או לשאול על משהו ספציפי יותר.' };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', onAbort);
  }
}
