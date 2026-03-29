-- Align with server/migrations/003_production_readiness.sql (Supabase / hosted Postgres)

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
