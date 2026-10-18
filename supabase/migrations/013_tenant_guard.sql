-- 013: block tenants from changing tenancy / billing columns (P0 found by mega-audit 18.10.2026)
create or replace function public.guard_tenant_columns() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated','anon') then
    if tg_table_name = 'profiles' then
      if new.organization_id is distinct from old.organization_id
         or new.selected_plan is distinct from old.selected_plan
         or new.trial_ends_at is distinct from old.trial_ends_at
         or new.subscription_status is distinct from old.subscription_status
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
drop trigger if exists trg_guard_tenant_profiles on public.profiles;
create trigger trg_guard_tenant_profiles before update on public.profiles for each row execute function public.guard_tenant_columns();
drop trigger if exists trg_guard_tenant_orgs on public.organizations;
create trigger trg_guard_tenant_orgs before update on public.organizations for each row execute function public.guard_tenant_columns();
-- block client inserts/deletes of profiles & orgs (created only by handle_new_user)
drop policy if exists "profiles: own row" on public.profiles;
create policy "profiles: select own" on public.profiles for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "organizations: own org" on public.organizations;
create policy "organizations: select own" on public.organizations for select using (id = current_org_id());
create policy "organizations: update own" on public.organizations for update using (id = current_org_id()) with check (id = current_org_id());
