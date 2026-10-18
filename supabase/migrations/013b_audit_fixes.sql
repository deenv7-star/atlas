-- 013b: mega-audit P0/P1 fixes (18.10.2026). ADDITIVE and idempotent; applied live on romvmqbcinurscwdsskx.
--   1. contact_messages      : public contact form (anon insert-only, admin read)
--   2. submit_guest_service  : guests send a service request with their booking's private guest_token
--   3. payment_gateways      : config never stores secrets (trigger strips secret-like keys)
--   4. delete_my_account     : real self-service deletion (typed confirmation)
--   5. storage atlas-files   : size cap (bucket stays public: photos are shown on public guest/booking pages)

-- ── 1. contact_messages ────────────────────────────────────────────────────
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  email       text not null check (char_length(email) between 3 and 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text check (phone is null or char_length(phone) <= 40),
  subject     text check (subject is null or char_length(subject) <= 200),
  message     text not null check (char_length(message) between 1 and 5000),
  source      text not null default 'contact' check (char_length(source) <= 40),
  status      text not null default 'NEW' check (status in ('NEW','READ','REPLIED','ARCHIVED')),
  user_id     uuid,
  created_at  timestamptz not null default now()
);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_email_idx on public.contact_messages (lower(email), created_at desc);
alter table public.contact_messages enable row level security;

drop policy if exists "contact_messages: anyone can send" on public.contact_messages;
create policy "contact_messages: anyone can send" on public.contact_messages
  for insert to anon, authenticated
  with check (status = 'NEW');
drop policy if exists "contact_messages: platform admins read" on public.contact_messages;
create policy "contact_messages: platform admins read" on public.contact_messages
  for select to authenticated using (public.is_platform_admin());
drop policy if exists "contact_messages: platform admins update" on public.contact_messages;
create policy "contact_messages: platform admins update" on public.contact_messages
  for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
revoke all on public.contact_messages from anon, authenticated;
grant insert (name, email, phone, subject, message, source) on public.contact_messages to anon, authenticated;
grant select, update (status) on public.contact_messages to authenticated;

-- rate limit: 3 per email / 10 min, 30 in total / minute; stamps user_id server-side
create or replace function public.contact_messages_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.contact_messages
       where lower(email) = lower(new.email) and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'יותר מדי הודעות. נסו שוב בעוד כמה דקות.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.contact_messages where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'יותר מדי הודעות. נסו שוב בעוד כמה דקות.' using errcode = 'P0001';
  end if;
  new.user_id := auth.uid();
  new.status := 'NEW';
  new.created_at := now();
  return new;
end $$;
drop trigger if exists trg_contact_messages_guard on public.contact_messages;
create trigger trg_contact_messages_guard before insert on public.contact_messages
  for each row execute function public.contact_messages_guard();

-- admin console reads them through an RPC (keeps the admin_* pattern of 011)
create or replace function public.admin_list_contact_messages(p_limit int default 100)
returns setof public.contact_messages
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then
    raise exception 'אין הרשאה' using errcode = '42501';
  end if;
  return query select * from public.contact_messages order by created_at desc limit least(greatest(coalesce(p_limit,100),1),500);
end $$;
revoke all on function public.admin_list_contact_messages(int) from public, anon;
grant execute on function public.admin_list_contact_messages(int) to authenticated;

-- ── 2. submit_guest_service ────────────────────────────────────────────────
create or replace function public.submit_guest_service(
  p_token text, p_guest_name text, p_guest_phone text, p_request_type text,
  p_title text, p_description text, p_urgency text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  b public.bookings%rowtype;
  v_type text := upper(coalesce(p_request_type, 'OTHER'));
  v_urg  text := upper(coalesce(p_urgency, 'MEDIUM'));
  v_id uuid;
begin
  if p_token is null or length(p_token) < 16 then
    raise exception 'הקישור אינו תקין' using errcode = 'P0001';
  end if;
  select * into b from public.bookings
   where guest_token = p_token and coalesce(upper(status), '') not in ('CANCELLED','CANCELED') limit 1;
  if not found then
    raise exception 'הקישור אינו תקין או שפג תוקפו' using errcode = 'P0001';
  end if;
  if coalesce(b.check_out_date, b.check_in_date + 1) < current_date - 7 then
    raise exception 'השהייה הסתיימה. לפניות פנו ישירות למארחים.' using errcode = 'P0001';
  end if;
  if coalesce(char_length(trim(p_guest_name)),0) < 1 or char_length(p_guest_name) > 120
     or coalesce(char_length(trim(p_title)),0) < 1 or char_length(p_title) > 200
     or char_length(coalesce(p_description,'')) > 4000
     or char_length(coalesce(p_guest_phone,'')) > 40 then
    raise exception 'חסרים פרטים או שהם ארוכים מדי' using errcode = 'P0001';
  end if;
  if v_type not in ('MAINTENANCE','AMENITY','CLEANING','COMPLAINT','QUESTION','OTHER') then v_type := 'OTHER'; end if;
  if v_urg not in ('LOW','MEDIUM','HIGH','URGENT') then v_urg := 'MEDIUM'; end if;
  if (select count(*) from public.guest_requests where booking_id = b.id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'נשלחו הרבה בקשות בשעה האחרונה. נסו שוב מעט מאוחר יותר.' using errcode = 'P0001';
  end if;
  insert into public.guest_requests (org_id, booking_id, property_id, guest_name, guest_phone, request_type, title, description, urgency, priority, status)
  values (b.org_id, b.id, b.property_id, trim(p_guest_name), nullif(trim(coalesce(p_guest_phone,'')), ''), v_type,
          trim(p_title), nullif(trim(coalesce(p_description,'')), ''), v_urg, v_urg, 'NEW')
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.submit_guest_service(text,text,text,text,text,text,text) from public;
grant execute on function public.submit_guest_service(text,text,text,text,text,text,text) to anon, authenticated;

-- ── 3. payment_gateways: never store secrets in config ─────────────────────
create or replace function public.payment_gateways_strip_secrets() returns trigger
language plpgsql set search_path = public as $$
declare k text; v_clean jsonb := '{}'::jsonb;
begin
  if new.config is null or jsonb_typeof(new.config) <> 'object' then return new; end if;
  for k in select jsonb_object_keys(new.config) loop
    if k ~* '(secret|private|password|passwd|api_?key|access_?token|refresh_?token|webhook_?key|signing)' then
      continue;  -- dropped: secrets belong in the server-side vault, never in a client-readable row
    end if;
    v_clean := v_clean || jsonb_build_object(k, new.config -> k);
  end loop;
  new.config := v_clean;
  return new;
end $$;
drop trigger if exists trg_payment_gateways_strip_secrets on public.payment_gateways;
create trigger trg_payment_gateways_strip_secrets before insert or update on public.payment_gateways
  for each row execute function public.payment_gateways_strip_secrets();

-- ── 4. delete_my_account ───────────────────────────────────────────────────
-- Deletes the caller's auth user. When the caller owns the org and is its only member, the org
-- and everything under it (ON DELETE CASCADE) go too. Otherwise only the user is removed.
create or replace function public.delete_my_account(p_confirm text)
returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
  v_owner uuid;
  v_members int;
  v_email text;
  v_org_deleted boolean := false;
begin
  if v_uid is null then
    raise exception 'יש להתחבר מחדש' using errcode = '42501';
  end if;
  select organization_id, email into v_org, v_email from public.profiles where id = v_uid;
  if coalesce(trim(p_confirm), '') not in ('מחיקה', 'מחק', 'DELETE') then
    raise exception 'כדי למחוק יש להקליד מחיקה' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.platform_admins where user_id = v_uid) then
    raise exception 'חשבון של צוות ATLAS לא נמחק מכאן' using errcode = '42501';
  end if;
  if v_org is not null then
    select owner_id into v_owner from public.organizations where id = v_org;
    select count(*) into v_members from public.profiles where organization_id = v_org and id <> v_uid;
    if (v_owner = v_uid or v_owner is null) and v_members = 0 then
      delete from public.organizations where id = v_org;
      v_org_deleted := true;
    end if;
  end if;
  delete from auth.users where id = v_uid;   -- cascades to profiles, sessions, identities
  return jsonb_build_object('ok', true, 'org_deleted', v_org_deleted);
end $$;
revoke all on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;

-- ── 5. storage: cap upload size (20 MB) ────────────────────────────────────
update storage.buckets set file_size_limit = 20971520 where id = 'atlas-files' and file_size_limit is null;
