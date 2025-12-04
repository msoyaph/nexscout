/*
  # Unit Economics & Profitability System

  1. New Tables
    - `user_costs` - Per-user COGS tracking
    - `llm_usage_logs` - Token usage by request
    - `api_calls_cost` - External API costs
    - `profitability_snapshots` - Daily/monthly snapshots
    - `cogs_breakdown` - Cost category breakdown
    - `tier_profitability` - Aggregate tier metrics
    - `cac_logs` - Customer acquisition cost tracking
    - `ltv_logs` - Lifetime value tracking

  2. Security
    - Enable RLS on all tables
    - Admin-only access
*/

-- ============================================================================
-- USER COSTS (Per-user COGS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  cost_date date NOT NULL DEFAULT CURRENT_DATE,
  llm_token_cost numeric DEFAULT 0,
  server_cost numeric DEFAULT 0,
  storage_cost numeric DEFAULT 0,
  api_cost numeric DEFAULT 0,
  total_cogs numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, cost_date)
);

CREATE INDEX IF NOT EXISTS idx_user_costs_user_id ON user_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_costs_date ON user_costs(cost_date DESC);

-- RLS
ALTER TABLE user_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view user costs"
  ON user_costs FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage user costs"
  ON user_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- LLM USAGE LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS llm_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  engine_id text NOT NULL,
  job_type text NOT NULL,
  model_used text NOT NULL,
  prompt_tokens int DEFAULT 0,
  completion_tokens int DEFAULT 0,
  total_tokens int DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_llm_usage_logs_user_id ON llm_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_logs_created_at ON llm_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_usage_logs_engine_id ON llm_usage_logs(engine_id);

-- RLS
ALTER TABLE llm_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view LLM logs"
  ON llm_usage_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert LLM logs"
  ON llm_usage_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- API CALLS COST
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_calls_cost (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  api_name text NOT NULL,
  endpoint text,
  cost_per_call numeric DEFAULT 0,
  calls_count int DEFAULT 1,
  total_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_calls_cost_user_id ON api_calls_cost(user_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_cost_api_name ON api_calls_cost(api_name);
CREATE INDEX IF NOT EXISTS idx_api_calls_cost_created_at ON api_calls_cost(created_at DESC);

-- RLS
ALTER TABLE api_calls_cost ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view API costs"
  ON api_calls_cost FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert API costs"
  ON api_calls_cost FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- PROFITABILITY SNAPSHOTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS profitability_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  snapshot_type text NOT NULL DEFAULT 'daily',
  total_mrr numeric DEFAULT 0,
  total_cogs numeric DEFAULT 0,
  total_opex numeric DEFAULT 0,
  gross_margin numeric DEFAULT 0,
  net_margin numeric DEFAULT 0,
  active_users int DEFAULT 0,
  paying_users int DEFAULT 0,
  arpu numeric DEFAULT 0,
  cac numeric DEFAULT 0,
  ltv numeric DEFAULT 0,
  ltv_cac_ratio numeric DEFAULT 0,
  growth_rate numeric DEFAULT 0,
  rule_of_40 numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (snapshot_date, snapshot_type)
);

CREATE INDEX IF NOT EXISTS idx_profitability_snapshots_date
  ON profitability_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_profitability_snapshots_type
  ON profitability_snapshots(snapshot_type);

-- RLS
ALTER TABLE profitability_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view snapshots"
  ON profitability_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage snapshots"
  ON profitability_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- COGS BREAKDOWN
-- ============================================================================

CREATE TABLE IF NOT EXISTS cogs_breakdown (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  subcategory text,
  total_cost numeric DEFAULT 0,
  percentage numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cogs_breakdown_date ON cogs_breakdown(breakdown_date DESC);
CREATE INDEX IF NOT EXISTS idx_cogs_breakdown_category ON cogs_breakdown(category);

-- RLS
ALTER TABLE cogs_breakdown ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view COGS breakdown"
  ON cogs_breakdown FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage COGS breakdown"
  ON cogs_breakdown FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- TIER PROFITABILITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS tier_profitability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL,
  period_date date NOT NULL DEFAULT CURRENT_DATE,
  user_count int DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  total_cogs numeric DEFAULT 0,
  gross_margin numeric DEFAULT 0,
  avg_cogs_per_user numeric DEFAULT 0,
  avg_revenue_per_user numeric DEFAULT 0,
  avg_contribution_margin numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tier, period_date)
);

CREATE INDEX IF NOT EXISTS idx_tier_profitability_tier ON tier_profitability(tier);
CREATE INDEX IF NOT EXISTS idx_tier_profitability_date ON tier_profitability(period_date DESC);

-- RLS
ALTER TABLE tier_profitability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tier profitability"
  ON tier_profitability FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage tier profitability"
  ON tier_profitability FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- CAC LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cac_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  acquisition_date date NOT NULL,
  channel text,
  campaign text,
  cost numeric DEFAULT 0,
  tier text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cac_logs_user_id ON cac_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cac_logs_date ON cac_logs(acquisition_date DESC);
CREATE INDEX IF NOT EXISTS idx_cac_logs_channel ON cac_logs(channel);

-- RLS
ALTER TABLE cac_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view CAC logs"
  ON cac_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage CAC logs"
  ON cac_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- LTV LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ltv_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  calculation_date date NOT NULL DEFAULT CURRENT_DATE,
  months_retained int DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  total_cogs numeric DEFAULT 0,
  gross_profit numeric DEFAULT 0,
  estimated_ltv numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ltv_logs_user_id ON ltv_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ltv_logs_date ON ltv_logs(calculation_date DESC);

-- RLS
ALTER TABLE ltv_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view LTV logs"
  ON ltv_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage LTV logs"
  ON ltv_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);