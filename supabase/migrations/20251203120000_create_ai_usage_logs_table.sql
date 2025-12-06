-- =====================================================
-- AI ORCHESTRATOR: Usage Logging Table
-- =====================================================
-- Purpose: Track all AI generation requests for:
--   - Cost tracking & billing
--   - Analytics & optimization
--   - Audit trail
--   - Per-user/workspace usage monitoring
-- =====================================================

-- Create ai_usage_logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User & workspace context
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspace_configs(workspace_id) ON DELETE SET NULL,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  
  -- AI request details
  action TEXT NOT NULL CHECK (action IN (
    'ai_message',
    'ai_scan',
    'ai_follow_up_sequence',
    'ai_objection_handler',
    'ai_pitch_deck',
    'ai_chatbot_response',
    'ai_deep_scan',
    'ai_company_analysis'
  )),
  
  -- Provider & model info
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'fallback')),
  model TEXT NOT NULL,
  
  -- Token usage
  tokens_prompt INTEGER NOT NULL DEFAULT 0,
  tokens_completion INTEGER NOT NULL DEFAULT 0,
  tokens_total INTEGER NOT NULL DEFAULT 0,
  
  -- Cost tracking
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  
  -- Energy consumed
  energy_consumed INTEGER NOT NULL DEFAULT 0,
  
  -- Performance metrics
  latency_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  fallback_used BOOLEAN DEFAULT FALSE,
  
  -- Success tracking
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_tokens CHECK (tokens_total >= 0),
  CONSTRAINT valid_cost CHECK (cost_usd >= 0),
  CONSTRAINT valid_latency CHECK (latency_ms IS NULL OR latency_ms >= 0)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Primary query patterns
CREATE INDEX idx_ai_usage_user_date 
  ON ai_usage_logs(user_id, created_at DESC);

CREATE INDEX idx_ai_usage_workspace_date 
  ON ai_usage_logs(workspace_id, created_at DESC) 
  WHERE workspace_id IS NOT NULL;

CREATE INDEX idx_ai_usage_prospect 
  ON ai_usage_logs(prospect_id) 
  WHERE prospect_id IS NOT NULL;

-- Analytics queries
CREATE INDEX idx_ai_usage_action_date 
  ON ai_usage_logs(action, created_at DESC);

CREATE INDEX idx_ai_usage_model_date 
  ON ai_usage_logs(model, created_at DESC);

-- Cost tracking
CREATE INDEX idx_ai_usage_cost_date 
  ON ai_usage_logs(created_at DESC, cost_usd) 
  WHERE cost_usd > 0;

-- Error monitoring
CREATE INDEX idx_ai_usage_errors 
  ON ai_usage_logs(created_at DESC) 
  WHERE success = FALSE;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage logs
CREATE POLICY "Users can view own AI usage logs"
  ON ai_usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert usage logs (backend only)
CREATE POLICY "System can insert AI usage logs"
  ON ai_usage_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- Super admins can view all logs
CREATE POLICY "Super admins can view all AI usage logs"
  ON ai_usage_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Get user's total AI cost (all time)
CREATE OR REPLACE FUNCTION get_user_total_ai_cost(p_user_id UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(cost_usd) FROM ai_usage_logs WHERE user_id = p_user_id),
    0
  );
END;
$$;

-- Get user's total AI cost (this month)
CREATE OR REPLACE FUNCTION get_user_monthly_ai_cost(p_user_id UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT SUM(cost_usd) 
      FROM ai_usage_logs 
      WHERE user_id = p_user_id
      AND created_at >= DATE_TRUNC('month', NOW())
    ),
    0
  );
END;
$$;

-- Get user's token usage (this month)
CREATE OR REPLACE FUNCTION get_user_monthly_tokens(p_user_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT SUM(tokens_total) 
      FROM ai_usage_logs 
      WHERE user_id = p_user_id
      AND created_at >= DATE_TRUNC('month', NOW())
    ),
    0
  );
END;
$$;

-- =====================================================
-- Views for Analytics
-- =====================================================

-- Daily AI usage summary
CREATE OR REPLACE VIEW daily_ai_usage_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  SUM(tokens_total) as total_tokens,
  SUM(cost_usd) as total_cost,
  AVG(latency_ms) as avg_latency_ms,
  SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as error_count,
  SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT as error_rate
FROM ai_usage_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Per-user monthly AI usage
CREATE OR REPLACE VIEW monthly_ai_usage_by_user AS
SELECT 
  user_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_requests,
  SUM(tokens_total) as total_tokens,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost_per_request
FROM ai_usage_logs
GROUP BY user_id, DATE_TRUNC('month', created_at)
ORDER BY month DESC, total_cost DESC;

-- Model usage distribution
CREATE OR REPLACE VIEW ai_model_usage_stats AS
SELECT 
  model,
  provider,
  COUNT(*) as usage_count,
  SUM(tokens_total) as total_tokens,
  SUM(cost_usd) as total_cost,
  AVG(latency_ms) as avg_latency_ms,
  SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT as error_rate
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY model, provider
ORDER BY usage_count DESC;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE ai_usage_logs IS 
  'Tracks all AI generation requests for cost tracking, analytics, and audit trail. Used by AIOrchestrator.';

COMMENT ON COLUMN ai_usage_logs.action IS 
  'Type of AI action performed (message, scan, sequence, etc.)';

COMMENT ON COLUMN ai_usage_logs.provider IS 
  'AI provider used (openai, anthropic, fallback)';

COMMENT ON COLUMN ai_usage_logs.model IS 
  'Specific model used (gpt-4o, gpt-3.5-turbo, etc.)';

COMMENT ON COLUMN ai_usage_logs.cost_usd IS 
  'Actual cost in USD based on token usage and model pricing';

COMMENT ON COLUMN ai_usage_logs.energy_consumed IS 
  'Energy points consumed from user energy system';

COMMENT ON FUNCTION get_user_total_ai_cost IS 
  'Get total AI cost for a user (all time)';

COMMENT ON FUNCTION get_user_monthly_ai_cost IS 
  'Get AI cost for a user in current month';

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Grant necessary permissions
GRANT SELECT ON ai_usage_logs TO authenticated;
GRANT INSERT ON ai_usage_logs TO service_role;
GRANT SELECT ON daily_ai_usage_summary TO authenticated;
GRANT SELECT ON monthly_ai_usage_by_user TO authenticated;
GRANT SELECT ON ai_model_usage_stats TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================

-- This migration creates:
-- ✅ ai_usage_logs table with comprehensive tracking
-- ✅ 7 performance indexes
-- ✅ RLS policies for security
-- ✅ 3 helper functions for cost tracking
-- ✅ 3 analytics views
-- ✅ Proper constraints and validations


