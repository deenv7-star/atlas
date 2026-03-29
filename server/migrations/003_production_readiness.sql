-- ATLAS — production readiness (run against the same DB as Express: schema_local / Postgres)
-- psql "$DATABASE_URL" -f server/migrations/003_production_readiness.sql

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'INVOICE';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_email TEXT DEFAULT '';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_address TEXT DEFAULT '';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_tax_id TEXT DEFAULT '';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(6,2) DEFAULT 17;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ILS';

COMMENT ON COLUMN public.users.is_platform_admin IS 'Super-admin flag; also check PLATFORM_ADMIN_EMAILS on server';
