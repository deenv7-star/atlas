-- 013c: the tenant guard (013) blocked onboarding's finish, which starts the 14-day trial
-- (trial_ends_at null -> now+14d), so onboarding_completed was never saved. Allow exactly that
-- one transition: trial_ends_at from NULL to a date at most 15 days ahead, status unchanged or 'trialing'.
create or replace function public.guard_tenant_columns() returns trigger
language plpgsql set search_path = public as $$
declare
  trial_start boolean := false;
begin
  if current_user in ('authenticated','anon') then
    if tg_table_name = 'profiles' then
      trial_start := old.trial_ends_at is null
        and new.trial_ends_at is not null
        and new.trial_ends_at <= now() + interval '15 days'
        and (new.subscription_status is not distinct from old.subscription_status or new.subscription_status = 'trialing');
      if new.organization_id is distinct from old.organization_id
         or new.selected_plan is distinct from old.selected_plan
         or (new.trial_ends_at is distinct from old.trial_ends_at and not trial_start)
         or (new.subscription_status is distinct from old.subscription_status and not trial_start)
         or new.id is distinct from old.id
         or new.email is distinct from old.email then
        raise exception 'אין הרשאה לשנות שדות חשבון' using errcode = '42501';
      end if;
    elsif tg_table_name = 'organizations' then
      if new.id is distinct from old.id
         or new.owner_id is distinct from old.owner_id
         or new.subscription_plan is distinct from old.subscription_plan then
        raise exception 'אין הרשאה לשנות שדות חשבון' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end $$;
