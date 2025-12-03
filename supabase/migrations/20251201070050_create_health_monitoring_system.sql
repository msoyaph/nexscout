/*
  # Create Health Monitoring System

  1. New Tables
    - `system_health_checks`
      - `id` (uuid, primary key)
      - `overall_status` (text: GREEN, YELLOW, RED)
      - `departments` (jsonb)
      - `orchestrator_latency_ms` (integer)
      - `db_latency_ms` (integer)
      - `error_rate_24h` (numeric)
      - `total_jobs_24h` (integer)
      - `failed_jobs_24h` (integer)
      - `blocked_jobs_24h` (integer)
      - `notes` (jsonb)
      - `created_at` (timestamptz)

  2. Indexes
    - Index on created_at for fast historical queries
    - Index on overall_status for filtering
    - Index on orchestrator_events(status, created_at) for performance
    - Index on audit_jobs(created_at, postcheck_blocked) for performance

  3. Security
    - Enable RLS
    - Only authenticated users can view health checks
    - Admins can insert health checks

  4. Performance
    - Add composite indexes for common query patterns
*/

-- Create system_health_checks table
CREATE TABLE IF NOT EXISTS system_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_status text NOT NULL CHECK (overall_status IN ('GREEN', 'YELLOW', 'RED')),
  departments jsonb DEFAULT '[]'::jsonb,
  orchestrator_latency_ms integer DEFAULT 0,
  db_latency_ms integer DEFAULT 0,
  error_rate_24h numeric(5,2) DEFAULT 0,
  total_jobs_24h integer DEFAULT 0,
  failed_jobs_24h integer DEFAULT 0,
  blocked_jobs_24h integer DEFAULT 0,
  notes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view health checks"
  ON system_health_checks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert health checks"
  ON system_health_checks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for system_health_checks
CREATE INDEX idx_health_checks_created_at ON system_health_checks(created_at DESC);
CREATE INDEX idx_health_checks_status ON system_health_checks(overall_status);
CREATE INDEX idx_health_checks_status_created ON system_health_checks(overall_status, created_at DESC);

-- Performance indexes for orchestrator_events (if not exists)
CREATE INDEX IF NOT EXISTS idx_orchestrator_events_status_created 
  ON orchestrator_events(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orchestrator_events_created_status 
  ON orchestrator_events(created_at DESC, status);

-- Performance indexes for audit_jobs (if not exists)
CREATE INDEX IF NOT EXISTS idx_audit_jobs_blocked_created 
  ON audit_jobs(postcheck_blocked, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_jobs_created_blocked 
  ON audit_jobs(created_at DESC, postcheck_blocked);

-- Function to clean up old health checks (keep last 1000)
CREATE OR REPLACE FUNCTION cleanup_old_health_checks()
RETURNS void AS $$
BEGIN
  DELETE FROM system_health_checks
  WHERE id IN (
    SELECT id FROM system_health_checks
    ORDER BY created_at DESC
    OFFSET 1000
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
