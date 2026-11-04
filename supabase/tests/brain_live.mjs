// LIVE eval (real OpenAI, costs a few cents): OPENAI_API_KEY=… node supabase/tests/brain_live.mjs
// Runs the real text brain (runBrain + openaiChat + search_web) over the fake test business. Not part of `npm test`.
import { fakeDb } from './fakeDb.mjs';
import { runBrain, openaiChat } from '../functions/_shared/brain/loop.js';
import { brainPrompt } from '../functions/_shared/brain/prompt.js';

const key = process.env.OPENAI_API_KEY; if (!key) { console.log('no OPENAI_API_KEY, skipped'); process.exit(0); }
const model = process.env.BRAIN_MODEL || 'gpt-6-luna';
const TODAY = '2026-11-04';
const db = () => fakeDb({
  properties: [{ id: 'u1', org_id: 'org-a', name: 'בקתת הגפן', base_price: 900, max_guests: 4 }, { id: 'u2', org_id: 'org-a', name: 'הסוויטה', base_price: 1200, max_guests: 2 }],
  bookings: [{ id: 'b1', org_id: 'org-a', property_id: 'u1', guest_name: 'יואב כהן', check_in_date: TODAY, check_out_date: '2026-11-06', total_price: 1800, status: 'CONFIRMED', is_block: false }],
  payments: [], expenses: [], leads: [], cleaning_tasks: [], calendar_syncs: [], automation_rules: [],
  profiles: [{ id: 'user-a', full_name: 'דין וינוקור', organization_id: 'org-a' }],
  organizations: [{ id: 'org-a', name: 'בקתות בגליל', address: 'חד-נס, רמת הגולן', settings: {} }],
});
const QS = (process.argv[2] ? [process.argv[2]] : ['אילו מסעדות יש סביב הכנרת?', 'מה מזג האוויר מחר?', 'כמה זמן נסיעה מכאן לצפת?', 'מה הגובה של החרמון?', 'מי מגיע היום?']);
const mode = process.env.MODE || 'voice';
for (const q of QS) {
  const t0 = Date.now();
  const ctx = { db: db(), userId: 'user-a', today: TODAY, native: true, world: { apiKey: key, model, effort: 'none' } };
  const r = await runBrain({ system: brainPrompt({ mode, today: TODAY, owner: 'דין', native: true }), turns: [{ role: 'user', content: q }], llm: openaiChat({ apiKey: key, model, user: 'eval' }), ctx });
  console.log(JSON.stringify({ q, tools: r.tools, ms: Date.now() - t0, a: r.text }));
}
