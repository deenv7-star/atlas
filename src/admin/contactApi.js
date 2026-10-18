/**
 * "פניות מהאתר": messages from the public contact form (public.contact_messages, migration 013b).
 * Supabase: admin_list_contact_messages(p_limit) to read (checks platform_admins) + a direct UPDATE of
 * `status` (013b grants update(status) to authenticated, RLS lets only platform admins through).
 * Demo: a small sample persisted in this browser.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { ADMIN_DEMO } from './config';
import { heMessage } from './ui';

const MISSING = (e) => ['42P01', 'PGRST205', 'PGRST202', '42883'].includes(String(e?.code || '')) || /does not exist|could not find|schema cache/i.test(String(e?.message || ''));
function fail(error, fallback) {
  const e = new Error(MISSING(error) ? 'הפניות מהאתר עוד לא הופעלו במסד הנתונים.' : /42501/.test(String(error?.code || '')) ? 'אין לכם הרשאה לפעולה הזו' : fallback);
  e.missing = MISSING(error);
  return e;
}

const KEY = 'atlas_admin_demo_contact_v1';
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
function demoRead() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (Array.isArray(v)) return v; } catch { /* fresh sample */ }
  return [
    { id: 'd1', name: 'מיכל אברהם', email: 'michal@example.com', phone: '052-4417823', subject: 'שאלה על חבילת עסקי', message: 'שלום, יש לנו 6 צימרים בגליל. אפשר לחבר את כולם ל-Booking ול-Airbnb באותו חשבון?\nתודה!', source: 'contact', status: 'NEW', created_at: ago(18) },
    { id: 'd2', name: 'יוסי כהן', email: 'yossi@example.com', phone: null, subject: 'upgrade:pro', message: 'בקשה לעבור לחבילת מקצועי (₪149 לחודש). ארגון: וילה בכרם.', source: 'contact', status: 'READ', created_at: ago(60 * 26) },
  ];
}
const demoWrite = (rows) => localStorage.setItem(KEY, JSON.stringify(rows));

const api = ADMIN_DEMO ? {
  list: async () => demoRead(),
  setStatus: async (id, status) => { demoWrite(demoRead().map((r) => (r.id === id ? { ...r, status } : r))); },
} : {
  async list() {
    const { data, error } = await supabase.rpc('admin_list_contact_messages', { p_limit: 300 });
    if (error) throw fail(error, 'לא הצלחנו לטעון את הפניות. נסו שוב בעוד רגע.');
    return data || [];
  },
  async setStatus(id, status) {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
    if (error) throw fail(error, 'לא הצלחנו לעדכן את הפנייה. נסו שוב בעוד רגע.');
  },
};

const QK = ['admin', 'contact'];
export const useContactMessages = () => useQuery({ queryKey: QK, queryFn: api.list, staleTime: 30_000, refetchInterval: 120_000, retry: (n, e) => !e?.missing && n < 1 });
/** Sidebar badge: how many messages nobody opened yet. */
export const useContactUnread = () => {
  const q = useContactMessages();
  return (q.data || []).filter((r) => r.status === 'NEW').length;
};

const TOAST = { READ: 'סומן כנקרא', NEW: 'סומן כלא נקרא', REPLIED: 'סומן שענינו', ARCHIVED: 'הפנייה הועברה לארכיון' };
export function useContactStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.setStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: QK });
      const prev = qc.getQueryData(QK);
      qc.setQueryData(QK, (rows) => (rows || []).map((r) => (r.id === id ? { ...r, status } : r)));
      return { prev };
    },
    onSuccess: (_d, v) => { if (!v.silent) atlasToastApi.success(TOAST[v.status]); },
    onError: (e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(QK, ctx.prev); atlasToastApi.error(heMessage(e, 'לא הצלחנו לעדכן את הפנייה')); },
    onSettled: () => qc.invalidateQueries({ queryKey: QK }),
  });
}
