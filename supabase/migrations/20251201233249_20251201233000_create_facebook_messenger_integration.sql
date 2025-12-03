/*
  # Facebook Messenger Integration v1.0

  1. Tables
    - `facebook_page_connections` - Linked Facebook pages
    - `facebook_chat_sessions` - Active chat sessions
    - `facebook_message_logs` - Full message history

  2. Features
    - OAuth page linking
    - Webhook message receiving
    - AI auto-reply routing
    - Full conversation tracking
    - Analytics and insights

  3. Customer Journey
    - Stranger messages → Prospect created
    - AI auto-replies → DeepScan starts
    - Data captured → Pipeline progresses
    - Appointment booked → Meeting scheduled
    - Sale closed → Upsell/referral triggered
*/

-- =====================================================
-- FACEBOOK PAGE CONNECTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS facebook_page_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Facebook Page Details
  page_id text NOT NULL,
  page_name text,
  page_username text,
  page_category text,
  page_profile_picture text,
  
  -- Access Tokens
  access_token text NOT NULL, -- Long-lived page access token
  
  -- Settings
  auto_reply_enabled boolean DEFAULT true,
  greeting_message text,
  away_message text,
  
  -- Webhook
  webhook_verified boolean DEFAULT false,
  webhook_subscribed_at timestamptz,
  
  -- Status
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, page_id)
);

CREATE INDEX IF NOT EXISTS idx_fb_pages_user ON facebook_page_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_fb_pages_page_id ON facebook_page_connections(page_id);
CREATE INDEX IF NOT EXISTS idx_fb_pages_active ON facebook_page_connections(is_active) WHERE is_active = true;

-- =====================================================
-- FACEBOOK CHAT SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS facebook_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Facebook Identifiers
  sender_id text NOT NULL, -- Facebook PSID (Page-Scoped ID)
  page_id text NOT NULL,
  
  -- Linked Prospect
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  
  -- Session Info
  last_message text,
  last_direction text, -- 'inbound' | 'outbound'
  message_count integer DEFAULT 0,
  
  -- AI Context
  conversation_context jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "detected_name": "Juan",
  --   "detected_interest": "health products",
  --   "stage": "inquiry",
  --   "sentiment": "positive"
  -- }
  
  -- Status
  is_active boolean DEFAULT true,
  archived_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(sender_id, page_id)
);

CREATE INDEX IF NOT EXISTS idx_fb_sessions_user ON facebook_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fb_sessions_sender ON facebook_chat_sessions(sender_id);
CREATE INDEX IF NOT EXISTS idx_fb_sessions_page ON facebook_chat_sessions(page_id);
CREATE INDEX IF NOT EXISTS idx_fb_sessions_prospect ON facebook_chat_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_fb_sessions_active ON facebook_chat_sessions(is_active) WHERE is_active = true;

-- =====================================================
-- FACEBOOK MESSAGE LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS facebook_message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES facebook_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  
  -- Message Details
  direction text NOT NULL, -- 'inbound' | 'outbound'
  message text,
  
  -- Facebook Metadata
  fb_message_id text,
  fb_timestamp bigint,
  
  -- Attachments
  attachments jsonb DEFAULT '[]'::jsonb,
  -- [{"type": "image", "url": "..."}]
  
  -- AI Processing
  ai_intent text, -- 'inquiry', 'objection', 'interest', 'ready_to_buy'
  ai_sentiment decimal(5,2), -- -1.0 to 1.0
  ai_confidence decimal(5,2),
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fb_messages_session ON facebook_message_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_fb_messages_direction ON facebook_message_logs(direction);
CREATE INDEX IF NOT EXISTS idx_fb_messages_created ON facebook_message_logs(created_at DESC);

-- =====================================================
-- FACEBOOK ANALYTICS CACHE
-- =====================================================

CREATE TABLE IF NOT EXISTS facebook_analytics_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page_id text NOT NULL,
  
  -- Date Range
  date date NOT NULL,
  
  -- Metrics
  total_messages integer DEFAULT 0,
  inbound_messages integer DEFAULT 0,
  outbound_messages integer DEFAULT 0,
  new_sessions integer DEFAULT 0,
  avg_response_time_seconds integer,
  
  -- Conversions
  leads_created integer DEFAULT 0,
  meetings_booked integer DEFAULT 0,
  sales_closed integer DEFAULT 0,
  
  -- Revenue
  revenue_generated numeric(12,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, page_id, date)
);

CREATE INDEX IF NOT EXISTS idx_fb_analytics_user ON facebook_analytics_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_fb_analytics_date ON facebook_analytics_cache(date DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE facebook_page_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_analytics_cache ENABLE ROW LEVEL SECURITY;

-- Page Connections
CREATE POLICY "Users can view own FB pages"
  ON facebook_page_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own FB pages"
  ON facebook_page_connections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chat Sessions
CREATE POLICY "Users can view own FB sessions"
  ON facebook_chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own FB sessions"
  ON facebook_chat_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Message Logs (through session)
CREATE POLICY "Users can view FB messages"
  ON facebook_message_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_chat_sessions
      WHERE facebook_chat_sessions.id = facebook_message_logs.session_id
      AND facebook_chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert FB messages"
  ON facebook_message_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facebook_chat_sessions
      WHERE facebook_chat_sessions.id = facebook_message_logs.session_id
      AND facebook_chat_sessions.user_id = auth.uid()
    )
  );

-- Analytics
CREATE POLICY "Users can view own FB analytics"
  ON facebook_analytics_cache FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can insert/update analytics
CREATE POLICY "Service can manage analytics"
  ON facebook_analytics_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);