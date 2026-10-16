-- 006: additive columns the frontend already reads/writes (no data changes)
alter table public.leads             add column if not exists nights integer;
alter table public.contract_templates add column if not exists property_id uuid references public.properties(id) on delete set null;
alter table public.calendar_syncs    add column if not exists sync_status text not null default 'ACTIVE';
alter table public.calendar_syncs    add column if not exists last_sync_at timestamptz;
alter table public.bookings          add column if not exists lead_id uuid references public.leads(id) on delete set null;
alter table public.review_requests   add column if not exists sent_at timestamptz;
notify pgrst, 'reload schema';
