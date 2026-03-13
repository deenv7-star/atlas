-- =============================================================================
-- ATLAS — Local PostgreSQL Schema (no Supabase-specific extensions)
-- Run with: psql "postgresql://atlas_user:atlas_local_pw_2024@127.0.0.1:5432/atlas_db" -f schema_local.sql
-- =============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLES
-- =============================================================================

-- ─── users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       TEXT DEFAULT '',
  phone           TEXT DEFAULT '',
  profile_image   TEXT DEFAULT '',
  organization_id UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── organizations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL DEFAULT 'My Organization',
  email             TEXT DEFAULT '',
  phone             TEXT DEFAULT '',
  address           TEXT DEFAULT '',
  website           TEXT DEFAULT '',
  owner_id          UUID REFERENCES public.users(id) ON DELETE SET NULL,
  subscription_plan TEXT NOT NULL DEFAULT 'starter',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users
  ADD CONSTRAINT IF NOT EXISTS users_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE SET NULL;

-- ─── refresh_tokens ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── properties ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.properties (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  address      TEXT DEFAULT '',
  type         TEXT DEFAULT '',
  bedrooms     INTEGER DEFAULT 1,
  bathrooms    INTEGER DEFAULT 1,
  max_guests   INTEGER DEFAULT 2,
  description  TEXT DEFAULT '',
  amenities    JSONB DEFAULT '[]',
  images       JSONB DEFAULT '[]',
  base_price   NUMERIC(10,2),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── units ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.units (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT DEFAULT '',
  floor       INTEGER,
  bedrooms    INTEGER DEFAULT 1,
  bathrooms   INTEGER DEFAULT 1,
  max_guests  INTEGER DEFAULT 2,
  base_price  NUMERIC(10,2),
  status      TEXT DEFAULT 'available',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── bookings ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id     UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id         UUID REFERENCES public.units(id) ON DELETE SET NULL,
  guest_name      TEXT DEFAULT '',
  guest_email     TEXT DEFAULT '',
  guest_phone     TEXT DEFAULT '',
  check_in_date   DATE,
  check_out_date  DATE,
  nights          INTEGER,
  adults          INTEGER DEFAULT 2,
  children        INTEGER DEFAULT 0,
  total_price     NUMERIC(10,2),
  status          TEXT NOT NULL DEFAULT 'PENDING',
  notes           TEXT DEFAULT '',
  property_name   TEXT DEFAULT '',
  source          TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── leads ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id     UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  full_name       TEXT DEFAULT '',
  email           TEXT DEFAULT '',
  phone           TEXT DEFAULT '',
  check_in_date   DATE,
  check_out_date  DATE,
  adults          INTEGER DEFAULT 2,
  children        INTEGER DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'NEW',
  source          TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  budget          NUMERIC(10,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── payments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_id  UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount      NUMERIC(10,2) NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'ILS',
  status      TEXT NOT NULL DEFAULT 'PENDING',
  method      TEXT DEFAULT 'credit_card',
  description TEXT DEFAULT '',
  due_date    DATE,
  paid_date   DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── subscriptions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id               UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL DEFAULT 'starter',
  status               TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  stripe_subscription_id TEXT DEFAULT '',
  stripe_customer_id     TEXT DEFAULT '',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── cleaning_tasks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cleaning_tasks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id    UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  booking_id     UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  title          TEXT DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'PENDING',
  scheduled_date DATE,
  cleaner_name   TEXT DEFAULT '',
  notes          TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── invoices ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_id     UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  invoice_number TEXT DEFAULT '',
  guest_name     TEXT DEFAULT '',
  guest_email    TEXT DEFAULT '',
  amount         NUMERIC(10,2),
  tax_amount     NUMERIC(10,2) DEFAULT 0,
  total_amount   NUMERIC(10,2),
  status         TEXT NOT NULL DEFAULT 'DRAFT',
  issue_date     DATE,
  due_date       DATE,
  items          JSONB DEFAULT '[]',
  notes          TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── guest_requests ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guest_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_id   UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  property_id  UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  guest_name   TEXT DEFAULT '',
  request_type TEXT DEFAULT '',
  description  TEXT DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'OPEN',
  priority     TEXT DEFAULT 'NORMAL',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── contract_templates ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  content    TEXT DEFAULT '',
  language   TEXT DEFAULT 'he',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── contract_instances ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_instances (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  booking_id  UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  guest_name  TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'DRAFT',
  signed_at   TIMESTAMPTZ,
  content     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── message_logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  lead_id    UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  direction  TEXT DEFAULT 'outbound',
  channel    TEXT DEFAULT 'email',
  recipient  TEXT DEFAULT '',
  subject    TEXT DEFAULT '',
  body       TEXT DEFAULT '',
  status     TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── review_requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  booking_id  UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  guest_name  TEXT DEFAULT '',
  guest_email TEXT DEFAULT '',
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT DEFAULT '',
  status      TEXT DEFAULT 'PENDING',
  platform    TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── automation_rules ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  trigger    TEXT DEFAULT '',
  conditions JSONB DEFAULT '{}',
  actions    JSONB DEFAULT '[]',
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── integration tables ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calendar_syncs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  provider    TEXT DEFAULT '',
  ical_url    TEXT DEFAULT '',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messaging_integrations (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id    UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider  TEXT DEFAULT '',
  config    JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounting_integrations (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id    UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider  TEXT DEFAULT '',
  config    JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pms_integrations (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id    UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider  TEXT DEFAULT '',
  config    JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id    UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider  TEXT DEFAULT '',
  config    JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email          ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_org_id         ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_org_id      ON public.bookings(org_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_id         ON public.leads(org_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_id      ON public.payments(org_id);
CREATE INDEX IF NOT EXISTS idx_properties_org_id    ON public.properties(org_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user  ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON public.refresh_tokens(token);

-- =============================================================================
-- updated_at TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','organizations','properties','units','bookings','leads',
    'payments','subscriptions','cleaning_tasks','invoices','guest_requests',
    'contract_templates','contract_instances','message_logs','review_requests',
    'automation_rules','calendar_syncs','messaging_integrations',
    'accounting_integrations','pms_integrations','payment_gateways'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s;
       CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON public.%s
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
       t, t, t, t
    );
  END LOOP;
END;
$$;
