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
  event_type TEXT NOT NULL,
  email TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Row Level Security (Güvenlik Kuralları)
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi bültenlerini görebilir" ON newsletters FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Kullanıcılar kendi bültenlerini ekleyebilir/güncelleyebilir" ON newsletters FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Kullanıcılar kendi mail listelerini görebilir" ON mailing_lists FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Kullanıcılar kendi mail listelerini ekleyebilir/güncelleyebilir" ON mailing_lists FOR ALL USING (auth.uid()::text = user_id);

-- Analytics için API'den veri yazabilmek adına INSERT herkese açık olmalı
CREATE POLICY "Everyone can insert analytics" ON campaign_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read analytics" ON campaign_analytics FOR SELECT USING (true);

DO $$
BEGIN
  RAISE NOTICE 'Bülten, Mail Listesi ve Analitik tabloları başarıyla oluşturuldu!';
END $$;
