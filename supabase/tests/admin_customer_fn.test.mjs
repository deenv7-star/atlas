// Run: npm i --no-save @electric-sql/pglite && node supabase/tests/admin_customer_fn.test.mjs
// (or PGLITE_DIR=/path/to/node_modules/@electric-sql/pglite node supabase/tests/admin_customer_fn.test.mjs)
//
// Real Postgres 17 (PGlite) with a Supabase-like auth/storage stub. Applies 001-007, 010-013b, 020 and the NEW
// 023 (never applied to any live DB by this test), then drives the admin-customer edge function core
// (supabase/functions/admin-customer/core.ts) against a DISPOSABLE customer created here. No network, no real users.
// Exits 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PG = process.env.PGLITE_DIR || '@electric-sql/pglite';
const { PGlite } = await import(PG.startsWith('@') ? PG : path.join(PG, 'dist/index.js'));
const { uuid_ossp } = await import(PG.startsWith('@') ? `${PG}/contrib/uuid_ossp` : path.join(PG, 'dist/contrib/uuid_ossp.js'));
const core = await import('../functions/admin-customer/core.ts');

const M = new URL('../migrations/', import.meta.url).pathname;
const db = new PGlite({ extensions: { uuid_ossp } });
const out = []; let pass = 0, fail = 0;
const log = (ok, name, extra = '') => { ok ? pass++ : fail++; out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };
const read = (f) => fs.readFileSync(M + f, 'utf8').replace(/notify pgrst[^;]*;/gi, '');

await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email varchar(255), last_sign_in_at timestamptz, email_confirmed_at timestamptz,
  raw_user_meta_data jsonb default '{}', created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create schema storage;
create table storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text);
alter table storage.objects enable row level security;
create schema extensions;
`);
for (const f of ['001_initial.sql', '002_trial_system.sql', '003_invoice_and_users_platform.sql', '004_onboarding_completed_backfill.sql', '005_audit_log.sql', '006_schema_alignment.sql', '007_ui_columns.sql', '010_org_settings.sql', '011_platform_admin.sql', '012_admin_units_from_properties.sql', '013_tenant_guard.sql', '013b_audit_fixes.sql']) {
  await db.exec(read(f));
}
// 014 needs btree_gist/pgcrypto/pg_cron: add only the columns/tables 023 reads (same names/types as live, checked 19.10.2026).
await db.exec(`
alter table public.calendar_syncs add column if not exists sync_status text, add column if not exists last_sync_at timestamptz,
  add column if not exists error_message text, add column if not exists label text, add column if not exists last_attempt_at timestamptz,
  add column if not exists last_success_at timestamptz, add column if not exists events_count integer not null default 0,
  add column if not exists conflicts jsonb not null default '[]'::jsonb;
create table if not exists public.message_queue (id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id) on delete cascade,
  template_key text not null default 'x', status text not null default 'pending', sent_at timestamptz, due_at timestamptz default now(), dedupe_key text default gen_random_uuid()::text,
  created_at timestamptz default now(), updated_at timestamptz default now());
`);
const s020 = await db.exec(read('020_support.sql')).then(() => true, (e) => e.message);
if (s020 !== true) {
  await db.exec(`create table if not exists public.support_conversations (id uuid primary key default gen_random_uuid(), org_id uuid references public.organizations(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade);
  create table if not exists public.support_messages (id uuid primary key default gen_random_uuid(), org_id uuid references public.organizations(id) on delete cascade, user_id uuid, author_id uuid, conversation_id uuid);`);
}
log(true, `base schema ready (020 ${s020 === true ? 'applied' : 'stubbed: ' + String(s020).slice(0, 60)})`);

// ── seed ──────────────────────────────────────────────────────────────────
const U = {
  deen: '11111111-1111-1111-1111-111111111111', qa: '22222222-2222-2222-2222-222222222222', sup: '44444444-4444-4444-4444-444444444444',
  victim: '55555555-5555-5555-5555-555555555555', victimMate: '66666666-6666-6666-6666-666666666666', other: '77777777-7777-7777-7777-777777777777',
};
const EMAIL = { deen: 'deenv7@gmail.com', qa: 'qa+hark@atlas-il.com', sup: 'support@atlas-il.com', victim: 'disposable-owner@test.invalid', victimMate: 'disposable-mate@test.invalid', other: 'keep-me@zimmer.co.il' };
for (const [k, id] of Object.entries(U)) {
  await db.query(`insert into auth.users (id, email, raw_user_meta_data, last_sign_in_at, email_confirmed_at) values ($1,$2,$3, now(), case when $4 then now() end)`,
    [id, EMAIL[k], JSON.stringify({ full_name: k, organization_name: k === 'victim' ? 'צימר בדיקה למחיקה' : k + ' org' }), k !== 'victimMate']);
}
// re-run 011 bootstrap now that Deen/QA exist, then add support
await db.exec(read('011_platform_admin.sql'));
await db.query(`insert into public.platform_admins (user_id, email, role) values ($1, $2, 'support') on conflict do nothing`, [U.sup, EMAIL.sup]);
const orgOf = async (uid) => (await db.query('select organization_id from public.profiles where id=$1', [uid])).rows[0].organization_id;
const VORG = await orgOf(U.victim); const OORG = await orgOf(U.other); const DORG = await orgOf(U.deen);
// mate joins the victim org (and its own auto-org is removed, like an invite)
const mateOrg = await orgOf(U.victimMate);
await db.query('update public.profiles set organization_id=$1 where id=$2', [VORG, U.victimMate]);
await db.query('delete from public.organizations where id=$1', [mateOrg]);
const IMG = `https://romvmqbcinurscwdsskx.supabase.co/storage/v1/object/public/atlas-files/uploads/1729_abc.jpg`;
for (const org of [VORG, OORG]) {
  await db.query(`insert into public.properties (org_id, name, images) values ($1, 'צימר הגפן', $2)`, [org, JSON.stringify(org === VORG ? [IMG] : [])]);
  await db.query(`insert into public.bookings (org_id, guest_name, check_in_date, total_price) values ($1,'דנה לוי', current_date, 1200),($1,'יוסי כהן', current_date + 3, 900)`, [org]);
  await db.query(`insert into public.leads (org_id, full_name) values ($1, 'ליד')`, [org]);
  await db.query(`insert into public.calendar_syncs (org_id, provider, ical_url, is_active, error_message) values ($1, 'AIRBNB', 'https://www.airbnb.com/calendar/ical/123.ics?s=SECRET_TOKEN', true, $2)`, [org, org === VORG ? 'http_404' : null]);
  await db.query(`insert into public.platform_customer_notes (org_id, body) values ($1, 'הערה')`, [org]);
  await db.query(`insert into public.message_queue (org_id, status, sent_at) values ($1, 'sent', now()), ($1, 'pending', null)`, [org]);
}
await db.query(`insert into public.invoices (org_id, invoice_number) values ($1, 'R-1')`, [VORG]);
await db.query(`insert into public.audit_log (user_id, action, table_name) values ($1, 'login', 'auth')`, [U.victim]);
await db.query(`insert into public.contact_messages (name, email, message, user_id) values ('x','disposable-owner@test.invalid','שלום',$1)`, [U.victim]);
// the 013b guard stamps user_id from auth.uid() (null for this superuser seed): set it like a signed-in sender
await db.query(`update public.contact_messages set user_id=$1 where email='disposable-owner@test.invalid'`, [U.victim]);
await db.query(`update public.organizations set settings = settings || '{"host_phone":"0525979520"}'::jsonb where id=$1`, [VORG]);
await db.query(`insert into storage.buckets (id, name, public) values ('atlas-files','atlas-files',true) on conflict do nothing`);

async function as(uid, sql, params = []) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid || '']);
  await db.exec(uid ? 'set role authenticated' : 'set role anon');
  try { const r = await db.query(sql, params); return { ok: true, rows: r.rows }; }
  catch (e) { return { ok: false, err: e.message, code: e.code }; }
  finally { await db.exec('reset role'); }
}
const denied = (r) => !r.ok && (r.code === '42501' || /permission denied|required|not authenticated/.test(r.err));

// ── 023 ───────────────────────────────────────────────────────────────────
const m023 = read('023_admin_v2.sql');
const a1 = await db.exec(m023).then(() => true, (e) => e.message);
log(a1 === true, 'migration 023 applies cleanly on 001-013b(+020)', a1 === true ? '' : a1);
log(await db.exec(m023).then(() => true, (e) => e.message) === true, 'migration 023 is re-runnable');
const bucket = (await db.query(`select public from storage.buckets where id='admin-backups'`)).rows[0];
log(bucket && bucket.public === false, 'admin-backups bucket is private');

const list = await as(U.sup, 'select public.admin_list_customers_v2() r');
const rows = list.ok ? list.rows[0].r : [];
const byOrg = Object.fromEntries(rows.map((r) => [r.org_id, r]));
log(list.ok && rows.length >= 4, 'support can read admin_list_customers_v2', list.err || `rows=${rows.length}`);
log(byOrg[VORG]?.is_test === true && byOrg[VORG]?.is_test_source === 'auto', 'test pattern: @test.invalid? (no) — owner disposable-owner@test.invalid', JSON.stringify(byOrg[VORG] && { t: byOrg[VORG].is_test, s: byOrg[VORG].is_test_source }));
log(byOrg[OORG]?.is_test === false, 'real-looking customer is not flagged as test');
log(byOrg[(await orgOf(U.qa))]?.is_test === true, 'qa+… owner is flagged as test automatically');
log(byOrg[VORG]?.members_count === 2 && byOrg[VORG]?.ical_feeds === 1 && byOrg[VORG]?.ical_errors === 1 && byOrg[VORG]?.wa_ready === true, 'v2 list: members, iCal health, WhatsApp readiness', JSON.stringify(byOrg[VORG] && [byOrg[VORG].members_count, byOrg[VORG].ical_feeds, byOrg[VORG].ical_errors, byOrg[VORG].wa_ready]));
const det = await as(U.sup, `select public.admin_get_customer_v2($1) r`, [VORG]);
const d = det.ok ? det.rows[0].r : {};
log(det.ok && d.members?.length === 2 && d.calendar_syncs?.length === 1 && d.whatsapp?.host_phone === '0525979520', 'customer 360: members, syncs, WhatsApp', det.err || '');
log(det.ok && !JSON.stringify(d).includes('SECRET_TOKEN'), 'customer 360 never returns iCal URLs (private tokens)');
log(det.ok && d.members.find((m) => m.user_id === U.victimMate)?.email_confirmed === false, 'customer 360: unconfirmed member is visible as unconfirmed');

const cust = await as(U.other, 'select public.admin_list_customers_v2()');
log(denied(cust), 'a normal customer cannot call admin_list_customers_v2', cust.err);
const anonr = await as(null, `select public.admin_get_customer_v2('${VORG}')`);
log(!anonr.ok, 'anon cannot call admin_get_customer_v2', anonr.err);
const flagsRead = await as(U.qa, 'select * from public.platform_org_flags');
log(!flagsRead.ok, 'platform_org_flags is not readable directly, even by an admin', flagsRead.err);
const supFlag = await as(U.sup, `select public.admin_set_test_flag($1, true)`, [OORG]);
log(denied(supFlag), 'support cannot change the test flag', supFlag.err);
const qaFlag = await as(U.qa, `select public.admin_set_test_flag($1, true, 'demo')`, [OORG]);
const after = (await as(U.qa, 'select public.admin_list_customers_v2() r')).rows[0].r.find((r) => r.org_id === OORG);
log(qaFlag.ok && after.is_test === true && after.is_test_source === 'manual', 'admin can flag a customer as test (manual wins)', qaFlag.err || '');
await as(U.qa, `select public.admin_set_test_flag($1, null)`, [OORG]);
const back = (await as(U.qa, 'select public.admin_list_customers_v2() r')).rows[0].r.find((r) => r.org_id === OORG);
log(back.is_test === false && back.is_test_source === null, 'null clears the manual flag back to automatic');
const flagLog = (await db.query(`select count(*)::int n from public.admin_audit_log where action='customer.flag_test' and org_id=$1`, [OORG])).rows[0].n;
log(flagLog === 2, 'every flag change is in admin_audit_log', `n=${flagLog}`);
const ev = await as(U.sup, `select public.admin_log_event('customer.view_as', $1, '{"tab":"today"}')`, [VORG]);
log(ev.ok, 'support can log a view-as event', ev.err || '');
const evBad = await as(U.sup, `select public.admin_log_event('customer.delete', $1, '{}')`, [VORG]);
log(!evBad.ok, 'admin_log_event refuses actions outside its allow-list (cannot forge a delete row)', evBad.err);
const evCust = await as(U.other, `select public.admin_log_event('customer.view_as', $1, '{}')`, [VORG]);
log(denied(evCust), 'a customer cannot write admin audit events');

// ── edge function core on a disposable org ────────────────────────────────
const store = { 'atlas-files': new Map([['uploads/1729_abc.jpg', 'jpg-bytes'], ['uploads/other.jpg', 'keep']]), 'admin-backups': new Map() };
const sent = [];
let failUpload = false;
const T = (spec) => ({ table: spec.table, col: spec.table === 'organizations' ? 'id' : spec.key });
async function exists(table) { return (await db.query(`select to_regclass('public.' || $1) is not null e`, [table])).rows[0].e; }
const port = {
  async roleOf(uid) { return (await db.query('select role from public.platform_admins where user_id=$1', [uid])).rows[0]?.role || null; },
  async getOrg(id) { return (await db.query('select id, name, owner_id, email from public.organizations where id=$1', [id])).rows[0] || null; },
  async members(id) {
    return (await db.query(`select p.id user_id, coalesce(u.email, p.email) email, exists(select 1 from public.platform_admins a where a.user_id=p.id) is_staff,
      u.email_confirmed_at is not null email_confirmed from public.profiles p left join auth.users u on u.id=p.id where p.organization_id=$1`, [id])).rows;
  },
  async rows(spec, org, ids) {
    if (!(await exists(spec.table))) return [];
    const { col } = T(spec);
    if (col === 'user_id') return ids.length ? (await db.query(`select * from public.${spec.table} where user_id = any($1::uuid[])`, [ids])).rows : [];
    return (await db.query(`select * from public.${spec.table} where ${col}=$1`, [org])).rows;
  },
  async count(spec, org, ids) { return (await this.rows(spec, org, ids)).length; },
  async deleteLoose(spec, ids) { if (!ids.length || !(await exists(spec.table))) return 0; return (await db.query(`delete from public.${spec.table} where user_id = any($1::uuid[])`, [ids])).affectedRows || 0; },
  async deleteOrg(id) { await db.query('delete from public.organizations where id=$1', [id]); },
  async deleteAuthUser(id) { await db.query('delete from auth.users where id=$1', [id]); },
  async storageExists(paths) { return paths.filter((p) => store['atlas-files'].has(p)); },
  async storageRemove(paths) { return paths.filter((p) => store['atlas-files'].delete(p)); },
  async uploadBackup(p, body) { if (failUpload) throw new Error('storage down'); if (store['admin-backups'].has(p)) throw new Error('exists'); store['admin-backups'].set(p, body); },
  async backupExists(p) { return store['admin-backups'].has(p); },
  async signBackup(p) { return `signed://${p}`; },
  async sendPasswordReset(email) { sent.push(['reset', email]); },
  async resendConfirmation(email) { sent.push(['confirm', email]); },
  async countAudit(actor, actions, since) { return (await db.query('select count(*)::int n from public.admin_audit_log where actor_id=$1 and action = any($2) and created_at >= $3', [actor, actions, since])).rows[0].n; },
  async audit(r) { await db.query('insert into public.admin_audit_log (actor_id, actor_email, action, target_type, target_id, org_id, details) values ($1,$2,$3,$4,$5,$6,$7)', [r.actor_id, r.actor_email, r.action, r.target_type, r.target_id, r.org_id, JSON.stringify(r.details)]); },
  now: () => new Date(),
  async sha256(t) { return crypto.createHash('sha256').update(t).digest('hex'); },
};
const call = async (who, body) => {
  try { return { ok: true, data: await core.handle(port, who ? { id: U[who], email: EMAIL[who] } : null, body) }; }
  catch (e) { return { ok: false, status: e.status, code: e.code, msg: e.message }; }
};
const countAll = async (org) => {
  const o = {};
  for (const t of core.TABLES) if (t.key !== 'user_id') o[t.table] = await port.count(t, org, []);
  return o;
};
const otherBefore = await countAll(OORG);

let r = await call(null, { action: 'preview', org_id: VORG });
log(!r.ok && r.status === 401, 'no caller → 401', r.code);
r = await call('other', { action: 'preview', org_id: VORG });
log(!r.ok && r.status === 403, 'a customer (not staff) → 403', r.code);
r = await call('sup', { action: 'preview', org_id: VORG });
log(!r.ok && r.status === 403, 'support → 403 on preview', r.code);
r = await call('qa', { action: 'preview', org_id: 'not-a-uuid' });
log(!r.ok && r.code === 'bad_org', 'bad org id → 400');
const pv = await call('qa', { action: 'preview', org_id: VORG });
const P = pv.data || {};
log(pv.ok && P.counts.bookings === 2 && P.counts.properties === 1 && P.counts.calendar_syncs === 1 && P.auth_users.length === 2 && P.files === 1 && P.counts.contact_messages === 1 && P.counts.audit_log === 1,
  'preview lists exactly what will be deleted (2 bookings, 1 unit, 1 iCal, 2 logins, 1 file, loose rows)', JSON.stringify({ files: P.files, cm: P.counts?.contact_messages, al: P.counts?.audit_log, u: P.auth_users?.length }));
r = await call('qa', { action: 'delete', org_id: VORG, confirm: 'צימר בדיקה למחיקה', acknowledge: true, fingerprint: P.fingerprint });
log(!r.ok && r.status === 403, 'admin (not owner) cannot delete', r.code);
const staffPv = await call('deen', { action: 'preview', org_id: DORG });
log(staffPv.ok && staffPv.data.blocked === 'staff_member', 'preview of an org with atlas staff is marked blocked');
r = await call('deen', { action: 'delete', org_id: DORG, confirm: staffPv.data?.org_name, acknowledge: true, fingerprint: staffPv.data?.fingerprint });
log(!r.ok && r.code === 'staff_member', 'cannot delete an org that has atlas staff (Deen\'s own)', r.code);
r = await call('deen', { action: 'delete', org_id: VORG, confirm: 'צימר אחר', acknowledge: true, fingerprint: P.fingerprint });
log(!r.ok && r.code === 'confirm_mismatch', 'wrong typed name → refused', r.code);
r = await call('deen', { action: 'delete', org_id: VORG, confirm: 'צימר בדיקה למחיקה', fingerprint: P.fingerprint });
log(!r.ok && r.code === 'not_acknowledged', 'missing acknowledge → refused');
r = await call('deen', { action: 'delete', org_id: VORG, confirm: 'צימר בדיקה למחיקה', acknowledge: true, fingerprint: 'stale' });
log(!r.ok && r.code === 'changed_since_preview', 'stale preview fingerprint → refused');
failUpload = true;
r = await call('deen', { action: 'delete', org_id: VORG, confirm: 'disposable-owner@test.invalid', acknowledge: true, fingerprint: P.fingerprint });
failUpload = false;
const stillThere = await port.getOrg(VORG);
log(!r.ok && r.code === 'backup_failed' && stillThere && (await port.count({ table: 'bookings', key: 'org_id' }, VORG, [])) === 2 && store['atlas-files'].has('uploads/1729_abc.jpg'),
  'backup failure → nothing deleted (org, bookings, file all intact)', r.code);

const ex = await call('qa', { action: 'export', org_id: VORG });
const exJson = JSON.stringify(ex.data || {});
log(ex.ok && ex.data.tables.bookings.length === 2 && ex.data.files.includes('uploads/1729_abc.jpg'), 'export one customer: every table + file list');
log(ex.ok && !exJson.includes('SECRET_TOKEN') && exJson.includes('[הוסתר]'), 'browser export redacts iCal URL / integration secrets');
const exLog = (await db.query(`select count(*)::int n from public.admin_audit_log where action='customer.export' and org_id=$1`, [VORG])).rows[0].n;
log(exLog === 1, 'export is logged');

r = await call('qa', { action: 'resend_confirmation', org_id: VORG });
log(!r.ok && r.code === 'already_confirmed', 'resend confirmation to a confirmed owner → 409');
r = await call('qa', { action: 'resend_confirmation', org_id: VORG, email: EMAIL.victimMate });
log(r.ok && sent.at(-1)?.[0] === 'confirm' && sent.at(-1)?.[1] === EMAIL.victimMate, 'resend confirmation to an unconfirmed member');
r = await call('qa', { action: 'password_reset', org_id: VORG });
log(r.ok && sent.at(-1)?.[0] === 'reset' && sent.at(-1)?.[1] === EMAIL.victim, 'password reset goes to the owner');
r = await call('qa', { action: 'password_reset', org_id: DORG });
log(!r.ok && r.code === 'staff_member', 'cannot send a reset to atlas staff from here');
r = await call('qa', { action: 'password_reset', org_id: VORG, email: 'stranger@x.com' });
log(!r.ok && r.code === 'member_not_found', 'cannot send a reset to an e-mail outside the org');

// the real delete (disposable org only)
const pv2 = (await call('deen', { action: 'preview', org_id: VORG })).data;
const del = await call('deen', { action: 'delete', org_id: VORG, confirm: '  צימר   בדיקה למחיקה ', acknowledge: true, fingerprint: pv2.fingerprint, reason: 'בדיקה אוטומטית' });
log(del.ok && del.data.ok === true && !del.data.partial, 'owner deletes the disposable org', JSON.stringify(del.data || del.code));
const left = await countAll(VORG);
log(Object.values(left).every((n) => n === 0), 'every org table is empty for that org afterwards', JSON.stringify(Object.fromEntries(Object.entries(left).filter(([, n]) => n))));
const users = (await db.query('select count(*)::int n from auth.users where id = any($1::uuid[])', [[U.victim, U.victimMate]])).rows[0].n;
const profs = (await db.query('select count(*)::int n from public.profiles where id = any($1::uuid[])', [[U.victim, U.victimMate]])).rows[0].n;
log(users === 0 && profs === 0, 'both logins and their profiles are gone');
const loose = (await db.query(`select (select count(*) from public.contact_messages where user_id=$1)::int c, (select count(*) from public.audit_log where user_id=$1)::int a`, [U.victim])).rows[0];
log(loose.c === 0 && loose.a === 0, 'loose rows (site inquiries, customer audit log) removed too');
log(!store['atlas-files'].has('uploads/1729_abc.jpg') && store['atlas-files'].has('uploads/other.jpg'), 'its file removed, other files untouched');
const otherAfter = await countAll(OORG);
log(JSON.stringify(otherAfter) === JSON.stringify(otherBefore), 'the other customer is untouched', JSON.stringify(otherAfter));
const bk = [...store['admin-backups'].entries()].find(([k]) => k.startsWith(VORG));
const bkJson = bk ? JSON.parse(bk[1]) : null;
log(bkJson && bkJson.tables.bookings.length === 2 && bk[1].includes('SECRET_TOKEN') && bkJson.auth_users.length === 2, 'server backup is complete (incl. secrets, private bucket only)');
const delRow = (await db.query(`select details from public.admin_audit_log where action='customer.delete' and org_id=$1`, [VORG])).rows[0];
log(delRow && delRow.details.backup_path?.startsWith('admin-backups/') && delRow.details.users_deleted.length === 2 && delRow.details.reason === 'בדיקה אוטומטית' && delRow.details.backup_sha256?.length === 64,
  'audit row written with counts, backup path + sha256, reason, deleted logins', JSON.stringify(delRow?.details?.counts?.bookings));
const tamper = await db.exec(`update public.admin_audit_log set action='x' where action='customer.delete'`).then(() => 'updated', (e) => e.message);
log(/append-only/.test(tamper), 'the delete record cannot be edited (append-only)');
r = await call('deen', { action: 'preview', org_id: VORG });
log(!r.ok && r.code === 'org_not_found', 'deleted org → 404 on the next call');

// rate limit: 3 deletes / hour / actor
for (let i = 0; i < 2; i++) await port.audit({ actor_id: U.deen, actor_email: EMAIL.deen, action: 'customer.delete', target_type: 'organization', target_id: OORG, org_id: null, details: { synthetic: true } });
r = await call('deen', { action: 'delete', org_id: OORG, confirm: 'other org', acknowledge: true, fingerprint: 'x' });
log(!r.ok && r.status === 429, '4th delete within an hour → 429', r.code);
log((await port.getOrg(OORG)) !== null, 'rate-limited delete did not touch the other org');

console.log(out.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
