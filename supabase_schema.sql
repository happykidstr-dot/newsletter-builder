-- Supabase SQL Editor içine yapıştırıp RUN tuşuna basmanız yeterlidir.

-- 1. Newsletters Tablosunu Oluşturma
CREATE TABLE IF NOT EXISTS newsletters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  design TEXT,
  header_img_url TEXT,
  blocks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Mailing Lists Tablosunu Oluşturma
CREATE TABLE IF NOT EXISTS mailing_lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  contacts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Analytics (Takip) Tablosunu Oluşturma
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  email TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permanent e-mail suppression after an unsubscribe request.
CREATE TABLE IF NOT EXISTS email_suppressions (
  user_id TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY(user_id,email_hash)
);

-- 4. RLS: no client access. Clerk identity is checked by Next.js API routes
-- using a server-only Supabase service-role key.
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;

-- No public policies. The service-role API accesses only records where
-- user_id equals the verified Clerk session ID.
CREATE INDEX IF NOT EXISTS idx_bulten_owner_newsletters ON newsletters(user_id);
CREATE INDEX IF NOT EXISTS idx_bulten_owner_lists ON mailing_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_bulten_owner_analytics ON campaign_analytics(user_id,created_at DESC);

DO $$
BEGIN
  RAISE NOTICE 'Bülten, Mail Listesi ve Analitik tabloları başarıyla oluşturuldu!';
END $$;
