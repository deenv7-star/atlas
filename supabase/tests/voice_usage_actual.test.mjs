// Run: npm i --no-save @electric-sql/pglite && node supabase/tests/voice_usage_actual.test.mjs
// Real Postgres (PGlite): applies 031 then 032_voice_usage_actual.sql and checks that voice is charged by the seconds
// actually used, that open slices still hold the cap (no parallel overrun), the 40-slice day cap, RLS, and the rollback.
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const m031 = read('migrations/031_voice_usage.sql');
const m032 = read('migrations/032_voice_usage_actual.sql');
const d032 = read('rollback/032_voice_usage_actual_down.sql');
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
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222', C = '33333333-3333-3333-3333-333333333333';
await db.query('insert into auth.users values ($1),($2),($3)', [A, B, C]);
const as = async (uid, q, params = []) => {
  await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  try { return await db.query(q, params); } finally { await db.exec('reset role;'); }
};
const start = async (u, daily = 1800) => (await as(u, 'select * from public.voice_session_start($1, 180, null)', [daily])).rows[0];
const end = async (u, id) => (await as(u, 'select public.voice_session_end($1) as u', [id])).rows[0].u;
const today = async (u) => (await as(u, 'select public.voice_seconds_today() as s')).rows[0].s;
const age = (id, s) => db.query(`update public.voice_sessions set started_at = now() - make_interval(secs => $2) where id = $1`, [id, s]);

log(await db.exec(m031).then(() => true, (e) => e.message) === true, '031 applies');
const r = await db.exec(m032).then(() => true, (e) => e.message);
log(r === true, '032 applies on top of 031', r === true ? '' : r);
log(await db.exec(m032).then(() => true, (e) => e.message) === true, '032 is re-runnable');

// the 04.11 pattern: a 25 s conversation
const s1 = await start(A);
log(s1.granted_seconds === 180 && s1.used_today === 0, 'start still grants a 180 s slice (the cap)', JSON.stringify(s1));
log(await today(A) === 180, 'an open slice holds its full reservation', String(await today(A)));
await age(s1.session_id, 25);
const u1 = await end(A, s1.session_id);
log(u1 >= 25 && u1 <= 27, 'end charges the seconds actually used', String(u1));
log(await today(A) === u1, 'the day counts used seconds, not 180', String(await today(A)));
log(await end(A, s1.session_id) === null && await today(A) === u1, 'end is idempotent (no second charge, no refund)');

// a socket that died at once is charged the 15 s floor
const s2 = await start(A);
log(s2.used_today === u1, 'next start sees the real usage', JSON.stringify(s2));
const u2 = await end(A, s2.session_id);
log(u2 === 15, 'a slice ended at once costs the 15 s floor', String(u2));
// a slice used to the end never costs more than the slice
const s3 = await start(A); await age(s3.session_id, 400);
log(await end(A, s3.session_id) === 180, 'a long slice is capped at its reservation');

// parallel starts cannot overrun the daily cap: open slices hold
const opens = []; for (let i = 0; i < 12; i++) opens.push(await start(B));
const granted = opens.reduce((a, o) => a + o.granted_seconds, 0);
log(granted === 1800 && opens.at(-1).granted_seconds === 0, 'open slices hold: parallel starts stop at 30 min', String(granted));
for (const o of opens.filter((x) => x.session_id)) { await age(o.session_id, 20); await end(B, o.session_id); }
const tB = await today(B);
log(tB >= 200 && tB <= 210, 'after hang-ups only the used seconds count (10 × ~20 s)', String(tB));
log((await start(B)).granted_seconds === 180, 'freed budget can be used again');

// 40 slices a day at most
let lastC = null; for (let i = 0; i < 41; i++) { lastC = await start(C, 100000); if (lastC.session_id) await end(C, lastC.session_id); }
const nC = (await db.query('select count(*)::int n from public.voice_sessions where user_id = $1', [C])).rows[0].n;
log(nC === 40 && lastC.granted_seconds === 0, 'at most 40 slices a day per user', `${nC} ${JSON.stringify(lastC)}`);

// security from 031 still holds
log((await as(B, 'select count(*)::int n from public.voice_sessions where user_id = $1', [A])).rows[0].n === 0, 'RLS: B cannot read A sessions');
const s4 = await start(A);
log(await end(B, s4.session_id) === null, 'B cannot end A session');
const upd = await as(A, 'update public.voice_sessions set used_seconds = 0').then(() => 'updated', (e) => e.message);
log(upd !== 'updated', 'app cannot rewrite its usage', upd);
const vd = await as(A, 'select public.voice_session_void($1)', [s4.session_id]).then(() => 'voided', (e) => e.message);
log(vd !== 'voided', 'app cannot void a slice');
await db.exec('set role service_role;');
await db.query('select public.voice_session_void($1)', [s4.session_id]);
await db.exec('reset role;');
log(await today(A) === u1 + 15 + 180, 'service-role void still charges 0', String(await today(A)));

// rollback: back to 031 (every slice counts in full), data kept
const d = await db.exec(d032).then(() => true, (e) => e.message);
const fn = (await db.query(`select to_regprocedure('public.voice_charge(integer,integer,timestamp with time zone)') f`)).rows[0].f;
log(d === true && fn === null, 'rollback drops voice_charge', String(d));
log(await today(A) === 180 * 3, 'rollback restores 031 counting (reserved in full)', String(await today(A)));
const after = await start(C, 100000);
log(after.granted_seconds === 180, 'rollback removes the 40-slice cap (031 behaviour)');
const rows = (await db.query('select count(*)::int n from public.voice_sessions')).rows[0].n;
log(rows > 50, 'rollback keeps the rows', String(rows));

console.log(out.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
