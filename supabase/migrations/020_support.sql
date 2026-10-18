-- =============================================================================
-- 020: in-app support (help bot + human handoff)
--
-- Requires 011_platform_admin.sql (platform_admins, admin_require, admin_log, is_platform_admin).
-- The app detects these tables at runtime (no VITE_DB_SCHEMA_LEVEL change). Deploy the Edge Function
-- supabase/functions/support-chat together with it (see its README.md). Re-runnable.
--
-- What it does (additive only: two new tables, no change to customer tables):
--   support_conversations  one thread per customer conversation (bot first, then a human if asked)
--   support_messages       every message: customer, bot, ATLAS agent, system. Doubles as the log
--                          (model, tokens, cost, latency per bot answer) for cost and quality review.
--
-- Who can do what
--   Customer (authenticated): SELECT only their own rows (user_id = auth.uid()). They never INSERT
--     or UPDATE directly: the Edge Function writes with the service role after checking their JWT,
--     so nobody can forge a "bot" or "agent" message. Two small RPCs let them mark a thread read
--     and rate an answer.
--   Platform admin (011, any role incl. support): SELECT everything (needed for the inbox + Realtime),
--     and reply / change status / mark read through admin_support_* SECURITY DEFINER RPCs, each
--     starting with admin_require('support') and writing admin_audit_log.
--   anon: nothing.
--   Realtime: both tables join the supabase_realtime publication. Realtime applies these same
--     SELECT policies, so a customer only receives events for their own conversation.
-- =============================================================================

-- ─── tables ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email          TEXT,
  user_name           TEXT,
  user_phone          TEXT,
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  mode                TEXT NOT NULL DEFAULT 'bot'  CHECK (mode IN ('bot','human')),
  subject             TEXT,                       -- first customer question, trimmed
  handoff_at          TIMESTAMPTZ,
  handoff_reason      TEXT CHECK (handoff_reason IS NULL OR handoff_reason IN ('button','keyword','unhelpful','bot_error','agent')),
  unhelpful_count     INTEGER NOT NULL DEFAULT 0, -- consecutive weak bot answers (resets on a good one)
  unread_admin        INTEGER NOT NULL DEFAULT 0, -- customer messages the team has not read
  unread_user         INTEGER NOT NULL DEFAULT 0, -- agent messages the customer has not read
  last_message_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_preview TEXT,
  last_sender         TEXT,
  page_path           TEXT,                       -- where in the app the customer opened help
  context             JSONB NOT NULL DEFAULT '{}'::jsonb,  -- plan, units, channels snapshot for the agent
  assigned_to         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_conv_user ON public.support_conversations (user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_conv_inbox ON public.support_conversations (status, mode, last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- the customer (denormalised for RLS + Realtime)
  org_id          UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender          TEXT NOT NULL CHECK (sender IN ('user','bot','agent','system')),
  author_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,          -- agent who replied
  author_name     TEXT,
  body            TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 8000),
  links           JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{label, path}] in-app deep links shown under a bot answer
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb,  -- confidence, follow_ups, offer_handoff, kb chunks used
  feedback        TEXT CHECK (feedback IS NULL OR feedback IN ('up','down')),
  model           TEXT,
  tokens_in       INTEGER,
  tokens_cached   INTEGER,
  tokens_out      INTEGER,
  cost_usd        NUMERIC(10,6),
  latency_ms      INTEGER,
  client_id       TEXT,                                -- idempotency key from the browser
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_msg_conv ON public.support_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_msg_rate ON public.support_messages (user_id, sender, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_msg_client ON public.support_messages (conversation_id, client_id) WHERE client_id IS NOT NULL;

-- Keep the conversation row (inbox list, unread badges) in step with its messages.
CREATE OR REPLACE FUNCTION public.support_after_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE public.support_conversations c SET
    last_message_at      = NEW.created_at,
    last_message_preview = left(regexp_replace(NEW.body, '\s+', ' ', 'g'), 140),
    last_sender          = NEW.sender,
    unread_admin         = c.unread_admin + CASE WHEN NEW.sender = 'user' AND c.mode = 'human' THEN 1 ELSE 0 END,
    unread_user          = c.unread_user  + CASE WHEN NEW.sender = 'agent' THEN 1 ELSE 0 END,
    status               = CASE WHEN NEW.sender = 'user' THEN 'open' ELSE c.status END,  -- a new question reopens
    closed_at            = CASE WHEN NEW.sender = 'user' THEN NULL ELSE c.closed_at END,
    subject              = COALESCE(c.subject, CASE WHEN NEW.sender = 'user' THEN left(NEW.body, 120) END),
    updated_at           = NOW()
  WHERE c.id = NEW.conversation_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_support_after_message ON public.support_messages;
CREATE TRIGGER trg_support_after_message AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.support_after_message();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_conversations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.support_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.support_conversations TO authenticated;
GRANT SELECT ON public.support_messages TO authenticated;

DO $$ BEGIN
  CREATE POLICY "support_conversations: own or platform admin" ON public.support_conversations
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_platform_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "support_messages: own or platform admin" ON public.support_messages
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_platform_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- No INSERT / UPDATE / DELETE policies on purpose (writes = Edge Function service role or RPCs below).

-- ─── customer RPCs ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.support_mark_read(p_conv UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  UPDATE public.support_conversations SET unread_user = 0, updated_at = NOW()
  WHERE id = p_conv AND user_id = auth.uid();
END $$;

CREATE OR REPLACE FUNCTION public.support_feedback(p_msg UUID, p_value TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_conv UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_value IS NOT NULL AND p_value NOT IN ('up','down') THEN RAISE EXCEPTION 'bad feedback value'; END IF;
  UPDATE public.support_messages SET feedback = p_value
  WHERE id = p_msg AND user_id = auth.uid() AND sender = 'bot'
  RETURNING conversation_id INTO v_conv;
  IF v_conv IS NULL THEN RAISE EXCEPTION 'message not found' USING ERRCODE = '42501'; END IF;
  -- A thumbs-down counts as an unhelpful answer (the widget offers a human at 2).
  UPDATE public.support_conversations
     SET unhelpful_count = CASE WHEN p_value = 'down' THEN unhelpful_count + 1
                                WHEN p_value = 'up' THEN 0 ELSE unhelpful_count END,
         updated_at = NOW()
   WHERE id = v_conv;
END $$;

-- ─── admin RPCs (platform admins from 011; support role is enough) ───────────
-- Inbox list. p_filter: 'waiting' (handed off + unread or awaiting reply) | 'open' | 'closed' | 'all'
CREATE OR REPLACE FUNCTION public.admin_support_list(p_filter TEXT DEFAULT 'open', p_limit INTEGER DEFAULT 200)
RETURNS TABLE (
  id UUID, org_id UUID, org_name TEXT, user_id UUID, user_email TEXT, user_name TEXT, user_phone TEXT,
  status TEXT, mode TEXT, subject TEXT, handoff_at TIMESTAMPTZ, handoff_reason TEXT,
  unread_admin INTEGER, last_message_at TIMESTAMPTZ, last_message_preview TEXT, last_sender TEXT,
  plan_key TEXT, messages_count INTEGER, created_at TIMESTAMPTZ
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('support');
  RETURN QUERY
  SELECT c.id, c.org_id, o.name, c.user_id, c.user_email, c.user_name, c.user_phone,
         c.status, c.mode, c.subject, c.handoff_at, c.handoff_reason,
         c.unread_admin, c.last_message_at, c.last_message_preview, c.last_sender,
         COALESCE(ps.plan_key, o.subscription_plan),
         (SELECT COUNT(*)::INTEGER FROM public.support_messages m WHERE m.conversation_id = c.id),
         c.created_at
  FROM public.support_conversations c
  LEFT JOIN public.organizations o ON o.id = c.org_id
  LEFT JOIN public.platform_subscriptions ps ON ps.org_id = c.org_id
  WHERE CASE COALESCE(p_filter, 'open')
          WHEN 'waiting' THEN c.status = 'open' AND c.mode = 'human' AND (c.unread_admin > 0 OR c.last_sender IN ('user','system'))
          WHEN 'open'    THEN c.status = 'open'
          WHEN 'closed'  THEN c.status = 'closed'
          ELSE TRUE END
  ORDER BY (c.mode = 'human' AND c.unread_admin > 0) DESC, c.last_message_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 1000);
END $$;

-- Unread badge for the admin sidebar.
CREATE OR REPLACE FUNCTION public.admin_support_unread()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('support');
  RETURN jsonb_build_object(
    'conversations', (SELECT COUNT(*) FROM public.support_conversations WHERE status = 'open' AND mode = 'human' AND unread_admin > 0),
    'messages', (SELECT COALESCE(SUM(unread_admin), 0) FROM public.support_conversations WHERE status = 'open' AND mode = 'human'),
    'waiting', (SELECT COUNT(*) FROM public.support_conversations WHERE status = 'open' AND mode = 'human' AND last_sender IN ('user','system')));
END $$;

CREATE OR REPLACE FUNCTION public.admin_support_reply(p_conv UUID, p_body TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_c public.support_conversations; v_name TEXT; v_id UUID;
BEGIN
  PERFORM public.admin_require('support');
  IF p_body IS NULL OR length(trim(p_body)) = 0 OR length(p_body) > 8000 THEN RAISE EXCEPTION 'reply must be 1-8000 chars'; END IF;
  SELECT * INTO v_c FROM public.support_conversations WHERE id = p_conv;
  IF v_c.id IS NULL THEN RAISE EXCEPTION 'conversation not found'; END IF;
  SELECT COALESCE(NULLIF(split_part(a.full_name, ' ', 1), ''), split_part(a.email, '@', 1)) INTO v_name
  FROM public.platform_admins a WHERE a.user_id = auth.uid();
  -- An agent stepping in takes the thread over from the bot.
  UPDATE public.support_conversations
     SET mode = 'human', status = 'open', closed_at = NULL, unread_admin = 0,
         handoff_at = COALESCE(handoff_at, NOW()), handoff_reason = COALESCE(handoff_reason, 'agent'),
         assigned_to = COALESCE(assigned_to, auth.uid()), updated_at = NOW()
   WHERE id = p_conv;
  INSERT INTO public.support_messages (conversation_id, user_id, org_id, sender, author_id, author_name, body)
  VALUES (p_conv, v_c.user_id, v_c.org_id, 'agent', auth.uid(), v_name, trim(p_body))
  RETURNING id INTO v_id;
  PERFORM public.admin_log('support.reply', 'support_conversation', p_conv::TEXT, v_c.org_id, jsonb_build_object('message_id', v_id, 'chars', length(p_body)));
  RETURN jsonb_build_object('id', v_id);
END $$;

CREATE OR REPLACE FUNCTION public.admin_support_set_status(p_conv UUID, p_status TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_org UUID;
BEGIN
  PERFORM public.admin_require('support');
  IF p_status NOT IN ('open','closed') THEN RAISE EXCEPTION 'status must be open or closed'; END IF;
  UPDATE public.support_conversations
     SET status = p_status, closed_at = CASE WHEN p_status = 'closed' THEN NOW() END,
         unread_admin = CASE WHEN p_status = 'closed' THEN 0 ELSE unread_admin END, updated_at = NOW()
   WHERE id = p_conv RETURNING org_id INTO v_org;
  IF NOT FOUND THEN RAISE EXCEPTION 'conversation not found'; END IF;
  PERFORM public.admin_log('support.' || p_status, 'support_conversation', p_conv::TEXT, v_org, '{}'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_support_mark_read(p_conv UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('support');
  UPDATE public.support_conversations SET unread_admin = 0, updated_at = NOW() WHERE id = p_conv;
END $$;

-- ─── grants on functions ─────────────────────────────────────────────────────
DO $$
DECLARE f TEXT;
BEGIN
  FOR f IN SELECT p.oid::regprocedure::TEXT FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND (p.proname LIKE 'admin\_support\_%' OR p.proname IN ('support_mark_read','support_feedback'))
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.support_after_message() FROM PUBLIC, anon, authenticated;

-- ─── Realtime ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- Retention (suggestion, not scheduled): conversations closed > 18 months can be deleted with
--   DELETE FROM public.support_conversations WHERE status = 'closed' AND closed_at < NOW() - INTERVAL '18 months';

NOTIFY pgrst, 'reload schema';
