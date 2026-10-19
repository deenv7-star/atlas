// admin-customer core: every rule of the destructive / privileged customer actions, with no I/O of its own.
// index.ts plugs in Supabase (service role, server-side only); supabase/tests/admin_customer_fn.test.mjs plugs in
// real Postgres (PGlite) with a disposable org. Keep this file dependency-free so both can import it.
//
// Actions:  preview (admin+) · export (admin+) · password_reset (admin+) · resend_confirmation (admin+) · delete (owner)

export type Role = "owner" | "admin" | "support";
export type Caller = { id: string; email: string | null };
export type Member = { user_id: string; email: string | null; is_staff: boolean; email_confirmed: boolean };
export type OrgRow = { id: string; name: string | null; owner_id: string | null; email: string | null };

/** Everything the core needs from the outside world. */
export interface Port {
  roleOf(userId: string): Promise<Role | null>;
  getOrg(orgId: string): Promise<OrgRow | null>;
  members(orgId: string): Promise<Member[]>;
  /** rows of one table for this org (org_id / organization_id / user_id IN members, per TABLES) */
  rows(table: TableSpec, orgId: string, memberIds: string[]): Promise<Record<string, unknown>[]>;
  count(table: TableSpec, orgId: string, memberIds: string[]): Promise<number>;
  /** deletes rows that the org cascade does not reach (by user_id) */
  deleteLoose(table: TableSpec, memberIds: string[]): Promise<number>;
  deleteOrg(orgId: string): Promise<void>;
  deleteAuthUser(userId: string): Promise<void>;
  storageExists(paths: string[]): Promise<string[]>;
  storageRemove(paths: string[]): Promise<string[]>;
  uploadBackup(path: string, body: string): Promise<void>;
  backupExists(path: string): Promise<boolean>;
  signBackup(path: string, seconds: number): Promise<string | null>;
  sendPasswordReset(email: string): Promise<void>;
  resendConfirmation(email: string): Promise<void>;
  countAudit(actorId: string, actions: string[], sinceIso: string): Promise<number>;
  audit(row: { actor_id: string; actor_email: string | null; action: string; target_type: string; target_id: string | null; org_id: string | null; details: Record<string, unknown> }): Promise<void>;
  now(): Date;
  sha256(text: string): Promise<string>;
}

export type TableSpec = { table: string; key: "org_id" | "organization_id" | "user_id"; label: string; group: string; cascade: boolean; secret?: string[] };

/** What a customer owns. `cascade` = removed by deleting the organizations row (ON DELETE CASCADE, checked on the live DB 19.10.2026). */
export const TABLES: TableSpec[] = [
  { table: "organizations", key: "org_id", label: "העסק", group: "org", cascade: true },
  { table: "profiles", key: "organization_id", label: "פרופילים של משתמשים", group: "users", cascade: false },
  { table: "users", key: "org_id", label: "משתמשי צוות (ישן)", group: "users", cascade: true },
  { table: "properties", key: "org_id", label: "יחידות / נכסים", group: "units", cascade: true },
  { table: "units", key: "org_id", label: "יחידות (טבלה ישנה)", group: "units", cascade: true },
  { table: "bookings", key: "org_id", label: "הזמנות", group: "bookings", cascade: true },
  { table: "leads", key: "org_id", label: "לידים", group: "leads", cascade: true },
  { table: "payments", key: "org_id", label: "תשלומים של אורחים", group: "money", cascade: true },
  { table: "invoices", key: "org_id", label: "קבלות וחשבוניות", group: "money", cascade: true },
  { table: "expenses", key: "org_id", label: "הוצאות", group: "money", cascade: true },
  { table: "messages", key: "org_id", label: "הודעות", group: "messages", cascade: true },
  { table: "message_logs", key: "org_id", label: "יומן הודעות", group: "messages", cascade: true },
  { table: "message_queue", key: "org_id", label: "תור הודעות וואטסאפ", group: "messages", cascade: true },
  { table: "cleaning_tasks", key: "org_id", label: "משימות ניקיון", group: "ops", cascade: true },
  { table: "calendar_syncs", key: "org_id", label: "חיבורי iCal", group: "ops", cascade: true, secret: ["ical_url"] },
  { table: "automation_rules", key: "org_id", label: "אוטומציות", group: "ops", cascade: true },
  { table: "contract_templates", key: "org_id", label: "תבניות חוזה", group: "ops", cascade: true },
  { table: "contract_instances", key: "org_id", label: "חוזים", group: "ops", cascade: true },
  { table: "review_requests", key: "org_id", label: "בקשות ביקורת", group: "ops", cascade: true },
  { table: "guest_requests", key: "org_id", label: "בקשות אורחים", group: "ops", cascade: true },
  { table: "messaging_integrations", key: "org_id", label: "חיבורי הודעות", group: "integrations", cascade: true, secret: ["config"] },
  { table: "accounting_integrations", key: "org_id", label: "חיבורי הנהלת חשבונות", group: "integrations", cascade: true, secret: ["config", "credentials", "api_key"] },
  { table: "pms_integrations", key: "org_id", label: "חיבורי PMS", group: "integrations", cascade: true, secret: ["config", "credentials", "api_key"] },
  { table: "payment_gateways", key: "org_id", label: "חיבורי סליקה", group: "integrations", cascade: true, secret: ["config", "credentials", "api_key", "secret_key"] },
  { table: "subscriptions", key: "org_id", label: "מנוי (טבלה ישנה)", group: "atlas", cascade: true },
  { table: "support_conversations", key: "org_id", label: "שיחות תמיכה", group: "atlas", cascade: true },
  { table: "support_messages", key: "org_id", label: "הודעות תמיכה", group: "atlas", cascade: true },
  { table: "platform_subscriptions", key: "org_id", label: "מנוי atlas", group: "atlas", cascade: true },
  { table: "platform_charges", key: "org_id", label: "חיובי atlas", group: "atlas", cascade: true },
  { table: "platform_customer_notes", key: "org_id", label: "הערות צוות", group: "atlas", cascade: true },
  { table: "platform_org_flags", key: "org_id", label: "סימון חשבון בדיקה", group: "atlas", cascade: true },
  { table: "audit_log", key: "user_id", label: "יומן פעולות של הלקוח", group: "users", cascade: false },
  { table: "contact_messages", key: "user_id", label: "פניות מהאתר", group: "users", cascade: false },
];

export const LIMITS = {
  delete: { max: 3, windowMin: 60 },
  export: { max: 20, windowMin: 60 },
  email: { max: 10, windowMin: 60 },
};
const NEEDS: Record<string, Role> = { preview: "admin", export: "admin", password_reset: "admin", resend_confirmation: "admin", delete: "owner" };
const RANK: Record<Role, number> = { owner: 3, admin: 2, support: 1 };

export class HttpError extends Error {
  status: number; code: string;
  constructor(status: number, code: string, message?: string) { super(message || code); this.status = status; this.code = code; }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const norm = (s: unknown) => String(s ?? "").normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();

/** Object paths inside the public atlas-files bucket that this customer's rows point at. */
export function fileRefs(rowsByTable: Record<string, Record<string, unknown>[]>): string[] {
  const found = new Set<string>();
  const re = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/atlas-files\/([A-Za-z0-9._\-\/%]+)/g;
  const text = JSON.stringify(rowsByTable);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const p = decodeURIComponent(m[1]).replace(/\\+$/, "");
    if (!p.includes("..")) found.add(p);
  }
  return [...found].sort();
}

/** Same shape as the export, with secret columns blanked (the browser download never carries API keys or iCal tokens). */
export function redact(rowsByTable: Record<string, Record<string, unknown>[]>): Record<string, Record<string, unknown>[]> {
  const out: Record<string, Record<string, unknown>[]> = {};
  for (const spec of TABLES) {
    const rows = rowsByTable[spec.table];
    if (!rows) continue;
    out[spec.table] = rows.map((r) => {
      const c = { ...r };
      for (const k of spec.secret || []) if (k in c && c[k] != null) c[k] = "[הוסתר]";
      return c;
    });
  }
  return out;
}

async function authorize(port: Port, caller: Caller | null, action: string): Promise<Role> {
  if (!caller?.id) throw new HttpError(401, "not_authenticated");
  const need = NEEDS[action];
  if (!need) throw new HttpError(400, "bad_action");
  const role = await port.roleOf(caller.id);
  if (!role || RANK[role] < RANK[need]) throw new HttpError(403, "forbidden");
  return role;
}

async function rateLimit(port: Port, caller: Caller, kind: keyof typeof LIMITS, actions: string[]) {
  const { max, windowMin } = LIMITS[kind];
  const since = new Date(port.now().getTime() - windowMin * 60_000).toISOString();
  const n = await port.countAudit(caller.id, actions, since);
  if (n >= max) throw new HttpError(429, "rate_limited");
}

async function load(port: Port, orgId: string) {
  if (!UUID.test(orgId || "")) throw new HttpError(400, "bad_org");
  const org = await port.getOrg(orgId);
  if (!org) throw new HttpError(404, "org_not_found");
  const members = await port.members(orgId);
  return { org, members, memberIds: members.map((m) => m.user_id) };
}

export async function buildPreview(port: Port, orgId: string) {
  const { org, members, memberIds } = await load(port, orgId);
  const counts: Record<string, number> = {};
  for (const t of TABLES) counts[t.table] = await port.count(t, orgId, memberIds);
  const rowsForFiles: Record<string, Record<string, unknown>[]> = {};
  for (const t of TABLES.filter((x) => ["organizations", "profiles", "properties", "units", "invoices", "contract_instances", "expenses"].includes(x.table))) {
    rowsForFiles[t.table] = await port.rows(t, orgId, memberIds);
  }
  const refs = fileRefs(rowsForFiles);
  const files = refs.length ? await port.storageExists(refs) : [];
  const owner = members.find((m) => m.user_id === org.owner_id) || members[0] || null;
  const staff = members.filter((m) => m.is_staff).map((m) => m.email);
  const paidCharges = counts.platform_charges || 0;
  const summary = {
    org_id: org.id, org_name: org.name, owner_email: owner?.email || org.email || null,
    auth_users: members.map((m) => m.email), files: files.length, counts,
    blocked: staff.length ? "staff_member" : null, staff,
    warnings: [
      ...(paidCharges ? ["platform_charges"] : []),
      ...(counts.invoices ? ["invoices"] : []),
    ],
  };
  // The admin confirms exactly this: if anything changes between preview and delete, the delete stops.
  const fingerprint = await port.sha256(JSON.stringify({ c: counts, u: summary.auth_users, f: files }));
  return { ...summary, fingerprint, file_paths: files };
}

export async function buildExport(port: Port, orgId: string) {
  const { org, members, memberIds } = await load(port, orgId);
  const tables: Record<string, Record<string, unknown>[]> = {};
  for (const t of TABLES) tables[t.table] = await port.rows(t, orgId, memberIds);
  const files = fileRefs(tables);
  return {
    format: "atlas-customer-export/1",
    exported_at: port.now().toISOString(),
    org: { id: org.id, name: org.name },
    auth_users: members.map((m) => ({ id: m.user_id, email: m.email, email_confirmed: m.email_confirmed })),
    files,
    tables,
  };
}

export async function handle(port: Port, caller: Caller | null, body: Record<string, unknown>) {
  const action = String(body?.action || "");
  const orgId = String(body?.org_id || "");
  await authorize(port, caller, action);
  const me = caller as Caller;

  if (action === "preview") {
    return await buildPreview(port, orgId);
  }

  if (action === "export") {
    await rateLimit(port, me, "export", ["customer.export"]);
    const data = await buildExport(port, orgId);
    const counts = Object.fromEntries(Object.entries(data.tables).map(([k, v]) => [k, v.length]));
    await port.audit({ actor_id: me.id, actor_email: me.email, action: "customer.export", target_type: "organization", target_id: orgId, org_id: orgId, details: { counts } });
    return { ...data, tables: redact(data.tables) };
  }

  if (action === "password_reset" || action === "resend_confirmation") {
    await rateLimit(port, me, "email", ["auth.password_reset", "auth.resend_confirmation"]);
    const { org, members } = await load(port, orgId);
    const wanted = body?.email ? norm(body.email) : null;
    const target = (wanted ? members.find((m) => norm(m.email) === wanted) : members.find((m) => m.user_id === org.owner_id)) || (!wanted ? members[0] : null);
    if (!target?.email) throw new HttpError(404, "member_not_found");
    if (target.is_staff) throw new HttpError(403, "staff_member");
    if (action === "resend_confirmation") {
      if (target.email_confirmed) throw new HttpError(409, "already_confirmed");
      await port.resendConfirmation(target.email);
    } else {
      await port.sendPasswordReset(target.email);
    }
    await port.audit({ actor_id: me.id, actor_email: me.email, action: action === "password_reset" ? "auth.password_reset" : "auth.resend_confirmation", target_type: "user", target_id: target.user_id, org_id: orgId, details: { email: target.email } });
    return { ok: true, email: target.email };
  }

  // ── delete ──────────────────────────────────────────────────────────────
  await rateLimit(port, me, "delete", ["customer.delete", "customer.delete_failed"]);
  const preview = await buildPreview(port, orgId);
  if (preview.blocked) throw new HttpError(403, preview.blocked);
  if (body?.acknowledge !== true) throw new HttpError(400, "not_acknowledged");
  const typed = norm(body?.confirm);
  const accepted = [preview.org_name, preview.owner_email].filter(Boolean).map(norm);
  if (!typed || !accepted.includes(typed)) throw new HttpError(400, "confirm_mismatch");
  if (body?.fingerprint !== preview.fingerprint) throw new HttpError(409, "changed_since_preview");
  if (body?.reason != null && String(body.reason).length > 300) throw new HttpError(400, "reason_too_long");

  // 1. backup first, verified, or nothing happens
  const data = await buildExport(port, orgId);
  const stamp = port.now().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${orgId}/${stamp}.json`;
  const backupBody = JSON.stringify(data);
  const backupSha = await port.sha256(backupBody);
  try {
    await port.uploadBackup(backupPath, backupBody);
    if (!(await port.backupExists(backupPath))) throw new Error("missing after upload");
  } catch (e) {
    await port.audit({ actor_id: me.id, actor_email: me.email, action: "customer.delete_failed", target_type: "organization", target_id: orgId, org_id: orgId, details: { stage: "backup", error: String((e as Error)?.message || e).slice(0, 200) } });
    throw new HttpError(502, "backup_failed");
  }

  const failures: string[] = [];
  // 2. the organization first (cascades every org table). If this fails, nothing else has been touched.
  try {
    await port.deleteOrg(orgId);
  } catch (e) {
    await port.audit({ actor_id: me.id, actor_email: me.email, action: "customer.delete_failed", target_type: "organization", target_id: orgId, org_id: orgId, details: { stage: "organization", backup_path: backupPath, error: String((e as Error)?.message || e).slice(0, 200) } });
    throw new HttpError(500, "delete_failed");
  }
  // 3. rows that the cascade does not reach (by user)
  const loose: Record<string, number> = {};
  for (const t of TABLES.filter((x) => x.key === "user_id")) {
    try { loose[t.table] = await port.deleteLoose(t, data.auth_users.map((u) => u.id)); } catch { failures.push(t.table); }
  }
  // 4. files the rows pointed at (best effort, recorded)
  let filesRemoved: string[] = [];
  if (preview.file_paths.length) {
    try { filesRemoved = await port.storageRemove(preview.file_paths); } catch { failures.push("storage"); }
  }
  // 5. login accounts
  const usersDeleted: string[] = [];
  for (const u of data.auth_users) {
    try { await port.deleteAuthUser(u.id); usersDeleted.push(u.email || u.id); } catch { failures.push(`auth:${u.email || u.id}`); }
  }
  // 6. the permanent record (admin_audit_log has no FK on org_id, so it outlives the org)
  const details = {
    org_name: preview.org_name, owner_email: preview.owner_email, reason: body?.reason || null,
    counts: preview.counts, files_removed: filesRemoved.length, users_deleted: usersDeleted,
    loose_rows: loose, backup_path: `admin-backups/${backupPath}`, backup_sha256: backupSha,
    failures,
  };
  await port.audit({ actor_id: me.id, actor_email: me.email, action: "customer.delete", target_type: "organization", target_id: orgId, org_id: orgId, details });
  const url = await port.signBackup(backupPath, 3600).catch(() => null);
  return { ok: failures.length === 0, partial: failures.length > 0, failures, backup_path: details.backup_path, backup_url: url, counts: preview.counts, users_deleted: usersDeleted };
}

/** Plain-Hebrew messages for every error code the UI can get. */
export const ERRORS_HE: Record<string, string> = {
  not_authenticated: "צריך להתחבר מחדש.",
  forbidden: "אין לכם הרשאה לפעולה הזו.",
  bad_action: "פעולה לא מוכרת.",
  bad_org: "מזהה לקוח לא תקין.",
  org_not_found: "הלקוח לא נמצא. אולי כבר נמחק.",
  member_not_found: "לא מצאנו משתמש עם האימייל הזה בחשבון.",
  staff_member: "בחשבון הזה יש איש צוות של atlas. אי אפשר לבצע עליו את הפעולה מכאן.",
  already_confirmed: "האימייל כבר אומת. אפשר לשלוח איפוס סיסמה במקום.",
  rate_limited: "יותר מדי פעולות כאלה בשעה האחרונה. נסו שוב מאוחר יותר.",
  not_acknowledged: "צריך לאשר שהבנתם שהמחיקה סופית.",
  confirm_mismatch: "הטקסט שהוקלד לא תואם לשם העסק או לאימייל.",
  changed_since_preview: "הנתונים של הלקוח השתנו מאז שנפתח החלון. פתחו אותו שוב כדי לראות מה יימחק.",
  backup_failed: "הגיבוי לא נשמר, ולכן שום דבר לא נמחק.",
  delete_failed: "המחיקה לא הושלמה. הגיבוי נשמר ושום נתון של העסק לא נמחק.",
  reason_too_long: "הסיבה ארוכה מדי.",
  bad_origin: "הבקשה נחסמה.",
};
