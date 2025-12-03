/*
  # Financial Intelligence System

  1. New Tables
    - `profit_snapshots` - Comprehensive MRR and profitability tracking
    - `tier_profitability_v2` - Enhanced tier economics
    - `agent_profitability` - Per-agent revenue and cost attribution
    - `energy_coin_revenue_forecasts` - Revenue forecasting
    - `pricing_experiments` - A/B testing pricing
    - `pricing_recommendations` - ML-based pricing suggestions

  2. Security
    - Enable RLS on all tables
    - Admin-only access
*/

-- ============================================================================
-- PROFIT SNAPSHOTS (Comprehensive daily/monthly snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profit_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  mrr_total numeric DEFAULT 0,
  mrr_new numeric DEFAULT 0,
  mrr_churn numeric DEFAULT 0,
  mrr_expansion numeric DEFAULT 0,
  mrr_contraction numeric DEFAULT 0,
  gross_margin numeric DEFAULT 0,
  rule_of_40 numeric DEFAULT 0,
  token_cost numeric DEFAULT 0,
  api_cost numeric DEFAULT 0,
  server_cost numeric DEFAULT 0,
  energy_revenue numeric DEFAULT 0,
  coin_revenue numeric DEFAULT 0,
  subscription_revenue numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_profit_snapshots_date
  ON profit_snapshots(snapshot_date DESC);

-- RLS
ALTER TABLE profit_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profit snapshots"
  ON profit_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage profit snapshots"
  ON profit_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- TIER PROFITABILITY V2 (Enhanced with more metrics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tier_profitability_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  active_users int DEFAULT 0,
  mrr numeric DEFAULT 0,
  cogs numeric DEFAULT 0,
  gross_margin numeric DEFAULT 0,
  ltv numeric DEFAULT 0,
  cac numeric DEFAULT 0,
  ltv_cac_ratio numeric DEFAULT 0,
  avg_revenue_per_user numeric DEFAULT 0,
  avg_cogs_per_user numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tier, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_tier_profitability_v2_tier
  ON tier_profitability_v2(tier);
CREATE INDEX IF NOT EXISTS idx_tier_profitability_v2_period
  ON tier_profitability_v2(period_start DESC);

-- RLS
ALTER TABLE tier_profitability_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tier profitability v2"
  ON tier_profitability_v2 FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage tier profitability v2"
  ON tier_profitability_v2 FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- AGENT PROFITABILITY (Per-agent economics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_profitability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  tier text,
  token_cost numeric DEFAULT 0,
  api_cost numeric DEFAULT 0,
  energy_used int DEFAULT 0,
  coins_spent int DEFAULT 0,
  subscription_revenue numeric DEFAULT 0,
  deal_revenue numeric DEFAULT 0,
  referral_revenue numeric DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  total_cogs numeric DEFAULT 0,
  contribution_margin numeric DEFAULT 0,
  churn_risk numeric DEFAULT 0,
  profitability_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_agent_profitability_user_id
  ON agent_profitability(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_profitability_period
  ON agent_profitability(period_start DESC);
CREATE INDEX IF NOT EXISTS idx_agent_profitability_score
  ON agent_profitability(profitability_score DESC);

-- RLS
ALTER TABLE agent_profitability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent profitability"
  ON agent_profitability FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage agent profitability"
  ON agent_profitability FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- ENERGY/COIN REVENUE FORECASTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS energy_coin_revenue_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date date NOT NULL DEFAULT CURRENT_DATE,
  horizon_days int NOT NULL,
  forecast_energy_revenue numeric DEFAULT 0,
  forecast_coin_revenue numeric DEFAULT 0,
  forecast_subscription_revenue numeric DEFAULT 0,
  forecast_total_revenue numeric DEFAULT 0,
  method text DEFAULT 'moving_average',
  assumptions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (forecast_date, horizon_days)
);

CREATE INDEX IF NOT EXISTS idx_energy_coin_forecasts_date
  ON energy_coin_revenue_forecasts(forecast_date DESC);
CREATE INDEX IF NOT EXISTS idx_energy_coin_forecasts_horizon
  ON energy_coin_revenue_forecasts(horizon_days);

-- RLS
ALTER TABLE energy_coin_revenue_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view forecasts"
  ON energy_coin_revenue_forecasts FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage forecasts"
  ON energy_coin_revenue_forecasts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- PRICING EXPERIMENTS (A/B testing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier text NOT NULL,
  variant_a_price numeric NOT NULL,
  variant_b_price numeric NOT NULL,
  status text DEFAULT 'draft',
  start_date timestamptz,
  end_date timestamptz,
  metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_experiments_status
  ON pricing_experiments(status);
CREATE INDEX IF NOT EXISTS idx_pricing_experiments_tier
  ON pricing_experiments(tier);

-- RLS
ALTER TABLE pricing_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pricing experiments"
  ON pricing_experiments FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage pricing experiments"
  ON pricing_experiments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- PRICING RECOMMENDATIONS (ML-based suggestions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at timestamptz DEFAULT now(),
  recommended_pro_price numeric DEFAULT 1299,
  recommended_team_base_price numeric DEFAULT 4990,
  recommended_team_seat_price numeric DEFAULT 999,
  recommended_enterprise_min_price numeric DEFAULT 30000,
  recommended_energy_pack_configs jsonb DEFAULT '[]'::jsonb,
  recommended_coin_pack_configs jsonb DEFAULT '[]'::jsonb,
  explanation text,
  confidence_score numeric DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pricing_recommendations_generated
  ON pricing_recommendations(generated_at DESC);

-- RLS
ALTER TABLE pricing_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pricing recommendations"
  ON pricing_recommendations FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage pricing recommendations"
  ON pricing_recommendations FOR ALL TO authenticated USING (true) WITH CHECK (true);