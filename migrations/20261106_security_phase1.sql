-- BÜLTEN READ Security Phase 1 -- run with Supabase SQL Editor, once.
-- Existing user data is preserved. Old tracking events without a user_id
-- remain inaccessible to the new owner-scoped analytics API.

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.campaign_analytics
  ADD COLUMN IF NOT EXISTS user_id text;

CREATE INDEX IF NOT EXISTS idx_bulten_analytics_owner_time
  ON public.campaign_analytics(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulten_analytics_owner_campaign
  ON public.campaign_analytics(user_id,campaign_id);

-- Previous example policies made analytics world-readable/writable. Remove
-- ALL user-facing policies: only server-held service-role API calls are allowed.
DROP POLICY IF EXISTS "Everyone can insert analytics" ON public.campaign_analytics;
DROP POLICY IF EXISTS "Users can read analytics" ON public.campaign_analytics;
DROP POLICY IF EXISTS "Kullanıcılar kendi bültenlerini görebilir" ON public.newsletters;
DROP POLICY IF EXISTS "Kullanıcılar kendi bültenlerini ekleyebilir/güncelleyebilir" ON public.newsletters;
DROP POLICY IF EXISTS "Kullanıcılar kendi mail listelerini görebilir" ON public.mailing_lists;
DROP POLICY IF EXISTS "Kullanıcılar kendi mail listelerini ekleyebilir/güncelleyebilir" ON public.mailing_lists;

-- Prevent REST exposure to anon/authenticated Supabase keys. Clerk identities
-- are validated by the Next.js API, which uses a server-only service-role key.
REVOKE ALL ON TABLE public.campaign_analytics FROM anon, authenticated;
REVOKE ALL ON TABLE public.mailing_lists FROM anon, authenticated;
REVOKE ALL ON TABLE public.newsletters FROM anon, authenticated;

COMMENT ON COLUMN public.campaign_analytics.user_id IS
  'Verified Clerk account ID of campaign owner. Required for private analytics.';
COMMENT ON COLUMN public.mailing_lists.contacts IS
  'Contact consentAt, consentSource, trackingConsent and unsubscribedAt are required for compliant bulk sends.';
