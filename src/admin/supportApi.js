/**
 * Admin side of support (/admin/support). Supabase: admin_support_* RPCs (migration 020, each checks
 * platform_admins) + direct SELECT on support_messages (020 lets platform admins read all, which is
 * also what Realtime needs). Demo: the same localStorage document the customer widget writes.
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { demoStore } from '@/support/demoStore';
import { ADMIN_DEMO, SUPPORT_ADMIN_READY } from './config';

const MISSING = (e) => ['42P01', 'PGRST205', 'PGRST202', '42883'].includes(String(e?.code || '')) || /does not exist|could not find|schema cache/i.test(String(e?.message || ''));
async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args || {});
  if (error) {
    const e = new Error(MISSING(error) ? 'התמיכה עוד לא הופעלה במסד הנתונים (020).' : /42501|required/.test(`${error.code} ${error.message}`) ? 'אין לכם הרשאה לפעולה הזו' : 'הפעולה לא הצליחה. נסו שוב בעוד רגע.');
    e.missing = MISSING(error);
    throw e;
  }
  return data;
}

const filterRow = (c, f) => (f === 'waiting' ? c.status === 'open' && c.mode === 'human' && (c.unread_admin > 0 || ['user', 'system'].includes(c.last_sender))
  : f === 'open' ? c.status === 'open' : f === 'closed' ? c.status === 'closed' : true);
let demoActor = 'דין';
export const setSupportActor = (name) => { if (name) demoActor = name; };

const demo = {
  async list(filter) {
    const d = demoStore.read();
    return d.conversations.filter((c) => filterRow(c, filter))
      .map((c) => ({ ...c, plan_key: c.context?.plan || null, messages_count: d.messages.filter((m) => m.conversation_id === c.id).length }))
      .sort((a, b) => (Number(b.mode === 'human' && b.unread_admin > 0) - Number(a.mode === 'human' && a.unread_admin > 0)) || b.last_message_at.localeCompare(a.last_message_at));
  },
  async unread() {
    const cs = demoStore.read().conversations.filter((c) => c.status === 'open' && c.mode === 'human');
    return { conversations: cs.filter((c) => c.unread_admin > 0).length, messages: cs.reduce((s, c) => s + (c.unread_admin || 0), 0), waiting: cs.filter((c) => ['user', 'system'].includes(c.last_sender)).length };
  },
  async messages(convId) { return demoStore.read().messages.filter((m) => m.conversation_id === convId); },
  async reply(convId, body) {
    return demoStore.write((d) => {
      const c = d.conversations.find((x) => x.id === convId);
      if (!c) throw new Error('השיחה לא נמצאה');
      const t = demoStore.now();
      const m = { id: crypto.randomUUID(), conversation_id: c.id, user_id: c.user_id, org_id: c.org_id, sender: 'agent', author_name: demoActor, body: body.trim(), links: [], meta: {}, created_at: t };
      d.messages.push(m);
      Object.assign(c, { mode: 'human', status: 'open', unread_admin: 0, unread_user: (c.unread_user || 0) + 1, handoff_at: c.handoff_at || t, handoff_reason: c.handoff_reason || 'agent', last_message_at: t, last_message_preview: m.body.slice(0, 140), last_sender: 'agent' });
      return { id: m.id };
    });
  },
  async setStatus(convId, status) { demoStore.write((d) => { const c = d.conversations.find((x) => x.id === convId); if (c) Object.assign(c, { status, closed_at: status === 'closed' ? demoStore.now() : null, unread_admin: status === 'closed' ? 0 : c.unread_admin }); }); },
  async markRead(convId) { demoStore.write((d) => { const c = d.conversations.find((x) => x.id === convId); if (c) c.unread_admin = 0; }); },
};

const db = {
  list: (filter) => rpc('admin_support_list', { p_filter: filter, p_limit: 300 }),
  unread: () => rpc('admin_support_unread'),
  async messages(convId) {
    const { data, error } = await supabase.from('support_messages')
      .select('id, conversation_id, sender, author_name, body, links, meta, feedback, model, tokens_in, tokens_out, cost_usd, latency_ms, created_at')
      .eq('conversation_id', convId).order('created_at', { ascending: true }).limit(500);
    if (error) throw new Error('לא הצלחנו לטעון את השיחה');
    return data || [];
  },
  reply: (convId, body) => rpc('admin_support_reply', { p_conv: convId, p_body: body }),
  setStatus: (convId, status) => rpc('admin_support_set_status', { p_conv: convId, p_status: status }),
  markRead: (convId) => rpc('admin_support_mark_read', { p_conv: convId }),
};

export const supportAdminApi = ADMIN_DEMO ? demo : db;

const Q = { staleTime: 15_000, retry: (n, e) => !e?.missing && n < 1, enabled: SUPPORT_ADMIN_READY };
export const useSupportList = (filter) => useQuery({ queryKey: ['admin', 'support', 'list', filter], queryFn: () => supportAdminApi.list(filter), ...Q });
export const useSupportUnread = () => useQuery({ queryKey: ['admin', 'support', 'unread'], queryFn: supportAdminApi.unread, ...Q, refetchInterval: 60_000 });
export const useSupportMessages = (convId) => useQuery({ queryKey: ['admin', 'support', 'msgs', convId], queryFn: () => supportAdminApi.messages(convId), ...Q, enabled: SUPPORT_ADMIN_READY && Boolean(convId) });

export function useSupportActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'support'] });
  return {
    reply: useMutation({ mutationFn: ({ convId, body }) => supportAdminApi.reply(convId, body), onSuccess: refresh, onError: (e) => atlasToastApi.error(e.message) }),
    setStatus: useMutation({ mutationFn: ({ convId, status }) => supportAdminApi.setStatus(convId, status), onSuccess: (_d, v) => { refresh(); atlasToastApi.success(v.status === 'closed' ? 'השיחה נסגרה' : 'השיחה נפתחה מחדש'); }, onError: (e) => atlasToastApi.error(e.message) }),
    markRead: useMutation({ mutationFn: (convId) => supportAdminApi.markRead(convId), onSuccess: refresh }),
  };
}

/**
 * Live inbox: any new support message / conversation change refreshes the lists, and a new handoff
 * raises a browser notification when the admin allowed it. Supabase Realtime under the 020 policies.
 */
export function useSupportLive(onEvent) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!SUPPORT_ADMIN_READY) return undefined;
    const bump = (row) => { qc.invalidateQueries({ queryKey: ['admin', 'support'] }); onEvent?.(row); };
    if (ADMIN_DEMO) {
      let last = demoStore.read().messages.length;
      return demoStore.subscribe(() => {
        const msgs = demoStore.read().messages;
        if (msgs.length !== last) { const fresh = msgs.slice(last); last = msgs.length; fresh.forEach(bump); } else qc.invalidateQueries({ queryKey: ['admin', 'support'] });
      });
    }
    const ch = supabase.channel('admin-support')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (p) => bump(p.new))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_conversations' }, () => qc.invalidateQueries({ queryKey: ['admin', 'support'] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, onEvent]);
}
