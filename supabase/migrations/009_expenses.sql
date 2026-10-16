-- 009: expenses table for the monthly accountant report (feat/killer-features).
-- ADDITIVE ONLY and idempotent. Not applied: needs the owner's approval first.
-- Same org isolation as every other table: org_id = current_org_id().

create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  property_id   uuid references public.properties(id) on delete set null,
  category      text not null default 'אחר',
  description   text,
  amount        numeric(12, 2) not null default 0,
  expense_date  date not null default current_date,
  receipt_url   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_date  timestamptz not null default now(),
  updated_date  timestamptz not null default now()
);

create index if not exists expenses_org_date_idx on public.expenses (org_id, expense_date);

alter table public.expenses enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'expenses: own org data'
  ) then
    create policy "expenses: own org data" on public.expenses
      for all using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
  end if;
end $$;

notify pgrst, 'reload schema';
