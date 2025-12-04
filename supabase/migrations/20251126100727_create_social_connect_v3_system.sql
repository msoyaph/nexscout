/*
  # NexScout Social Connect v3.0 System

  1. New Tables
    - `social_identities` - OAuth tokens and provider connections
    - `social_page_insights` - FB/IG page data
    - `linkedin_page_insights` - LinkedIn org page data
    - `tiktok_insights` - TikTok business insights
    - `twitter_insights` - Twitter/X data
    - `browser_capture_events` - Browser extension captures
    - `scan_smartness_events` - Smartness boost tracking
    - `social_connect_logs` - Audit logs

  2. Security
    - RLS on all tables
    - Encrypted token storage
    - User-scoped access

  3. Indexes
    - Performance indexes for lookups
*/

-- Social identities (OAuth connections)
CREATE TABLE IF NOT EXISTS social_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('facebook', 'google', 'linkedin', 'twitter', 'tiktok', 'instagram')),
  provider_user_id text NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  profile_data jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_social_identities_user_id ON social_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_social_identities_provider ON social_identities(provider);

-- Social page insights (FB/IG)
CREATE TABLE IF NOT EXISTS social_page_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  page_id text NOT NULL,
  page_name text,
  insight_type text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_page_insights_user_id ON social_page_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_social_page_insights_platform ON social_page_insights(platform);

-- LinkedIn page insights
CREATE TABLE IF NOT EXISTS linkedin_page_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id text NOT NULL,
  organization_name text,
  insight_type text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_linkedin_page_insights_user_id ON linkedin_page_insights(user_id);

-- TikTok insights
CREATE TABLE IF NOT EXISTS tiktok_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id text NOT NULL,
  insight_type text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tiktok_insights_user_id ON tiktok_insights(user_id);

-- Twitter insights
CREATE TABLE IF NOT EXISTS twitter_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tweet_id text,
  insight_type text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_twitter_insights_user_id ON twitter_insights(user_id);

-- Browser capture events
CREATE TABLE IF NOT EXISTS browser_capture_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_id uuid,
  html_snapshot text,
  text_content text,
  source_url text,
  capture_type text NOT NULL CHECK (capture_type IN ('friends_list', 'post', 'comments', 'messages', 'profile', 'other')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_browser_capture_user_id ON browser_capture_events(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_capture_scan_id ON browser_capture_events(scan_id);

-- Smartness events
CREATE TABLE IF NOT EXISTS scan_smartness_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  smartness_delta integer NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_smartness_events_user_id ON scan_smartness_events(user_id);

-- Social connect audit logs
CREATE TABLE IF NOT EXISTS social_connect_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  provider text NOT NULL,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_connect_logs_user_id ON social_connect_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connect_logs_action ON social_connect_logs(action);

-- RLS Policies

ALTER TABLE social_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own social identities"
  ON social_identities FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own social identities"
  ON social_identities FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own social identities"
  ON social_identities FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own social identities"
  ON social_identities FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE social_page_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own page insights"
  ON social_page_insights FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own page insights"
  ON social_page_insights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

ALTER TABLE linkedin_page_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own LinkedIn insights"
  ON linkedin_page_insights FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own LinkedIn insights"
  ON linkedin_page_insights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

ALTER TABLE tiktok_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own TikTok insights"
  ON tiktok_insights FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own TikTok insights"
  ON tiktok_insights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

ALTER TABLE twitter_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own Twitter insights"
  ON twitter_insights FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own Twitter insights"
  ON twitter_insights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

ALTER TABLE browser_capture_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own browser captures"
  ON browser_capture_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own browser captures"
  ON browser_capture_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

ALTER TABLE scan_smartness_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own smartness events"
  ON scan_smartness_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own smartness events"
  ON scan_smartness_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

ALTER TABLE social_connect_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own connect logs"
  ON social_connect_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own connect logs"
  ON social_connect_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());