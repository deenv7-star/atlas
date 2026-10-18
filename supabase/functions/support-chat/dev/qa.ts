// Local QA for support-chat: runs the PRODUCTION handler (lib/handler.ts) against an in-memory store.
//   deno run -A dev/qa.ts                    behaviour tests only (mock answers, no OpenAI cost)
//   deno run -A dev/qa.ts --real             + the 20 Hebrew owner questions against OpenAI
//   deno run -A dev/qa.ts --real --model=gpt-6.1-sol --out=qa-sol.json
import kbJson from '../kb/kb.json' with { type: 'json' };
import { handle, sanitizeAnswer, type Deps } from '../lib/handler.ts';
import { memoryStore } from '../lib/store.ts';
import { openaiLlm } from '../lib/openai.ts';
import { wantsHuman } from '../lib/policy.ts';
import type { KB } from '../lib/prompt.ts';

const kb = kbJson as unknown as KB;
const args = Object.fromEntries(Deno.args.map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? 'true']; }));
const OWNER = {
  id: 'u-owner', email: 'yael@zimmer-galil.co.il', name: 'יעל לוי',
  context: {
    org_id: 'org-galil', name: 'יעל לוי', org_name: 'צימרי הגליל', plan: 'starter', subscription_status: 'trialing', trial_days_left: 9,
    units: { count: 3, names: ['צימר הגפן', 'צימר התאנה', 'סוויטת הזית'] },
    channels: [{ provider: 'BOOKING_COM', active: true, last_sync_at: null }], messaging: [], payments: [],
    bookings_count: 14, leads_count: 5, onboarding_completed: true, phone: '0521234567',
  },
};
const OTHER = { id: 'u-other', email: 'dan@villa.co.il', name: 'דן', context: { ...OWNER.context, org_id: 'org-villa', org_name: 'וילה בכרם' } };
const results: string[] = []; let pass = 0, fail = 0;
const check = (ok: boolean, name: string, extra = '') => { ok ? pass++ : fail++; results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };

function mkDeps(llm: Deps['llm']) {
  const store = memoryStore({ 'jwt-owner': OWNER, 'jwt-other': OTHER } as never);
  const notified: unknown[] = [];
  const deps: Deps = { store, kb, llm, notify: async (h) => { notified.push(h); return ['test']; }, allowedOrigins: ['https://atlas-il.com'] };
  return { deps, store, notified };
}
const call = async (deps: Deps, jwt: string | null, body: unknown, origin = 'https://atlas-il.com') => {
  const res = await handle(new Request('http://x/support-chat', { method: 'POST', headers: { 'content-type': 'application/json', origin, ...(jwt ? { authorization: `Bearer ${jwt}` } : {}) }, body: JSON.stringify(body) }), deps);
  return { status: res.status, cors: res.headers.get('access-control-allow-origin'), json: await res.json() };
};

/* ── behaviour (mock, free) ───────────────────────────────────────────── */
{
  const { deps, store, notified } = mkDeps(null);
  const r0 = await call(deps, null, { message: 'שלום' });
  check(r0.status === 401 && /להתחבר/.test(r0.json.message), 'no JWT → 401 with a Hebrew message');
  const r1 = await call(deps, 'jwt-owner', { message: 'איך מחברים את בוקינג?', client_id: 'c1', device: 'mobile', page: '/calendar' });
  check(r1.status === 200 && r1.json.conversation_id && r1.json.reply?.sender === 'bot', 'first message creates a conversation and gets a bot reply', r1.json.reply?.body?.slice(0, 60));
  check(r1.cors === 'https://atlas-il.com', 'CORS echoes an allowed origin');
  const rBad = await call(deps, 'jwt-owner', { message: 'x' }, 'https://evil.example');
  check(rBad.cors !== 'https://evil.example', 'CORS does not echo an unknown origin', String(rBad.cors));
  const conv = r1.json.conversation_id;
  const dup = await call(deps, 'jwt-owner', { message: 'איך מחברים את בוקינג?', client_id: 'c1', conversation_id: conv });
  check(dup.status === 200 && dup.json.duplicate === true, 'same client_id twice → stored once (idempotent retry)');
  const foreign = await call(deps, 'jwt-other', { message: 'היי', conversation_id: conv });
  check(foreign.status === 403, "another customer cannot post into someone else's conversation");
  const empty = await call(deps, 'jwt-owner', { message: '   ' });
  check(empty.status === 400, 'empty message → 400');
  const long = await call(deps, 'jwt-owner', { message: 'א'.repeat(2001) });
  check(long.status === 400, 'message over 2000 chars → 400');
  const kw = await call(deps, 'jwt-owner', { message: 'אני רוצה לדבר עם נציג', conversation_id: conv });
  check(kw.json.offer_handoff === true && kw.json.offer_reason === 'keyword', 'keyword "נציג" → offer a human');
  const ho = await call(deps, 'jwt-owner', { action: 'handoff', conversation_id: conv, reason: 'button' });
  check(ho.status === 200 && ho.json.mode === 'human' && notified.length === 1, 'handoff → mode human, team notified once', JSON.stringify(notified[0]).slice(0, 120));
  const ho2 = await call(deps, 'jwt-owner', { action: 'handoff', conversation_id: conv, reason: 'button' });
  check(ho2.status === 200 && notified.length === 1, 'second handoff click does not notify again');
  const after = await call(deps, 'jwt-owner', { message: 'עדיין לא הצלחתי', conversation_id: conv });
  check(after.json.mode === 'human' && after.json.reply === null, 'after handoff the bot stays quiet (agent answers)');
  const c = await store.getConversation(conv);
  check(c?.mode === 'human', 'conversation persisted as human');
  // unhelpful twice → offer
  const low = mkDeps(async () => ({ answer: { answer: 'לא בטוח', links: [], confidence: 'low', suggest_human: false, follow_ups: [] }, model: 'test', tokens_in: 1, tokens_cached: 0, tokens_out: 1, cost_usd: 0, latency_ms: 1 }));
  const u1 = await call(low.deps, 'jwt-owner', { message: 'שאלה מוזרה ראשונה' });
  const u2 = await call(low.deps, 'jwt-owner', { message: 'שאלה מוזרה שנייה', conversation_id: u1.json.conversation_id });
  check(u1.json.offer_handoff === false && u2.json.offer_handoff === true && u2.json.offer_reason === 'unhelpful', 'two weak answers in a row → offer a human');
  // llm failure → graceful message + offer
  const boom = mkDeps(async () => { throw new Error('timeout'); });
  const b1 = await call(boom.deps, 'jwt-owner', { message: 'מה קורה?' });
  check(b1.status === 200 && b1.json.offer_handoff && /נציג/.test(b1.json.reply.body), 'OpenAI down → calm Hebrew fallback + offer a human');
  // rate limit
  const rl = mkDeps(null);
  let last;
  for (let i = 0; i < 9; i++) last = await call(rl.deps, 'jwt-owner', { message: `שאלה ${i}` });
  check(last!.status === 429 && /נציג/.test(last!.json.message), '9th message in 2 minutes → 429 rate limit (Hebrew)');
  // link sanitizer
  const s = sanitizeAnswer({ answer: 'x', links: [{ label: 'ok', path: '/integrations?tab=calendars' }, { label: 'evil', path: 'https://evil.example' }, { label: 'fake', path: '/secret-admin' }], confidence: 'high', suggest_human: false, follow_ups: [] }, kb);
  check(s.links.length === 1 && s.links[0].path === '/integrations?tab=calendars', 'links outside the app route whitelist are dropped');
  const kws = ['אני רוצה בן אדם', 'אפשר לדבר עם מישהו?', 'לבטל את המנוי', 'חויבתי פעמיים', 'זה לא עוזר לי'];
  check(kws.every(wantsHuman) && !wantsHuman('איך מוסיפים חדר?'), 'handoff keyword detector', kws.filter((k) => !wantsHuman(k)).join(','));
}

/* ── 20 real questions ────────────────────────────────────────────────── */
type Q = { q: string; device?: 'mobile' | 'desktop'; must?: RegExp[]; mustNot?: RegExp[]; human?: boolean };
const QUESTIONS: Q[] = [
  { q: 'איך אני מחבר את הבוקינג שלי למערכת?', device: 'mobile', must: [/יומנים|פתיחת ההגדרה/, /(לא|עוד לא).{0,40}(אוטומטי|לבד|נמשכות)|ידנית/] },
  { q: 'בניתי צימר חדש, איך מוסיפים עוד חדר?', must: [/פתיחת ההגדרה/, /הגדרות/] },
  { q: 'איך שולחים לאורח הודעה בוואטסאפ עם הוראות הגעה?', device: 'mobile', must: [/שליחה בוואטסאפ/, /הוראות הגעה/] },
  { q: 'כמה ימים נשארו לי בניסיון ומה קורה אחרי זה?', must: [/9/, /(לא|בלי).{0,30}(מחויב|כרטיס)/] },
  { q: 'אני רוצה לבטל את המנוי', must: [/נציג/], human: true },
  { q: 'קיבלתי הזמנה בטלפון, איך אני רושם אותה?', device: 'mobile', must: [/\+|הזמנה חדשה/, /שם אורח|שם/] },
  { q: 'אורח העביר לי מקדמה בביט, איפה אני מסמן את זה?', must: [/רישום תשלום|תשלום חדש/, /מקדמה/] },
  { q: 'הזמנה מאיירבנב לא מופיעה לי בלוח השנה, למה?', must: [/(לא|עוד לא).{0,40}(אוטומטי|לבד|נמשכות)/, /ידנית|הזמנה חדשה/] },
  { q: 'אפשר שהמערכת תשלח לאורחים הודעה אוטומטית יום לפני שהם מגיעים?', must: [/(לא|עוד לא).{0,30}(רצות|אוטומטי|לבד)/, /שליחה בוואטסאפ|לחיצה/] },
  { q: 'שכחתי את הסיסמה, מה עושים?', must: [/שכחתי סיסמה/] },
  { q: 'איך אני מוציא דוח לרואה החשבון של החודש?', must: [/דוח חודשי/, /CSV|PDF/] },
  { q: 'אני בשיפוצים בשבוע הבא, איך אני חוסם תאריכים בלוח?', must: [/הזמנה/, /חסום/] },
  { q: 'אני צריך להפיק חשבונית מס לאורח, איך?', must: [/(לא|אינה).{0,40}(רשמי|מאושר|הקצאה)/] },
  { q: 'אורח ביטל, איך אני מבטל את ההזמנה שלו?', must: [/עריכה/, /בוטלה/] },
  { q: 'איפה אני רואה כמה כסף אורחים עוד חייבים לי?', device: 'mobile', must: [/יתרות/] },
  { q: 'כמה עולה המערכת? יש לי 4 צימרים באותו מתחם', must: [/399/] },
  { q: 'אפשר לתת לעובדת הניקיון כניסה משלה למערכת?', must: [/(אין|לא).{0,40}(עובד|משתמש|כניסה|הרשאות)/] },
  { q: 'מישהי פנתה אליי בפייסבוק ושאלה על תאריכים, איפה אני שומר את זה?', must: [/ליד/] },
  { q: 'איך מורידים את האפליקציה לאייפון?', device: 'mobile', must: [/הוסף למסך הבית|מסך הבית/] },
  { q: 'שום דבר לא עובד לי, אני רוצה לדבר עם בן אדם', human: true, must: [/נציג/] },
];

if (args.real) {
  const model = args.model || 'gpt-6-luna';
  const effort = args.effort || 'low';
  const llm = openaiLlm(Deno.env.get('OPENAI_API_KEY') || 'gateway', model, effort);
  const { deps } = mkDeps(llm);
  const rows: Record<string, unknown>[] = [];
  let usd = 0;
  for (const [i, t] of QUESTIONS.entries()) {
    const r = await call(deps, 'jwt-owner', { message: t.q, device: t.device || 'desktop', page: '/dashboard' }); // fresh conversation per question
    const rep = r.json.reply || {};
    const body: string = rep.body || r.json.message || '';
    const miss = (t.must || []).filter((re) => !re.test(body)).map(String);
    const humanOk = t.human ? r.json.offer_handoff === true : true;
    usd += Number(rep.cost_usd || 0);
    rows.push({ n: i + 1, q: t.q, device: t.device || 'desktop', answer: body, links: rep.links, meta: rep.meta, offer_handoff: r.json.offer_handoff, offer_reason: r.json.offer_reason, model: rep.model, tokens_in: rep.tokens_in, tokens_cached: rep.tokens_cached, tokens_out: rep.tokens_out, cost_usd: rep.cost_usd, latency_ms: rep.latency_ms, auto_missing: miss, auto_ok: miss.length === 0 && humanOk });
    console.log(`#${i + 1} ${miss.length === 0 && humanOk ? 'ok ' : 'CHK'} ${rep.latency_ms}ms $${Number(rep.cost_usd || 0).toFixed(5)} in=${rep.tokens_in}/${rep.tokens_cached} out=${rep.tokens_out} :: ${t.q}`);
  }
  const out = args.out || `qa-${model}.json`;
  await Deno.writeTextFile(out, JSON.stringify({ model, effort, kb: { git: kb.git, built_at: kb.built_at, chunks: kb.chunks.length }, total_usd: usd, rows }, null, 2));
  console.log(`total ${usd.toFixed(4)} USD → ${out}`);
}

console.log(results.join('\n'));
console.log(`\nbehaviour: ${pass} passed, ${fail} failed`);
if (fail) Deno.exit(1);
