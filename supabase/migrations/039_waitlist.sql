-- 039 · /early waitlist: real place-in-line, real spots-left, referral codes, and a push to the atlas team.
-- NOT APPLIED. Needs Deen's OK (backup first). Rollback: supabase/rollback/039_waitlist_down.sql.
--
-- Today the page works WITHOUT this migration: signups go to public.contact_messages (source 'waitlist'),
-- which already has anon column-INSERT + an insert-only RLS policy + a rate-limit guard. That path cannot show
-- "you are #N" or "N spots left" (anon cannot read the table). This migration adds:
--   1. public.waitlist_signups   (RLS on, no policies: nobody reads/writes it directly, only the functions below)
--   2. public.join_waitlist(...)  SECURITY DEFINER, anon-callable: validates, dedupes by phone, rate-limits,
--                                 stores, mirrors the row into contact_messages (admin inbox), returns position + ref code
--   3. public.waitlist_stats()    anon-callable: { joined, spots_left } (counts only, no personal data)
--   4. trigger on contact_messages: a waitlist row sends a push to every platform admin's phone (atlas_send_push
--      from 030, vault secret atlas_push_secret). Works for both paths (direct insert or RPC mirror).
-- Then set VITE_WAITLIST_RPC=1 in Vercel and redeploy; the page switches to the RPC and shows the real counter.

create table if not exists public.waitlist_signups (
  id          uuid primary key default gen_random_uuid(),
  place       integer generated always as identity,
  name        text not null check (char_length(name) between 1 and 120),
  phone       text not null check (phone ~ '^05[0-9]{8}$'),
  units       text not null check (units in ('1', '2-3', '4-6', '7+')),
  complex     text check (complex is null or char_length(complex) <= 200),
  ref_code    text not null unique check (ref_code ~ '^[a-z0-9]{6,12}$'),
  referred_by text check (referred_by is null or referred_by ~ '^[a-z0-9]{4,12}$'),
  variant     text check (variant is null or variant in ('a', 'b')),
  consent_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create unique index if not exists waitlist_signups_phone_key on public.waitlist_signups (phone);
create index if not exists waitlist_signups_referred_by_idx on public.waitlist_signups (referred_by) where referred_by is not null;
alter table public.waitlist_signups enable row level security;
revoke all on table public.waitlist_signups from public, anon, authenticated;
grant select, insert, update, delete on table public.waitlist_signups to service_role;

create or replace function public.join_waitlist(
  p_name text, p_phone text, p_units text, p_complex text, p_ref text, p_variant text, p_consent boolean
) returns table (place integer, ref_code text, spots_left integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_row public.waitlist_signups;
  v_code text;
begin
  if v_phone like '972%' then v_phone := '0' || substr(v_phone, 4); end if;
  if not coalesce(p_consent, false) then raise exception 'סמנו שמותר לחזור אליכם.' using errcode = 'P0001'; end if;
  if v_phone !~ '^05[0-9]{8}$' then raise exception 'בדקו את מספר הטלפון.' using errcode = 'P0001'; end if;
  if (select count(*) from public.waitlist_signups where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'יותר מדי הרשמות כרגע. נסו שוב בעוד דקה.' using errcode = 'P0001';
  end if;
  -- same phone again: return the existing place, do not create a second one
  select * into v_row from public.waitlist_signups w where w.phone = v_phone;
  if found then
    return query select v_row.place, v_row.ref_code,
      greatest(0, 50 - (select count(*)::int from public.waitlist_signups));
    return;
  end if;
  loop
    v_code := substr(translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/=OIl01', ''), 1, 6);
    v_code := lower(v_code);
    exit when v_code ~ '^[a-z0-9]{6}$' and not exists (select 1 from public.waitlist_signups w where w.ref_code = v_code);
  end loop;
  insert into public.waitlist_signups (name, phone, units, complex, ref_code, referred_by, variant)
  values (left(trim(p_name), 120), v_phone, p_units, nullif(left(trim(coalesce(p_complex, '')), 200), ''),
          v_code, case when p_ref ~ '^[a-z0-9]{4,12}$' then p_ref end,
          case when p_variant in ('a', 'b') then p_variant end)
  returning * into v_row;
  -- mirror into the admin inbox ("פניות מהאתר"); this also fires the push trigger below
  insert into public.contact_messages (name, email, phone, subject, message, source)
  values (v_row.name, v_phone || '@waitlist.atlas-il.com', v_phone, 'waitlist:early:' || coalesce(v_row.variant, 'a'),
          concat_ws(E'\n', 'רשימת המתנה #' || v_row.place, 'יחידות: ' || v_row.units,
                    case when v_row.complex is not null then 'מתחם / אזור: ' || v_row.complex end,
                    'קוד הפניה: ' || v_row.ref_code,
                    case when v_row.referred_by is not null then 'הגיע מהפניה: ' || v_row.referred_by end),
          'waitlist');
  return query select v_row.place, v_row.ref_code,
    greatest(0, 50 - (select count(*)::int from public.waitlist_signups));
end;
$$;
revoke all on function public.join_waitlist(text, text, text, text, text, text, boolean) from public;
grant execute on function public.join_waitlist(text, text, text, text, text, text, boolean) to anon, authenticated, service_role;

create or replace function public.waitlist_stats()
returns table (joined integer, spots_left integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*)::int, greatest(0, 50 - count(*)::int) from public.waitlist_signups;
$$;
revoke all on function public.waitlist_stats() from public;
grant execute on function public.waitlist_stats() to anon, authenticated, service_role;

-- Push to the atlas team's phones for every waitlist signup (needs at least one admin phone with notifications on).
create or replace function public.trg_push_waitlist_signup() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare r record;
begin
  if new.source <> 'waitlist' then return new; end if;
  for r in
    select distinct d.org_id from public.platform_admins pa
    join public.device_tokens d on d.user_id = pa.user_id and d.disabled_at is null
  loop
    perform public.atlas_send_push(r.org_id, 'waitlist_signup', 'נרשם חדש לרשימת ההמתנה',
      left(new.name || coalesce(' · ' || new.phone, ''), 200), '/admin', new.id);
  end loop;
  return new;
exception when others then
  raise warning 'trg_push_waitlist_signup: %', sqlerrm;
  return new; -- never block a signup
end;
$$;
revoke all on function public.trg_push_waitlist_signup() from public, anon, authenticated;
drop trigger if exists trg_contact_messages_waitlist_push on public.contact_messages;
create trigger trg_contact_messages_waitlist_push after insert on public.contact_messages
  for each row execute function public.trg_push_waitlist_signup();
