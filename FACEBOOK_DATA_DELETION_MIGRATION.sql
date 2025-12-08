-- Facebook Data Deletion Request Table Migration
-- 
-- Run this in Supabase SQL Editor to create the data_deletion_requests table
-- This table tracks all data deletion requests from Facebook and other providers

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('facebook', 'google', 'linkedin', 'twitter')),
  confirmation_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_confirmation_code ON data_deletion_requests(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_provider ON data_deletion_requests(provider);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);

-- Enable Row Level Security
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own deletion requests
CREATE POLICY "Users can view own deletion requests"
  ON data_deletion_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role has full access (for Edge Functions)
CREATE POLICY "Service role full access"
  ON data_deletion_requests
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_data_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_data_deletion_requests_updated_at
  BEFORE UPDATE ON data_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_data_deletion_requests_updated_at();




