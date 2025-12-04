/*
  # Adaptive Selling Brain v5.0 - Multi-Agent AI System

  1. New Tables
    - `adaptive_learning_weights` - AI brain learning parameters
    - `multi_agent_logs` - 6-agent conversation tracking
    - `emotional_state_snapshots` - Real-time emotion tracking
    - `behavior_clusters` - Behavioral archetype classifications
    - `pitch_personalization_records` - Hyper-personalized pitch tracking
    - `market_trends` - TrendAI market detection
    - `company_update_history` - Self-updating company intelligence
    - `product_cleaning_records` - Auto-fixer tracking
    - `micro_segments` - Prospect micro-segmentation
    - `offer_match_logs` - Dynamic offer matching v3
    - `weekly_playbooks` - AI-generated weekly insights
    - `agent_performance_signals` - Multi-agent performance tracking

  2. Features
    - 6-agent parallel processing
    - Real-time emotional analysis
    - Adaptive learning every 24 hours
    - Self-updating intelligence
    - Micro-segmentation
    - Weekly AI insights

  3. Security
    - Full RLS on all tables
    - Performance optimizations
    - WebSocket support
*/

-- Adaptive Learning Weights Table
CREATE TABLE IF NOT EXISTS adaptive_learning_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weight_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  weight_key text NOT NULL,
  weight_value float NOT NULL,
  confidence_score float DEFAULT 0.5,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  learning_iteration integer DEFAULT 0,
  context_data jsonb DEFAULT '{}',
  owner_type feeder_owner_type NOT NULL DEFAULT 'system',
  owner_id uuid,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE adaptive_learning_weights ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_weights_entity ON adaptive_learning_weights(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_weights_type ON adaptive_learning_weights(weight_type, weight_key);
CREATE INDEX IF NOT EXISTS idx_weights_confidence ON adaptive_learning_weights(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_weights_owner ON adaptive_learning_weights(owner_type, owner_id);

-- Multi-Agent Logs Table
CREATE TABLE IF NOT EXISTS multi_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  prospect_id uuid,
  agent_name text NOT NULL,
  agent_role text NOT NULL,
  input_data jsonb DEFAULT '{}',
  output_data jsonb DEFAULT '{}',
  decisions_made jsonb DEFAULT '[]',
  confidence_score float DEFAULT 0.0,
  processing_time_ms integer,
  tokens_used integer,
  cost_usd float,
  success boolean,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE multi_agent_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_logs_conv ON multi_agent_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_prospect ON multi_agent_logs(prospect_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON multi_agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON multi_agent_logs(created_at DESC);

-- Emotional State Snapshots Table
CREATE TABLE IF NOT EXISTS emotional_state_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL,
  conversation_id uuid,
  message_id uuid,
  detected_emotions jsonb NOT NULL DEFAULT '{}',
  primary_emotion text,
  emotion_intensity float DEFAULT 0.0,
  buying_intent_score float DEFAULT 0.0,
  hesitation_level float DEFAULT 0.0,
  urgency_score float DEFAULT 0.0,
  skepticism_score float DEFAULT 0.0,
  behavioral_archetype text,
  decision_making_style text,
  communication_preferences jsonb DEFAULT '{}',
  triggers_detected text[] DEFAULT '{}',
  objections_detected text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emotional_state_snapshots ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_emotion_prospect ON emotional_state_snapshots(prospect_id);
CREATE INDEX IF NOT EXISTS idx_emotion_conv ON emotional_state_snapshots(conversation_id);
CREATE INDEX IF NOT EXISTS idx_emotion_primary ON emotional_state_snapshots(primary_emotion);
CREATE INDEX IF NOT EXISTS idx_emotion_intent ON emotional_state_snapshots(buying_intent_score DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_created ON emotional_state_snapshots(created_at DESC);

-- Behavior Clusters Table
CREATE TABLE IF NOT EXISTS behavior_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_name text NOT NULL,
  cluster_type text NOT NULL,
  characteristics jsonb NOT NULL DEFAULT '{}',
  decision_making_pattern text,
  communication_style text,
  typical_objections text[] DEFAULT '{}',
  best_approach_strategies text[] DEFAULT '{}',
  avg_conversion_rate float,
  avg_sales_cycle_days integer,
  recommended_scripts uuid[] DEFAULT '{}',
  member_count integer DEFAULT 0,
  performance_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE behavior_clusters ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_behavior_type ON behavior_clusters(cluster_type);
CREATE INDEX IF NOT EXISTS idx_behavior_conversion ON behavior_clusters(avg_conversion_rate DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_name ON behavior_clusters(cluster_name);

-- Pitch Personalization Records Table
CREATE TABLE IF NOT EXISTS pitch_personalization_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL,
  pitch_deck_id uuid,
  personalization_level text NOT NULL,
  buyer_persona text,
  emotional_profile jsonb DEFAULT '{}',
  adaptations_made jsonb DEFAULT '[]',
  slides_modified jsonb DEFAULT '{}',
  tone_adjustments text[] DEFAULT '{}',
  content_emphasis text[] DEFAULT '{}',
  objections_addressed text[] DEFAULT '{}',
  success_metrics jsonb DEFAULT '{}',
  viewed boolean DEFAULT false,
  downloaded boolean DEFAULT false,
  converted boolean DEFAULT false,
  feedback_score float,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pitch_personalization_records ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pitch_pers_prospect ON pitch_personalization_records(prospect_id);
CREATE INDEX IF NOT EXISTS idx_pitch_pers_deck ON pitch_personalization_records(pitch_deck_id);
CREATE INDEX IF NOT EXISTS idx_pitch_pers_level ON pitch_personalization_records(personalization_level);
CREATE INDEX IF NOT EXISTS idx_pitch_pers_converted ON pitch_personalization_records(converted);

-- Market Trends Table
CREATE TABLE IF NOT EXISTS market_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_type text NOT NULL,
  trend_category text,
  trend_name text NOT NULL,
  trend_description text,
  industry text,
  detected_keywords text[] DEFAULT '{}',
  engagement_score float DEFAULT 0.0,
  growth_rate float,
  peak_intensity float,
  geographic_focus text[] DEFAULT '{}',
  affected_products uuid[] DEFAULT '{}',
  affected_industries text[] DEFAULT '{}',
  recommended_actions jsonb DEFAULT '[]',
  data_sources text[] DEFAULT '{}',
  confidence_level float DEFAULT 0.0,
  trend_status text DEFAULT 'emerging',
  first_detected_at timestamptz DEFAULT now(),
  last_updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE market_trends ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_trends_type ON market_trends(trend_type);
CREATE INDEX IF NOT EXISTS idx_trends_category ON market_trends(trend_category);
CREATE INDEX IF NOT EXISTS idx_trends_industry ON market_trends(industry);
CREATE INDEX IF NOT EXISTS idx_trends_status ON market_trends(trend_status);
CREATE INDEX IF NOT EXISTS idx_trends_engagement ON market_trends(engagement_score DESC);

-- Company Update History Table
CREATE TABLE IF NOT EXISTS company_update_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  update_type text NOT NULL,
  changes_detected jsonb NOT NULL DEFAULT '{}',
  before_snapshot jsonb DEFAULT '{}',
  after_snapshot jsonb DEFAULT '{}',
  change_significance text,
  auto_applied boolean DEFAULT false,
  requires_review boolean DEFAULT false,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  crawl_source text,
  confidence_score float DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE company_update_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_company_update_company ON company_update_history(company_id);
CREATE INDEX IF NOT EXISTS idx_company_update_type ON company_update_history(update_type);
CREATE INDEX IF NOT EXISTS idx_company_update_review ON company_update_history(requires_review);
CREATE INDEX IF NOT EXISTS idx_company_update_created ON company_update_history(created_at DESC);

-- Product Cleaning Records Table
CREATE TABLE IF NOT EXISTS product_cleaning_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  cleaning_type text NOT NULL,
  issues_detected text[] DEFAULT '{}',
  before_data jsonb DEFAULT '{}',
  after_data jsonb DEFAULT '{}',
  improvements_made text[] DEFAULT '{}',
  quality_score_before float,
  quality_score_after float,
  auto_applied boolean DEFAULT false,
  requires_review boolean DEFAULT false,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  confidence_score float DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_cleaning_records ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_product_clean_product ON product_cleaning_records(product_id);
CREATE INDEX IF NOT EXISTS idx_product_clean_type ON product_cleaning_records(cleaning_type);
CREATE INDEX IF NOT EXISTS idx_product_clean_review ON product_cleaning_records(requires_review);
CREATE INDEX IF NOT EXISTS idx_product_clean_quality ON product_cleaning_records(quality_score_after DESC);

-- Micro Segments Table
CREATE TABLE IF NOT EXISTS micro_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_name text NOT NULL,
  segment_type text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '{}',
  characteristics jsonb DEFAULT '{}',
  member_prospects uuid[] DEFAULT '{}',
  member_count integer DEFAULT 0,
  custom_scripts uuid[] DEFAULT '{}',
  custom_message_flows jsonb DEFAULT '[]',
  custom_follow_ups jsonb DEFAULT '[]',
  recommended_angles text[] DEFAULT '{}',
  avg_conversion_rate float,
  avg_response_rate float,
  performance_metrics jsonb DEFAULT '{}',
  owner_type feeder_owner_type NOT NULL DEFAULT 'system',
  owner_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE micro_segments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_micro_seg_type ON micro_segments(segment_type);
CREATE INDEX IF NOT EXISTS idx_micro_seg_owner ON micro_segments(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_micro_seg_conversion ON micro_segments(avg_conversion_rate DESC);
CREATE INDEX IF NOT EXISTS idx_micro_seg_members ON micro_segments USING gin(member_prospects);

-- Offer Match Logs Table
CREATE TABLE IF NOT EXISTS offer_match_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL,
  product_id uuid NOT NULL,
  match_score float NOT NULL,
  match_factors jsonb DEFAULT '{}',
  emotional_state jsonb DEFAULT '{}',
  behavioral_data jsonb DEFAULT '{}',
  competitor_context jsonb DEFAULT '{}',
  conversation_patterns jsonb DEFAULT '{}',
  recommended_pitch text,
  recommended_emotional_hook text,
  recommended_cta text,
  match_timestamp timestamptz DEFAULT now(),
  accepted boolean,
  converted boolean,
  feedback_score float
);

ALTER TABLE offer_match_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_offer_match_prospect ON offer_match_logs(prospect_id);
CREATE INDEX IF NOT EXISTS idx_offer_match_product ON offer_match_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_offer_match_score ON offer_match_logs(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_offer_match_converted ON offer_match_logs(converted);

-- Weekly Playbooks Table
CREATE TABLE IF NOT EXISTS weekly_playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  playbook_type text NOT NULL,
  industry text,
  top_performing_scripts jsonb DEFAULT '[]',
  top_closing_angles jsonb DEFAULT '[]',
  top_objections_responses jsonb DEFAULT '{}',
  best_follow_up_sequences jsonb DEFAULT '[]',
  best_product_hooks jsonb DEFAULT '[]',
  trending_topics text[] DEFAULT '{}',
  engagement_insights jsonb DEFAULT '{}',
  conversion_insights jsonb DEFAULT '{}',
  recommendations jsonb DEFAULT '[]',
  data_sources jsonb DEFAULT '{}',
  generated_at timestamptz DEFAULT now(),
  owner_type feeder_owner_type NOT NULL DEFAULT 'system',
  owner_id uuid
);

ALTER TABLE weekly_playbooks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_weekly_pb_week ON weekly_playbooks(week_start_date, week_end_date);
CREATE INDEX IF NOT EXISTS idx_weekly_pb_type ON weekly_playbooks(playbook_type);
CREATE INDEX IF NOT EXISTS idx_weekly_pb_industry ON weekly_playbooks(industry);
CREATE INDEX IF NOT EXISTS idx_weekly_pb_owner ON weekly_playbooks(owner_type, owner_id);

-- Agent Performance Signals Table
CREATE TABLE IF NOT EXISTS agent_performance_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  signal_type text NOT NULL,
  metric_name text NOT NULL,
  metric_value float NOT NULL,
  context_data jsonb DEFAULT '{}',
  success_indicator boolean,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE agent_performance_signals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_perf_agent ON agent_performance_signals(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_perf_type ON agent_performance_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_agent_perf_timestamp ON agent_performance_signals(timestamp DESC);

-- RLS Policies

-- Adaptive Learning Weights
CREATE POLICY "System can manage learning weights"
  ON adaptive_learning_weights FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Multi-Agent Logs
CREATE POLICY "Users can view their agent logs"
  ON multi_agent_logs FOR SELECT
  TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert agent logs"
  ON multi_agent_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Emotional State Snapshots
CREATE POLICY "Users can view their emotional snapshots"
  ON emotional_state_snapshots FOR SELECT
  TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage emotional snapshots"
  ON emotional_state_snapshots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Behavior Clusters
CREATE POLICY "Users can view behavior clusters"
  ON behavior_clusters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage behavior clusters"
  ON behavior_clusters FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Pitch Personalization Records
CREATE POLICY "Users can view their pitch records"
  ON pitch_personalization_records FOR SELECT
  TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage pitch records"
  ON pitch_personalization_records FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Market Trends
CREATE POLICY "Users can view market trends"
  ON market_trends FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage market trends"
  ON market_trends FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Company Update History
CREATE POLICY "Users can view company updates"
  ON company_update_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage company updates"
  ON company_update_history FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Product Cleaning Records
CREATE POLICY "Users can view product cleaning"
  ON product_cleaning_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage product cleaning"
  ON product_cleaning_records FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Micro Segments
CREATE POLICY "Users can view micro segments"
  ON micro_segments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage micro segments"
  ON micro_segments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

-- Offer Match Logs
CREATE POLICY "Users can view their match logs"
  ON offer_match_logs FOR SELECT
  TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert match logs"
  ON offer_match_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Weekly Playbooks
CREATE POLICY "Users can view weekly playbooks"
  ON weekly_playbooks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage weekly playbooks"
  ON weekly_playbooks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Agent Performance Signals
CREATE POLICY "System can manage agent signals"
  ON agent_performance_signals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Functions

-- Update learning weights based on success/failure
CREATE OR REPLACE FUNCTION update_learning_weight(
  p_weight_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_weight_key text,
  p_success boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_weight float;
  v_new_weight float;
  v_adjustment float := 0.05;
BEGIN
  SELECT weight_value INTO v_current_weight
  FROM adaptive_learning_weights
  WHERE weight_type = p_weight_type
    AND entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND weight_key = p_weight_key;

  IF v_current_weight IS NULL THEN
    v_current_weight := 0.5;
  END IF;

  IF p_success THEN
    v_new_weight := LEAST(1.0, v_current_weight + v_adjustment);
    
    UPDATE adaptive_learning_weights
    SET weight_value = v_new_weight,
        confidence_score = LEAST(1.0, confidence_score + 0.02),
        success_count = success_count + 1,
        last_success_at = now(),
        learning_iteration = learning_iteration + 1,
        updated_at = now()
    WHERE weight_type = p_weight_type
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND weight_key = p_weight_key;
  ELSE
    v_new_weight := GREATEST(0.0, v_current_weight - v_adjustment);
    
    UPDATE adaptive_learning_weights
    SET weight_value = v_new_weight,
        confidence_score = GREATEST(0.0, confidence_score - 0.02),
        failure_count = failure_count + 1,
        last_failure_at = now(),
        learning_iteration = learning_iteration + 1,
        updated_at = now()
    WHERE weight_type = p_weight_type
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND weight_key = p_weight_key;
  END IF;

  IF NOT FOUND THEN
    INSERT INTO adaptive_learning_weights (
      weight_type, entity_type, entity_id, weight_key,
      weight_value, confidence_score,
      success_count, failure_count,
      last_success_at, last_failure_at,
      learning_iteration
    ) VALUES (
      p_weight_type, p_entity_type, p_entity_id, p_weight_key,
      v_new_weight, 0.5,
      CASE WHEN p_success THEN 1 ELSE 0 END,
      CASE WHEN p_success THEN 0 ELSE 1 END,
      CASE WHEN p_success THEN now() ELSE NULL END,
      CASE WHEN p_success THEN NULL ELSE now() END,
      1
    );
  END IF;
END;
$$;
