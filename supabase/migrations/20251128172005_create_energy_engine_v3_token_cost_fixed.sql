/*
  # Energy Engine v3.0 - Dynamic Token Cost System

  1. New Tables
    - `token_usage` - Real-time token tracking
    - `token_budgets` - Tier-based limits
    - `ai_cost_estimates` - Pre-calculation estimates

  2. Token Budget Management
    - Daily reset logic
    - Spike detection
    - Compression mode

  3. Security
    - RLS enabled on all tables
*/

-- Token Usage Tracking
CREATE TABLE IF NOT EXISTS token_usage (
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
    'company_crawler'
  )),
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  energy_cost integer NOT NULL DEFAULT 0,
  tier text NOT NULL,
  compression_mode boolean DEFAULT false,
  spike_detected boolean DEFAULT false,
  estimated_tokens integer,
  actual_vs_estimate_diff integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Token Budgets (Tier-based)
CREATE TABLE IF NOT EXISTS token_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL UNIQUE CHECK (tier IN ('free', 'pro', 'elite', 'team', 'enterprise')),
  daily_token_limit integer NOT NULL,
  tokens_per_energy integer NOT NULL,
  spike_threshold integer NOT NULL,
  compression_threshold integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Cost Estimates (for preview)
CREATE TABLE IF NOT EXISTS ai_cost_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature text NOT NULL,
  input_type text NOT NULL,
  base_tokens integer NOT NULL,
  multiplier_per_item numeric DEFAULT 1.0,
  avg_output_tokens integer DEFAULT 500,
  complexity_factor numeric DEFAULT 1.0,
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enhanced User Energy with Token Tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'daily_token_budget'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN daily_token_budget integer DEFAULT 5000;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'tokens_used_today'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN tokens_used_today integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'last_token_reset'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN last_token_reset date DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'compression_mode_enabled'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN compression_mode_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'spike_warnings_count'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN spike_warnings_count integer DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_estimates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for token_usage
CREATE POLICY "Users can view own token usage"
  ON token_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own token usage"
  ON token_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for token_budgets
CREATE POLICY "Users can view token budgets"
  ON token_budgets FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for ai_cost_estimates
CREATE POLICY "Users can view cost estimates"
  ON ai_cost_estimates FOR SELECT
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_usage_user ON token_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_feature ON token_usage(feature);
CREATE INDEX IF NOT EXISTS idx_token_usage_created ON token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_spike ON token_usage(spike_detected) WHERE spike_detected = true;
CREATE INDEX IF NOT EXISTS idx_user_energy_token_reset ON user_energy(last_token_reset);

-- Seed token budgets
INSERT INTO token_budgets (tier, daily_token_limit, tokens_per_energy, spike_threshold, compression_threshold) VALUES
  ('free', 5000, 1500, 3000, 4000),
  ('pro', 40000, 3000, 10000, 35000),
  ('elite', 120000, 5000, 30000, 100000),
  ('team', 300000, 6000, 50000, 250000),
  ('enterprise', 1000000, 10000, 100000, 900000)
ON CONFLICT (tier) DO UPDATE SET
  daily_token_limit = EXCLUDED.daily_token_limit,
  tokens_per_energy = EXCLUDED.tokens_per_energy,
  spike_threshold = EXCLUDED.spike_threshold,
  compression_threshold = EXCLUDED.compression_threshold,
  updated_at = now();

-- Seed AI cost estimates
INSERT INTO ai_cost_estimates (feature, input_type, base_tokens, multiplier_per_item, avg_output_tokens, complexity_factor) VALUES
  ('ai_pitchdeck', 'company_data', 1000, 1.5, 2000, 1.2),
  ('ai_deepscan', 'prospect_list', 500, 50, 800, 1.5),
  ('ai_sequence', 'message_template', 800, 1.2, 1500, 1.0),
  ('ai_message', 'prospect_data', 600, 1.0, 500, 0.9),
  ('ai_chatbot', 'conversation', 400, 1.1, 600, 0.8),
  ('ai_scanner', 'document', 800, 2.0, 1000, 1.3),
  ('ai_objection', 'objection_text', 500, 1.0, 700, 1.0),
  ('ai_about', 'user_data', 700, 1.2, 1200, 1.1),
  ('company_crawler', 'website_url', 1500, 3.0, 2500, 1.8)
ON CONFLICT DO NOTHING;

-- Function to reset daily token usage
CREATE OR REPLACE FUNCTION reset_daily_token_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_energy
  SET tokens_used_today = 0,
      last_token_reset = CURRENT_DATE,
      spike_warnings_count = 0
  WHERE last_token_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate token to energy cost
CREATE OR REPLACE FUNCTION calculate_token_energy_cost(
  p_user_id uuid,
  p_tokens integer
)
RETURNS integer AS $$
DECLARE
  v_tier text;
  v_tokens_per_energy integer;
  v_energy_cost integer;
BEGIN
  SELECT COALESCE(subscription_tier, 'free')
  INTO v_tier
  FROM profiles
  WHERE id = p_user_id;

  SELECT tokens_per_energy
  INTO v_tokens_per_energy
  FROM token_budgets
  WHERE tier = v_tier;

  v_energy_cost := CEIL(p_tokens / v_tokens_per_energy::numeric);

  RETURN v_energy_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;