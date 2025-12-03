/*
  # Deep Scan V3 System - Multi-Agent Intelligence

  1. New Tables
    - `user_scoring_weights`
      - Stores personalized ScoutScore v10 weights per user
      - Learns from outcomes (closed vs ignored)
      - Machine learning weight adjustments
    
    - `deep_scan_sessions`
      - Tracks deep scan processing sessions
      - Real-time status and progress tracking
      - WebSocket-ready state management
    
    - `deep_scan_results`
      - Stores detailed scan results
      - Multi-agent enrichment data
      - ScoutScore v10 calculations
    
    - `deep_scan_events`
      - Real-time event log for WebSocket streaming
      - Stage transitions and progress updates
      - Error tracking and diagnostics

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Proper indexes for performance

  3. Features
    - Personalized weight learning
    - Real-time progress tracking
    - Multi-stage processing pipeline
    - ScoutScore v10 with ML optimization
*/

-- User Scoring Weights (Personalized ML)
CREATE TABLE IF NOT EXISTS user_scoring_weights (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  feature text NOT NULL,
  weight numeric DEFAULT 0.5 CHECK (weight >= 0 AND weight <= 1),
  learning_rate numeric DEFAULT 0.05,
  total_outcomes integer DEFAULT 0,
  successful_outcomes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, feature)
);

-- Deep Scan Sessions
CREATE TABLE IF NOT EXISTS deep_scan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  raw_payload jsonb NOT NULL,
  status text DEFAULT 'idle' CHECK (status IN ('idle', 'preprocessing', 'parsing', 'enriching', 'deep_intel', 'scoring', 'complete', 'failed')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_stage text,
  error_message text,
  total_prospects integer DEFAULT 0,
  processed_prospects integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Deep Scan Results
CREATE TABLE IF NOT EXISTS deep_scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES deep_scan_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_data jsonb NOT NULL,
  extracted_entities jsonb DEFAULT '{}'::jsonb,
  enrichment_data jsonb DEFAULT '{}'::jsonb,
  scout_score_v10 numeric CHECK (scout_score_v10 >= 0 AND scout_score_v10 <= 100),
  feature_scores jsonb DEFAULT '{}'::jsonb,
  personalized_weights jsonb DEFAULT '{}'::jsonb,
  ai_insights jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Deep Scan Events (WebSocket Log)
CREATE TABLE IF NOT EXISTS deep_scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES deep_scan_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  stage text NOT NULL,
  progress integer NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_scoring_weights_user_id ON user_scoring_weights(user_id);
CREATE INDEX IF NOT EXISTS idx_deep_scan_sessions_user_id ON deep_scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_deep_scan_sessions_status ON deep_scan_sessions(status);
CREATE INDEX IF NOT EXISTS idx_deep_scan_results_session_id ON deep_scan_results(session_id);
CREATE INDEX IF NOT EXISTS idx_deep_scan_results_user_id ON deep_scan_results(user_id);
CREATE INDEX IF NOT EXISTS idx_deep_scan_events_session_id ON deep_scan_events(session_id);
CREATE INDEX IF NOT EXISTS idx_deep_scan_events_user_id ON deep_scan_events(user_id);

-- RLS Policies
ALTER TABLE user_scoring_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_scan_events ENABLE ROW LEVEL SECURITY;

-- User Scoring Weights Policies
CREATE POLICY "Users can view own scoring weights"
  ON user_scoring_weights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scoring weights"
  ON user_scoring_weights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scoring weights"
  ON user_scoring_weights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Deep Scan Sessions Policies
CREATE POLICY "Users can view own deep scan sessions"
  ON deep_scan_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deep scan sessions"
  ON deep_scan_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deep scan sessions"
  ON deep_scan_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Deep Scan Results Policies
CREATE POLICY "Users can view own deep scan results"
  ON deep_scan_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deep scan results"
  ON deep_scan_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Deep Scan Events Policies
CREATE POLICY "Users can view own deep scan events"
  ON deep_scan_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deep scan events"
  ON deep_scan_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to initialize default scoring weights
CREATE OR REPLACE FUNCTION initialize_user_scoring_weights(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO user_scoring_weights (user_id, feature, weight, learning_rate)
  VALUES
    (p_user_id, 'intent_strength', 0.25, 0.05),
    (p_user_id, 'buying_power', 0.20, 0.05),
    (p_user_id, 'emotional_fit', 0.15, 0.05),
    (p_user_id, 'relationship_closeness', 0.15, 0.05),
    (p_user_id, 'need_urgency', 0.15, 0.05),
    (p_user_id, 'digital_presence', 0.10, 0.05)
  ON CONFLICT (user_id, feature) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update weights based on outcome
CREATE OR REPLACE FUNCTION update_scoring_weight_on_outcome(
  p_user_id uuid,
  p_feature text,
  p_outcome text,
  p_feature_value numeric
)
RETURNS void AS $$
DECLARE
  v_current_weight numeric;
  v_learning_rate numeric;
  v_new_weight numeric;
BEGIN
  -- Get current weight and learning rate
  SELECT weight, learning_rate INTO v_current_weight, v_learning_rate
  FROM user_scoring_weights
  WHERE user_id = p_user_id AND feature = p_feature;

  -- Calculate new weight based on outcome
  IF p_outcome = 'closed' THEN
    v_new_weight := v_current_weight + (v_learning_rate * p_feature_value);
  ELSIF p_outcome = 'ignored' THEN
    v_new_weight := v_current_weight - (v_learning_rate * p_feature_value);
  ELSE
    v_new_weight := v_current_weight;
  END IF;

  -- Clamp between 0 and 1
  v_new_weight := GREATEST(0, LEAST(1, v_new_weight));

  -- Update weight and outcomes
  UPDATE user_scoring_weights
  SET 
    weight = v_new_weight,
    total_outcomes = total_outcomes + 1,
    successful_outcomes = CASE WHEN p_outcome = 'closed' THEN successful_outcomes + 1 ELSE successful_outcomes END,
    updated_at = now()
  WHERE user_id = p_user_id AND feature = p_feature;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
