// Data access for the support function. Two implementations with one shape:
//   supabaseStore  production: writes with the service role (after the JWT was verified), reads the
//                  customer's own org context with THEIR JWT so RLS decides what the bot may see.
//   memoryStore    local QA (dev/server.ts, dev/qa.ts): same behaviour in memory.
import type { OrgContext } from './prompt.ts';

export type Conversation = {
  id: string; user_id: string; org_id: string | null; status: 'open' | 'closed'; mode: 'bot' | 'human';
  unhelpful_count: number; handoff_at: string | null; subject?: string | null;
};
export type Message = {
  id: string; conversation_id: string; sender: 'user' | 'bot' | 'agent' | 'system'; body: string;
  links?: { label: string; path: string }[]; meta?: Record<string, unknown>; created_at: string;
  model?: string | null; tokens_in?: number | null; tokens_cached?: number | null; tokens_out?: number | null; cost_usd?: number | null; latency_ms?: number | null;
  author_name?: string | null; feedback?: string | null; client_id?: string | null;
};
export type AuthedUser = { id: string; email: string | null; name?: string | null; phone?: string | null };

export interface Store {
  getUser(jwt: string): Promise<AuthedUser | null>;
  orgContext(jwt: string, user: AuthedUser): Promise<OrgContext & { org_id: string | null }>;
  countUserMessages(userId: string, sinceMinutes: number): Promise<number>;
  getConversation(id: string): Promise<Conversation | null>;
  createConversation(c: Omit<Conversation, 'id' | 'status' | 'mode' | 'unhelpful_count' | 'handoff_at'> & { user_email: string | null; user_name: string | null; user_phone: string | null; page_path: string | null; context: unknown }): Promise<Conversation>;
  updateConversation(id: string, patch: Partial<Conversation> & Record<string, unknown>): Promise<void>;
  recentMessages(conversationId: string, limit: number): Promise<Message[]>;
  insertMessage(m: Omit<Message, 'id' | 'created_at'> & { user_id: string; org_id: string | null }): Promise<Message>;
}

/* ── production ───────────────────────────────────────────────────────── */
// deno-lint-ignore no-explicit-any
type SB = any;
export function supabaseStore(createClient: (url: string, key: string, opts?: unknown) => SB, url: string, anonKey: string, serviceKey: string): Store {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const asUser = (jwt: string) => createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${jwt}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const must = <T>(r: { data: T; error: { message: string } | null }) => { if (r.error) throw new Error(r.error.message); return r.data; };
  return {
    async getUser(jwt) {
      const { data, error } = await admin.auth.getUser(jwt);
      if (error || !data?.user) return null;
      return { id: data.user.id, email: data.user.email ?? null, name: data.user.user_metadata?.full_name ?? null };
    },
    async orgContext(jwt, user) {
      // Everything below runs with the CUSTOMER's JWT: RLS limits it to their own org.
      const db = asUser(jwt);
      const errors: string[] = [];
      const safe = async <T>(label: string, p: Promise<{ data: T; error: { message: string } | null; count?: number | null }>) => {
        try { const r = await p; if (r.error) { errors.push(`${label}: ${r.error.message}`); return null; } return r; } catch (e) { errors.push(`${label}: ${(e as Error).message}`); return null; }
      };
      const prof = await safe('profiles', db.from('profiles').select('full_name, phone, organization_id, onboarding_completed, selected_plan, trial_ends_at, subscription_status, organizations(name, subscription_plan)').eq('id', user.id).maybeSingle());
      const p = (prof?.data || {}) as Record<string, any>;
      const orgId = p.organization_id || null;
      const [props, syncs, msgs, pays, books, leads] = await Promise.all([
        safe('properties', db.from('properties').select('name', { count: 'exact' }).order('name').limit(30)),
        safe('calendar_syncs', db.from('calendar_syncs').select('provider, is_active, sync_status, last_sync_at').limit(50)),
        safe('messaging_integrations', db.from('messaging_integrations').select('provider, is_active').limit(20)),
        safe('payment_gateways', db.from('payment_gateways').select('provider, is_active').limit(20)),
        safe('bookings', db.from('bookings').select('id', { count: 'exact', head: true })),
        safe('leads', db.from('leads').select('id', { count: 'exact', head: true })),
      ]);
      const trialEnds = p.trial_ends_at ? new Date(p.trial_ends_at) : null;
      return {
        org_id: orgId,
        name: p.full_name || user.name || null,
        org_name: p.organizations?.name || null,
        plan: p.organizations?.subscription_plan || p.selected_plan || null,
        subscription_status: p.subscription_status || null,
        trial_days_left: trialEnds && p.subscription_status === 'trialing' ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 864e5)) : null,
        units: props ? { count: props.count ?? (props.data as unknown[])?.length ?? 0, names: ((props.data as { name: string }[]) || []).map((x) => x.name) } : null,
        channels: syncs ? ((syncs.data as any[]) || []).map((s) => ({ provider: s.provider, active: s.is_active !== false && s.sync_status !== 'PAUSED', last_sync_at: s.last_sync_at })) : null,
        messaging: msgs ? ((msgs.data as any[]) || []).filter((m) => m.is_active).map((m) => m.provider) : null,
        payments: pays ? ((pays.data as any[]) || []).filter((m) => m.is_active).map((m) => m.provider) : null,
        bookings_count: books?.count ?? null,
        leads_count: leads?.count ?? null,
        onboarding_completed: p.onboarding_completed ?? null,
        errors,
        phone: p.phone || null,
      } as OrgContext & { org_id: string | null };
    },
    async countUserMessages(userId, sinceMinutes) {
      const r = await admin.from('support_messages').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('sender', 'user').gte('created_at', new Date(Date.now() - sinceMinutes * 60000).toISOString());
      if (r.error) throw new Error(r.error.message);
      return r.count || 0;
    },
    async getConversation(id) {
      return must(await admin.from('support_conversations').select('id, user_id, org_id, status, mode, unhelpful_count, handoff_at, subject').eq('id', id).maybeSingle());
    },
    async createConversation(c) {
      return must(await admin.from('support_conversations').insert(c).select('id, user_id, org_id, status, mode, unhelpful_count, handoff_at, subject').single());
    },
    async updateConversation(id, patch) {
      must(await admin.from('support_conversations').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id));
    },
    async recentMessages(conversationId, limit) {
      const rows = must(await admin.from('support_messages').select('id, conversation_id, sender, body, created_at, author_name').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(limit)) as Message[];
      return rows.reverse();
    },
    async insertMessage(m) {
      return must(await admin.from('support_messages').insert(m).select('*').single());
    },
  };
}

/* ── local QA ─────────────────────────────────────────────────────────── */
export function memoryStore(users: Record<string, AuthedUser & { context: OrgContext & { org_id: string | null } }>): Store & { dump(): { conversations: Conversation[]; messages: Message[] } } {
  const convs = new Map<string, Conversation & Record<string, unknown>>();
  const msgs: (Message & { user_id: string })[] = [];
  const id = () => crypto.randomUUID();
  return {
    dump: () => ({ conversations: [...convs.values()], messages: msgs }),
    async getUser(jwt) { const u = users[jwt]; return u ? { id: u.id, email: u.email, name: u.name } : null; },
    async orgContext(jwt) { return structuredClone(users[jwt].context); },
    async countUserMessages(userId, sinceMinutes) {
      const since = Date.now() - sinceMinutes * 60000;
      return msgs.filter((m) => m.user_id === userId && m.sender === 'user' && new Date(m.created_at).getTime() >= since).length;
    },
    async getConversation(cid) { const c = convs.get(cid); return c ? structuredClone(c) : null; },
    async createConversation(c) {
      const row = { id: id(), status: 'open' as const, mode: 'bot' as const, unhelpful_count: 0, handoff_at: null, ...c };
      convs.set(row.id, row as Conversation & Record<string, unknown>);
      return structuredClone(row) as Conversation;
    },
    async updateConversation(cid, patch) { const c = convs.get(cid); if (c) Object.assign(c, patch); },
    async recentMessages(cid, limit) { return msgs.filter((m) => m.conversation_id === cid).slice(-limit).map((m) => structuredClone(m)); },
    async insertMessage(m) {
      if (m.client_id && msgs.some((x) => x.conversation_id === m.conversation_id && x.client_id === m.client_id)) throw new Error('duplicate key value violates unique constraint "idx_support_msg_client"');
      const row = { links: [], meta: {}, ...m, id: id(), created_at: new Date().toISOString() } as Message & { user_id: string };
      msgs.push(row);
      const c = convs.get(m.conversation_id);
      if (c) {
        c.subject ||= m.sender === 'user' ? m.body.slice(0, 120) : null;
        c.last_sender = m.sender;
        if (m.sender === 'user') c.status = 'open';
      }
      return structuredClone(row);
    },
  };
}
