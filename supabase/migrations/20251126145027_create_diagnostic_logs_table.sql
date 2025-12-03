/*
  # Create Diagnostic Logs Table

  1. New Tables
    - `diagnostic_logs`
      - `id` (uuid, primary key)
      - `category` (text) - Type of diagnostic check
      - `message` (text) - Human-readable message
      - `result` (jsonb) - Full diagnostic result
      - `created_at` (timestamptz) - When the check ran

  2. Security
    - Enable RLS on `diagnostic_logs` table
    - Only authenticated users can read their own diagnostic logs
    - System can insert logs without user context
*/

CREATE TABLE IF NOT EXISTS diagnostic_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  category text NOT NULL,
  message text NOT NULL,
  result jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diagnostic_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diagnostic logs"
  ON diagnostic_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert diagnostic logs"
  ON diagnostic_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_diagnostic_logs_user_id ON diagnostic_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_logs_category ON diagnostic_logs(category);
CREATE INDEX IF NOT EXISTS idx_diagnostic_logs_created_at ON diagnostic_logs(created_at DESC);
