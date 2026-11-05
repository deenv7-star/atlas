-- 037 (feat/leads-v2, 05.11.2026): one inbox for every inquiry ("שיחות").
-- ADDITIVE ONLY, idempotent. NOT APPLIED: needs Deen's OK. Rollback: supabase/rollback/037_leads_inbox_down.sql
--
-- What it adds:
--   1. leads.channel + thread fields, so a WhatsApp / Messenger / Instagram conversation (once Meta approves the
--      atlas app and integrations-hub connects it) is ONE lead row per (org, channel, external_thread_id).
--   2. message_logs.external_id / sender_name / read_at: inbound messages from those channels land in the same
--      table the app already uses for outgoing WhatsApp messages (direction = 'inbound').
--   3. A trigger that fills leads.channel for rows that do not set it (inquiry link, manual, lead-intake),
--      from source and the "הגיעה דרך:" line the inquiry link writes into notes. Existing rows are backfilled.
--   4. An index for the lead-intake webhook token lookup (organizations.settings->>'leads_webhook_token').
--   5. get_public_property returns the owner's WhatsApp number ONLY for units where the owner turned on
--      guest_info.public_whatsapp (default off), so the inquiry page can show a "write to us on WhatsApp" button.
-- Nothing is deleted or rewritten except the channel backfill on leads (a new column).

begin;

-- 1. leads: channel + thread
alter table public.leads add column if not exists channel text;
alter table public.leads add column if not exists external_thread_id text;
alter table public.leads add column if not exists last_message_at timestamptz;
alter table public.leads add column if not exists last_message_preview text;
alter table public.leads add column if not exists replied_at timestamptz;
alter table public.leads add column if not exists unread_count integer not null default 0;
create unique index if not exists leads_org_channel_thread_key
  on public.leads (org_id, channel, external_thread_id) where external_thread_id is not null;
create index if not exists idx_leads_org_last_message on public.leads (org_id, last_message_at desc nulls last);

-- 2. message_logs: inbound messages from connected channels
alter table public.message_logs add column if not exists external_id text;
alter table public.message_logs add column if not exists sender_name text;
alter table public.message_logs add column if not exists read_at timestamptz;
create unique index if not exists message_logs_org_channel_external_key
  on public.message_logs (org_id, channel, external_id) where external_id is not null;
create index if not exists idx_message_logs_lead_id on public.message_logs (lead_id) where lead_id is not null;
create index if not exists idx_message_logs_booking_id on public.message_logs (booking_id) where booking_id is not null;

-- 3. channel for rows that don't say
create or replace function public.leads_fill_channel() returns trigger
language plpgsql set search_path = public as $$
declare s text := lower(coalesce(new.source, ''));
        n text := coalesce(new.notes, '');
begin
  if new.channel is not null and new.channel <> '' then return new; end if;
  new.channel := case
    when n like '%הגיעה דרך: אינסטגרם%' or s like '%instagram%' then 'instagram'
    when n like '%הגיעה דרך: פייסבוק%' or s like '%facebook%' then 'facebook'
    when n like '%הגיעה דרך: גוגל%' or s like '%google%' then 'google'
    when n like '%הגיעה דרך: וואטסאפ%' or s like '%whatsapp%' then 'whatsapp'
    when s like '%messenger%' then 'messenger'
    when s like 'webhook%' then 'webhook'
    when s = 'website' then 'link'
    when s like '%mail%' then 'email'
    when s like '%phone%' then 'phone'
    else 'manual'
  end;
  return new;
end $$;
revoke all on function public.leads_fill_channel() from public, anon, authenticated;
drop trigger if exists trg_leads_fill_channel on public.leads;
create trigger trg_leads_fill_channel before insert or update of source, notes, channel on public.leads
  for each row execute function public.leads_fill_channel();
update public.leads set channel = null where channel is null; -- fires the trigger once per existing row (backfill)

-- 4. lead-intake token lookup
create index if not exists idx_org_leads_webhook_token
  on public.organizations ((settings->>'leads_webhook_token')) where settings ? 'leads_webhook_token';

-- 5. public inquiry page: opt-in WhatsApp button
create or replace function public.get_public_property(p_slug text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to 'public'
as $function$
declare
  p public.properties%rowtype;
  o public.organizations%rowtype;
  v_busy jsonb;
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
begin
  select * into p from public.properties
   where public_slug = p_slug and booking_page_enabled = true
   limit 1;
  if not found then
    return null;
  end if;
  select * into o from public.organizations where id = p.org_id;

  select coalesce(jsonb_agg(jsonb_build_object('from', r.ci, 'to', r.co) order by r.ci), '[]'::jsonb)
    into v_busy
    from (
      select check_in_date as ci,
             coalesce(check_out_date, check_in_date + greatest(coalesce(nights, 1), 1)) as co
        from public.bookings
       where property_id = p.id
         and org_id = p.org_id
         and check_in_date is not null
         and coalesce(upper(status), '') not in ('CANCELLED', 'CANCELED', 'WAITLIST')
         and coalesce(check_out_date, check_in_date + 1) > v_today
         and check_in_date < v_today + 366
    ) r;

  return jsonb_build_object(
    'property', jsonb_build_object(
      'name', p.name,
      'address', p.address,
      'description', p.description,
      'max_guests', p.max_guests,
      'bedrooms', p.bedrooms,
      'base_price', p.base_price,
      'images', coalesce(p.images, '[]'::jsonb),
      'check_in_time', coalesce(nullif(p.guest_info->>'check_in_time', ''), '15:00'),
      'check_out_time', coalesce(nullif(p.guest_info->>'check_out_time', ''), '11:00')
    ),
    'host', jsonb_build_object(
      'name', coalesce(nullif(p.guest_info->>'host_name', ''), o.name),
      -- 037: the owner's WhatsApp number, ONLY when they turned on "show a WhatsApp button" for this unit
      'whatsapp', case when coalesce(p.guest_info->>'public_whatsapp', '') = 'true'
                       then nullif(regexp_replace(coalesce(p.guest_info->>'host_phone', ''), '[^0-9+]', '', 'g'), '')
                  end
    ),
    'busy', v_busy
  );
end;
$function$;

commit;
notify pgrst, 'reload schema';
