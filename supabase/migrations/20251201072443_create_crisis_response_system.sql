/*
  # Crisis Response System

  1. New Tables
    - `crisis_policies` - Threshold configuration per engine
    - `crisis_incidents` - Active crisis tracking
    - `engine_states` - Current engine health status
    - `engine_fallback_logs` - Fallback routing history

  2. Security
    - Enable RLS on all tables
    - Admin access policies
*/

-- ============================================================================
-- CRISIS POLICIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS crisis_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id text NOT NULL UNIQUE,
  threshold_error_rate numeric DEFAULT 0.15,
  threshold_latency_ms integer DEFAULT 4000,
  threshold_queue_length integer DEFAULT 50,
  action_on_yellow text DEFAULT 'degrade',
  action_on_red text DEFAULT 'fallback',
  fallback_engine_ids text[],
  allow_degraded boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crisis_policies_engine_id
  ON crisis_policies(engine_id);

-- Seed default policies for key engines
INSERT INTO crisis_policies (engine_id, fallback_engine_ids)
VALUES
  ('SCAN_DEEP', ARRAY['SCAN_BASIC']::text[]),
  ('AI_MESSAGE', ARRAY['AI_MESSAGE_SIMPLE']::text[]),
  ('CHATBOT_PUBLIC', ARRAY['CHATBOT_BASIC']::text[]),
  ('PITCH_DECK', ARRAY['PITCH_DECK_SIMPLE']::text[])
ON CONFLICT (engine_id) DO NOTHING;

-- RLS
ALTER TABLE crisis_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view crisis policies"
  ON crisis_policies FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage crisis policies"
  ON crisis_policies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- CRISIS INCIDENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS crisis_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN',
  severity text NOT NULL,
  reason text,
  started_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  active_fallback_engine_id text,
  meta jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_crisis_incidents_engine_id
  ON crisis_incidents(engine_id);
CREATE INDEX IF NOT EXISTS idx_crisis_incidents_status
  ON crisis_incidents(status);
CREATE INDEX IF NOT EXISTS idx_crisis_incidents_severity
  ON crisis_incidents(severity);

-- RLS
ALTER TABLE crisis_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view incidents"
  ON crisis_incidents FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage incidents"
  ON crisis_incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- ENGINE STATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS engine_states (
  engine_id text PRIMARY KEY,
  status text NOT NULL DEFAULT 'GREEN',
  last_updated timestamptz DEFAULT now(),
  last_reason text,
  active_fallback_engine_id text,
  metrics jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_engine_states_status
  ON engine_states(status);

-- RLS
ALTER TABLE engine_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view engine states"
  ON engine_states FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage engine states"
  ON engine_states FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- ENGINE FALLBACK LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS engine_fallback_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text,
  original_engine_id text NOT NULL,
  fallback_engine_id text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engine_fallback_logs_original
  ON engine_fallback_logs(original_engine_id);
CREATE INDEX IF NOT EXISTS idx_engine_fallback_logs_fallback
  ON engine_fallback_logs(fallback_engine_id);
CREATE INDEX IF NOT EXISTS idx_engine_fallback_logs_created_at
  ON engine_fallback_logs(created_at DESC);

-- RLS
ALTER TABLE engine_fallback_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view fallback logs"
  ON engine_fallback_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert fallback logs"
  ON engine_fallback_logs FOR INSERT TO authenticated WITH CHECK (true);