-- 010: business defaults from onboarding v1. Applied to the live project on 18 Oct 2026.
-- The app keeps these on the owner's device (localStorage, per organization) and, when this column
-- exists (detected at runtime, independent of VITE_DB_SCHEMA_LEVEL / 008 / 009), also in
-- organizations.settings so every device sees them.
--   settings = { complex_type, check_in_time, check_out_time, host_name, host_phone, wa_greeting,
--                deposit: 'none' | '30' | '50' | 'full', cover_photo }
alter table public.organizations add column if not exists settings jsonb not null default '{}'::jsonb;

-- Photos: onboarding stores owner / unit photos as small jpeg data urls because the project has no
-- storage bucket. A public-read bucket lets them become real files (UploadFile already targets it).
insert into storage.buckets (id, name, public)
values ('atlas-files', 'atlas-files', true)
on conflict (id) do nothing;

do $$ begin
  create policy "atlas-files: members upload" on storage.objects
    for insert to authenticated with check (bucket_id = 'atlas-files');
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';
