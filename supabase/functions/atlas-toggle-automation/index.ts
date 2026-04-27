/**
 * ATLAS Edge Function — Toggle automation rule active flag
 *
 * Purpose: Authenticated org users with role ADMIN or MANAGER may set
 * `automation_rules.is_active` for a rule in their organization.
 * STAFF / unmapped users receive 403.
 *
 * Env (set by Supabase, never expose service_role to clients):
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type AtlasRole = "ADMIN" | "MANAGER" | "STAFF";

const REQUIRED_ROLES: AtlasRole[] = ["ADMIN", "MANAGER"];

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(
  body: Record<string, unknown>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateBody(raw: unknown): { ok: true; rule_id: string; is_active: boolean } | { ok: false; error: string } {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }
  const o = raw as Record<string, unknown>;
  const rule_id = o.rule_id;
  const is_active = o.is_active;
  if (typeof rule_id !== "string" || !UUID_RE.test(rule_id)) {
    return { ok: false, error: "Field rule_id must be a valid UUID" };
  }
  if (typeof is_active !== "boolean") {
    return { ok: false, error: "Field is_active must be a boolean" };
  }
  return { ok: true, rule_id, is_active };
}

async function resolveAtlasRole(
  service: ReturnType<typeof createClient>,
  authUserId: string,
  authEmail: string | undefined,
): Promise<{ role: AtlasRole; orgId: string | null }> {
  const { data: profile, error: pErr } = await service
    .from("profiles")
    .select("organization_id")
    .eq("id", authUserId)
    .maybeSingle();

  if (pErr || !profile?.organization_id) {
    return { role: "STAFF", orgId: null };
  }

  const orgId = profile.organization_id as string;

  const { data: org, error: oErr } = await service
    .from("organizations")
    .select("owner_id")
    .eq("id", orgId)
    .maybeSingle();

  if (!oErr && org?.owner_id === authUserId) {
    return { role: "ADMIN", orgId };
  }

  if (!authEmail) {
    return { role: "STAFF", orgId };
  }

  const { data: appUser, error: uErr } = await service
    .from("users")
    .select("role")
    .eq("org_id", orgId)
    .ilike("email", authEmail)
    .maybeSingle();

  if (uErr || !appUser?.role) {
    return { role: "STAFF", orgId };
  }

  const r = String(appUser.role).toUpperCase();
  if (r === "ADMIN" || r === "OWNER") return { role: "ADMIN", orgId };
  if (r === "MANAGER") return { role: "MANAGER", orgId };
  if (r === "STAFF" || r === "MEMBER") return { role: "STAFF", orgId };
  return { role: "STAFF", orgId };
}

async function insertAudit(
  service: ReturnType<typeof createClient>,
  userId: string,
  action: string,
  tableName: string,
  recordId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const { error } = await service.from("audit_log").insert({
    user_id: userId,
    action,
    table_name: tableName,
    record_id: recordId,
    metadata,
  });
  if (error) {
    console.error("[audit_log]", error.code, error.message);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ success: false, error: "Server misconfiguration" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ success: false, error: "Missing or invalid Authorization" }, 401);
  }

  // 1) Auth — user JWT + anon client (never trust body for identity)
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser();

  if (authErr || !user) {
    return json({ success: false, error: "Not authenticated" }, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 422);
  }

  const parsed = validateBody(body);
  if (!parsed.ok) {
    return json({ success: false, error: parsed.error }, 422);
  }

  const service = createClient(supabaseUrl, serviceKey);

  // 2) Role — ADMIN | MANAGER only for this operation
  const { role, orgId } = await resolveAtlasRole(
    service,
    user.id,
    user.email ?? undefined,
  );

  if (!orgId) {
    return json({ success: false, error: "No organization context" }, 403);
  }

  if (!REQUIRED_ROLES.includes(role)) {
    return json({ success: false, error: "Insufficient role" }, 403);
  }

  // 4) Business logic — scoped update via service_role + explicit org check
  try {
    const { data: existing, error: readErr } = await service
      .from("automation_rules")
      .select("id, org_id, name, is_active")
      .eq("id", parsed.rule_id)
      .maybeSingle();

    if (readErr) {
      await insertAudit(service, user.id, "toggle_automation_failed", "automation_rules", parsed.rule_id, {
        reason: "read_error",
      });
      return json({ success: false, error: "Could not load automation rule" }, 500);
    }

    if (!existing || existing.org_id !== orgId) {
      return json({ success: false, error: "Rule not found" }, 404);
    }

    const { data: updated, error: upErr } = await service
      .from("automation_rules")
      .update({ is_active: parsed.is_active })
      .eq("id", parsed.rule_id)
      .eq("org_id", orgId)
      .select("id, is_active, name")
      .single();

    if (upErr || !updated) {
      await insertAudit(service, user.id, "toggle_automation_failed", "automation_rules", parsed.rule_id, {
        reason: "update_error",
      });
      return json({ success: false, error: "Could not update automation rule" }, 500);
    }

    await insertAudit(service, user.id, "toggle_automation", "automation_rules", parsed.rule_id, {
      is_active: parsed.is_active,
      role,
    });

    return json(
      {
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          is_active: updated.is_active,
        },
      },
      200,
    );
  } catch (_e) {
    await insertAudit(service, user.id, "toggle_automation_failed", "automation_rules", parsed.rule_id, {
      reason: "unexpected",
    });
    return json({ success: false, error: "Unexpected server error" }, 500);
  }
});
