// Run: npm i --no-save @electric-sql/pglite && node supabase/tests/support_rls.test.mjs
// Real Postgres 17 (PGlite) + a Supabase-like auth stub: applies 001-007, 011, 012 (admin units) and 020 and checks every
// boundary of the support tables and RPCs. Exits 1 on any failure.
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
create schema auth;
create table auth.users (id uuid primary key, email varchar(255), last_sign_in_at timestamptz, raw_user_meta_data jsonb default '{}', created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create publication supabase_realtime;
`);
for (const f of ['001_initial.sql', '002_trial_system.sql', '003_invoice_and_users_platform.sql', '004_onboarding_completed_backfill.sql', '005_audit_log.sql', '006_schema_alignment.sql', '007_ui_columns.sql']) await db.exec(sql(f));

const U = {
  deen: '11111111-1111-1111-1111-111111111111', qa: '22222222-2222-2222-2222-222222222222',
  a: '33333333-3333-3333-3333-333333333333', b: '55555555-5555-5555-5555-555555555555', sup: '44444444-4444-4444-4444-444444444444',
};
const EMAIL = { deen: 'deenv7@gmail.com', qa: 'qa+hark@atlas-il.com', a: 'owner-a@zimmer.co.il', b: 'owner-b@villa.co.il', sup: 'support@atlas-il.com' };
for (const [k, id] of Object.entries(U)) await db.query(`insert into auth.users (id, email, raw_user_meta_data, last_sign_in_at) values ($1,$2,$3,now())`, [id, EMAIL[k], JSON.stringify({ full_name: k, organization_name: k + ' org' })]);
const orgOf = async (uid) => (await db.query('select organization_id from public.profiles where id=$1', [uid])).rows[0].organization_id;
const OA = await orgOf(U.a), OB = await orgOf(U.b);

await db.exec(sql('011_platform_admin.sql'));
await db.exec(sql('012_admin_units_from_properties.sql'));
const first = await db.exec(sql('020_support.sql')).then(() => true, (e) => e.message);
log(first === true, 'migration 020 applies cleanly on top of 001-007 + 011 + 012', first === true ? '' : first);
const again = await db.exec(sql('020_support.sql')).then(() => true, (e) => e.message);
log(again === true, 'migration 020 is re-runnable (idempotent)', again === true ? '' : again);
const pub = (await db.query(`select tablename from pg_publication_tables where pubname='supabase_realtime' order by 1`)).rows.map((r) => r.tablename);
log(pub.includes('support_messages') && pub.includes('support_conversations'), 'both tables are in the supabase_realtime publication', pub.join(','));

async function as(uid, q, params = []) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid || '']);
  await db.exec(uid ? 'set role authenticated' : 'set role anon');
  try { const r = await db.query(q, params); return { ok: true, rows: r.rows }; }
  catch (e) { return { ok: false, err: e.message, code: e.code }; }
  finally { await db.exec('reset role'); }
}
const denied = (r) => !r.ok && (r.code === '42501' || /permission denied|required|not authenticated|not found/.test(r.err));

// add a support-role team member through the real 011 RPC
const addSup = await as(U.deen, `select public.admin_set_team_member('support@atlas-il.com','support')`);
log(addSup.ok, 'owner adds support@ as support role', addSup.err || '');

// Seed as the Edge Function would (service role = superuser here): conversation per customer + messages
const conv = async (uid, org) => (await db.query(`insert into public.support_conversations (user_id, org_id, user_email) values ($1,$2,$3) returning id`, [uid, org, 'x'])).rows[0].id;
const CA = await conv(U.a, OA), CB = await conv(U.b, OB);
const msg = async (c, uid, org, sender, body) => (await db.query(`insert into public.support_messages (conversation_id, user_id, org_id, sender, body) values ($1,$2,$3,$4,$5) returning id`, [c, uid, org, sender, body])).rows[0].id;
await msg(CA, U.a, OA, 'user', 'איך מחברים את בוקינג?');
const BOT_A = await msg(CA, U.a, OA, 'bot', 'עוד ← ערוצים וחיבורים ← יומנים ← הוסף יומן');
await msg(CB, U.b, OB, 'user', 'שאלה של לקוח ב');
const BOT_B = await msg(CB, U.b, OB, 'bot', 'תשובה ללקוח ב');

const trig = (await db.query(`select subject, last_sender, last_message_preview from public.support_conversations where id=$1`, [CA])).rows[0];
log(trig.subject === 'איך מחברים את בוקינג?' && trig.last_sender === 'bot', 'trigger: subject = first question, last_sender/preview follow messages', JSON.stringify(trig));

// anon
const anonC = await as(null, 'select * from public.support_conversations');
log(denied(anonC) || (anonC.ok && anonC.rows.length === 0), 'anon cannot read conversations', anonC.err || `${anonC.rows?.length} rows`);
const anonM = await as(null, 'select * from public.support_messages');
log(denied(anonM) || (anonM.ok && anonM.rows.length === 0), 'anon cannot read messages', anonM.err || `${anonM.rows?.length} rows`);

// customer A
const aC = await as(U.a, 'select id from public.support_conversations');
log(aC.ok && aC.rows.length === 1 && aC.rows[0].id === CA, 'customer A sees only their own conversation', JSON.stringify(aC.rows || aC.err));
const aM = await as(U.a, 'select conversation_id from public.support_messages');
log(aM.ok && aM.rows.length === 2 && aM.rows.every((r) => r.conversation_id === CA), 'customer A sees only their own messages', `${aM.rows?.length}`);
const aMB = await as(U.a, 'select * from public.support_messages where conversation_id=$1', [CB]);
log(aMB.ok && aMB.rows.length === 0, "customer A cannot read customer B's messages even by id");
const aIns = await as(U.a, `insert into public.support_messages (conversation_id, user_id, org_id, sender, body) values ($1,$2,$3,'bot','forged bot answer')`, [CA, U.a, OA]);
log(denied(aIns), 'customer cannot INSERT messages directly (no forged bot/agent messages)', aIns.err || 'INSERTED!');
const aInsC = await as(U.a, `insert into public.support_conversations (user_id, org_id) values ($1,$2)`, [U.a, OA]);
log(denied(aInsC), 'customer cannot INSERT conversations directly', aInsC.err || 'INSERTED!');
const aUpd = await as(U.a, `update public.support_conversations set mode='human', status='closed' where id=$1`, [CA]);
log(denied(aUpd) || (aUpd.ok && (await db.query('select mode from public.support_conversations where id=$1', [CA])).rows[0].mode === 'bot'), 'customer cannot UPDATE a conversation directly', aUpd.err || '');
const aDel = await as(U.a, `delete from public.support_messages where conversation_id=$1`, [CA]);
log(denied(aDel) || (await db.query('select count(*)::int n from public.support_messages where conversation_id=$1', [CA])).rows[0].n === 2, 'customer cannot DELETE messages');
const fb = await as(U.a, `select public.support_feedback($1,'down')`, [BOT_A]);
const fbRow = (await db.query('select m.feedback, c.unhelpful_count from public.support_messages m join public.support_conversations c on c.id=m.conversation_id where m.id=$1', [BOT_A])).rows[0];
log(fb.ok && fbRow.feedback === 'down' && fbRow.unhelpful_count === 1, 'customer can rate their own bot answer; thumbs-down counts as unhelpful', JSON.stringify(fbRow) + (fb.err || ''));
const fbX = await as(U.a, `select public.support_feedback($1,'down')`, [BOT_B]);
log(denied(fbX), "customer cannot rate another customer's answer", fbX.err || 'ALLOWED!');
const fbBad = await as(U.a, `select public.support_feedback($1,'love')`, [BOT_A]);
log(!fbBad.ok, 'feedback only accepts up/down', fbBad.err || 'ALLOWED!');
const mrX = await as(U.a, `select public.support_mark_read($1)`, [CB]);
log(mrX.ok && true, "support_mark_read on someone else's thread is a silent no-op", mrX.err || '');
for (const fn of [`admin_support_list('all')`, `admin_support_unread()`, `admin_support_reply('${CA}','hi')`, `admin_support_set_status('${CA}','closed')`, `admin_support_mark_read('${CA}')`]) {
  const r = await as(U.a, `select * from public.${fn}`);
  log(denied(r), `customer cannot call ${fn.split('(')[0]}`, r.err || 'ALLOWED!');
}
const anonR = await as(null, `select * from public.admin_support_list('all')`);
log(denied(anonR), 'anon cannot call admin_support_list', anonR.err || 'ALLOWED!');

// platform admins
for (const [who, uid] of [['support', U.sup], ['admin (QA)', U.qa], ['owner (Deen)', U.deen]]) {
  const l = await as(uid, `select id, org_name from public.admin_support_list('all')`);
  log(l.ok && l.rows.length === 2, `${who} lists every conversation`, l.err || `${l.rows?.length} rows`);
  const m = await as(uid, 'select count(*)::int n from public.support_messages');
  log(m.ok && m.rows[0].n >= 4, `${who} can SELECT all messages (needed for Realtime inbox)`, m.err || `${m.rows?.[0]?.n}`);
}
// customer message while in human mode → unread_admin goes up
await db.query(`update public.support_conversations set mode='human', handoff_at=now(), handoff_reason='button' where id=$1`, [CA]);
await msg(CA, U.a, OA, 'user', 'עדיין לא הצלחתי');
let c1 = (await db.query('select unread_admin from public.support_conversations where id=$1', [CA])).rows[0];
log(c1.unread_admin === 1, 'customer message after handoff raises the unread badge', JSON.stringify(c1));
const un = await as(U.sup, 'select public.admin_support_unread() u');
log(un.ok && un.rows[0].u.conversations === 1, 'admin_support_unread counts waiting threads', JSON.stringify(un.rows?.[0]?.u || un.err));
const wait = await as(U.sup, `select id from public.admin_support_list('waiting')`);
log(wait.ok && wait.rows.length === 1 && wait.rows[0].id === CA, "'waiting' filter shows only handed-off threads that need a reply", JSON.stringify(wait.rows || wait.err));
const rep = await as(U.sup, `select public.admin_support_reply($1, 'שלום, אני מטפל בזה') r`, [CA]);
const c2 = (await db.query('select mode, unread_admin, unread_user, last_sender, assigned_to from public.support_conversations where id=$1', [CA])).rows[0];
log(rep.ok && c2.unread_admin === 0 && c2.unread_user === 1 && c2.last_sender === 'agent' && c2.assigned_to === U.sup, 'support replies: agent message, admin unread cleared, customer unread +1, assigned', JSON.stringify(c2) + (rep.err || ''));
const seen = await as(U.a, `select sender, author_name from public.support_messages where conversation_id=$1 and sender='agent'`, [CA]);
log(seen.ok && seen.rows.length === 1, 'customer sees the agent reply under RLS', JSON.stringify(seen.rows || seen.err));
const mr = await as(U.a, `select public.support_mark_read($1)`, [CA]);
log(mr.ok && (await db.query('select unread_user from public.support_conversations where id=$1', [CA])).rows[0].unread_user === 0, 'customer marks the thread read');
const empty = await as(U.sup, `select public.admin_support_reply($1, '   ')`, [CA]);
log(!empty.ok, 'empty reply is rejected', empty.err || 'ALLOWED!');
const close = await as(U.sup, `select public.admin_support_set_status($1, 'closed')`, [CA]);
const c3 = (await db.query('select status, closed_at from public.support_conversations where id=$1', [CA])).rows[0];
log(close.ok && c3.status === 'closed' && c3.closed_at, 'support closes the conversation', JSON.stringify(c3) + (close.err || ''));
const badS = await as(U.sup, `select public.admin_support_set_status($1, 'deleted')`, [CA]);
log(!badS.ok, 'status only accepts open/closed', badS.err || 'ALLOWED!');
await msg(CA, U.a, OA, 'user', 'עוד שאלה');
const c4 = (await db.query('select status from public.support_conversations where id=$1', [CA])).rows[0];
log(c4.status === 'open', 'a new customer message reopens a closed thread', JSON.stringify(c4));
const audit = (await db.query(`select action from public.admin_audit_log where action like 'support.%' order by id`)).rows.map((r) => r.action);
log(audit.includes('support.reply') && audit.includes('support.closed'), 'every admin support action is in admin_audit_log', audit.join(','));
// a support person (no org of their own in the thread) still cannot touch customer business tables via 012
const leak = await as(U.sup, `select count(*)::int n from public.bookings where org_id=$1`, [OA]);
log(leak.ok && leak.rows[0].n === 0, '020 adds no cross-org access to customer business tables', JSON.stringify(leak.rows || leak.err));

console.log(out.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
