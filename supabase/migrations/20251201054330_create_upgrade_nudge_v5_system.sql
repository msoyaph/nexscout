/*
  # NexScout Upgrade Nudge System v5.0

  1. New Tables
    - `nudge_intent_predictions` - AI-powered upgrade intent scoring
    - `flash_offer_events` - 60-180s flash upgrade offers
    - `social_proof_messages` - Filipino psychology-based social proof
    - `daily_deals` - AI-generated personalized daily deals
    - `emotional_tone_matches` - Emotion → Offer tone mapping
    - `growth_momentum_tracking` - User growth velocity tracking
    - `chatbot_upsell_conversations` - In-chat upgrade suggestions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Functions
    - calculate_intent_score() - Predict upgrade likelihood
    - generate_flash_offer() - Create time-limited offers
    - get_social_proof_message() - Fetch relevant social proof
*/

-- Intent Predictions Table
CREATE TABLE IF NOT EXISTS nudge_intent_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_score numeric(5,2) DEFAULT 0,
  emotional_state text,
  usage_profile jsonb DEFAULT '{}'::jsonb,
  predicted_offer text,
  confidence_level numeric(3,2) DEFAULT 0,
  factors jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intent_predictions_user_id ON nudge_intent_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_intent_predictions_score ON nudge_intent_predictions(intent_score DESC);

-- Flash Offer Events Table
CREATE TABLE IF NOT EXISTS flash_offer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_type text NOT NULL,
  original_price numeric NOT NULL,
  offer_amount numeric NOT NULL,
  discount_percentage numeric,
  trigger_reason text,
  emotional_context text,
  duration_seconds integer DEFAULT 60,
  expires_at timestamptz NOT NULL,
  shown_at timestamptz DEFAULT now(),
  clicked_at timestamptz,
  accepted boolean DEFAULT false,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flash_offers_user_id ON flash_offer_events(user_id);
CREATE INDEX IF NOT EXISTS idx_flash_offers_expires ON flash_offer_events(expires_at);
CREATE INDEX IF NOT EXISTS idx_flash_offers_accepted ON flash_offer_events(accepted);

-- Social Proof Messages Table
CREATE TABLE IF NOT EXISTS social_proof_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_segment text NOT NULL,
  message_type text NOT NULL,
  message text NOT NULL,
  message_tagalog text,
  priority integer DEFAULT 1,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_proof_segment ON social_proof_messages(audience_segment);
CREATE INDEX IF NOT EXISTS idx_social_proof_active ON social_proof_messages(is_active);

-- Daily Deals Table
CREATE TABLE IF NOT EXISTS daily_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  original_price numeric NOT NULL,
  deal_price numeric NOT NULL,
  discount numeric NOT NULL,
  reason text,
  valid_until timestamptz NOT NULL,
  shown_at timestamptz,
  clicked_at timestamptz,
  accepted boolean DEFAULT false,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_deals_user_id ON daily_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_deals_valid ON daily_deals(valid_until);
CREATE INDEX IF NOT EXISTS idx_daily_deals_accepted ON daily_deals(accepted);

-- Emotional Tone Matches Table
CREATE TABLE IF NOT EXISTS emotional_tone_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emotional_state text NOT NULL UNIQUE,
  tone_descriptor text NOT NULL,
  copy_style text NOT NULL,
  urgency_level text NOT NULL,
  color_scheme jsonb DEFAULT '{}'::jsonb,
  example_copies jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Growth Momentum Tracking Table
CREATE TABLE IF NOT EXISTS growth_momentum_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  current_value numeric DEFAULT 0,
  previous_value numeric DEFAULT 0,
  growth_rate numeric DEFAULT 0,
  velocity_score numeric DEFAULT 0,
  tracked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_momentum_user_id ON growth_momentum_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_momentum_metric ON growth_momentum_tracking(metric_name);

-- Chatbot Upsell Conversations Table
CREATE TABLE IF NOT EXISTS chatbot_upsell_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid,
  trigger_feature text NOT NULL,
  upsell_message text NOT NULL,
  user_response text,
  accepted boolean DEFAULT false,
  emotional_tone text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_upsell_user_id ON chatbot_upsell_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_upsell_accepted ON chatbot_upsell_conversations(accepted);

-- Enable RLS
ALTER TABLE nudge_intent_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_offer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_proof_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_tone_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_momentum_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_upsell_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own intent predictions" ON nudge_intent_predictions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert intent predictions" ON nudge_intent_predictions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view own flash offers" ON flash_offer_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert flash offers" ON flash_offer_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own flash offers" ON flash_offer_events FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active social proof" ON social_proof_messages FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Users can view own daily deals" ON daily_deals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert daily deals" ON daily_deals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own daily deals" ON daily_deals FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view emotional tone matches" ON emotional_tone_matches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own growth momentum" ON growth_momentum_tracking FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert growth momentum" ON growth_momentum_tracking FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view own chatbot upsells" ON chatbot_upsell_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert chatbot upsells" ON chatbot_upsell_conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own chatbot upsells" ON chatbot_upsell_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Function: Calculate Intent Score
CREATE OR REPLACE FUNCTION calculate_intent_score(
  p_user_id uuid,
  p_days_active integer,
  p_feature_usage jsonb,
  p_emotional_state text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score numeric := 0;
  v_activity_score numeric := 0;
  v_feature_score numeric := 0;
  v_emotional_score numeric := 0;
BEGIN
  v_activity_score := LEAST(p_days_active * 3, 30);
  v_feature_score := LEAST(
    (p_feature_usage->>'total_scans')::numeric * 2 +
    (p_feature_usage->>'total_messages')::numeric * 1.5 +
    (p_feature_usage->>'energy_usage')::numeric * 0.5,
    40
  );
  v_emotional_score := CASE p_emotional_state
    WHEN 'excited' THEN 25 WHEN 'confident' THEN 20 WHEN 'momentum' THEN 25
    WHEN 'eager' THEN 20 WHEN 'curious' THEN 15 WHEN 'frustrated' THEN 10
    WHEN 'overwhelmed' THEN 5 ELSE 10
  END;
  v_score := v_activity_score + v_feature_score + v_emotional_score;
  RETURN LEAST(v_score, 100);
END;
$$;

-- Function: Generate Flash Offer
CREATE OR REPLACE FUNCTION generate_flash_offer(
  p_user_id uuid,
  p_base_price numeric,
  p_trigger_reason text,
  p_duration_seconds integer DEFAULT 60
)
RETURNS TABLE(offer_id uuid, offer_price numeric, discount_percentage numeric, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer_id uuid;
  v_discount numeric;
  v_offer_price numeric;
  v_expires_at timestamptz;
BEGIN
  v_discount := CASE
    WHEN p_trigger_reason = 'energy_depleted' THEN 25
    WHEN p_trigger_reason = 'surge_activity' THEN 30
    WHEN p_trigger_reason = 'hot_lead_detected' THEN 20
    WHEN p_trigger_reason = 'feature_blocked' THEN 15
    ELSE 10
  END;
  v_offer_price := p_base_price * (1 - v_discount / 100.0);
  v_expires_at := now() + (p_duration_seconds || ' seconds')::interval;
  INSERT INTO flash_offer_events (user_id, offer_type, original_price, offer_amount, discount_percentage, trigger_reason, duration_seconds, expires_at)
  VALUES (p_user_id, 'flash_upgrade', p_base_price, v_offer_price, v_discount, p_trigger_reason, p_duration_seconds, v_expires_at)
  RETURNING id INTO v_offer_id;
  RETURN QUERY SELECT v_offer_id, v_offer_price, v_discount, v_expires_at;
END;
$$;

-- Function: Get Social Proof Message
CREATE OR REPLACE FUNCTION get_social_proof_message(p_audience_segment text)
RETURNS TABLE(message text, message_tagalog text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT spm.message, spm.message_tagalog
  FROM social_proof_messages spm
  WHERE spm.audience_segment = p_audience_segment AND spm.is_active = true
  ORDER BY spm.priority DESC, RANDOM()
  LIMIT 1;
  UPDATE social_proof_messages SET usage_count = usage_count + 1
  WHERE audience_segment = p_audience_segment AND is_active = true;
END;
$$;

-- Seed Data
INSERT INTO emotional_tone_matches (emotional_state, tone_descriptor, copy_style, urgency_level, color_scheme, example_copies) VALUES
('excited', 'Enthusiastic', 'High energy', 'high', '{"primary": "#FF6B00"}'::jsonb, '["You''re on fire!"]'::jsonb),
('frustrated', 'Empathetic', 'Solution-focused', 'medium', '{"primary": "#4A90E2"}'::jsonb, '["Let me help"]'::jsonb),
('curious', 'Educational', 'Informative', 'low', '{"primary": "#9013FE"}'::jsonb, '["Discover more"]'::jsonb),
('confident', 'Empowering', 'Achievement', 'medium', '{"primary": "#417505"}'::jsonb, '["Level up"]'::jsonb),
('momentum', 'Victory', 'Winning', 'high', '{"primary": "#F5A623"}'::jsonb, '["Keep winning!"]'::jsonb)
ON CONFLICT (emotional_state) DO NOTHING;

INSERT INTO social_proof_messages (audience_segment, message_type, message, message_tagalog, priority) VALUES
('filipino_agents', 'conversion', '23,487 Filipino agents unlocked PRO this month', '23,487 Filipino agents nag-unlock ng PRO', 10),
('filipino_agents', 'social', 'Top earners use PRO for auto-closing', 'Mga top earners gumagamit ng PRO', 9),
('new_users', 'milestone', 'Most PRO users upgraded after 4th scan', 'Karamihan nag-upgrade after 4th scan', 8)
ON CONFLICT DO NOTHING;
