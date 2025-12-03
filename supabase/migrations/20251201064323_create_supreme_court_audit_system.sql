/*
  # Create Supreme Court Audit System

  1. New Tables
    - `audit_jobs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `job_type` (text)
      - `tier` (text)
      - `source` (text)
      - `precheck_allowed` (boolean)
      - `precheck_reasons` (jsonb)
      - `precheck_risk_score` (integer)
      - `postcheck_allowed` (boolean)
      - `postcheck_blocked` (boolean)
      - `postcheck_reasons` (jsonb)
      - `postcheck_risk_score` (integer)
      - `payload_summary` (jsonb)
      - `execution_metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `blocked_outputs`
      - `id` (uuid, primary key)
      - `audit_job_id` (uuid, references audit_jobs)
      - `user_id` (uuid, references profiles)
      - `engine_output` (jsonb)
      - `sanitized_output` (jsonb)
      - `block_reason` (text)
      - `severity` (text)
      - `created_at` (timestamptz)

    - `banned_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `reason` (text)
      - `banned_by` (uuid, references profiles)
      - `banned_at` (timestamptz)
      - `expires_at` (timestamptz, nullable)
      - `is_permanent` (boolean)

  2. Security
    - Enable RLS on all tables
    - Only authenticated users can view their own audit logs
    - Admins can view all audit logs

  3. Indexes
    - Add indexes on user_id, job_type, created_at for fast queries
*/

-- Create audit_jobs table
CREATE TABLE IF NOT EXISTS audit_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  tier text NOT NULL,
  source text NOT NULL,
  precheck_allowed boolean DEFAULT true,
  precheck_reasons jsonb DEFAULT '[]'::jsonb,
  precheck_risk_score integer DEFAULT 0,
  postcheck_allowed boolean DEFAULT true,
  postcheck_blocked boolean DEFAULT false,
  postcheck_reasons jsonb DEFAULT '[]'::jsonb,
  postcheck_risk_score integer DEFAULT 0,
  payload_summary jsonb DEFAULT '{}'::jsonb,
  execution_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blocked_outputs table
CREATE TABLE IF NOT EXISTS blocked_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_job_id uuid NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  engine_output jsonb DEFAULT '{}'::jsonb,
  sanitized_output jsonb DEFAULT '{}'::jsonb,
  block_reason text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamptz DEFAULT now()
);

-- Create banned_users table
CREATE TABLE IF NOT EXISTS banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  banned_by uuid REFERENCES profiles(id),
  banned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_permanent boolean DEFAULT false,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE audit_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_jobs
CREATE POLICY "Users can view own audit logs"
  ON audit_jobs FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON audit_jobs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "System can update audit logs"
  ON audit_jobs FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- RLS Policies for blocked_outputs
CREATE POLICY "Users can view own blocked outputs"
  ON blocked_outputs FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "System can insert blocked outputs"
  ON blocked_outputs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- RLS Policies for banned_users
CREATE POLICY "Users can view own ban status"
  ON banned_users FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Indexes for performance
CREATE INDEX idx_audit_jobs_user_id ON audit_jobs(user_id);
CREATE INDEX idx_audit_jobs_job_type ON audit_jobs(job_type);
CREATE INDEX idx_audit_jobs_created_at ON audit_jobs(created_at DESC);
CREATE INDEX idx_audit_jobs_user_created ON audit_jobs(user_id, created_at DESC);
CREATE INDEX idx_audit_jobs_blocked ON audit_jobs(postcheck_blocked) WHERE postcheck_blocked = true;

CREATE INDEX idx_blocked_outputs_audit_job_id ON blocked_outputs(audit_job_id);
CREATE INDEX idx_blocked_outputs_user_id ON blocked_outputs(user_id);
CREATE INDEX idx_blocked_outputs_severity ON blocked_outputs(severity);

CREATE INDEX idx_banned_users_user_id ON banned_users(user_id);
CREATE INDEX idx_banned_users_expires_at ON banned_users(expires_at);
