/*
  # Energy Engine v5.0 - Autonomous AI Cost Intelligence

  1. New Tables
    - `ai_cluster_status` - Real-time LLM health/load tracking
    - `prompt_rewrite_cache` - Cached compressed prompts
    - `user_ai_pricing_profile` - Personalized per-user pricing
    - `ai_cost_simulations` - Predictive cost modeling
    - `token_debt_tracker` - Overspend detection
    - `system_load_events` - Load state history

  2. Autonomous Intelligence
    - Real-time token governor
    - Auto prompt compression
    - Global load balancing
    - Adaptive per-user pricing
    - Surge protection

  3. Enterprise Features
    - Multi-provider routing (OpenAI, Anthropic, Groq)
    - Cluster-aware decisions
    - Predictive cost simulation
    - User efficiency learning

  4. Security
    - RLS on all tables
*/

-- AI Cluster Status (Real-time LLM Health)
CREATE TABLE IF NOT EXISTS ai_cluster_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('openai', 'anthropic', 'groq', 'cohere', 'together')),
  model text NOT NULL,
  latency_ms integer DEFAULT 0,
  rejection_rate numeric DEFAULT 0.0,
  success_rate numeric DEFAULT 1.0,
  last_checked timestamptz DEFAULT now(),
  cost_per_1k_input numeric NOT NULL,
  cost_per_1k_output numeric NOT NULL,
  tokens_today integer DEFAULT 0,
  status text DEFAULT 'healthy' CHECK (status IN ('healthy', 'degraded', 'overloaded', 'failed')),
  max_tokens integer DEFAULT 128000,
  requests_today integer DEFAULT 0,
  avg_response_time_ms integer DEFAULT 0,
  gpu_load_estimate numeric DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider, model)
);

-- Prompt Rewrite Cache
CREATE TABLE IF NOT EXISTS prompt_rewrite_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  original_hash text NOT NULL,
  rewritten_prompt text NOT NULL,
  compression_ratio numeric NOT NULL,
  tokens_saved integer DEFAULT 0,
  quality_score numeric DEFAULT 1.0,
  hit_count integer DEFAULT 0,
  last_used_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '60 days'),
  created_at timestamptz DEFAULT now(),
  UNIQUE(original_hash)
);

-- User AI Pricing Profile (Personalized Pricing)
CREATE TABLE IF NOT EXISTS user_ai_pricing_profile (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avg_token_usage integer DEFAULT 0,
  efficiency_rating numeric DEFAULT 1.0,
  tier text NOT NULL DEFAULT 'free',
  surge_multiplier numeric DEFAULT 1.0,
  weekly_usage integer DEFAULT 0,
  weekly_cost_usd numeric DEFAULT 0.0,
  recommended_plan text,
  cost_tier_score numeric DEFAULT 0.5,
  compression_preference numeric DEFAULT 0.5,
  preferred_quality text DEFAULT 'balanced',
  last_7_days_tokens integer DEFAULT 0,
  last_30_days_tokens integer DEFAULT 0,
  total_tokens_saved integer DEFAULT 0,
  total_cost_saved_usd numeric DEFAULT 0.0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- AI Cost Simulations (Predictive Modeling)
CREATE TABLE IF NOT EXISTS ai_cost_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  simulation_type text CHECK (simulation_type IN ('daily', 'weekly', 'monthly', 'custom')),
  predicted_tokens integer NOT NULL,
  predicted_cost_usd numeric NOT NULL,
  predicted_energy integer NOT NULL,
  scenario text DEFAULT 'normal',
  confidence_score numeric DEFAULT 0.8,
  factors jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Token Debt Tracker (Overspend Detection)
CREATE TABLE IF NOT EXISTS token_debt_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  debt_tokens integer DEFAULT 0,
  debt_cost_usd numeric DEFAULT 0.0,
  overspend_reason text,
  recovery_plan text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'repaying', 'cleared')),
  created_at timestamptz DEFAULT now(),
  cleared_at timestamptz
);

-- System Load Events (State Machine History)
CREATE TABLE IF NOT EXISTS system_load_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_state text NOT NULL CHECK (load_state IN ('idle', 'normal', 'high', 'surge', 'panic')),
  system_load_percent integer NOT NULL,
  active_requests integer DEFAULT 0,
  queue_depth integer DEFAULT 0,
  models_affected text[] DEFAULT '{}',
  actions_taken jsonb DEFAULT '{}'::jsonb,
  duration_seconds integer,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Enable RLS
ALTER TABLE ai_cluster_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_rewrite_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_pricing_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_debt_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_load_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_cluster_status (read-only for users)
CREATE POLICY "Users can view cluster status"
  ON ai_cluster_status FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for prompt_rewrite_cache
CREATE POLICY "Users can view own rewrite cache"
  ON prompt_rewrite_cache FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert rewrite cache"
  ON prompt_rewrite_cache FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update own rewrite cache"
  ON prompt_rewrite_cache FOR UPDATE
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id)
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- RLS Policies for user_ai_pricing_profile
CREATE POLICY "Users can view own pricing profile"
  ON user_ai_pricing_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pricing profile"
  ON user_ai_pricing_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pricing profile"
  ON user_ai_pricing_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_cost_simulations
CREATE POLICY "Users can view own cost simulations"
  ON ai_cost_simulations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cost simulations"
  ON ai_cost_simulations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for token_debt_tracker
CREATE POLICY "Users can view own token debt"
  ON token_debt_tracker FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own token debt"
  ON token_debt_tracker FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for system_load_events (read-only for all)
CREATE POLICY "Users can view recent load events"
  ON system_load_events FOR SELECT
  TO authenticated
  USING (created_at > now() - interval '24 hours');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cluster_status_provider ON ai_cluster_status(provider, status);
CREATE INDEX IF NOT EXISTS idx_cluster_status_updated ON ai_cluster_status(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewrite_cache_hash ON prompt_rewrite_cache(original_hash);
CREATE INDEX IF NOT EXISTS idx_rewrite_cache_expires ON prompt_rewrite_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_pricing_profile_user ON user_ai_pricing_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_pricing_profile_tier ON user_ai_pricing_profile(tier);
CREATE INDEX IF NOT EXISTS idx_cost_simulations_user ON ai_cost_simulations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debt_tracker_user ON token_debt_tracker(user_id, status);
CREATE INDEX IF NOT EXISTS idx_load_events_state ON system_load_events(load_state, created_at DESC);

-- Seed initial AI cluster status
INSERT INTO ai_cluster_status (provider, model, cost_per_1k_input, cost_per_1k_output, status) VALUES
  ('openai', 'gpt-4o-mini', 0.00015, 0.0006, 'healthy'),
  ('openai', 'gpt-4o', 0.0025, 0.01, 'healthy'),
  ('openai', 'gpt-4o-mini-high', 0.0003, 0.0012, 'healthy'),
  ('anthropic', 'claude-3-haiku', 0.00025, 0.00125, 'healthy'),
  ('anthropic', 'claude-3-sonnet', 0.003, 0.015, 'healthy'),
  ('anthropic', 'claude-3-opus', 0.015, 0.075, 'healthy'),
  ('groq', 'llama-3-8b', 0.00005, 0.00008, 'healthy'),
  ('groq', 'mixtral-8x7b', 0.00024, 0.00024, 'healthy')
ON CONFLICT (provider, model) DO UPDATE SET
  cost_per_1k_input = EXCLUDED.cost_per_1k_input,
  cost_per_1k_output = EXCLUDED.cost_per_1k_output,
  updated_at = now();

-- Function to create pricing profile for new users
CREATE OR REPLACE FUNCTION create_default_pricing_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_ai_pricing_profile (user_id, tier)
  VALUES (NEW.user_id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when energy is created
DROP TRIGGER IF EXISTS create_pricing_profile_on_signup ON user_energy;
CREATE TRIGGER create_pricing_profile_on_signup
  AFTER INSERT ON user_energy
  FOR EACH ROW
  EXECUTE FUNCTION create_default_pricing_profile();

-- Function to update cluster health
CREATE OR REPLACE FUNCTION update_cluster_health(
  p_provider text,
  p_model text,
  p_latency_ms integer,
  p_success boolean
)
RETURNS void AS $$
DECLARE
  v_rejection_rate numeric;
  v_success_rate numeric;
BEGIN
  SELECT 
    COALESCE(rejection_rate, 0.0),
    COALESCE(success_rate, 1.0)
  INTO v_rejection_rate, v_success_rate
  FROM ai_cluster_status
  WHERE provider = p_provider AND model = p_model;

  IF p_success THEN
    v_success_rate := (v_success_rate * 0.95) + 0.05;
    v_rejection_rate := v_rejection_rate * 0.9;
  ELSE
    v_success_rate := v_success_rate * 0.9;
    v_rejection_rate := (v_rejection_rate * 0.9) + 0.1;
  END IF;

  UPDATE ai_cluster_status
  SET 
    latency_ms = p_latency_ms,
    rejection_rate = v_rejection_rate,
    success_rate = v_success_rate,
    requests_today = requests_today + 1,
    status = CASE
      WHEN v_success_rate < 0.5 THEN 'failed'
      WHEN v_rejection_rate > 0.3 THEN 'overloaded'
      WHEN p_latency_ms > 5000 THEN 'degraded'
      ELSE 'healthy'
    END,
    updated_at = now()
  WHERE provider = p_provider AND model = p_model;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate dynamic user pricing
CREATE OR REPLACE FUNCTION calculate_dynamic_energy_cost(
  p_user_id uuid,
  p_base_tokens integer,
  p_model text
)
RETURNS integer AS $$
DECLARE
  v_profile record;
  v_tier_factor numeric;
  v_efficiency_factor numeric;
  v_surge_mult numeric;
  v_final_cost integer;
BEGIN
  SELECT * INTO v_profile
  FROM user_ai_pricing_profile
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN CEIL(p_base_tokens / 1500.0);
  END IF;

  v_tier_factor := CASE v_profile.tier
    WHEN 'free' THEN 1.3
    WHEN 'pro' THEN 1.0
    WHEN 'elite' THEN 0.6
    WHEN 'enterprise' THEN 0.4
    ELSE 1.0
  END;

  v_efficiency_factor := CASE
    WHEN v_profile.efficiency_rating > 0.9 THEN 0.85
    WHEN v_profile.efficiency_rating > 0.7 THEN 1.0
    ELSE 1.15
  END;

  v_surge_mult := COALESCE(v_profile.surge_multiplier, 1.0);

  v_final_cost := CEIL(
    (p_base_tokens / 1000.0) * 
    v_tier_factor * 
    v_efficiency_factor * 
    v_surge_mult
  );

  RETURN GREATEST(v_final_cost, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_prompt_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM prompt_rewrite_cache
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;