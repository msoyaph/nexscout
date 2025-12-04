/*
  # Citizen Feedback System

  1. New Tables
    - `citizen_feedback` - User feedback submissions
    - `citizen_feedback_votes` - Voting on feedback

  2. Security
    - Enable RLS on all tables
    - Users can manage own feedback
*/

-- ============================================================================
-- CITIZEN FEEDBACK
-- ============================================================================

CREATE TABLE IF NOT EXISTS citizen_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  source_page text,
  related_engine_id text,
  feedback_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  sentiment text DEFAULT 'neutral',
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citizen_feedback_user_id
  ON citizen_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_citizen_feedback_status
  ON citizen_feedback(status);
CREATE INDEX IF NOT EXISTS idx_citizen_feedback_type
  ON citizen_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_citizen_feedback_sentiment
  ON citizen_feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_citizen_feedback_created_at
  ON citizen_feedback(created_at DESC);

-- RLS
ALTER TABLE citizen_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all feedback"
  ON citizen_feedback
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own feedback"
  ON citizen_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON citizen_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage all feedback"
  ON citizen_feedback
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- CITIZEN FEEDBACK VOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS citizen_feedback_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid REFERENCES citizen_feedback(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz DEFAULT now(),
  UNIQUE (feedback_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_citizen_feedback_votes_feedback_id
  ON citizen_feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_citizen_feedback_votes_user_id
  ON citizen_feedback_votes(user_id);

-- RLS
ALTER TABLE citizen_feedback_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all votes"
  ON citizen_feedback_votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own votes"
  ON citizen_feedback_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON citizen_feedback_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);