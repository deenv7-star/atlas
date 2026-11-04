// Run: npm i --no-save @electric-sql/pglite && node supabase/tests/voice_usage.test.mjs
// Real Postgres (PGlite) + a Supabase-like auth stub: applies 031_voice_usage.sql and its rollback, and checks the
// voice budget: slices, the 30-minute daily cap, that the app cannot refund itself, RLS, and the service-role void.
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const up = fs.readFileSync(path.join(ROOT, 'migrations/031_voice_usage.sql'), 'utf8');
const down = fs.readFileSync(path.join(ROOT, 'rollback/031_voice_usage_down.sql'), 'utf8');
const db = new PGlite();
let pass = 0, fail = 0; const out = [];
const log = (ok, name, extra = '') => { ok ? pass++ : fail++; out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };
await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role; grant execute on function auth.uid() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
`);
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222';
await db.query('insert into auth.users values ($1),($2)', [A, B]);
const as = async (uid, q, params = []) => {
  await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  try { return await db.query(q, params); } finally { await db.exec('reset role;'); }
};

const r1 = await db.exec(up).then(() => true, (e) => e.message);
log(r1 === true, '031 applies', r1 === true ? '' : r1);
const r2 = await db.exec(up).then(() => true, (e) => e.message);
log(r2 === true, '031 is re-runnable', r2 === true ? '' : r2);

const s1 = (await as(A, 'select * from public.voice_session_start(1800, 180, $1)', ['eleven_realtime_v1_max'])).rows[0];
log(s1.session_id && s1.granted_seconds === 180 && s1.used_today === 0, 'first start reserves one 180 s slice', JSON.stringify(s1));
const e1 = (await as(A, 'select public.voice_session_end($1) as used', [s1.session_id])).rows[0].used;
log(e1 >= 0 && e1 <= 180, 'end records server-clock seconds', String(e1));
const today1 = (await as(A, 'select public.voice_seconds_today() as s')).rows[0].s;
log(today1 === 180, 'an ended slice still counts in full (no self-refund)', String(today1));

let last = null;
for (let i = 0; i < 12; i++) last = (await as(A, 'select * from public.voice_session_start(1800, 180, null)')).rows[0];
const total = (await as(A, 'select public.voice_seconds_today() as s')).rows[0].s;
log(total === 1800 && last.granted_seconds === 0 && last.session_id === null, 'daily cap: 30 minutes, then granted 0', `${total} / ${JSON.stringify(last)}`);

const near = (await as(B, 'select * from public.voice_session_start(200, 180, null)')).rows[0];
const rest = (await as(B, 'select * from public.voice_session_start(200, 180, null)')).rows[0];
log(near.granted_seconds === 180 && rest.granted_seconds === 20, 'last slice is cut to what is left', `${near.granted_seconds}, ${rest.granted_seconds}`);
const tiny = (await as(B, 'select * from public.voice_session_start(205, 180, null)')).rows[0];
log(tiny.granted_seconds === 0, 'under 15 s left: no slice', JSON.stringify(tiny));

const seenByB = (await as(B, 'select count(*)::int n from public.voice_sessions where user_id = $1', [A])).rows[0].n;
log(seenByB === 0, 'RLS: B cannot read A sessions');
const ins = await as(B, `insert into public.voice_sessions (user_id, reserved_seconds) values ('${B}', 0)`).then(() => 'inserted', (e) => e.message);
log(ins !== 'inserted', 'app cannot insert rows directly', ins);
const upd = await as(A, `update public.voice_sessions set reserved_seconds = 0`).then(() => 'updated', (e) => e.message);
log(upd !== 'updated', 'app cannot rewrite its reservations', upd);
const voidByUser = await as(A, 'select public.voice_session_void($1)', [s1.session_id]).then(() => 'voided', (e) => e.message);
log(voidByUser !== 'voided', 'app cannot void (refund) a slice', voidByUser);
const endOther = (await as(B, 'select public.voice_session_end($1) as u', [last?.session_id || s1.session_id])).rows[0].u;
log(endOther === null, 'B cannot end A session');

await db.exec(`set role service_role;`);
const v = await db.query('select public.voice_session_void($1)', [near.session_id]).then(() => true, (e) => e.message);
await db.exec('reset role;');
const afterVoid = (await as(B, 'select public.voice_seconds_today() as s')).rows[0].s;
log(v === true && afterVoid === 20, 'service role voids a slice when no secret was issued', `${v} ${afterVoid}`);

const d = await db.exec(down).then(() => true, (e) => e.message);
const gone = (await db.query(`select to_regclass('public.voice_sessions') t`)).rows[0].t;
log(d === true && gone === null, 'rollback drops everything 031 created', String(d));

console.log(out.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
