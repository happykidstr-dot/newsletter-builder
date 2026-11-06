-- BÜLTEN READ Phase 2: owner-scoped full drafts and anonymous page-request metrics.
-- Apply AFTER migrations/20261106_security_phase1.sql.
-- Existing newsletters, lists and events are retained.

ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS content jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_bulten_newsletters_owner_updated
  ON public.newsletters (user_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS public.newsletter_web_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  publication_slug text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bulten_web_events_owner_time
  ON public.newsletter_web_events (user_id,viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulten_web_events_publication
  ON public.newsletter_web_events (publication_slug,viewed_at DESC);
ALTER TABLE public.newsletter_web_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.newsletter_web_events FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.newsletter_web_events_id_seq FROM anon, authenticated;
-- No public policies. Next.js service-role queries must be scoped to the
-- verified publisher's Clerk user ID. Raw user IPs, user agents and cookies
-- are never recorded in this table.
COMMENT ON TABLE public.newsletter_web_events IS
  'Anonymous, non-unique page requests for owned newsletters. Preview bots are filtered on a best-effort basis. Not a unique audience estimate.';
-- Operators should configure a periodic retention job according to their privacy policy.
