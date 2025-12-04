/*
  # Public AI Chatbot v5.0 - Adaptive Human Shadow Mode

  1. New Tables
    - `shadow_learning_profiles` - Learn from top closers
    - `top_closer_rankings` - Identify best performers
    - `conversion_path_predictions` - Predict customer journey
    - `ai_persona_modes` - Multiple AI personalities
    - `channel_orchestration_history` - Track multi-channel sequences
    - `closing_stage_progressions` - Multi-stage closing tracking
    - `style_matching_vectors` - Match AI style to customer preference
    - `adaptive_follow_up_sequences` - Dynamic follow-up rules
    - `persona_continuity_memory` - Remember preferences across conversations

  2. Adaptive Features
    - Shadow learning from best closers
    - Dynamic persona switching
    - Conversion path forecasting
    - Multi-channel orchestration
    - 10-stage closing intelligence
    - Style & tone adaptation
    - Predictive sales scoring
    - Cultural & linguistic adaptation

  3. Safety & Ethics
    - Anti-manipulation guardrails
    - Consent management
    - Spam prevention
    - Human override capability
    - Industry-specific disclaimers
*/

-- Shadow Learning Profiles
CREATE TABLE IF NOT EXISTS shadow_learning_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Learning Source
  learned_from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  learned_from_sessions text[] DEFAULT '{}',
  
  -- Training Data
  training_data jsonb DEFAULT '{}'::jsonb,
  total_samples integer DEFAULT 0,
  success_rate numeric DEFAULT 0.0,
  
  -- Style Analysis
  style_vector jsonb DEFAULT '{}'::jsonb,
  tone_signature jsonb DEFAULT '{
    "formality": 0.5,
    "enthusiasm": 0.7,
    "directness": 0.6,
    "empathy": 0.8,
    "urgency": 0.5
  }'::jsonb,
  
  -- Patterns
  closing_patterns jsonb DEFAULT '[]'::jsonb,
  objection_patterns jsonb DEFAULT '[]'::jsonb,
  greeting_patterns jsonb DEFAULT '[]'::jsonb,
  follow_up_patterns jsonb DEFAULT '[]'::jsonb,
  
  -- Language & Cultural
  language_preference text DEFAULT 'taglish',
  cultural_markers text[] DEFAULT '{}',
  regional_dialect text,
  
  -- Performance Metrics
  avg_messages_to_close numeric,
  avg_response_time_seconds numeric,
  preferred_channels text[] DEFAULT '{}',
  best_times_of_day text[] DEFAULT '{}',
  
  -- Status
  is_active boolean DEFAULT true,
  confidence_score numeric DEFAULT 0.0,
  
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Top Closer Rankings
CREATE TABLE IF NOT EXISTS top_closer_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Performance Scores
  overall_score numeric DEFAULT 0.0,
  win_rate numeric DEFAULT 0.0,
  conversion_rate numeric DEFAULT 0.0,
  
  -- Speed Metrics
  avg_response_time_seconds numeric,
  avg_time_to_qualify_minutes numeric,
  avg_time_to_close_days numeric,
  
  -- Volume Metrics
  total_conversations integer DEFAULT 0,
  total_qualified integer DEFAULT 0,
  total_closed integer DEFAULT 0,
  total_revenue numeric DEFAULT 0.0,
  
  -- Quality Metrics
  customer_satisfaction_score numeric DEFAULT 0.0,
  objection_resolution_rate numeric DEFAULT 0.0,
  follow_up_effectiveness numeric DEFAULT 0.0,
  
  -- Style Characteristics
  signature_strengths text[] DEFAULT '{}',
  unique_techniques text[] DEFAULT '{}',
  
  -- Ranking
  rank_position integer,
  rank_tier text CHECK (rank_tier IN ('platinum', 'gold', 'silver', 'bronze', 'rookie')),
  
  -- Time Period
  period_start timestamptz,
  period_end timestamptz,
  
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, period_start)
);

-- Conversion Path Predictions
CREATE TABLE IF NOT EXISTS conversion_path_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  session_id uuid,
  
  -- Current State
  current_stage text NOT NULL,
  current_buying_intent numeric DEFAULT 0.0,
  current_engagement_level numeric DEFAULT 0.0,
  
  -- Predictions
  predicted_next_stage text,
  predicted_close_probability numeric,
  predicted_days_to_close numeric,
  predicted_touchpoints_needed integer,
  
  -- Recommendations
  recommended_channel text CHECK (recommended_channel IN (
    'web', 'messenger', 'whatsapp', 'sms', 'viber', 'instagram', 'email', 'telegram', 'voice'
  )),
  recommended_tone text CHECK (recommended_tone IN (
    'formal', 'casual', 'enthusiastic', 'empathetic', 'urgent', 'consultative', 'friendly'
  )),
  recommended_message_type text CHECK (recommended_message_type IN (
    'question', 'value_prop', 'social_proof', 'urgency', 'objection_handler', 'closing_cta', 'follow_up'
  )),
  recommended_message text,
  
  -- Timing
  recommended_contact_time timestamptz,
  optimal_day_of_week text,
  optimal_time_of_day text,
  
  -- Confidence
  prediction_confidence numeric DEFAULT 0.0,
  model_version text DEFAULT 'v1',
  
  -- Factors
  key_signals jsonb DEFAULT '[]'::jsonb,
  risk_factors jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- AI Persona Modes
CREATE TABLE IF NOT EXISTS ai_persona_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Persona Details
  persona_name text NOT NULL,
  persona_description text,
  persona_category text CHECK (persona_category IN (
    'closer', 'consultant', 'advisor', 'motivator', 'technical', 'support', 'custom'
  )),
  
  -- Behavior Rules
  persona_rules jsonb DEFAULT '{}'::jsonb,
  
  -- Tone Profile
  tone_profile jsonb DEFAULT '{
    "formality": 0.5,
    "enthusiasm": 0.7,
    "directness": 0.6,
    "empathy": 0.8,
    "urgency": 0.5,
    "technical_depth": 0.5
  }'::jsonb,
  
  -- Communication Style
  greeting_style text,
  question_style text,
  objection_style text,
  closing_style text,
  
  -- Language & Culture
  primary_language text DEFAULT 'taglish',
  formality_level text CHECK (formality_level IN ('very_formal', 'formal', 'neutral', 'casual', 'very_casual')),
  cultural_context text,
  
  -- Use Cases
  best_for_industries text[] DEFAULT '{}',
  best_for_buyer_types text[] DEFAULT '{}',
  best_for_channels text[] DEFAULT '{}',
  
  -- Activation
  active boolean DEFAULT false,
  auto_switch_enabled boolean DEFAULT true,
  switch_triggers jsonb DEFAULT '[]'::jsonb,
  
  -- Performance
  usage_count integer DEFAULT 0,
  success_rate numeric DEFAULT 0.0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Channel Orchestration History
CREATE TABLE IF NOT EXISTS channel_orchestration_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  
  -- Sequence Info
  sequence_id uuid DEFAULT gen_random_uuid(),
  sequence_position integer,
  
  -- Channel Details
  channel text NOT NULL CHECK (channel IN (
    'web', 'messenger', 'whatsapp', 'sms', 'viber', 'instagram', 'email', 'telegram', 'voice'
  )),
  previous_channel text,
  switch_reason text,
  
  -- Message Info
  message_sent text,
  message_type text,
  tone_used text,
  
  -- Outcome
  delivered boolean DEFAULT false,
  opened boolean DEFAULT false,
  replied boolean DEFAULT false,
  conversion_achieved boolean DEFAULT false,
  
  -- Timing
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  replied_at timestamptz,
  
  -- Effectiveness
  effectiveness_score numeric DEFAULT 0.0,
  
  created_at timestamptz DEFAULT now()
);

-- Closing Stage Progressions
CREATE TABLE IF NOT EXISTS closing_stage_progressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  session_id uuid,
  
  -- 10-Stage Closing Framework
  current_stage text NOT NULL CHECK (current_stage IN (
    'interest_spark',
    'believability_boost',
    'need_amplification',
    'solution_alignment',
    'objection_disarmament',
    'urgency_trigger',
    'closing_cta',
    'follow_up_push',
    'appointment_booking',
    'documentation_signup'
  )),
  previous_stage text,
  
  -- Stage Progress
  stage_score numeric DEFAULT 0.0,
  stage_completed boolean DEFAULT false,
  
  -- Actions Taken
  messages_in_stage integer DEFAULT 0,
  touchpoints_in_stage integer DEFAULT 0,
  
  -- Timing
  stage_entered_at timestamptz DEFAULT now(),
  stage_exited_at timestamptz,
  stage_duration_seconds integer,
  
  -- Outcome
  progressed_forward boolean,
  regressed_backward boolean,
  stalled boolean DEFAULT false,
  
  -- Next Actions
  recommended_next_action text,
  
  created_at timestamptz DEFAULT now()
);

-- Style Matching Vectors
CREATE TABLE IF NOT EXISTS style_matching_vectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  
  -- Customer Style Profile
  customer_style_vector jsonb DEFAULT '{}'::jsonb,
  
  -- Preferences
  preferred_formality numeric DEFAULT 0.5,
  preferred_message_length text CHECK (preferred_message_length IN ('short', 'medium', 'long')),
  preferred_emoji_usage numeric DEFAULT 0.5,
  preferred_response_speed text CHECK (preferred_response_speed IN ('immediate', 'quick', 'normal', 'slow')),
  
  -- Communication Patterns
  responds_best_to text[] DEFAULT '{}',
  dislikes text[] DEFAULT '{}',
  
  -- Cultural Markers
  language_detected text,
  cultural_context text,
  regional_indicators text[] DEFAULT '{}',
  
  -- Matched AI Style
  matched_persona_id uuid REFERENCES ai_persona_modes(id) ON DELETE SET NULL,
  match_confidence numeric DEFAULT 0.0,
  
  -- Learning
  samples_analyzed integer DEFAULT 0,
  last_analyzed timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adaptive Follow-Up Sequences
CREATE TABLE IF NOT EXISTS adaptive_follow_up_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  
  -- Sequence Config
  sequence_name text,
  sequence_type text CHECK (sequence_type IN (
    'warm_nurture', 'hot_closer', 'cold_revival', 'objection_handler', 'custom'
  )),
  
  -- Adaptive Parameters
  tone_progression text[] DEFAULT '{}',
  channel_progression text[] DEFAULT '{}',
  message_length_progression text[] DEFAULT '{}',
  urgency_progression numeric[] DEFAULT '{}',
  
  -- Timing Strategy
  day_intervals integer[] DEFAULT '{}',
  optimal_times text[] DEFAULT '{}',
  
  -- Current State
  current_step integer DEFAULT 1,
  total_steps integer,
  
  -- Performance
  open_rate numeric DEFAULT 0.0,
  reply_rate numeric DEFAULT 0.0,
  conversion_rate numeric DEFAULT 0.0,
  
  -- Status
  is_active boolean DEFAULT true,
  paused_at timestamptz,
  completed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Persona Continuity Memory
CREATE TABLE IF NOT EXISTS persona_continuity_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  
  -- Continuity Context
  established_relationship_type text,
  conversation_history_summary text,
  
  -- Agent Behavior Memory
  previous_agent_persona text,
  agent_name_used text,
  agent_tone_established text,
  
  -- Customer Preferences
  customer_prefers_formality boolean,
  customer_likes_humor boolean,
  customer_responds_to_urgency boolean,
  customer_needs_details boolean,
  
  -- Cultural Context
  language_preference text,
  cultural_nuances jsonb DEFAULT '[]'::jsonb,
  regional_context text,
  
  -- Topic Memory
  topics_discussed text[] DEFAULT '{}',
  interests_mentioned text[] DEFAULT '{}',
  concerns_raised text[] DEFAULT '{}',
  preferences_stated text[] DEFAULT '{}',
  
  -- Relationship Markers
  trust_level numeric DEFAULT 0.5,
  rapport_score numeric DEFAULT 0.5,
  familiarity_level text CHECK (familiarity_level IN ('stranger', 'acquaintance', 'friend', 'trusted_advisor')),
  
  -- Consistency Rules
  maintain_persona boolean DEFAULT true,
  maintain_tone boolean DEFAULT true,
  maintain_language boolean DEFAULT true,
  
  last_interaction timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE shadow_learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_closer_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_path_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_persona_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_orchestration_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_stage_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_matching_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_follow_up_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_continuity_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shadow_learning_profiles
CREATE POLICY "Users can view own learning profiles"
  ON shadow_learning_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning profiles"
  ON shadow_learning_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning profiles"
  ON shadow_learning_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for top_closer_rankings
CREATE POLICY "Users can view own rankings"
  ON top_closer_rankings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rankings"
  ON top_closer_rankings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for conversion_path_predictions
CREATE POLICY "Users can view own predictions"
  ON conversion_path_predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
  ON conversion_path_predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_persona_modes
CREATE POLICY "Users can view own personas"
  ON ai_persona_modes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personas"
  ON ai_persona_modes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personas"
  ON ai_persona_modes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own personas"
  ON ai_persona_modes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for channel_orchestration_history
CREATE POLICY "Users can view own orchestration"
  ON channel_orchestration_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orchestration"
  ON channel_orchestration_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for closing_stage_progressions
CREATE POLICY "Users can view own progressions"
  ON closing_stage_progressions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progressions"
  ON closing_stage_progressions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progressions"
  ON closing_stage_progressions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for style_matching_vectors
CREATE POLICY "Users can view own vectors"
  ON style_matching_vectors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vectors"
  ON style_matching_vectors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vectors"
  ON style_matching_vectors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for adaptive_follow_up_sequences
CREATE POLICY "Users can view own sequences"
  ON adaptive_follow_up_sequences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sequences"
  ON adaptive_follow_up_sequences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sequences"
  ON adaptive_follow_up_sequences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for persona_continuity_memory
CREATE POLICY "Users can view own continuity"
  ON persona_continuity_memory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own continuity"
  ON persona_continuity_memory FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own continuity"
  ON persona_continuity_memory FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shadow_user ON shadow_learning_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_shadow_learned_from ON shadow_learning_profiles(learned_from_user_id);
CREATE INDEX IF NOT EXISTS idx_shadow_active ON shadow_learning_profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_rankings_user ON top_closer_rankings(user_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_rankings_score ON top_closer_rankings(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_rankings_tier ON top_closer_rankings(rank_tier);

CREATE INDEX IF NOT EXISTS idx_predictions_prospect ON conversion_path_predictions(prospect_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_probability ON conversion_path_predictions(predicted_close_probability DESC);

CREATE INDEX IF NOT EXISTS idx_personas_user ON ai_persona_modes(user_id, active);
CREATE INDEX IF NOT EXISTS idx_personas_category ON ai_persona_modes(persona_category);

CREATE INDEX IF NOT EXISTS idx_orchestration_prospect ON channel_orchestration_history(prospect_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_orchestration_sequence ON channel_orchestration_history(sequence_id);

CREATE INDEX IF NOT EXISTS idx_progressions_prospect ON closing_stage_progressions(prospect_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progressions_stage ON closing_stage_progressions(current_stage);

CREATE INDEX IF NOT EXISTS idx_style_prospect ON style_matching_vectors(prospect_id);
CREATE INDEX IF NOT EXISTS idx_style_persona ON style_matching_vectors(matched_persona_id);

CREATE INDEX IF NOT EXISTS idx_followup_prospect ON adaptive_follow_up_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_followup_active ON adaptive_follow_up_sequences(is_active);

CREATE INDEX IF NOT EXISTS idx_continuity_prospect ON persona_continuity_memory(prospect_id);
CREATE INDEX IF NOT EXISTS idx_continuity_user ON persona_continuity_memory(user_id);

-- Function: Predict conversion path
CREATE OR REPLACE FUNCTION predict_conversion_path(
  p_user_id uuid,
  p_prospect_id uuid,
  p_current_stage text,
  p_buying_intent numeric,
  p_engagement numeric
)
RETURNS jsonb AS $$
DECLARE
  v_prediction jsonb;
  v_close_prob numeric;
  v_days_to_close numeric;
  v_channel text := 'whatsapp';
  v_tone text := 'consultative';
BEGIN
  -- Simple prediction logic (would be ML model in production)
  v_close_prob := (p_buying_intent * 0.6) + (p_engagement * 0.4);
  
  v_days_to_close := CASE
    WHEN v_close_prob >= 0.8 THEN 2
    WHEN v_close_prob >= 0.6 THEN 5
    WHEN v_close_prob >= 0.4 THEN 10
    ELSE 20
  END;
  
  -- Channel recommendation
  v_channel := CASE
    WHEN v_close_prob >= 0.8 THEN 'whatsapp'
    WHEN v_close_prob >= 0.6 THEN 'messenger'
    ELSE 'email'
  END;
  
  -- Tone recommendation
  v_tone := CASE
    WHEN v_close_prob >= 0.8 THEN 'urgent'
    WHEN v_close_prob >= 0.6 THEN 'consultative'
    ELSE 'friendly'
  END;
  
  v_prediction := jsonb_build_object(
    'close_probability', v_close_prob,
    'days_to_close', v_days_to_close,
    'recommended_channel', v_channel,
    'recommended_tone', v_tone,
    'confidence', 0.75
  );
  
  RETURN v_prediction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get top closer profile
CREATE OR REPLACE FUNCTION get_top_closer_profile(
  p_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_profile jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', user_id,
    'win_rate', win_rate,
    'avg_time_to_close', avg_time_to_close_days,
    'rank', rank_tier,
    'strengths', signature_strengths
  ) INTO v_profile
  FROM top_closer_rankings
  WHERE user_id = p_user_id
  ORDER BY period_start DESC
  LIMIT 1;
  
  RETURN COALESCE(v_profile, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Select best persona for prospect
CREATE OR REPLACE FUNCTION select_best_persona(
  p_user_id uuid,
  p_prospect_id uuid,
  p_emotional_state text,
  p_buying_intent numeric
)
RETURNS uuid AS $$
DECLARE
  v_persona_id uuid;
BEGIN
  -- Simple selection logic (would be ML in production)
  SELECT id INTO v_persona_id
  FROM ai_persona_modes
  WHERE user_id = p_user_id
    AND active = true
  ORDER BY success_rate DESC
  LIMIT 1;
  
  RETURN v_persona_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Track closing stage progression
CREATE OR REPLACE FUNCTION progress_closing_stage(
  p_user_id uuid,
  p_prospect_id uuid,
  p_new_stage text,
  p_completed boolean DEFAULT false
)
RETURNS void AS $$
BEGIN
  INSERT INTO closing_stage_progressions (
    user_id, prospect_id, current_stage, stage_completed
  ) VALUES (
    p_user_id, p_prospect_id, p_new_stage, p_completed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;