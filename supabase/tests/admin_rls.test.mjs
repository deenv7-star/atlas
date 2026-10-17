// Run: npm i --no-save @electric-sql/pglite && node supabase/tests/admin_rls.test.mjs
// Real Postgres (PGlite) + a Supabase-like auth stub: applies 001-007 then 011 and checks every role boundary.
// Exits 1 on any failure.
// Applies 001..007 + 010 + 011 to PGlite (real Postgres 17 in WASM) with a Supabase-like auth stub,
// then checks what an anonymous user, a normal customer, support, admin and owner can and cannot do.
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import fs from 'node:fs';
const M = new URL('../migrations/', import.meta.url).pathname;
const db = new PGlite({ extensions: { uuid_ossp } });
const out = []; let pass = 0, fail = 0;
const log = (ok, name, extra = '') => { ok ? pass++ : fail++; out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };
await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email varchar(255), last_sign_in_at timestamptz, raw_user_meta_data jsonb default '{}', created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- minimal Supabase storage stub for 010 (bucket + object policy)
create schema storage;
create table storage.buckets (id text primary key, name text not null, public boolean default false);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text);
alter table storage.objects enable row level security;
`);
for (const f of ['001_initial.sql','002_trial_system.sql','003_invoice_and_users_platform.sql','004_onboarding_completed_backfill.sql','005_audit_log.sql','006_schema_alignment.sql','007_ui_columns.sql']) {
  await db.exec(fs.readFileSync(M + f, 'utf8').replace(/notify pgrst[^;]*;/gi, ''));
}
// Seed: Deen (owner-to-be), QA (admin-to-be), a normal customer, a support person.
const U = { deen: '11111111-1111-1111-1111-111111111111', qa: '22222222-2222-2222-2222-222222222222', cust: '33333333-3333-3333-3333-333333333333', sup: '44444444-4444-4444-4444-444444444444' };
for (const [k, id] of Object.entries(U)) {
  const email = { deen: 'deenv7@gmail.com', qa: 'qa+hark@atlas-il.com', cust: 'owner@zimmer.co.il', sup: 'support@atlas-il.com' }[k];
  await db.query(`insert into auth.users (id, email, raw_user_meta_data, last_sign_in_at) values ($1, $2, $3, now())`, [id, email, JSON.stringify({ full_name: k, organization_name: k + ' org' })]);
}
const orgOf = async (uid) => (await db.query('select organization_id from public.profiles where id=$1', [uid])).rows[0].organization_id;
const CORG = await orgOf(U.cust);
await db.query(`insert into public.units (org_id, name) values ($1,'צימר 1'),($1,'צימר 2')`, [CORG]);
await db.query(`insert into public.bookings (org_id, guest_name, guest_phone, check_in_date, total_price) values ($1,'דנה לוי','0501234567', current_date, 1200)`, [CORG]);
const m010 = fs.readFileSync(M + '010_org_settings.sql', 'utf8').replace(/notify pgrst[^;]*;/gi, '');
await db.exec(m010);
log(true, 'migration 010 applies cleanly on top of 001-007');
log(await db.exec(m010).then(() => true, () => false), 'migration 010 is re-runnable (idempotent)');
const colS = (await db.query(`select data_type, is_nullable, column_default from information_schema.columns where table_schema='public' and table_name='organizations' and column_name='settings'`)).rows[0];
log(colS?.data_type === 'jsonb' && colS.is_nullable === 'NO', 'organizations.settings is jsonb not null default {}', JSON.stringify(colS));
const own = await as(U.cust, `update public.organizations set settings = '{"check_in_time":"14:00"}' where id = $1 returning settings`, [CORG]);
log(own.ok && own.rows.length === 1 && own.rows[0].settings.check_in_time === '14:00', 'customer can write their own org settings', own.err || '');
const other = await as(U.cust, `update public.organizations set settings = '{"x":1}' where id <> $1 returning id`, [CORG]);
log(other.ok && other.rows.length === 0, 'customer cannot write another org\'s settings (RLS)', other.err || `rows=${other.rows?.length}`);
const otherRead = await as(U.cust, `select settings from public.organizations where id <> $1`, [CORG]);
log(otherRead.ok && otherRead.rows.length === 0, 'customer cannot read another org\'s settings');
const bkt = (await db.query(`select public from storage.buckets where id='atlas-files'`)).rows[0];
log(bkt?.public === true, 'atlas-files bucket created (public read)');
await db.exec(fs.readFileSync(M + '011_platform_admin.sql', 'utf8').replace(/notify pgrst[^;]*;/gi, ''));
log(true, 'migration 011 applies cleanly on top of 001-007');
const again = await db.exec(fs.readFileSync(M + '011_platform_admin.sql', 'utf8').replace(/notify pgrst[^;]*;/gi, '')).then(() => true, (e) => e.message);
log(again === true, 'migration 011 is re-runnable (idempotent)', again === true ? '' : again);
const boot = (await db.query('select email, role from public.platform_admins order by email')).rows;
log(boot.length === 2 && boot.find((r) => r.email === 'deenv7@gmail.com')?.role === 'owner' && boot.find((r) => r.email.startsWith('qa+'))?.role === 'admin', 'bootstrap: deenv7 = owner, QA = admin, nobody else', JSON.stringify(boot));

async function as(uid, sql, params = []) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid || '']);
  await db.exec(uid ? 'set role authenticated' : 'set role anon');
  try { const r = await db.query(sql, params); return { ok: true, rows: r.rows }; }
  catch (e) { return { ok: false, err: e.message, code: e.code }; }
  finally { await db.exec('reset role'); }
}
const denied = (r) => !r.ok && (r.code === '42501' || /permission denied|required|not authenticated/.test(r.err));

// add support member as owner (Deen) for later tests
const addSup = await as(U.deen, `select public.admin_set_team_member('support@atlas-il.com','support') r`);
log(addSup.ok, 'owner can add a support member', addSup.err || '');

const RPCS = [
  ['admin_list_customers', 'select * from public.admin_list_customers()'],
  ['admin_get_customer', `select public.admin_get_customer('${CORG}')`],
  ['admin_list_charges', 'select public.admin_list_charges()'],
  ['admin_list_plans', 'select public.admin_list_plans()'],
  ['admin_list_team', 'select public.admin_list_team()'],
  ['admin_list_audit', 'select public.admin_list_audit()'],
  ['admin_system_health', 'select public.admin_system_health()'],
  ['admin_extend_trial', `select public.admin_extend_trial('${CORG}', 7)`],
  ['admin_change_plan', `select public.admin_change_plan('${CORG}', 'pro')`],
  ['admin_set_suspended', `select public.admin_set_suspended('${CORG}', true, 'x')`],
  ['admin_add_note', `select public.admin_add_note('${CORG}', 'hi')`],
  ['admin_record_charge', `select public.admin_record_charge('${CORG}', 399)`],
  ['admin_update_plan', `select public.admin_update_plan('starter', 1, 1, 3, 'x', '[]', false, true)`],
  ['admin_set_team_member', `select public.admin_set_team_member('owner@zimmer.co.il', 'owner')`],
  ['admin_log (internal)', `select public.admin_log('x','y','z',null,'{}')`],
  ['admin_ensure_subscription (internal)', `select public.admin_ensure_subscription('${CORG}')`],
];
for (const [who, uid] of [['anonymous', null], ['customer (non-admin)', U.cust]]) {
  for (const [n, sql] of RPCS) { const r = await as(uid, sql); log(denied(r), `${who} cannot call ${n}`, r.ok ? 'ALLOWED: ' + JSON.stringify(r.rows).slice(0, 120) : r.err); }
  for (const t of ['platform_admins','platform_plans','platform_subscriptions','platform_charges','platform_customer_notes','admin_audit_log']) {
    const r = await as(uid, `select * from public.${t}`); log(denied(r) || (r.ok && r.rows.length === 0), `${who} cannot read table ${t}`, r.ok ? `rows=${r.rows.length}` : r.err);
    const w = await as(uid, `insert into public.${t} default values`); log(!w.ok, `${who} cannot insert into ${t}`, w.ok ? 'INSERTED' : w.err.slice(0, 60));
  }
  const who2 = await as(uid, 'select public.admin_whoami() w, public.is_platform_admin() a');
  log(who2.ok ? (who2.rows[0].w === null && who2.rows[0].a === false) : denied(who2), `${who}: admin_whoami() is null / is_platform_admin() false`, JSON.stringify(who2.rows || who2.err));
}
// customer cannot make themselves admin through the old users.is_platform_admin flag path
const selfAdmin = await as(U.cust, `insert into public.platform_admins (user_id,email,role) values ('${U.cust}','owner@zimmer.co.il','owner')`);
log(!selfAdmin.ok, 'customer cannot insert themselves into platform_admins', selfAdmin.err || 'INSERTED');
await as(U.cust, `insert into public.users (email, org_id, is_platform_admin) values ('owner@zimmer.co.il', '${CORG}', true)`);
const flagged = await as(U.cust, 'select public.is_platform_admin() a');
log(flagged.ok && flagged.rows[0].a === false, 'setting users.is_platform_admin=true on own org row grants nothing');
// customer still sees only their own org via normal tables (no new policies leak)
const custOrgs = await as(U.cust, 'select id from public.organizations');
log(custOrgs.ok && custOrgs.rows.length === 1 && custOrgs.rows[0].id === CORG, 'customer still sees exactly 1 organization (own)');
// admin's own customer app is NOT widened
const deenOrgs = await as(U.deen, 'select id from public.organizations');
const deenBookings = await as(U.deen, 'select id from public.bookings');
log(deenOrgs.ok && deenOrgs.rows.length === 1 && deenBookings.rows.length === 0, 'platform owner\'s normal app queries still see only their own org (no cross-org leak)');

// support: reads yes, writes no
for (const [n, sql] of RPCS.slice(0, 7)) { const r = await as(U.sup, sql); log(r.ok, `support can call ${n}`, r.err || ''); }
const supNote = await as(U.sup, `select public.admin_add_note('${CORG}', 'שוחחנו בטלפון')`); log(supNote.ok, 'support can add a note', supNote.err || '');
for (const n of ['admin_extend_trial', 'admin_change_plan', 'admin_set_suspended', 'admin_record_charge', 'admin_update_plan', 'admin_set_team_member']) {
  const r = await as(U.sup, RPCS.find((x) => x[0] === n)[1]); log(denied(r), `support cannot call ${n}`, r.ok ? 'ALLOWED' : r.err);
}
// admin (QA): customer actions yes, plans/team no
const ext = await as(U.qa, `select public.admin_extend_trial('${CORG}', 7) r`); log(ext.ok, 'admin can extend trial', ext.err || '');
const prof = (await db.query('select trial_ends_at, subscription_status, selected_plan from public.profiles where id=$1', [U.cust])).rows[0];
log(prof.trial_ends_at && new Date(prof.trial_ends_at) > new Date(Date.now() + 6 * 864e5), 'extend trial is visible to the customer app (profiles.trial_ends_at moved)', String(prof.trial_ends_at));
const bad = await as(U.qa, `select public.admin_extend_trial('${CORG}', 500)`); log(!bad.ok, 'extend trial rejects 500 days');
const ch = await as(U.qa, `select public.admin_change_plan('${CORG}', 'pro', 'yearly', null, 'active') r`); log(ch.ok, 'admin can change plan', ch.err || '');
const org = (await db.query('select subscription_plan from public.organizations where id=$1', [CORG])).rows[0];
log(org.subscription_plan === 'pro', 'change plan is visible to the customer app (organizations.subscription_plan)');
const bogus = await as(U.qa, `select public.admin_change_plan('${CORG}', 'platinum')`); log(!bogus.ok, 'change plan rejects unknown plan');
const susp = await as(U.qa, `select public.admin_set_suspended('${CORG}', true, 'חוב פתוח')`); log(susp.ok, 'admin can suspend', susp.err || '');
const my = await as(U.cust, 'select public.my_account_status() s'); log(my.ok && my.rows[0].s.suspended === true, 'customer sees own suspension via my_account_status()', JSON.stringify(my.rows || my.err));
const myOther = await as(U.deen, 'select public.my_account_status() s'); log(myOther.ok && myOther.rows[0].s === null, 'my_account_status() returns only the caller\'s own org');
const list = await as(U.qa, 'select status, plan_key, units_count, bookings_count, owner_email from public.admin_list_customers() where org_id=$1', [CORG]);
log(list.ok && list.rows[0].status === 'suspended' && list.rows[0].plan_key === 'pro' && list.rows[0].units_count === 2 && list.rows[0].bookings_count === 1, 'customer list reflects suspended / pro / 2 units / 1 booking', JSON.stringify(list.rows || list.err));
const re = await as(U.qa, `select public.admin_set_suspended('${CORG}', false)`); log(re.ok, 'admin can reactivate');
const rc = await as(U.qa, `select public.admin_record_charge('${CORG}', 559, 'failed', 'card', 'מנוי שנתי') r`); log(rc.ok, 'admin can record a failed charge', rc.err || '');
const cid = rc.rows?.[0]?.r?.id;
const mp = await as(U.qa, `select public.admin_mark_charge_paid('${cid}', 'bank_transfer') r`); log(mp.ok && mp.rows[0].r.status === 'paid', 'admin can mark a charge paid');
const mp2 = await as(U.qa, `select public.admin_mark_charge_paid('${cid}')`); log(!mp2.ok, 'mark paid twice is rejected');
const det = await as(U.qa, `select public.admin_get_customer('${CORG}') d`);
const d = det.rows?.[0]?.d;
log(det.ok && d.units.length === 2 && d.charges.length === 1 && d.notes.length === 1 && d.audit.length >= 5, 'customer detail returns units, charges, notes, audit', det.err || `audit=${d?.audit?.length}`);
log(det.ok && d.recent_bookings[0].guest_initials === 'דל' && !JSON.stringify(d).includes('0501234567') && !JSON.stringify(d).includes('דנה לוי'), 'view-as is privacy-safe: guest initials only, no guest phone/name');
for (const n of ['admin_update_plan', 'admin_set_team_member']) { const r = await as(U.qa, RPCS.find((x) => x[0] === n)[1]); log(denied(r), `admin cannot call ${n} (owner only)`, r.ok ? 'ALLOWED' : r.err); }
const forge = await as(U.qa, `select public.admin_log('fake','x','y',null,'{}')`); log(!forge.ok, 'admin cannot forge audit rows by calling admin_log directly', forge.err || 'ALLOWED');
// owner
const up = await as(U.deen, `select public.admin_update_plan('starter', 429, 349, 3, 'למתחמים קטנים', '["עד 3 נכסים"]', false, true) r`); log(up.ok && up.rows[0].r.price_monthly === 429, 'owner can update a plan price', up.err || '');
const rmSelf = await as(U.deen, `select public.admin_remove_team_member('${U.deen}')`); log(!rmSelf.ok, 'owner cannot remove themselves');
const demote = await as(U.deen, `select public.admin_set_team_member('deenv7@gmail.com', 'admin')`); log(!demote.ok, 'last owner cannot be demoted');
const noUser = await as(U.deen, `select public.admin_set_team_member('nobody@x.com', 'admin')`); log(!noUser.ok, 'adding an email with no ATLAS login is rejected');
const rm = await as(U.deen, `select public.admin_remove_team_member('${U.sup}')`); log(rm.ok, 'owner can remove support member');
const supGone = await as(U.sup, 'select * from public.admin_list_customers()'); log(denied(supGone), 'removed member loses access immediately');
// audit immutability
const audDel = await db.query('delete from public.admin_audit_log').then(() => 'DELETED', (e) => e.message);
log(/append-only/.test(audDel), 'audit log is append-only even for the table owner', audDel);
const aud = (await db.query('select action from public.admin_audit_log order by id')).rows.map((r) => r.action);
log(['team.add','trial.extend','plan.change','account.suspend','account.reactivate','charge.record','charge.mark_paid','plan.update','team.remove','note.add'].every((a) => aud.includes(a)), 'every action wrote an audit row', aud.join(','));
// user deletion still works (no FK from audit log)
const del = await db.query(`delete from auth.users where id='${U.sup}'`).then(() => true, (e) => e.message);
log(del === true, 'deleting an auth user still works after admin actions (audit keeps actor_email)', del === true ? '' : del);
// grants check: no admin_* function executable by anon
const anonFns = (await db.query(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname like 'admin\\_%' or p.proname in ('is_platform_admin','my_account_status')) and has_function_privilege('anon', p.oid, 'execute')`)).rows;
log(anonFns.length === 0, 'anon has EXECUTE on no admin function', anonFns.map((r) => r.proname).join(','));
const defs = (await db.query(`select p.proname, p.prosecdef, array_to_string(p.proconfig, ',') cfg from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'admin\\_%' and p.prosecdef`)).rows;
log(defs.every((r) => /search_path=public, pg_temp/.test(r.cfg || '')), `all ${defs.length} SECURITY DEFINER admin functions pin search_path`);
const hl = await as(U.deen, 'select public.admin_system_health() h');
log(hl.ok && hl.rows[0].h.schema.org_settings_010 === true && hl.rows[0].h.schema.platform_admin_011 === true && hl.rows[0].h.schema.guest_pages_008 === false && hl.rows[0].h.schema.expenses_009 === false, 'health reports 010 + 011 applied, 008/009 not', JSON.stringify(hl.rows?.[0]?.h?.schema || hl.err));

console.log(out.join('\n')); console.log(`\n${pass} passed, ${fail} failed`);

if (fail) process.exit(1);
