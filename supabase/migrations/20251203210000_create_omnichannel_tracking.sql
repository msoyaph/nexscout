-- =====================================================
-- OMNI-CHANNEL ENGAGEMENT TRACKING SYSTEM
-- =====================================================
-- Tracks all prospect interactions across multiple channels
-- with AI-powered message analysis and ScoutScore updates

-- =====================================================
-- 1. CONVERSATION CHANNELS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Channel info
  channel_type TEXT NOT NULL CHECK (channel_type IN (
    'facebook_messenger', 
    'email', 
    'sms', 
    'whatsapp', 
    'linkedin', 
    'phone',
    'instagram',
    'telegram',
    'other'
  )),
  channel_identifier TEXT, -- e.g., email address, phone number, FB ID
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  
  -- Metadata
  first_contact_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_received INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversation_channels_prospect ON conversation_channels(prospect_id);
CREATE INDEX idx_conversation_channels_user ON conversation_channels(user_id);
CREATE INDEX idx_conversation_channels_type ON conversation_channels(channel_type);

-- =====================================================
-- 2. MESSAGES TABLE (Omni-channel)
-- =====================================================
CREATE TABLE IF NOT EXISTS omnichannel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES conversation_channels(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message details
  direction TEXT NOT NULL CHECK (direction IN ('sent', 'received')),
  channel_type TEXT NOT NULL,
  message_content TEXT,
  message_preview TEXT, -- First 200 chars for display
  
  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN (
    'draft',
    'sending',
    'sent',
    'delivered',
    'read',
    'replied',
    'failed',
    'bounced'
  )),
  
  -- AI Analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  sentiment_score DECIMAL(3,2), -- 0.00 to 1.00
  intent TEXT CHECK (intent IN (
    'interested',
    'questioning',
    'objecting',
    'scheduling',
    'buying',
    'declining',
    'neutral'
  )),
  engagement_level TEXT CHECK (engagement_level IN ('high', 'medium', 'low')),
  
  -- Buying signals
  buying_signals JSONB DEFAULT '[]'::jsonb, -- Array of detected signals
  objections_detected JSONB DEFAULT '[]'::jsonb, -- Array of objections
  questions_asked JSONB DEFAULT '[]'::jsonb, -- Array of questions
  
  -- Timing
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  response_time_seconds INTEGER, -- Time to respond (if received message)
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_omnichannel_messages_channel ON omnichannel_messages(channel_id);
CREATE INDEX idx_omnichannel_messages_prospect ON omnichannel_messages(prospect_id);
CREATE INDEX idx_omnichannel_messages_direction ON omnichannel_messages(direction);
CREATE INDEX idx_omnichannel_messages_created ON omnichannel_messages(created_at DESC);
CREATE INDEX idx_omnichannel_messages_sentiment ON omnichannel_messages(sentiment);

-- =====================================================
-- 3. ENGAGEMENT ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS prospect_engagement_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Overall metrics
  total_touchpoints INTEGER DEFAULT 0,
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_received INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  avg_response_time_seconds INTEGER,
  
  -- Channel breakdown
  channels_used JSONB DEFAULT '[]'::jsonb, -- Array of channel types used
  preferred_channel TEXT,
  channel_engagement JSONB DEFAULT '{}'::jsonb, -- Stats per channel
  
  -- Sentiment analysis
  overall_sentiment TEXT,
  positive_messages_count INTEGER DEFAULT 0,
  neutral_messages_count INTEGER DEFAULT 0,
  negative_messages_count INTEGER DEFAULT 0,
  sentiment_trend TEXT CHECK (sentiment_trend IN ('improving', 'stable', 'declining')),
  
  -- Intent analysis
  primary_intent TEXT,
  buying_signals_count INTEGER DEFAULT 0,
  objections_count INTEGER DEFAULT 0,
  questions_count INTEGER DEFAULT 0,
  
  -- Engagement scoring
  engagement_score DECIMAL(5,2) DEFAULT 0.00, -- 0-100
  engagement_trend TEXT CHECK (engagement_trend IN ('increasing', 'stable', 'decreasing')),
  
  -- Best contact times
  best_contact_day TEXT, -- e.g., "Monday"
  best_contact_hour INTEGER, -- 0-23
  contact_patterns JSONB DEFAULT '{}'::jsonb,
  
  -- ScoutScore impact
  scoutscore_before INTEGER,
  scoutscore_after INTEGER,
  scoutscore_change INTEGER,
  last_scoutscore_update TIMESTAMPTZ,
  
  -- Timestamps
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_engagement_analytics_prospect ON prospect_engagement_analytics(prospect_id);
CREATE INDEX idx_engagement_analytics_user ON prospect_engagement_analytics(user_id);
CREATE INDEX idx_engagement_analytics_score ON prospect_engagement_analytics(engagement_score DESC);

-- =====================================================
-- 4. REAL-TIME ENGAGEMENT EVENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'message_sent',
    'message_received',
    'message_read',
    'link_clicked',
    'profile_viewed',
    'calendar_opened',
    'call_answered',
    'call_missed',
    'meeting_scheduled',
    'meeting_completed',
    'document_viewed',
    'video_watched'
  )),
  channel_type TEXT,
  
  -- Impact
  scoutscore_impact INTEGER, -- +/- points
  engagement_impact TEXT CHECK (engagement_impact IN ('positive', 'neutral', 'negative')),
  
  -- Details
  event_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_engagement_events_prospect ON engagement_events(prospect_id);
CREATE INDEX idx_engagement_events_type ON engagement_events(event_type);
CREATE INDEX idx_engagement_events_created ON engagement_events(created_at DESC);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- conversation_channels policies
ALTER TABLE conversation_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own channels"
  ON conversation_channels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own channels"
  ON conversation_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own channels"
  ON conversation_channels FOR UPDATE
  USING (auth.uid() = user_id);

-- omnichannel_messages policies
ALTER TABLE omnichannel_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON omnichannel_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages"
  ON omnichannel_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON omnichannel_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- prospect_engagement_analytics policies
ALTER TABLE prospect_engagement_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
  ON prospect_engagement_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analytics"
  ON prospect_engagement_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON prospect_engagement_analytics FOR UPDATE
  USING (auth.uid() = user_id);

-- engagement_events policies
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON engagement_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own events"
  ON engagement_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Function to analyze message and update engagement
CREATE OR REPLACE FUNCTION analyze_message_engagement(
  p_message_id UUID,
  p_sentiment TEXT,
  p_sentiment_score DECIMAL,
  p_intent TEXT,
  p_engagement_level TEXT,
  p_buying_signals JSONB,
  p_objections JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prospect_id UUID;
  v_user_id UUID;
  v_channel_type TEXT;
  v_direction TEXT;
  v_scoutscore_impact INTEGER := 0;
  v_current_score INTEGER;
  v_new_score INTEGER;
  v_result JSONB;
BEGIN
  -- Get message details
  SELECT prospect_id, user_id, channel_type, direction
  INTO v_prospect_id, v_user_id, v_channel_type, v_direction
  FROM omnichannel_messages
  WHERE id = p_message_id;

  -- Update message with AI analysis
  UPDATE omnichannel_messages
  SET
    sentiment = p_sentiment,
    sentiment_score = p_sentiment_score,
    intent = p_intent,
    engagement_level = p_engagement_level,
    buying_signals = p_buying_signals,
    objections_detected = p_objections,
    updated_at = NOW()
  WHERE id = p_message_id;

  -- Calculate ScoutScore impact (only for received messages)
  IF v_direction = 'received' THEN
    -- Positive sentiment: +5 points
    IF p_sentiment = 'positive' THEN
      v_scoutscore_impact := v_scoutscore_impact + 5;
    END IF;

    -- Buying signals: +3 points each (max +15)
    v_scoutscore_impact := v_scoutscore_impact + LEAST(jsonb_array_length(p_buying_signals) * 3, 15);

    -- High engagement: +5 points
    IF p_engagement_level = 'high' THEN
      v_scoutscore_impact := v_scoutscore_impact + 5;
    END IF;

    -- Interested intent: +10 points
    IF p_intent IN ('interested', 'buying', 'scheduling') THEN
      v_scoutscore_impact := v_scoutscore_impact + 10;
    END IF;

    -- Objections: -3 points each (max -9)
    v_scoutscore_impact := v_scoutscore_impact - LEAST(jsonb_array_length(p_objections) * 3, 9);

    -- Negative sentiment: -5 points
    IF p_sentiment = 'negative' THEN
      v_scoutscore_impact := v_scoutscore_impact - 5;
    END IF;

    -- Get current ScoutScore from prospect metadata
    SELECT 
      COALESCE((metadata->>'scout_score')::integer, 50)
    INTO v_current_score
    FROM prospects
    WHERE id = v_prospect_id;

    -- Calculate new score (keep within 0-100)
    v_new_score := GREATEST(0, LEAST(100, v_current_score + v_scoutscore_impact));

    -- Update prospect ScoutScore
    UPDATE prospects
    SET
      metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{scout_score}',
        to_jsonb(v_new_score)
      ),
      updated_at = NOW()
    WHERE id = v_prospect_id;

    -- Log engagement event
    INSERT INTO engagement_events (
      prospect_id,
      user_id,
      event_type,
      channel_type,
      scoutscore_impact,
      engagement_impact,
      event_data
    ) VALUES (
      v_prospect_id,
      v_user_id,
      'message_received',
      v_channel_type,
      v_scoutscore_impact,
      CASE 
        WHEN v_scoutscore_impact > 0 THEN 'positive'
        WHEN v_scoutscore_impact < 0 THEN 'negative'
        ELSE 'neutral'
      END,
      jsonb_build_object(
        'message_id', p_message_id,
        'sentiment', p_sentiment,
        'intent', p_intent,
        'score_before', v_current_score,
        'score_after', v_new_score
      )
    );

    -- Update engagement analytics
    INSERT INTO prospect_engagement_analytics (
      prospect_id,
      user_id,
      total_messages_received,
      scoutscore_before,
      scoutscore_after,
      scoutscore_change,
      last_scoutscore_update
    ) VALUES (
      v_prospect_id,
      v_user_id,
      1,
      v_current_score,
      v_new_score,
      v_scoutscore_impact,
      NOW()
    )
    ON CONFLICT (prospect_id)
    DO UPDATE SET
      total_messages_received = prospect_engagement_analytics.total_messages_received + 1,
      scoutscore_before = v_current_score,
      scoutscore_after = v_new_score,
      scoutscore_change = prospect_engagement_analytics.scoutscore_change + v_scoutscore_impact,
      last_scoutscore_update = NOW(),
      updated_at = NOW();
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'success', TRUE,
    'scoutscore_impact', v_scoutscore_impact,
    'new_score', v_new_score,
    'message', 'Message analyzed and ScoutScore updated'
  );

  RETURN v_result;
END;
$$;

-- Function to update channel statistics
CREATE OR REPLACE FUNCTION update_channel_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update conversation channel stats
  UPDATE conversation_channels
  SET
    last_message_at = NEW.created_at,
    total_messages_sent = total_messages_sent + CASE WHEN NEW.direction = 'sent' THEN 1 ELSE 0 END,
    total_messages_received = total_messages_received + CASE WHEN NEW.direction = 'received' THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = NEW.channel_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_channel_stats
AFTER INSERT ON omnichannel_messages
FOR EACH ROW
EXECUTE FUNCTION update_channel_stats();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Omni-channel tracking system created successfully!';
  RAISE NOTICE '📊 Tables: conversation_channels, omnichannel_messages, prospect_engagement_analytics, engagement_events';
  RAISE NOTICE '🤖 AI message analysis integrated with ScoutScore updates';
  RAISE NOTICE '🔄 Real-time engagement tracking enabled';
END $$;




