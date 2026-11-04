-- 033_property_imports: usage log + daily cap for "ייבוא מתחם" (edge function property-import).
-- PREPARED, NOT APPLIED. Needs Deen's approval. Additive only: 1 table, RLS, no change to existing rows.
-- Rollback: supabase/rollback/033_property_imports_down.sql
--
-- The imported complex itself needs NO migration: the app saves it where atlas already keeps these facts
--   units          → properties rows (name, type, max_guests, bedrooms, bathrooms, description, amenities, images, base_price, address)
--   the complex    → organizations.settings.property_profile (jsonb, migration 010, live): location, parking,
--                    arrival, rules, policies, contact, nearby, guest FAQ, reviews summary, sources
--   times / phone  → organizations.settings.check_in_time / check_out_time / host_phone (what guest messages read today)
--   photos         → storage bucket atlas-files/<org>/import/… (migration 010 bucket + 013b size cap)
-- This table only records that an import ran (no page text, no photos, no guest data), so the function can cap
-- imports per user per day and we can see which sources work.

create table if not exists public.property_imports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  org_id       uuid references public.organizations(id) on delete cascade,
  created_at   timestamptz not null default now(),
  sources      jsonb not null default '[]'::jsonb,   -- [{ kind, ok, error, photos, pages }] (urls of public listings)
  used_paste   boolean not null default false,
  used_images  integer not null default 0 check (used_images between 0 and 10),
  model        text,
  model_error  text,
  tokens       integer,
  found        jsonb not null default '{}'::jsonb      -- { business_name, missing: [...] }
);
create index if not exists property_imports_user_created_idx on public.property_imports (user_id, created_at desc);

alter table public.property_imports enable row level security;
drop policy if exists property_imports_select_own on public.property_imports;
create policy property_imports_select_own on public.property_imports for select using (user_id = auth.uid());
drop policy if exists property_imports_insert_own on public.property_imports;
create policy property_imports_insert_own on public.property_imports for insert
  with check (user_id = auth.uid() and (org_id is null or org_id = public.current_org_id()));
-- no update / delete policies: the log is append-only for users

grant select, insert on public.property_imports to authenticated;
revoke all on public.property_imports from anon;
