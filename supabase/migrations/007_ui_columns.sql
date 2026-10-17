-- 007: additive columns the frontend already writes/reads (found in data QA, Oct 2026).
-- Each one was a live PGRST204 "could not find column" (insert/update rejected) or a
-- field the UI displays that could never be stored. No data changes, no drops.

-- Automations: rule templates + create dialog send these
alter table public.automation_rules add column if not exists description text;
alter table public.automation_rules add column if not exists timing_offset_hours integer not null default 0;
alter table public.automation_rules add column if not exists execution_count integer not null default 0;

-- iCal sync wizard sends sync_direction; list shows error_message
alter table public.calendar_syncs add column if not exists sync_direction text not null default 'IMPORT';
alter table public.calendar_syncs add column if not exists error_message text;

-- Integration setup dialogs send name + status; cards show name/status/error_message
alter table public.messaging_integrations  add column if not exists name text;
alter table public.messaging_integrations  add column if not exists status text not null default 'INACTIVE';
alter table public.messaging_integrations  add column if not exists error_message text;
alter table public.payment_gateways        add column if not exists name text;
alter table public.payment_gateways        add column if not exists status text not null default 'INACTIVE';
alter table public.payment_gateways        add column if not exists error_message text;
alter table public.payment_gateways        add column if not exists currency text not null default 'ILS';
alter table public.accounting_integrations add column if not exists name text;
alter table public.accounting_integrations add column if not exists status text not null default 'INACTIVE';
alter table public.accounting_integrations add column if not exists error_message text;
alter table public.pms_integrations        add column if not exists name text;
alter table public.pms_integrations        add column if not exists status text not null default 'INACTIVE';
alter table public.pms_integrations        add column if not exists error_message text;

-- Booking detail "add payment" sends type (DEPOSIT / BALANCE …) and shows it
alter table public.payments add column if not exists type text;

-- Messages page groups/sends threads by guest + property
alter table public.message_logs add column if not exists guest_name text;
alter table public.message_logs add column if not exists property_id uuid references public.properties(id) on delete set null;
alter table public.message_logs add column if not exists property_name text;

-- Service requests (staff page + public guest form)
alter table public.guest_requests add column if not exists title text;
alter table public.guest_requests add column if not exists urgency text;
alter table public.guest_requests add column if not exists guest_phone text;
alter table public.guest_requests add column if not exists notes text;
alter table public.guest_requests add column if not exists resolved_at timestamptz;

notify pgrst, 'reload schema';
