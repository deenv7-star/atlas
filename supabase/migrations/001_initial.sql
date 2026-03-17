-- =============================================================================
-- ATLAS — Initial Database Migration
-- Run this in the Supabase SQL editor (Settings → SQL Editor)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── organizations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL DEFAULT 'My Organization',
  email             TEXT,
  phone             TEXT,
  address           TEXT,
  website           TEXT,
  owner_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_plan TEXT NOT NULL DEFAULT 'starter',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── profiles (linked to auth.users) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT,
  full_name       TEXT,
  phone           TEXT,
  profile_image   TEXT,
  organization_id UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── users (application-level users per org) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT NOT NULL,
  name       TEXT,
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── properties ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.properties (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  address      TEXT,
  type         TEXT,
  bedrooms     INTEGER DEFAULT 1,
  bathrooms    INTEGER DEFAULT 1,
  max_guests   INTEGER DEFAULT 2,
  description  TEXT,
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
  type        TEXT,
  floor       INTEGER,
  bedrooms    INTEGER DEFAULT 1,
  bathrooms   INTEGER DEFAULT 1,
  max_guests  INTEGER DEFAULT 2,
  base_price  NUMERIC(10,2),
  status      TEXT DEFAULT 'available',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── leads ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name      TEXT,
  email          TEXT,
  phone          TEXT,
  status         TEXT NOT NULL DEFAULT 'NEW',
  source         TEXT,
  property_id    UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  check_in_date  DATE,
  check_out_date DATE,
  adults         INTEGER DEFAULT 2,
  children       INTEGER DEFAULT 0,
  budget         NUMERIC(10,2),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  created_date   TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date   TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

-- ─── bookings ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id     UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id         UUID REFERENCES public.units(id) ON DELETE SET NULL,
  guest_name      TEXT,
  guest_email     TEXT,
  guest_phone     TEXT,
  check_in_date   DATE,
  check_out_date  DATE,
  nights          INTEGER,
  adults          INTEGER DEFAULT 2,
  children        INTEGER DEFAULT 0,
  total_price     NUMERIC(10,2),
  status          TEXT NOT NULL DEFAULT 'PENDING',
  notes           TEXT,
  property_name   TEXT,
  source          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_date    TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date    TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

-- ─── payments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2) NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'ILS',
  status      TEXT NOT NULL DEFAULT 'PENDING',
  method      TEXT DEFAULT 'credit_card',
  description TEXT,
  due_date    DATE,
  paid_date   DATE,
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

-- ─── cleaning_tasks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cleaning_tasks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id    UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_id     UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  assigned_to    TEXT,
  title          TEXT,
  status         TEXT NOT NULL DEFAULT 'PENDING',
  scheduled_date DATE,
  scheduled_for  TIMESTAMPTZ,
  cleaner_name   TEXT,
  notes          TEXT,
  checklist      JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  created_date   TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date   TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

-- ─── messages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  content    TEXT,
  sent_at    TIMESTAMPTZ DEFAULT NOW(),
  channel    TEXT DEFAULT 'email',
  direction  TEXT DEFAULT 'outbound',
  recipient  TEXT,
  subject    TEXT,
  status     TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── message_logs (backward compat alias) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_id   UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  lead_id      UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  direction    TEXT DEFAULT 'outbound',
  channel      TEXT DEFAULT 'email',
  recipient    TEXT,
  subject      TEXT,
  body         TEXT,
  status       TEXT DEFAULT 'sent',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

-- ─── invoices ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_id     UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  invoice_number TEXT,
  guest_name     TEXT,
  guest_email    TEXT,
  amount         NUMERIC(10,2),
  tax            NUMERIC(10,2) DEFAULT 0,
  tax_amount     NUMERIC(10,2) DEFAULT 0,
  total_amount   NUMERIC(10,2),
  status         TEXT NOT NULL DEFAULT 'DRAFT',
  issue_date     DATE,
  due_date       DATE,
  items          JSONB DEFAULT '[]',
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  created_date   TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date   TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

-- ─── subscriptions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                 UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan                   TEXT NOT NULL DEFAULT 'starter',
  status                 TEXT NOT NULL DEFAULT 'active',
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id     TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ─── guest_requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guest_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_id   UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  property_id  UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  guest_name   TEXT,
  request_type TEXT,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'OPEN',
  priority     TEXT DEFAULT 'NORMAL',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

-- ─── contract_templates ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  content    TEXT,
  language   TEXT DEFAULT 'he',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

-- ─── contract_instances ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_instances (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id  UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  booking_id   UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  guest_name   TEXT,
  status       TEXT NOT NULL DEFAULT 'DRAFT',
  signed_at    TIMESTAMPTZ,
  content      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

-- ─── review_requests ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id  UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  booking_id   UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  guest_name   TEXT,
  guest_email  TEXT,
  rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text  TEXT,
  status       TEXT DEFAULT 'PENDING',
  platform     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

-- ─── automation_rules ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  trigger     TEXT,
  conditions  JSONB DEFAULT '{}',
  actions     JSONB DEFAULT '[]',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

-- ─── integration tables ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calendar_syncs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  provider    TEXT,
  ical_url    TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

CREATE TABLE IF NOT EXISTS public.messaging_integrations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider   TEXT,
  config     JSONB DEFAULT '{}',
  is_active  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

CREATE TABLE IF NOT EXISTS public.accounting_integrations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider   TEXT,
  config     JSONB DEFAULT '{}',
  is_active  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

CREATE TABLE IF NOT EXISTS public.pms_integrations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider   TEXT,
  config     JSONB DEFAULT '{}',
  is_active  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider   TEXT,
  config     JSONB DEFAULT '{}',
  is_active  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  updated_date TIMESTAMPTZ GENERATED ALWAYS AS (updated_at) STORED
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_bookings_org_id      ON public.bookings(org_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_leads_org_id         ON public.leads(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_property_id    ON public.leads(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_id      ON public.payments(org_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id  ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_properties_org_id    ON public.properties(org_id);
CREATE INDEX IF NOT EXISTS idx_units_org_id         ON public.units(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id      ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id         ON public.users(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_org_id      ON public.messages(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id  ON public.messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_org   ON public.cleaning_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id      ON public.invoices(org_id);

-- =============================================================================
-- TRIGGERS — auto-update updated_at
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
    'profiles','organizations','properties','units','bookings','leads',
    'payments','subscriptions','cleaning_tasks','invoices','guest_requests',
    'contract_templates','contract_instances','message_logs','messages',
    'review_requests','automation_rules','calendar_syncs',
    'messaging_integrations','accounting_integrations',
    'pms_integrations','payment_gateways','users'
  ]
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON public.%s
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
       t, t
    );
  END LOOP;
END;
$$;

-- =============================================================================
-- On new user signup: create org + profile automatically
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org_id   UUID;
  v_org_name TEXT;
BEGIN
  v_org_name := COALESCE(
    NEW.raw_user_meta_data->>'organization_name',
    CONCAT(COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), '''s Organization'),
    'My Organization'
  );

  INSERT INTO public.organizations (name, owner_id)
  VALUES (v_org_name, NEW.id)
  RETURNING id INTO v_org_id;

  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_org_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Enable RLS on every table
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','organizations','properties','units','bookings','leads',
    'payments','subscriptions','cleaning_tasks','invoices','guest_requests',
    'contract_templates','contract_instances','message_logs','messages',
    'review_requests','automation_rules','calendar_syncs',
    'messaging_integrations','accounting_integrations',
    'pms_integrations','payment_gateways','users'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%s ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;

-- profiles: users can read/update their own row
DO $$ BEGIN
  CREATE POLICY "profiles: own row" ON public.profiles FOR ALL USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- organizations: access own org
DO $$ BEGIN
  CREATE POLICY "organizations: own org" ON public.organizations FOR ALL USING (id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Generic org_id policies for all org-scoped tables
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'properties','units','bookings','leads','payments','subscriptions',
    'cleaning_tasks','invoices','guest_requests','contract_templates',
    'contract_instances','message_logs','messages','review_requests',
    'automation_rules','calendar_syncs','messaging_integrations',
    'accounting_integrations','pms_integrations','payment_gateways','users'
  ]
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY "%s: own org data" ON public.%s
         FOR ALL USING (org_id = public.current_org_id())',
         t, t
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END;
$$;

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','organizations','properties','units','bookings','leads',
    'payments','subscriptions','cleaning_tasks','invoices','guest_requests',
    'contract_templates','contract_instances','message_logs','messages',
    'review_requests','automation_rules','calendar_syncs',
    'messaging_integrations','accounting_integrations',
    'pms_integrations','payment_gateways','users'
  ]
  LOOP
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.%s TO authenticated', t
    );
  END LOOP;
END;
$$;
