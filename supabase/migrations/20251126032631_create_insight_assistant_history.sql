/*
  # Insight Assistant History Table

  Stores conversational analytics query history for Super Admins.

  ## New Tables
  - `insight_assistant_history` - Query and response log

  ## Security
  - Admin-only access via RLS
*/

CREATE TABLE IF NOT EXISTS insight_assistant_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  question text NOT NULL,
  response jsonb NOT NULL,
  intent text NOT NULL,
  priority_score integer,
  
  session_id text,
  query_time_ms integer,
  
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_insight_history_admin ON insight_assistant_history(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_insight_history_created ON insight_assistant_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insight_history_intent ON insight_assistant_history(intent);

-- RLS
ALTER TABLE insight_assistant_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can access insight history"
  ON insight_assistant_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role_id IN (
        SELECT id FROM admin_roles WHERE role_name = 'super_admin'
      )
    )
  );