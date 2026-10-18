-- 016: start the 14-day trial on the server (18.10.2026).
-- 013 (tenant guard) rightly blocks clients from writing profiles.trial_ends_at / subscription_status, which
-- made onboarding's final update fail as a whole (onboarding_completed stayed false). The trial now starts
-- through this function: once per account, only when none is set, never extendable from the client.
create or replace function public.start_my_trial()
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare v timestamptz;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  update public.profiles
     set trial_ends_at = now() + interval '14 days',
         subscription_status = coalesce(nullif(subscription_status, ''), 'trialing')
   where id = auth.uid() and trial_ends_at is null;
  select trial_ends_at into v from public.profiles where id = auth.uid();
  return v;
end $$;
revoke all on function public.start_my_trial() from public, anon;
grant execute on function public.start_my_trial() to authenticated;
