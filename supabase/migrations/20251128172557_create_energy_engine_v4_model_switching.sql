/*
  # Energy Engine v4.0 - Intelligent Model Switching & Predictive Costing

  1. New Tables
    - `ai_model_usage` - Track model selection per request
    - `user_efficiency_profiles` - Personalized AI usage patterns
    - `ai_model_configs` - Available models and costs
    - `cached_ai_responses` - Response cache for efficiency
    - `ai_cost_predictions` - Pre-generation cost estimates

  2. Enhanced Tracking
    - Model routing decisions
    - Cost predictions vs actuals
    - Efficiency improvements over time
    - Token savings per user

  3. Features
    - Smart model selection
    - Predictive cost firewall
    - Personalized efficiency learning
    - Response caching
    - Load balancing

  4. Security
    - RLS on all tables
*/

-- AI Model Usage Tracking
CREATE TABLE IF NOT EXISTS ai_model_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature text NOT NULL CHECK (feature IN (
    'ai_pitchdeck',
    'ai_deepscan',
    'ai_sequence',
    'ai_message',
    'ai_chatbot',
    'ai_scanner',
    'ai_objection',
    'ai_about',
    'company_crawler',
    'ai_emotional',
    'ai_coaching'
  )),
  model_used text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost_usd numeric NOT NULL DEFAULT 0,
  mode text DEFAULT 'auto' CHECK (mode IN ('auto', 'fast', 'pro', 'expert', 'panic')),
  routing_reason text,
  compression_applied boolean DEFAULT false,
  cached_response boolean DEFAULT false,
  prediction_accuracy numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- User Efficiency Profiles
CREATE TABLE IF NOT EXISTS user_efficiency_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  efficiency_rating numeric DEFAULT 1.0,
  preferred_mode text DEFAULT 'auto' CHECK (preferred_mode IN ('auto', 'fast', 'pro', 'expert')),
  avg_token_per_request integer DEFAULT 0,
  predicted_daily_usage integer DEFAULT 0,
  total_requests integer DEFAULT 0,
  total_tokens_saved integer DEFAULT 0,
  writing_style_profile jsonb DEFAULT '{}'::jsonb,
  common_patterns text[] DEFAULT '{}',
  peak_usage_hours integer[] DEFAULT '{}',
  preferred_output_length text DEFAULT 'medium',
  cache_hit_rate numeric DEFAULT 0.0,
  model_preference_score jsonb DEFAULT '{}'::jsonb,
  last_analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Model Configurations
CREATE TABLE IF NOT EXISTS ai_model_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL UNIQUE,
  model_type text NOT NULL CHECK (model_type IN ('small', 'medium', 'large', 'xl')),
  cost_per_1k_input numeric NOT NULL,
  cost_per_1k_output numeric NOT NULL,
  max_tokens integer NOT NULL,
  quality_score numeric DEFAULT 0.8,
  speed_score numeric DEFAULT 0.8,
  best_for text[] DEFAULT '{}',
  min_tier text DEFAULT 'free',
  is_active boolean DEFAULT true,
  fallback_model text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cached AI Responses
CREATE TABLE IF NOT EXISTS cached_ai_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature text NOT NULL,
  prompt_hash text NOT NULL,
  response_text text NOT NULL,
  tokens_saved integer DEFAULT 0,
  hit_count integer DEFAULT 0,
  last_used_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- AI Cost Predictions
CREATE TABLE IF NOT EXISTS ai_cost_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature text NOT NULL,
  predicted_tokens integer NOT NULL,
  predicted_cost_usd numeric NOT NULL,
  predicted_energy integer NOT NULL,
  recommended_model text NOT NULL,
  actual_tokens integer,
  actual_cost_usd numeric,
  actual_energy integer,
  prediction_accuracy numeric,
  approved boolean DEFAULT false,
  rejected_reason text,
  created_at timestamptz DEFAULT now()
);

-- Enhanced user_energy with v4.0 fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'efficiency_rating'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN efficiency_rating numeric DEFAULT 1.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'preferred_mode'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN preferred_mode text DEFAULT 'auto';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'avg_token_per_request'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN avg_token_per_request integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'predicted_daily_usage'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN predicted_daily_usage integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'model_mode'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN model_mode text DEFAULT 'auto';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE ai_model_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_efficiency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_model_usage
CREATE POLICY "Users can view own model usage"
  ON ai_model_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own model usage"
  ON ai_model_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_efficiency_profiles
CREATE POLICY "Users can view own efficiency profile"
  ON user_efficiency_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own efficiency profile"
  ON user_efficiency_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own efficiency profile"
  ON user_efficiency_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_model_configs (read-only for users)
CREATE POLICY "Users can view active models"
  ON ai_model_configs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for cached_ai_responses
CREATE POLICY "Users can view own cached responses"
  ON cached_ai_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cached responses"
  ON cached_ai_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cached responses"
  ON cached_ai_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_cost_predictions
CREATE POLICY "Users can view own cost predictions"
  ON ai_cost_predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cost predictions"
  ON ai_cost_predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cost predictions"
  ON ai_cost_predictions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_user ON ai_model_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_feature ON ai_model_usage(feature);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_model ON ai_model_usage(model_used);
CREATE INDEX IF NOT EXISTS idx_efficiency_profiles_user ON user_efficiency_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_cached_responses_hash ON cached_ai_responses(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_cached_responses_expires ON cached_ai_responses(expires_at);
CREATE INDEX IF NOT EXISTS idx_cost_predictions_user ON ai_cost_predictions(user_id, created_at DESC);

-- Seed AI model configurations
INSERT INTO ai_model_configs (model_name, model_type, cost_per_1k_input, cost_per_1k_output, max_tokens, quality_score, speed_score, best_for, min_tier) VALUES
  ('gpt-4o-mini', 'small', 0.00015, 0.0006, 128000, 0.7, 0.95, ARRAY['simple_messages','quick_responses','chat'], 'free'),
  ('gpt-4o', 'large', 0.0025, 0.01, 128000, 0.95, 0.8, ARRAY['pitch_decks','deep_analysis','complex_writing'], 'pro'),
  ('gpt-4o-mini-high', 'medium', 0.0003, 0.0012, 128000, 0.85, 0.9, ARRAY['sequences','objections','emotional'], 'free'),
  ('claude-3-haiku', 'small', 0.00025, 0.00125, 200000, 0.75, 0.95, ARRAY['simple_tasks','chat','quick_scan'], 'free'),
  ('claude-3-sonnet', 'medium', 0.003, 0.015, 200000, 0.9, 0.85, ARRAY['analysis','writing','coaching'], 'pro'),
  ('claude-3-opus', 'xl', 0.015, 0.075, 200000, 0.98, 0.7, ARRAY['pitch_decks','strategic','complex'], 'elite')
ON CONFLICT (model_name) DO UPDATE SET
  cost_per_1k_input = EXCLUDED.cost_per_1k_input,
  cost_per_1k_output = EXCLUDED.cost_per_1k_output,
  updated_at = now();

-- Function to create efficiency profile for new users
CREATE OR REPLACE FUNCTION create_default_efficiency_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_efficiency_profiles (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when energy is created
DROP TRIGGER IF EXISTS create_efficiency_profile_on_signup ON user_energy;
CREATE TRIGGER create_efficiency_profile_on_signup
  AFTER INSERT ON user_energy
  FOR EACH ROW
  EXECUTE FUNCTION create_default_efficiency_profile();

-- Function to update efficiency rating
CREATE OR REPLACE FUNCTION update_efficiency_rating(
  p_user_id uuid,
  p_tokens_used integer,
  p_tokens_predicted integer
)
RETURNS void AS $$
DECLARE
  v_accuracy numeric;
  v_current_rating numeric;
BEGIN
  v_accuracy := 1.0 - ABS(p_tokens_used - p_tokens_predicted)::numeric / GREATEST(p_tokens_predicted, 1);
  v_accuracy := GREATEST(0.0, LEAST(1.0, v_accuracy));

  SELECT efficiency_rating INTO v_current_rating
  FROM user_efficiency_profiles
  WHERE user_id = p_user_id;

  UPDATE user_efficiency_profiles
  SET 
    efficiency_rating = (COALESCE(v_current_rating, 1.0) * 0.9) + (v_accuracy * 0.1),
    total_requests = total_requests + 1,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM cached_ai_responses
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;