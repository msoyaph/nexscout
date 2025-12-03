/*
  # Public AI Chatbot v3.0 - Omni-Channel Auto Closer

  1. New Tables
    - `omni_channel_identities` - Unified identity across all platforms
    - `omni_messages` - Unified message storage (all channels)
    - `omni_channel_followups` - Multi-channel follow-up sequences
    - `omni_channel_settings` - User's omni-channel configuration
    - `prospect_memory_cache` - Cross-channel AI memory
    - `channel_effectiveness_scores` - Track best performing channels
    - `identity_merge_log` - Audit trail of identity stitching

  2. Omni-Channel Features
    - Identity stitching (merge same person across platforms)
    - Cross-channel memory (AI remembers everything)
    - Omni-closer (close on any channel)
    - Ghosted revival (re-engage on best channel)
    - Channel effectiveness tracking

  3. Supported Channels
    - Web chat
    - Facebook Messenger
    - WhatsApp
    - Instagram DM
    - Viber
    - SMS
    - Email
*/

-- Omni-Channel Identities (Identity Stitching)
CREATE TABLE IF NOT EXISTS omni_channel_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  
  -- Channel Info
  channel text NOT NULL CHECK (channel IN ('web', 'messenger', 'whatsapp', 'sms', 'viber', 'instagram', 'email', 'telegram')),
  external_id text NOT NULL,
  
  -- Identity Data
  display_name text,
  profile_pic_url text,
  phone_number text,
  email_address text,
  
  -- Behavioral Fingerprint
  behavioral_signature jsonb DEFAULT '{}'::jsonb,
  device_fingerprint text,
  ip_address inet,
  
  -- Status
  is_verified boolean DEFAULT false,
  is_primary boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  last_message_at timestamptz,
  
  -- Confidence Scores
  identity_confidence numeric DEFAULT 1.0,
  merge_confidence numeric,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, channel, external_id)
);

-- Omni Messages (Unified Storage)
CREATE TABLE IF NOT EXISTS omni_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  session_id uuid,
  identity_id uuid REFERENCES omni_channel_identities(id) ON DELETE SET NULL,
  
  -- Message Details
  channel text NOT NULL CHECK (channel IN ('web', 'messenger', 'whatsapp', 'sms', 'viber', 'instagram', 'email', 'telegram')),
  sender text NOT NULL CHECK (sender IN ('visitor', 'ai', 'human')),
  message text NOT NULL,
  
  -- AI Analysis
  intent text,
  sentiment numeric,
  buying_signals text[] DEFAULT '{}',
  objections_detected text[] DEFAULT '{}',
  emotional_state text,
  urgency_level text,
  
  -- Metadata
  meta jsonb DEFAULT '{}'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  
  -- Status
  read_at timestamptz,
  replied_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Omni-Channel Follow-Ups
CREATE TABLE IF NOT EXISTS omni_channel_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  identity_id uuid REFERENCES omni_channel_identities(id) ON DELETE SET NULL,
  
  -- Channel Strategy
  channel text NOT NULL CHECK (channel IN ('web', 'messenger', 'whatsapp', 'sms', 'viber', 'instagram', 'email', 'telegram')),
  fallback_channel text,
  
  -- Follow-Up Content
  message text NOT NULL,
  sequence_type text DEFAULT 'warm_nurture',
  day_number integer,
  
  -- Scheduling
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  
  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'replied', 'failed', 'cancelled')),
  failure_reason text,
  
  -- Response Tracking
  response_received boolean DEFAULT false,
  response_text text,
  response_sentiment numeric,
  conversion_event boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Omni-Channel Settings
CREATE TABLE IF NOT EXISTS omni_channel_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Enabled Channels
  enabled_channels text[] DEFAULT ARRAY['web', 'email'],
  preferred_channel text DEFAULT 'web',
  
  -- Channel Credentials
  messenger_page_id text,
  messenger_access_token text,
  whatsapp_number text,
  whatsapp_api_key text,
  instagram_account_id text,
  viber_auth_token text,
  sms_provider text,
  sms_api_key text,
  
  -- Auto-Closer Settings
  enable_omni_closer boolean DEFAULT true,
  closer_aggressiveness text DEFAULT 'normal' CHECK (closer_aggressiveness IN ('soft', 'normal', 'strong', 'very_strong')),
  auto_switch_channels boolean DEFAULT true,
  
  -- Follow-Up Strategy
  followup_sequence_length integer DEFAULT 7,
  followup_channel_preference jsonb DEFAULT '{"priority": ["whatsapp", "messenger", "sms", "email"]}'::jsonb,
  
  -- Revival Strategy
  ghosted_revival_enabled boolean DEFAULT true,
  ghosted_threshold_hours integer DEFAULT 48,
  revival_max_attempts integer DEFAULT 5,
  
  -- Urgency & Offers
  enable_urgency_tactics boolean DEFAULT false,
  enable_limited_offers boolean DEFAULT false,
  enable_channel_switching boolean DEFAULT true,
  
  -- Safety
  require_human_approval boolean DEFAULT false,
  escalate_after_failed_attempts integer DEFAULT 3,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prospect Memory Cache (Cross-Channel AI Memory)
CREATE TABLE IF NOT EXISTS prospect_memory_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  
  -- Conversation State
  conversation_stage text DEFAULT 'discovery',
  last_topic text,
  unresolved_objections text[] DEFAULT '{}',
  confirmed_interests text[] DEFAULT '{}',
  
  -- Buying Context
  budget_discussed boolean DEFAULT false,
  budget_range text,
  timeline_discussed boolean DEFAULT false,
  timeline_estimate text,
  authority_level text,
  
  -- Products/Services
  products_asked_about text[] DEFAULT '{}',
  products_interested text[] DEFAULT '{}',
  products_objected text[] DEFAULT '{}',
  
  -- Emotional Profile
  emotional_journey jsonb DEFAULT '[]'::jsonb,
  dominant_emotion text,
  trust_level numeric DEFAULT 0.5,
  engagement_level numeric DEFAULT 0.5,
  
  -- Follow-Up Context
  last_promise text,
  next_expected_action text,
  appointment_requested boolean DEFAULT false,
  payment_link_sent boolean DEFAULT false,
  
  -- Channel Behavior
  preferred_response_time text,
  most_responsive_channel text,
  channel_activity jsonb DEFAULT '{}'::jsonb,
  
  -- Scores
  readiness_score numeric DEFAULT 0.0,
  lifetime_engagement_score numeric DEFAULT 0.0,
  
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Channel Effectiveness Scores
CREATE TABLE IF NOT EXISTS channel_effectiveness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  
  channel text NOT NULL CHECK (channel IN ('web', 'messenger', 'whatsapp', 'sms', 'viber', 'instagram', 'email', 'telegram')),
  
  -- Performance Metrics
  messages_sent integer DEFAULT 0,
  messages_delivered integer DEFAULT 0,
  messages_read integer DEFAULT 0,
  messages_replied integer DEFAULT 0,
  
  -- Engagement Metrics
  avg_response_time_minutes numeric,
  response_rate numeric DEFAULT 0.0,
  engagement_rate numeric DEFAULT 0.0,
  
  -- Conversion Metrics
  appointments_booked integer DEFAULT 0,
  deals_closed integer DEFAULT 0,
  revenue_generated numeric DEFAULT 0.0,
  
  -- Effectiveness Score
  overall_score numeric DEFAULT 0.0,
  
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, prospect_id, channel)
);

-- Identity Merge Log (Audit Trail)
CREATE TABLE IF NOT EXISTS identity_merge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Merge Details
  source_identity_id uuid,
  target_prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  
  -- Merge Signals
  matching_signals jsonb NOT NULL,
  confidence_score numeric NOT NULL,
  merge_method text CHECK (merge_method IN ('automatic', 'manual', 'suggested')),
  
  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_merged')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE omni_channel_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE omni_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE omni_channel_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE omni_channel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_memory_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_effectiveness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_merge_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for omni_channel_identities
CREATE POLICY "Users can view own identities"
  ON omni_channel_identities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own identities"
  ON omni_channel_identities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own identities"
  ON omni_channel_identities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for omni_messages
CREATE POLICY "Users can view own messages"
  ON omni_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON omni_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for omni_channel_followups
CREATE POLICY "Users can view own followups"
  ON omni_channel_followups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own followups"
  ON omni_channel_followups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own followups"
  ON omni_channel_followups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for omni_channel_settings
CREATE POLICY "Users can view own settings"
  ON omni_channel_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON omni_channel_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON omni_channel_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for prospect_memory_cache
CREATE POLICY "Users can view own memory cache"
  ON prospect_memory_cache FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory cache"
  ON prospect_memory_cache FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory cache"
  ON prospect_memory_cache FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for channel_effectiveness_scores
CREATE POLICY "Users can view own effectiveness scores"
  ON channel_effectiveness_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own effectiveness scores"
  ON channel_effectiveness_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own effectiveness scores"
  ON channel_effectiveness_scores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for identity_merge_log
CREATE POLICY "Users can view own merge log"
  ON identity_merge_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own merge log"
  ON identity_merge_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_identities_prospect ON omni_channel_identities(prospect_id);
CREATE INDEX IF NOT EXISTS idx_identities_channel ON omni_channel_identities(user_id, channel);
CREATE INDEX IF NOT EXISTS idx_identities_external ON omni_channel_identities(external_id);
CREATE INDEX IF NOT EXISTS idx_identities_phone ON omni_channel_identities(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_identities_email ON omni_channel_identities(email_address) WHERE email_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_prospect ON omni_messages(prospect_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON omni_messages(user_id, channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session ON omni_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_followups_scheduled ON omni_channel_followups(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_followups_status ON omni_channel_followups(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_followups_prospect ON omni_channel_followups(prospect_id);

CREATE INDEX IF NOT EXISTS idx_memory_prospect ON prospect_memory_cache(prospect_id);
CREATE INDEX IF NOT EXISTS idx_memory_stage ON prospect_memory_cache(conversation_stage);

CREATE INDEX IF NOT EXISTS idx_effectiveness_prospect ON channel_effectiveness_scores(prospect_id);
CREATE INDEX IF NOT EXISTS idx_effectiveness_score ON channel_effectiveness_scores(overall_score DESC);

-- Function: Stitch identities together
CREATE OR REPLACE FUNCTION stitch_identity(
  p_user_id uuid,
  p_identity_id uuid,
  p_prospect_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_merged_count integer;
BEGIN
  UPDATE omni_channel_identities
  SET 
    prospect_id = p_prospect_id,
    updated_at = now()
  WHERE id = p_identity_id AND user_id = p_user_id;

  INSERT INTO identity_merge_log (
    user_id, source_identity_id, target_prospect_id,
    matching_signals, confidence_score, merge_method, status
  ) VALUES (
    p_user_id, p_identity_id, p_prospect_id,
    '{"method": "manual"}'::jsonb, 1.0, 'manual', 'approved'
  );

  SELECT COUNT(*)::integer INTO v_merged_count
  FROM omni_channel_identities
  WHERE prospect_id = p_prospect_id AND user_id = p_user_id;

  v_result := jsonb_build_object(
    'success', true,
    'prospect_id', p_prospect_id,
    'merged_identities', v_merged_count
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Find potential identity matches
CREATE OR REPLACE FUNCTION find_identity_matches(
  p_user_id uuid,
  p_identity_id uuid
)
RETURNS TABLE(
  prospect_id uuid,
  confidence_score numeric,
  matching_signals jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH target AS (
    SELECT * FROM omni_channel_identities WHERE id = p_identity_id
  )
  SELECT 
    i.prospect_id,
    CASE
      WHEN t.phone_number IS NOT NULL AND i.phone_number = t.phone_number THEN 0.95
      WHEN t.email_address IS NOT NULL AND i.email_address = t.email_address THEN 0.90
      WHEN similarity(t.display_name, i.display_name) > 0.8 THEN 0.70
      ELSE 0.50
    END AS confidence_score,
    jsonb_build_object(
      'phone_match', (t.phone_number = i.phone_number),
      'email_match', (t.email_address = i.email_address),
      'name_similarity', similarity(t.display_name, i.display_name)
    ) AS matching_signals
  FROM target t
  CROSS JOIN omni_channel_identities i
  WHERE i.user_id = p_user_id
    AND i.id != p_identity_id
    AND i.prospect_id IS NOT NULL
    AND (
      (t.phone_number IS NOT NULL AND i.phone_number = t.phone_number) OR
      (t.email_address IS NOT NULL AND i.email_address = t.email_address) OR
      similarity(t.display_name, i.display_name) > 0.7
    )
  ORDER BY confidence_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get best channel for prospect
CREATE OR REPLACE FUNCTION get_best_channel_for_prospect(
  p_prospect_id uuid
)
RETURNS text AS $$
DECLARE
  v_best_channel text;
BEGIN
  SELECT channel INTO v_best_channel
  FROM channel_effectiveness_scores
  WHERE prospect_id = p_prospect_id
  ORDER BY overall_score DESC, last_used_at DESC
  LIMIT 1;

  IF v_best_channel IS NULL THEN
    SELECT channel INTO v_best_channel
    FROM omni_channel_identities
    WHERE prospect_id = p_prospect_id
    ORDER BY last_seen DESC
    LIMIT 1;
  END IF;

  RETURN COALESCE(v_best_channel, 'email');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update channel effectiveness
CREATE OR REPLACE FUNCTION update_channel_effectiveness(
  p_user_id uuid,
  p_prospect_id uuid,
  p_channel text,
  p_event_type text
)
RETURNS void AS $$
BEGIN
  INSERT INTO channel_effectiveness_scores (
    user_id, prospect_id, channel, last_used_at
  ) VALUES (
    p_user_id, p_prospect_id, p_channel, now()
  )
  ON CONFLICT (user_id, prospect_id, channel) DO UPDATE
  SET
    messages_sent = channel_effectiveness_scores.messages_sent + CASE WHEN p_event_type = 'sent' THEN 1 ELSE 0 END,
    messages_delivered = channel_effectiveness_scores.messages_delivered + CASE WHEN p_event_type = 'delivered' THEN 1 ELSE 0 END,
    messages_read = channel_effectiveness_scores.messages_read + CASE WHEN p_event_type = 'read' THEN 1 ELSE 0 END,
    messages_replied = channel_effectiveness_scores.messages_replied + CASE WHEN p_event_type = 'replied' THEN 1 ELSE 0 END,
    last_used_at = now(),
    updated_at = now();

  UPDATE channel_effectiveness_scores
  SET 
    response_rate = CASE WHEN messages_sent > 0 THEN messages_replied::numeric / messages_sent ELSE 0 END,
    engagement_rate = CASE WHEN messages_delivered > 0 THEN messages_read::numeric / messages_delivered ELSE 0 END,
    overall_score = (
      (CASE WHEN messages_sent > 0 THEN messages_replied::numeric / messages_sent ELSE 0 END) * 0.5 +
      (CASE WHEN messages_delivered > 0 THEN messages_read::numeric / messages_delivered ELSE 0 END) * 0.3 +
      (CASE WHEN messages_read > 0 THEN 0.2 ELSE 0 END)
    )
  WHERE user_id = p_user_id AND prospect_id = p_prospect_id AND channel = p_channel;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_trgm for name similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;