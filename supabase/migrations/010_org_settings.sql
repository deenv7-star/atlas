-- 010: business defaults from onboarding v1 (NOT applied to the live project yet).
-- Today the app keeps these on the owner's device (localStorage, per organization). After applying,
-- set VITE_DB_SCHEMA_LEVEL=10 (and apply 008 + 009 first) so they sync to every device.
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
