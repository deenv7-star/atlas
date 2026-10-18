/**
 * Customer-side support API. Two backends with one shape:
 *   Supabase: Edge Function `support-chat` for sending / handoff (OpenAI key stays server-side),
 *             reads under RLS (own rows only), Realtime for agent replies.
 *   Demo:     localStorage (demoStore), answers from VITE_SUPPORT_DEMO_URL or the bundled KB.
 */
import { supabase } from '@/api/supabaseClient';
import { SUPPORT_DEMO, SUPPORT_DEMO_URL } from './config';
import { demoStore } from './demoStore';

export class SupportError extends Error {
  constructor(message, { code, status, retryAfter } = {}) { super(message); this.code = code; this.status = status; this.retryAfter = retryAfter; }
}
const OFFLINE = 'אין חיבור לאינטרנט. ההודעה לא נשלחה.';
const GENERIC = 'משהו השתבש. נסו שוב בעוד רגע, או לחצו "דבר עם נציג".';

/* ── Supabase ─────────────────────────────────────────────────────────── */
async function invoke(body) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new SupportError(OFFLINE, { code: 'offline' });
  const { data, error } = await supabase.functions.invoke('support-chat', { body });
  if (error) {
    let j = null;
    try { j = await error.context?.json?.(); } catch { /* not json */ }
    const status = error.context?.status;
    throw new SupportError(j?.message || (status === 404 ? 'העזרה עוד לא הופעלה בחשבון.' : GENERIC), { code: j?.error || 'server', status, retryAfter: j?.retry_after_s });
  }
  return data;
}
const MISSING = (e) => ['42P01', 'PGRST205', 'PGRST202', '42883'].includes(String(e?.code || '')) || /does not exist|could not find|schema cache/i.test(String(e?.message || ''));
let probed = null;
const dbApi = {
  /** true when migration 020 is applied (the table answers), false when it is missing. Cached per load. */
  probe() {
    probed ||= supabase.from('support_conversations').select('id', { head: true, count: 'exact' }).limit(1)
      .then(({ error }) => (error ? !MISSING(error) : true), () => true);
    return probed;
  },
  async listConversations(user) {
    const { data, error } = await supabase.from('support_conversations')
      .select('id, status, mode, subject, last_message_at, last_message_preview, last_sender, unread_user, created_at')
      .eq('user_id', user.id).order('last_message_at', { ascending: false }).limit(20);
    if (error) throw new SupportError(GENERIC);
    return data || [];
  },
  async getMessages(convId) {
    const { data, error } = await supabase.from('support_messages')
      .select('id, conversation_id, sender, author_name, body, links, meta, feedback, created_at')
      .eq('conversation_id', convId).order('created_at', { ascending: true }).limit(300);
    if (error) throw new SupportError(GENERIC);
    return data || [];
  },
  send: ({ conversationId, text, clientId, page, device }) => invoke({ action: 'send', conversation_id: conversationId || undefined, message: text, client_id: clientId, page, device }),
  handoff: ({ conversationId, reason, page, device }) => invoke({ action: 'handoff', conversation_id: conversationId || undefined, reason, page, device }),
  async markRead(convId) { await supabase.rpc('support_mark_read', { p_conv: convId }); },
  async feedback(msgId, value) { const { error } = await supabase.rpc('support_feedback', { p_msg: msgId, p_value: value }); if (error) throw new SupportError(GENERIC); },
  /** New messages (agent replies) in one conversation; RLS limits events to the customer's own rows. */
  subscribe(convId, onMessage) {
    const ch = supabase.channel(`support:${convId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${convId}` }, (p) => onMessage(p.new))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  },
};

/* ── demo ─────────────────────────────────────────────────────────────── */
let kbMod = null;
async function demoAnswer(text, history, ctx, device) {
  if (SUPPORT_DEMO_URL) {
    try {
      const r = await fetch(`${SUPPORT_DEMO_URL.replace(/\/$/, '')}/answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history, context: ctx, device }) });
      if (r.ok) return await r.json();
    } catch { /* fall back to the bundled KB */ }
  }
  // No dev server: best-matching section of the real KB (same retrieval the function uses), no AI.
  kbMod ||= await Promise.all([import('../../supabase/functions/support-chat/kb/kb.json'), import('../../supabase/functions/support-chat/lib/prompt.ts')]);
  const [kbm, prompt] = kbMod;
  const top = prompt.retrieve(kbm.default || kbm, text, 1)[0];
  if (!top) return { answer: 'לא מצאתי תשובה לזה. אפשר לנסח אחרת, או ללחוץ **דבר עם נציג**.', links: [], confidence: 'low', suggest_human: true, follow_ups: [] };
  const body = top.text.split('\n').filter((l) => l.trim() && !l.startsWith('#')).slice(0, 8).join('\n');
  return { answer: body, links: [], confidence: 'medium', suggest_human: false, follow_ups: [], model: 'demo-kb' };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HUMAN = /נציג|בן\s*אדם|בנאדם|לבטל\s*(את\s*)?(ה)?מנוי|החזר\s*כספי|לא\s*עוזר|לדבר\s*עם/;
const demoApi = {
  probe: async () => true,
  async listConversations(user) {
    return demoStore.read().conversations.filter((c) => c.user_id === user.id).sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
  },
  async getMessages(convId) { return demoStore.read().messages.filter((m) => m.conversation_id === convId); },
  async send({ conversationId, text, clientId, page, device, user, ctx }) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new SupportError(OFFLINE, { code: 'offline' });
    const t = demoStore.now();
    const { conv, userMsg } = demoStore.write((d) => {
      let c = d.conversations.find((x) => x.id === conversationId);
      if (!c) {
        c = { id: crypto.randomUUID(), org_id: user.organization_id || 'org_demo', org_name: user.organization_name || '', user_id: user.id, user_email: user.email, user_name: user.full_name || '', user_phone: user.phone || '', status: 'open', mode: 'bot', subject: text.slice(0, 120), handoff_at: null, handoff_reason: null, unhelpful_count: 0, unread_admin: 0, unread_user: 0, last_message_at: t, last_message_preview: '', last_sender: 'user', context: { plan: user.subscription_plan || 'starter', units: ctx?.units?.count ?? null, channels: [], org_name: user.organization_name || '' }, page_path: page, created_at: t };
        d.conversations.push(c);
      }
      if (clientId && d.messages.some((m) => m.conversation_id === c.id && m.client_id === clientId)) return { conv: c, userMsg: null };
      const um = { id: crypto.randomUUID(), conversation_id: c.id, user_id: c.user_id, org_id: c.org_id, sender: 'user', body: text, links: [], meta: { device, page }, feedback: null, client_id: clientId, created_at: t };
      d.messages.push(um);
      Object.assign(c, { status: 'open', last_message_at: t, last_message_preview: text.slice(0, 140), last_sender: 'user', unread_admin: c.unread_admin + (c.mode === 'human' ? 1 : 0) });
      return { conv: { ...c }, userMsg: um };
    });
    if (conv.mode === 'human') return { conversation_id: conv.id, mode: 'human', user_message: userMsg, reply: null, offer_handoff: false };
    const history = demoStore.read().messages.filter((m) => m.conversation_id === conv.id && m.id !== userMsg?.id && ['user', 'bot', 'agent'].includes(m.sender)).slice(-12).map((m) => ({ sender: m.sender, body: m.body }));
    const [ans] = await Promise.all([demoAnswer(text, history, ctx, device), sleep(700)]);
    const weak = ans.confidence === 'low' || ans.suggest_human;
    return demoStore.write((d) => {
      const c = d.conversations.find((x) => x.id === conv.id);
      c.unhelpful_count = weak ? (c.unhelpful_count || 0) + 1 : 0;
      const offer = HUMAN.test(text) || c.unhelpful_count >= 2;
      const reply = { id: crypto.randomUUID(), conversation_id: c.id, user_id: c.user_id, org_id: c.org_id, sender: 'bot', body: ans.answer, links: ans.links || [], meta: { confidence: ans.confidence, follow_ups: ans.follow_ups || [], offer_handoff: offer }, feedback: null, model: ans.model || 'demo', created_at: demoStore.now() };
      d.messages.push(reply);
      Object.assign(c, { last_message_at: reply.created_at, last_message_preview: ans.answer.slice(0, 140), last_sender: 'bot' });
      return { conversation_id: c.id, mode: 'bot', user_message: userMsg, reply, offer_handoff: offer, offer_reason: offer ? (HUMAN.test(text) ? 'keyword' : 'unhelpful') : null };
    });
  },
  async handoff({ conversationId, reason, user, page }) {
    await sleep(300);
    return demoStore.write((d) => {
      let c = d.conversations.find((x) => x.id === conversationId);
      const t = demoStore.now();
      if (!c) {
        c = { id: crypto.randomUUID(), org_id: user.organization_id || 'org_demo', org_name: user.organization_name || '', user_id: user.id, user_email: user.email, user_name: user.full_name || '', user_phone: user.phone || '', status: 'open', mode: 'bot', subject: null, unhelpful_count: 0, unread_admin: 0, unread_user: 0, last_message_at: t, context: { plan: user.subscription_plan || 'starter', org_name: user.organization_name || '' }, page_path: page, created_at: t };
        d.conversations.push(c);
      }
      Object.assign(c, { mode: 'human', status: 'open', handoff_at: c.handoff_at || t, handoff_reason: c.handoff_reason || reason, unread_admin: Math.max(1, c.unread_admin) });
      const sys = { id: crypto.randomUUID(), conversation_id: c.id, user_id: c.user_id, org_id: c.org_id, sender: 'system', body: 'העברנו את השיחה לנציג מצוות ATLAS. הוא רואה את כל מה שכתבתם, ויענה כאן באותו חלון. אפשר להמשיך לכתוב בינתיים.', links: [], meta: { reason }, created_at: t };
      d.messages.push(sys);
      Object.assign(c, { last_message_at: t, last_message_preview: sys.body.slice(0, 140), last_sender: 'system' });
      return { conversation_id: c.id, mode: 'human', system_message: sys };
    });
  },
  async markRead(convId) { demoStore.write((d) => { const c = d.conversations.find((x) => x.id === convId); if (c) c.unread_user = 0; }); },
  async feedback(msgId, value) { demoStore.write((d) => { const m = d.messages.find((x) => x.id === msgId); if (m) m.feedback = value; }); },
  subscribe(convId, onMessage) {
    let seen = new Set(demoStore.read().messages.filter((m) => m.conversation_id === convId).map((m) => m.id));
    return demoStore.subscribe(() => {
      const fresh = demoStore.read().messages.filter((m) => m.conversation_id === convId && !seen.has(m.id));
      fresh.forEach((m) => { seen.add(m.id); onMessage(m); });
    });
  },
};

export const supportApi = SUPPORT_DEMO ? demoApi : dbApi;
