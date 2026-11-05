-- Rollback for 037_leads_inbox.sql. Restores get_public_property exactly as 028 defined it, drops the trigger,
-- and drops the new columns/indexes. The columns are new in 037, so dropping them loses only data written after 037
-- (channel values, Meta thread ids, inbound messages' external ids). Take a backup first if Meta messages arrived.
begin;
drop trigger if exists trg_leads_fill_channel on public.leads;
drop function if exists public.leads_fill_channel();
drop index if exists public.idx_org_leads_webhook_token;
drop index if exists public.leads_org_channel_thread_key;
drop index if exists public.idx_leads_org_last_message;
drop index if exists public.message_logs_org_channel_external_key;
drop index if exists public.idx_message_logs_lead_id;
drop index if exists public.idx_message_logs_booking_id;
alter table public.leads drop column if exists channel;
alter table public.leads drop column if exists external_thread_id;
alter table public.leads drop column if exists last_message_at;
alter table public.leads drop column if exists last_message_preview;
alter table public.leads drop column if exists replied_at;
alter table public.leads drop column if exists unread_count;
alter table public.message_logs drop column if exists external_id;
alter table public.message_logs drop column if exists sender_name;
alter table public.message_logs drop column if exists read_at;
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
    'host', jsonb_build_object('name', coalesce(nullif(p.guest_info->>'host_name', ''), o.name)),
    'busy', v_busy
  );
end;
$function$;
commit;
notify pgrst, 'reload schema';
