// admin-customer: privileged customer actions for the platform admin console (/admin).
// NOT DEPLOYED. Deploy only after Deen approves (see qa/admin-v2/report.md):
//   supabase functions deploy admin-customer --project-ref romvmqbcinurscwdsskx
// (verify_jwt stays ON, the default: the gateway rejects calls without a valid user JWT before this code runs.)
//
// Security model
//   • The service-role key is read from the function's own environment and never leaves this server.
//   • Caller identity = the user JWT in Authorization (checked again here with auth.getUser).
//   • Caller role = public.platform_admins, read with the service role (never from the request body).
//     delete → owner only; preview / export / emails → admin or owner.
//   • CSRF: no cookies are used; the browser must send a bearer token, and Origin must be on the allow-list.
//   • Rate limits come from admin_audit_log (3 deletes, 20 exports, 10 emails per actor per hour).
//   • Delete = typed confirmation (business name or owner e-mail) + fingerprint of the preview + verified backup
//     in the private admin-backups bucket BEFORE any row is removed + an append-only audit row.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { handle, HttpError, ERRORS_HE, type Port, type TableSpec, type Member, type Role } from "./core.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SITE = Deno.env.get("ATLAS_SITE_URL") || "https://atlas-il.com";
const ALLOWED = new Set(
  (Deno.env.get("ATLAS_ADMIN_ORIGINS") || "https://atlas-il.com,https://www.atlas-il.com").split(",").map((s) => s.trim()).filter(Boolean),
);
const BUCKET = "admin-backups";
const FILES = "atlas-files";

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED.has(origin) ? origin : "https://atlas-il.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
}

const svc = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
const missing = (e: { code?: string; message?: string } | null) => !!e && (e.code === "42P01" || e.code === "PGRST205" || /does not exist|could not find the table/i.test(e.message || ""));

const port: Port = {
  async roleOf(userId) {
    const { data, error } = await svc.from("platform_admins").select("role").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    return (data?.role as Role) || null;
  },
  async getOrg(orgId) {
    const { data, error } = await svc.from("organizations").select("id,name,owner_id,email").eq("id", orgId).maybeSingle();
    if (error) throw error;
    return data;
  },
  async members(orgId) {
    const { data: profs, error } = await svc.from("profiles").select("id,email").eq("organization_id", orgId);
    if (error) throw error;
    const ids = (profs || []).map((p) => p.id);
    const { data: staff } = ids.length ? await svc.from("platform_admins").select("user_id").in("user_id", ids) : { data: [] };
    const staffSet = new Set((staff || []).map((s) => s.user_id));
    const out: Member[] = [];
    for (const p of profs || []) {
      const { data: u } = await svc.auth.admin.getUserById(p.id);
      out.push({ user_id: p.id, email: u?.user?.email || p.email || null, is_staff: staffSet.has(p.id), email_confirmed: !!u?.user?.email_confirmed_at });
    }
    return out;
  },
  async rows(t: TableSpec, orgId, memberIds) {
    if (t.key === "user_id" && !memberIds.length) return [];
    let q = svc.from(t.table).select("*");
    q = t.table === "organizations" ? q.eq("id", orgId) : t.key === "user_id" ? q.in("user_id", memberIds) : q.eq(t.key, orgId);
    const { data, error } = await q.limit(50000);
    if (missing(error)) return [];
    if (error) throw error;
    return data || [];
  },
  async count(t: TableSpec, orgId, memberIds) {
    if (t.key === "user_id" && !memberIds.length) return 0;
    let q = svc.from(t.table).select("*", { count: "exact", head: true });
    q = t.table === "organizations" ? q.eq("id", orgId) : t.key === "user_id" ? q.in("user_id", memberIds) : q.eq(t.key, orgId);
    const { count, error } = await q;
    if (missing(error)) return 0;
    if (error) throw error;
    return count || 0;
  },
  async deleteLoose(t: TableSpec, memberIds) {
    if (!memberIds.length) return 0;
    const { count, error } = await svc.from(t.table).delete({ count: "exact" }).in("user_id", memberIds);
    if (missing(error)) return 0;
    if (error) throw error;
    return count || 0;
  },
  async deleteOrg(orgId) {
    const { error } = await svc.from("organizations").delete().eq("id", orgId);
    if (error) throw error;
  },
  async deleteAuthUser(userId) {
    const { error } = await svc.auth.admin.deleteUser(userId);
    if (error) throw error;
  },
  async storageExists(paths) {
    const found: string[] = [];
    for (const p of paths) {
      const dir = p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "";
      const name = p.slice(p.lastIndexOf("/") + 1);
      const { data } = await svc.storage.from(FILES).list(dir, { search: name, limit: 5 });
      if ((data || []).some((o) => o.name === name)) found.push(p);
    }
    return found;
  },
  async storageRemove(paths) {
    const { data, error } = await svc.storage.from(FILES).remove(paths);
    if (error) throw error;
    return (data || []).map((o) => o.name);
  },
  async uploadBackup(path, body) {
    const { error } = await svc.storage.from(BUCKET).upload(path, new Blob([body], { type: "application/json" }), { upsert: false, contentType: "application/json" });
    if (error) throw error;
  },
  async backupExists(path) {
    const dir = path.slice(0, path.lastIndexOf("/"));
    const name = path.slice(path.lastIndexOf("/") + 1);
    const { data } = await svc.storage.from(BUCKET).list(dir, { search: name, limit: 2 });
    return (data || []).some((o) => o.name === name);
  },
  async signBackup(path, seconds) {
    const { data } = await svc.storage.from(BUCKET).createSignedUrl(path, seconds, { download: true });
    return data?.signedUrl || null;
  },
  async sendPasswordReset(email) {
    const { error } = await anon.auth.resetPasswordForEmail(email, { redirectTo: `${SITE}/update-password` });
    if (error) throw error;
  },
  async resendConfirmation(email) {
    const { error } = await anon.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${SITE}/verify-email?confirmed=1` } });
    if (error) throw error;
  },
  async countAudit(actorId, actions, sinceIso) {
    const { count, error } = await svc.from("admin_audit_log").select("id", { count: "exact", head: true })
      .eq("actor_id", actorId).in("action", actions).gte("created_at", sinceIso);
    if (error) throw error;
    return count || 0;
  },
  async audit(row) {
    const { error } = await svc.from("admin_audit_log").insert(row);
    if (error) throw error;
  },
  now: () => new Date(),
  async sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  },
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === "OPTIONS") return new Response(null, { status: origin && ALLOWED.has(origin) ? 204 : 403, headers: cors(origin) });
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405);
  if (!origin || !ALLOWED.has(origin)) return reply({ error: "bad_origin", message: ERRORS_HE.bad_origin }, 403);

  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  let caller = null;
  if (jwt && jwt !== ANON) {
    const { data } = await svc.auth.getUser(jwt);
    if (data?.user) caller = { id: data.user.id, email: data.user.email || null };
  }
  let body: Record<string, unknown> = {};
  try {
    const raw = await req.text();
    if (raw.length > 20_000) return reply({ error: "too_large" }, 413);
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return reply({ error: "bad_json" }, 400);
  }
  try {
    return reply(await handle(port, caller, body));
  } catch (e) {
    if (e instanceof HttpError) return reply({ error: e.code, message: ERRORS_HE[e.code] || "הפעולה לא הצליחה." }, e.status);
    console.error("admin-customer", (e as Error)?.message);
    return reply({ error: "internal", message: "הפעולה לא הצליחה. שום דבר לא נמחק בלי גיבוי." }, 500);
  }
});
