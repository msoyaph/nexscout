/*
  # Create Master Orchestrator Engine v10.0 System

  1. New Tables
    - `orchestrator_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `job_type` (text)
      - `sub_type` (text, nullable)
      - `source` (text)
      - `engine_used` (text, nullable)
      - `model_used` (text, nullable)
      - `tier` (text)
      - `energy_cost` (integer)
      - `coin_cost` (integer)
      - `status` (text)
      - `duration_ms` (integer, nullable)
      - `metadata` (jsonb, nullable)
      - `error_message` (text, nullable)
      - `warnings` (jsonb, nullable)
      - `audit_trail_id` (uuid, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `orchestrator_job_costs`
      - `id` (uuid, primary key)
      - `job_type` (text)
      - `tier` (text)
      - `energy_cost_base` (integer)
      - `coin_cost_base` (integer)
      - `rate_limit_per_hour` (integer)
      - `rate_limit_per_day` (integer)
      - `model_preference` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)

    - `orchestrator_rate_limits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `job_type` (text)
      - `hour_count` (integer)
      - `day_count` (integer)
      - `hour_window_start` (timestamptz)
      - `day_window_start` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to view own data
    - Add policies for system to insert/update

  3. Indexes
    - Add indexes on user_id, job_type, status for fast queries
    - Add composite index on (user_id, created_at) for timeline queries
*/

-- Create orchestrator_events table
CREATE TABLE IF NOT EXISTS orchestrator_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  sub_type text,
  source text NOT NULL,
  engine_used text,
  model_used text,
  tier text NOT NULL,
  energy_cost integer DEFAULT 0,
  coin_cost integer DEFAULT 0,
  status text NOT NULL CHECK (status IN ('STARTED', 'COMPLETED', 'BLOCKED', 'FAILED')),
  duration_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  error_message text,
  warnings jsonb DEFAULT '[]'::jsonb,
  audit_trail_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orchestrator_job_costs table
CREATE TABLE IF NOT EXISTS orchestrator_job_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  tier text NOT NULL,
  energy_cost_base integer NOT NULL DEFAULT 10,
  coin_cost_base integer NOT NULL DEFAULT 0,
  rate_limit_per_hour integer NOT NULL DEFAULT 100,
  rate_limit_per_day integer NOT NULL DEFAULT 500,
  model_preference text NOT NULL DEFAULT 'gpt-4o-mini',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_type, tier)
);

-- Create orchestrator_rate_limits table
CREATE TABLE IF NOT EXISTS orchestrator_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  hour_count integer DEFAULT 0,
  day_count integer DEFAULT 0,
  hour_window_start timestamptz DEFAULT now(),
  day_window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_type)
);

-- Enable RLS
ALTER TABLE orchestrator_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_job_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orchestrator_events
CREATE POLICY "Users can view own orchestrator events"
  ON orchestrator_events FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "System can insert orchestrator events"
  ON orchestrator_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "System can update orchestrator events"
  ON orchestrator_events FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- RLS Policies for orchestrator_job_costs (public read)
CREATE POLICY "Authenticated users can view job costs"
  ON orchestrator_job_costs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for orchestrator_rate_limits
CREATE POLICY "Users can view own rate limits"
  ON orchestrator_rate_limits FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "System can manage rate limits"
  ON orchestrator_rate_limits FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Indexes for performance
CREATE INDEX idx_orchestrator_events_user_id ON orchestrator_events(user_id);
CREATE INDEX idx_orchestrator_events_job_type ON orchestrator_events(job_type);
CREATE INDEX idx_orchestrator_events_status ON orchestrator_events(status);
CREATE INDEX idx_orchestrator_events_user_created ON orchestrator_events(user_id, created_at DESC);
CREATE INDEX idx_orchestrator_events_tier ON orchestrator_events(tier);

CREATE INDEX idx_orchestrator_job_costs_job_type_tier ON orchestrator_job_costs(job_type, tier);

CREATE INDEX idx_orchestrator_rate_limits_user_job ON orchestrator_rate_limits(user_id, job_type);

-- Seed orchestrator_job_costs with base configurations
INSERT INTO orchestrator_job_costs (job_type, tier, energy_cost_base, coin_cost_base, rate_limit_per_hour, rate_limit_per_day, model_preference) VALUES
-- Free tier
('SCAN', 'free', 20, 0, 5, 20, 'gpt-4o-mini'),
('MESSAGE', 'free', 15, 0, 10, 50, 'gpt-4o-mini'),
('PITCH_DECK', 'free', 0, 50, 2, 5, 'gpt-4o-mini'),
('CHATBOT', 'free', 10, 0, 20, 100, 'gpt-4o-mini'),
('FOLLOW_UP', 'free', 12, 0, 10, 40, 'gpt-4o-mini'),
('COMPANY_INTELLIGENCE', 'free', 25, 0, 3, 10, 'gpt-4o-mini'),
('PUBLIC_CHATBOT', 'free', 5, 0, 50, 200, 'gpt-4o-mini'),
('ANALYTICS_QUERY', 'free', 8, 0, 15, 60, 'gpt-4o-mini'),

-- Pro tier
('SCAN', 'pro', 15, 0, 50, 200, 'gpt-4o'),
('MESSAGE', 'pro', 10, 0, 100, 500, 'gpt-4o'),
('PITCH_DECK', 'pro', 0, 30, 10, 50, 'gpt-4o'),
('CHATBOT', 'pro', 8, 0, 200, 1000, 'gpt-4o'),
('FOLLOW_UP', 'pro', 10, 0, 100, 400, 'gpt-4o'),
('COMPANY_INTELLIGENCE', 'pro', 20, 0, 20, 100, 'gpt-4o'),
('PUBLIC_CHATBOT', 'pro', 4, 0, 500, 2000, 'gpt-4o'),
('ANALYTICS_QUERY', 'pro', 6, 0, 50, 200, 'gpt-4o'),

-- Team tier
('SCAN', 'team', 12, 0, 100, 500, 'gpt-4o'),
('MESSAGE', 'team', 8, 0, 200, 1000, 'gpt-4o'),
('PITCH_DECK', 'team', 0, 20, 25, 100, 'gpt-4o'),
('CHATBOT', 'team', 6, 0, 500, 2500, 'gpt-4o'),
('FOLLOW_UP', 'team', 8, 0, 200, 800, 'gpt-4o'),
('COMPANY_INTELLIGENCE', 'team', 15, 0, 50, 250, 'gpt-4o'),
('PUBLIC_CHATBOT', 'team', 3, 0, 1000, 5000, 'gpt-4o'),
('ANALYTICS_QUERY', 'team', 5, 0, 100, 500, 'gpt-4o'),

-- Enterprise tier
('SCAN', 'enterprise', 10, 0, 500, 5000, 'gpt-4o'),
('MESSAGE', 'enterprise', 6, 0, 1000, 10000, 'gpt-4o'),
('PITCH_DECK', 'enterprise', 0, 10, 100, 1000, 'gpt-4o'),
('CHATBOT', 'enterprise', 5, 0, 2000, 20000, 'gpt-4o'),
('FOLLOW_UP', 'enterprise', 6, 0, 1000, 10000, 'gpt-4o'),
('COMPANY_INTELLIGENCE', 'enterprise', 12, 0, 200, 2000, 'gpt-4o'),
('PUBLIC_CHATBOT', 'enterprise', 2, 0, 5000, 50000, 'gpt-4o'),
('ANALYTICS_QUERY', 'enterprise', 4, 0, 500, 5000, 'gpt-4o')
ON CONFLICT (job_type, tier) DO NOTHING;
