-- ATLAS: append-only audit trail for Edge Functions and server actions.
-- RLS enabled with no policies for authenticated → only service_role / table owner bypasses.

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  table_name  TEXT NOT NULL,
  record_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_created
  ON public.audit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_created
  ON public.audit_log (table_name, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.audit_log IS
  'Security-sensitive audit events. Inserts typically use service_role from Edge Functions.';
