// property-import v1: "ייבוא מתחם". The owner pastes a Booking.com / Airbnb / own-website link (or a few), or pastes
// text / uploads screenshots when a site blocks us; we return a typed draft of their complex + what is still missing.
//   POST { op: 'import', urls?: string[], text?: string, images?: dataUrl[] } → { result, missing, sources… }
//   POST { op: 'save_photos', urls: string[] }                              → { saved: [{ from, url }] }
//   - Signed-in users only (user JWT); browsers only from the atlas origin allow-list (shared with ai-chat).
//   - Every outbound request goes through core.safeFetch (https, public IPs only, size/time caps, manual redirects).
//   - The OpenAI key is the existing edge secret OPENAI_API_KEY; it never reaches the browser.
//   - Nothing is written to the owner's tables here: the app saves the confirmed draft with its normal code paths.
//     Photos are copied to Storage only on save_photos (bucket atlas-files, the owner's JWT, the bucket's own policy).
//   - Usage is logged to property_imports when migration 033 exists (daily cap); without it the minute limiter holds.
// NOT DEPLOYED by this branch. Deploy: supabase functions deploy property-import (needs Deen's approval).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders, isAllowedOrigin, makeMinuteLimiter } from "../ai-chat/core.js";
import { runImport, savePhotos } from "./core.js";

const importMinuteOk = makeMinuteLimiter(4);
const photoMinuteOk = makeMinuteLimiter(4);
const DAILY_IMPORTS = 25;
const MODEL = Deno.env.get("IMPORT_MODEL") || "gpt-4.1-mini";

async function resolve(host: string): Promise<string[]> {
  const [a, aaaa] = await Promise.all([
    Deno.resolveDns(host, "A").catch(() => [] as string[]),
    Deno.resolveDns(host, "AAAA").catch(() => [] as string[]),
  ]);
  return [...a, ...aaaa];
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const CORS = corsHeaders(origin);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response("ok", { status: isAllowedOrigin(origin) ? 200 : 403, headers: CORS });
  if (!isAllowedOrigin(origin)) return json({ error: "forbidden_origin" }, 403);
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (Number(req.headers.get("content-length") || 0) > 8_000_000) return json({ error: "too_big" }, 413);

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: u, error: authErr } = await sb.auth.getUser(jwt);
  if (authErr || !u?.user) return json({ error: "unauthorized" }, 401);
  const uid = u.user.id;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }

  const { data: prof } = await sb.from("profiles").select("organization_id").eq("id", uid).maybeSingle();
  const orgId = (prof as { organization_id?: string } | null)?.organization_id || null;

  if (body.op === "save_photos") {
    if (!photoMinuteOk(uid)) return json({ error: "rate_limited" }, 429);
    if (!orgId) return json({ error: "no_org" }, 400);
    const upload = async (path: string, bytes: Uint8Array, type: string) => {
      const { error } = await sb.storage.from("atlas-files").upload(path, bytes, { contentType: type, upsert: false, cacheControl: "31536000" });
      if (error) { console.warn("import upload", error.message?.slice(0, 120)); return null; }
      return sb.storage.from("atlas-files").getPublicUrl(path).data.publicUrl;
    };
    const out = await savePhotos(body.urls as string[], orgId, { fetch, resolve, upload });
    return json(out);
  }

  // ── import ──
  if (!importMinuteOk(uid)) return json({ error: "rate_limited" }, 429);
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count, error: capErr } = await sb.from("property_imports").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", since);
  if (!capErr && (count ?? 0) >= DAILY_IMPORTS) return json({ error: "daily_limit" }, 429);

  const out = await runImport(
    { urls: body.urls as string[], text: String(body.text || ""), images: body.images as string[] },
    { fetch, resolve, key: Deno.env.get("OPENAI_API_KEY"), model: MODEL },
  );
  if ("error" in out && out.error) {
    return json(out, out.error === "nothing_to_import" ? 400 : 200);
  }
  // usage log (migration 033); a missing table is fine
  const r = out.result as { sources?: unknown[]; business_name?: string | null } | undefined;
  const { error: logErr } = await sb.from("property_imports").insert({
    user_id: uid, org_id: orgId, sources: r?.sources ?? [], used_paste: out.used_paste, used_images: out.used_images,
    model: MODEL, model_error: out.model_error, tokens: (out.usage as { total_tokens?: number } | null)?.total_tokens ?? null,
    found: { business_name: r?.business_name ?? null, missing: out.missing },
  });
  if (logErr && !/42P01|PGRST205|does not exist|schema cache/i.test(`${logErr.code} ${logErr.message}`)) console.warn("property_imports", logErr.code, logErr.message?.slice(0, 120));
  return json({ result: out.result, missing: out.missing, model_error: out.model_error });
});
