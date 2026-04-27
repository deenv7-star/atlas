-- Align local / self-hosted Postgres with Express routes (domain + entities).
-- psql "$DATABASE_URL" -f server/migrations/004_schema_alignment.sql

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT '';

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

CREATE INDEX IF NOT EXISTS idx_messages_org_id ON public.messages(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON public.messages(booking_id);

DROP TRIGGER IF EXISTS trg_messages_updated_at ON public.messages;
CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
