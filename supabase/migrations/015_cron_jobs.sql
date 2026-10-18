-- 015: schedule the real-core edge functions with pg_cron + pg_net (feat/real-core).
-- Additive. The shared secret lives in Supabase Vault as 'atlas_cron_secret' (created out of band,
-- same value as the edge-function secret ATLAS_CRON_SECRET); it is never written in this file.
--   atlas-ical-sync         every 15 minutes  -> functions/v1/ical-sync         {"all": true}
--   atlas-automation-runner every 15 minutes  -> functions/v1/automation-runner {"all": true}

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.atlas_call_edge(p_fn text, p_body jsonb default '{"all": true}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text;
  v_id bigint;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'atlas_cron_secret' limit 1;
  if v_secret is null then
    raise warning 'atlas_cron_secret missing in vault; % not called', p_fn;
    return null;
  end if;
  select net.http_post(
    url := 'https://romvmqbcinurscwdsskx.supabase.co/functions/v1/' || p_fn,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-atlas-cron', v_secret),
    body := p_body,
    timeout_milliseconds := 120000
  ) into v_id;
  return v_id;
end;
$$;
revoke all on function public.atlas_call_edge(text, jsonb) from public, anon, authenticated;

do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname in ('atlas-ical-sync', 'atlas-automation-runner');
  perform cron.schedule('atlas-ical-sync', '*/15 * * * *', $c$ select public.atlas_call_edge('ical-sync') $c$);
  perform cron.schedule('atlas-automation-runner', '2-59/15 * * * *', $c$ select public.atlas_call_edge('automation-runner') $c$);
end $$;
