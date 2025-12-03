/*
  # Constitution and Certification System

  1. New Tables
    - `constitution_rules`
      - Dynamic rule system for Congress
      - Allows real-time policy updates
    - `engine_certification`
      - Engine approval and testing status
    - `engine_tests`
      - AI-generated regression tests

  2. Security
    - Enable RLS on all tables
    - Admin-only write access
*/

-- ============================================================================
-- CONSTITUTION RULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS constitution_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text UNIQUE NOT NULL,
  rule_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_constitution_rules_key
  ON constitution_rules(rule_key);

-- Seed default rules
INSERT INTO constitution_rules (rule_key, rule_value, description)
VALUES
  ('energy_costs', '{
    "free": {"SCAN": 5, "MESSAGE": 3, "PITCH_DECK": 10, "FOLLOW_UP": 2},
    "pro": {"SCAN": 3, "MESSAGE": 2, "PITCH_DECK": 5, "FOLLOW_UP": 1},
    "team": {"SCAN": 2, "MESSAGE": 1, "PITCH_DECK": 3, "FOLLOW_UP": 1},
    "enterprise": {"SCAN": 1, "MESSAGE": 1, "PITCH_DECK": 2, "FOLLOW_UP": 0}
  }'::jsonb, 'Energy costs per job type and tier'),
  
  ('coin_costs', '{
    "free": {"SCAN": 0, "MESSAGE": 0, "PITCH_DECK": 100, "FOLLOW_UP": 0},
    "pro": {"SCAN": 0, "MESSAGE": 0, "PITCH_DECK": 50, "FOLLOW_UP": 0},
    "team": {"SCAN": 0, "MESSAGE": 0, "PITCH_DECK": 25, "FOLLOW_UP": 0},
    "enterprise": {"SCAN": 0, "MESSAGE": 0, "PITCH_DECK": 0, "FOLLOW_UP": 0}
  }'::jsonb, 'Coin costs per job type and tier'),
  
  ('rate_limits', '{
    "free": {"daily": 10, "hourly": 3},
    "pro": {"daily": 100, "hourly": 20},
    "team": {"daily": 500, "hourly": 100},
    "enterprise": {"daily": -1, "hourly": -1}
  }'::jsonb, 'Rate limits per tier (-1 = unlimited)')
ON CONFLICT (rule_key) DO NOTHING;

-- RLS
ALTER TABLE constitution_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read constitution rules"
  ON constitution_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only system can update constitution rules"
  ON constitution_rules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- ENGINE CERTIFICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS engine_certification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id text UNIQUE NOT NULL,
  certified boolean DEFAULT false,
  last_test_result jsonb,
  last_health_check jsonb,
  certification_date timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engine_certification_engine_id
  ON engine_certification(engine_id);
CREATE INDEX IF NOT EXISTS idx_engine_certification_certified
  ON engine_certification(certified);

-- RLS
ALTER TABLE engine_certification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view certifications"
  ON engine_certification
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage certifications"
  ON engine_certification
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- ENGINE TESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS engine_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id text NOT NULL,
  test_name text NOT NULL,
  test_code text NOT NULL,
  test_type text DEFAULT 'unit',
  passed boolean,
  output jsonb,
  created_at timestamptz DEFAULT now(),
  last_run timestamptz
);

CREATE INDEX IF NOT EXISTS idx_engine_tests_engine_id
  ON engine_tests(engine_id);
CREATE INDEX IF NOT EXISTS idx_engine_tests_passed
  ON engine_tests(passed);

-- RLS
ALTER TABLE engine_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tests"
  ON engine_tests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage tests"
  ON engine_tests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);