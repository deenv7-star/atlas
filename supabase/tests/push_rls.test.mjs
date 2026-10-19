// Run: npm i --no-save @electric-sql/pglite && node supabase/tests/push_rls.test.mjs
// Real Postgres 17 (PGlite) + a Supabase-like auth stub: applies 001-007, the 014 booking columns it needs, a stub
// of 015's atlas_call_edge (records calls instead of HTTP), then 022_push_notifications.sql, and checks:
// RLS of push_subscriptions, the push_subscribe RPC, and that the booking / lead triggers queue send-push
// (or stay silent) without ever breaking an insert. Exits 1 on any failure.
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import fs from 'node:fs';

const M = new URL('../migrations/', import.meta.url).pathname;
const db = new PGlite({ extensions: { uuid_ossp } });
const out = []; let pass = 0, fail = 0;
const log = (ok, name, extra = '') => { ok ? pass++ : fail++; out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };
const sql = (f) => fs.readFileSync(M + f, 'utf8').replace(/notify pgrst[^;]*;/gi, '');

await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema extensions;
create table auth.users (id uuid primary key, email varchar(255), last_sign_in_at timestamptz, raw_user_meta_data jsonb default '{}', created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
`);
for (const f of ['001_initial.sql', '002_trial_system.sql', '003_invoice_and_users_platform.sql', '004_onboarding_completed_backfill.sql', '005_audit_log.sql', '006_schema_alignment.sql', '007_ui_columns.sql']) await db.exec(sql(f));
// the parts of 014 / 015 that 022 depends on (014's GiST overlap constraint is not needed here)
await db.exec(`
alter table public.bookings add column if not exists external_uid text;
alter table public.bookings add column if not exists external_sync_id uuid;
alter table public.bookings add column if not exists is_block boolean not null default false;
create table public._edge_calls (fn text, body jsonb, at timestamptz default clock_timestamp());
create or replace function public.atlas_call_edge(p_fn text, p_body jsonb default '{"all": true}'::jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
begin
  if p_body->>'org_id' = '00000000-0000-0000-0000-00000000dead' then raise exception 'simulated pg_net failure'; end if;
  insert into public._edge_calls (fn, body) values (p_fn, p_body); return 1;
end $$;
revoke all on function public.atlas_call_edge(text, jsonb) from public, anon, authenticated;
grant select, insert on public.bookings, public.leads to authenticated;
`);

const U = { a: '33333333-3333-3333-3333-333333333333', a2: '66666666-6666-6666-6666-666666666666', b: '55555555-5555-5555-5555-555555555555' };
for (const [k, id] of Object.entries(U)) await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1,$2,$3)`, [id, `${k}@zimmer.test`, JSON.stringify({ full_name: k, organization_name: k + ' org' })]);
const orgOf = async (uid) => (await db.query('select organization_id from public.profiles where id=$1', [uid])).rows[0].organization_id;
const OA = await orgOf(U.a), OB = await orgOf(U.b);
// a2 is a team member of org A
await db.query('update public.profiles set organization_id=$1 where id=$2', [OA, U.a2]);

const first = await db.exec(sql('022_push_notifications.sql')).then(() => true, (e) => e.message);
log(first === true, 'migration 022 applies cleanly on top of 001-007 (+014/015 parts)', first === true ? '' : first);
const again = await db.exec(sql('022_push_notifications.sql')).then(() => true, (e) => e.message);
log(again === true, 'migration 022 is re-runnable (idempotent)', again === true ? '' : again);

async function as(uid, q, params = []) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid || '']);
  await db.exec(uid ? 'set role authenticated' : 'set role anon');
  try { const r = await db.query(q, params); return { ok: true, rows: r.rows }; }
  catch (e) { return { ok: false, err: e.message, code: e.code }; }
  finally { await db.exec('reset role'); }
}
const P256 = 'B' + 'x'.repeat(86); // 87 chars like a real base64url p256dh
const AUTH = 'a'.repeat(22);
const sub = (uid, ep, extra = '') => as(uid, `select public.push_subscribe($1,$2,$3${extra}) as id`, [ep, P256, AUTH]);

// ── push_subscribe + RLS ──
const s1 = await sub(U.a, 'https://fcm.googleapis.com/fcm/send/A1');
log(s1.ok && s1.rows[0].id, 'owner A subscribes a device through push_subscribe', s1.err || '');
const s2 = await sub(U.b, 'https://web.push.apple.com/B1');
log(s2.ok, 'owner B subscribes a device', s2.err || '');
const seeA = await as(U.a, 'select endpoint, org_id from public.push_subscriptions');
log(seeA.ok && seeA.rows.length === 1 && seeA.rows[0].endpoint.endsWith('/A1') && seeA.rows[0].org_id === OA, 'A sees only their own device, in their own org', JSON.stringify(seeA.rows || seeA.err));
const seeAnon = await as(null, 'select count(*)::int n from public.push_subscriptions');
log(!seeAnon.ok, 'anon cannot read push_subscriptions', seeAnon.err || JSON.stringify(seeAnon.rows));
const anonRpc = await sub(null, 'https://fcm.googleapis.com/fcm/send/X');
log(!anonRpc.ok, 'anon cannot call push_subscribe', anonRpc.err || '');
const forge = await as(U.a, `insert into public.push_subscriptions (user_id, org_id, endpoint, p256dh, auth) values ($1,$2,'https://x.test/forge',$3,$4)`, [U.b, OB, P256, AUTH]);
log(!forge.ok, 'A cannot insert a device for B / B\'s org', forge.err || 'inserted!');
const crossOrg = await as(U.a, `insert into public.push_subscriptions (user_id, org_id, endpoint, p256dh, auth) values ($1,$2,'https://x.test/forge2',$3,$4)`, [U.a, OB, P256, AUTH]);
log(!crossOrg.ok, 'A cannot insert their own device into another org', crossOrg.err || 'inserted!');
const updB = await as(U.a, `update public.push_subscriptions set prefs='{"bookings":false}' where endpoint like '%/B1' returning id`);
log(updB.ok && updB.rows.length === 0, 'A cannot change B\'s device', JSON.stringify(updB.rows || updB.err));
const delB = await as(U.a, `delete from public.push_subscriptions where endpoint like '%/B1' returning id`);
log(delB.ok && delB.rows.length === 0, 'A cannot delete B\'s device', JSON.stringify(delB.rows || delB.err));
const prefs = await as(U.a, `update public.push_subscriptions set prefs='{"bookings":true,"leads":false,"ical":true}' where endpoint like '%/A1' returning prefs`);
log(prefs.ok && prefs.rows.length === 1 && prefs.rows[0].prefs.leads === false, 'A can change their own device preferences', JSON.stringify(prefs.rows || prefs.err));
const badEp = await as(U.a, `select public.push_subscribe('http://insecure.test/x',$1,$2)`, [P256, AUTH]);
log(!badEp.ok, 'non-https endpoints are rejected', badEp.err || '');
// same endpoint re-registered by another account (shared phone): moves to the new owner, old owner loses it
const moved = await sub(U.a2, 'https://fcm.googleapis.com/fcm/send/A1');
const afterMove = await as(U.a, `select count(*)::int n from public.push_subscriptions`);
const a2rows = await as(U.a2, `select user_id from public.push_subscriptions`);
log(moved.ok && afterMove.rows[0].n === 0 && a2rows.rows.length === 1, 'a device re-registered by another user moves to that user', `${moved.err || ''} a=${afterMove.rows?.[0]?.n} a2=${a2rows.rows?.length}`);
await sub(U.a, 'https://fcm.googleapis.com/fcm/send/A2'); // A gets a second device back

// ── triggers ──
await db.exec('delete from public._edge_calls');
const insB = await as(U.a, `insert into public.bookings (org_id, guest_name, check_in_date, check_out_date, source) values ($1,'דנה כהן','2026-11-12','2026-11-14','direct') returning id`, [OA]);
const calls1 = (await db.query(`select fn, body from public._edge_calls`)).rows;
log(insB.ok && calls1.length === 1 && calls1[0].fn === 'send-push' && calls1[0].body.kind === 'booking' && calls1[0].body.id === insB.rows[0].id && calls1[0].body.actor === U.a,
  'a new booking queues send-push with kind, id, org and the inserting user as actor', JSON.stringify(calls1) + (insB.err || ''));
await db.exec('delete from public._edge_calls');
await db.query(`select set_config('request.jwt.claim.sub', '', false)`); // service role (iCal cron): no JWT
await db.query(`insert into public.bookings (org_id, guest_name, source, external_sync_id, external_uid, is_block, status) values ($1,'אורח Airbnb','airbnb',uuid_generate_v4(),'uid-1',true,'CONFIRMED')`, [OA]);
const calls2 = (await db.query(`select body from public._edge_calls`)).rows;
log(calls2.length === 1 && calls2[0].body.actor === null, 'an iCal / service-role booking queues send-push with no actor', JSON.stringify(calls2));
await db.exec('delete from public._edge_calls');
await db.query(`insert into public.bookings (org_id, guest_name, status) values ($1,'x','CANCELLED')`, [OA]);
log((await db.query(`select count(*)::int n from public._edge_calls`)).rows[0].n === 0, 'a cancelled booking does not notify');
const insL = await as(U.a, `insert into public.leads (org_id, full_name) values ($1,'יוסי לוי') returning id`, [OA]);
const calls3 = (await db.query(`select body from public._edge_calls`)).rows;
log(insL.ok && calls3.length === 1 && calls3[0].body.kind === 'lead', 'a new lead queues send-push (kind lead)', JSON.stringify(calls3) + (insL.err || ''));
await db.exec('delete from public._edge_calls');
// org B's only device disabled -> no call at all
await db.query(`update public.push_subscriptions set disabled_at = now() where org_id = $1`, [OB]);
await db.query(`insert into public.bookings (org_id, guest_name) values ($1,'x')`, [OB]);
log((await db.query(`select count(*)::int n from public._edge_calls`)).rows[0].n === 0, 'an org with no enabled device makes no call');
// a failing pg_net call never breaks the insert
await db.query(`insert into public.organizations (id, name) values ('00000000-0000-0000-0000-00000000dead','dead org')`);
await db.query(`insert into public.push_subscriptions (user_id, org_id, endpoint, p256dh, auth) values ($1,'00000000-0000-0000-0000-00000000dead','https://x.test/dead',$2,$3)`, [U.b, P256, AUTH]);
const survive = await db.query(`insert into public.bookings (org_id, guest_name) values ('00000000-0000-0000-0000-00000000dead','x') returning id`).then(() => true, (e) => e.message);
log(survive === true, 'a booking insert still succeeds when the notification call fails', survive === true ? '' : survive);
const fnPriv = await as(U.a, `select public.atlas_push_on_insert()`);
log(!fnPriv.ok, 'the trigger function cannot be called directly by users', fnPriv.err || '');

console.log(out.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
