-- BÜLTEN READ security & persistence migration, 2026-11-05
-- Run once in Supabase SQL Editor after taking a backup.
BEGIN;

ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS show_toc BOOLEAN DEFAULT TRUE;

ALTER TABLE mailing_lists ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE campaign_analytics ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE campaign_analytics ADD COLUMN IF NOT EXISTS recipient_token TEXT;
CREATE INDEX IF NOT EXISTS campaign_analytics_owner_time ON campaign_analytics(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS campaign_recipients_owner ON campaign_recipients(user_id, campaign_id);

CREATE TABLE IF NOT EXISTS suppressed_emails (
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id,email)
);

CREATE TABLE IF NOT EXISTS action_quotas (
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL CHECK (count >= 0),
  PRIMARY KEY (user_id,action,window_start)
);

ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppressed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_quotas ENABLE ROW LEVEL SECURITY;

-- All personal data access is via authenticated server handlers with service-role.
-- Prevent direct anonymous and client-side Supabase access.
DROP POLICY IF EXISTS "Everyone can insert analytics" ON campaign_analytics;
DROP POLICY IF EXISTS "Users can read analytics" ON campaign_analytics;
REVOKE ALL ON TABLE newsletters, mailing_lists, campaign_analytics, campaign_recipients, suppressed_emails, action_quotas FROM anon, authenticated;

CREATE OR REPLACE FUNCTION consume_action_quota(
  p_user_id TEXT, p_action TEXT, p_maximum INTEGER, p_window_seconds INTEGER
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER; v_window TIMESTAMPTZ;
BEGIN
  IF p_user_id IS NULL OR length(p_user_id) < 1 OR p_maximum < 1 OR p_window_seconds < 10 THEN
    RETURN FALSE;
  END IF;
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  INSERT INTO action_quotas(user_id,action,window_start,count)
  VALUES(p_user_id,p_action,v_window,1)
  ON CONFLICT(user_id,action,window_start)
  DO UPDATE SET count = action_quotas.count + 1
  WHERE action_quotas.count < p_maximum
  RETURNING count INTO v_count;
  RETURN v_count IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION consume_action_quota(TEXT,TEXT,INTEGER,INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_action_quota(TEXT,TEXT,INTEGER,INTEGER) TO service_role;
COMMIT;
