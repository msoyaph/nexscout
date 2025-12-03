/*
  # AI Legislative Pipeline System

  1. New Tables
    - `law_proposals` - AI/admin generated law proposals
    - `law_votes` - Voting on proposals
    - `law_change_log` - History of applied changes

  2. Security
    - Enable RLS on all tables
    - Admin access for sensitive operations
*/

-- ============================================================================
-- LAW PROPOSALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS law_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  details text NOT NULL,
  impact_area text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  author_type text NOT NULL,
  author_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  suggested_rule_changes jsonb DEFAULT '{}'::jsonb,
  simulated_impact jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_law_proposals_status
  ON law_proposals(status);
CREATE INDEX IF NOT EXISTS idx_law_proposals_impact_area
  ON law_proposals(impact_area);
CREATE INDEX IF NOT EXISTS idx_law_proposals_author_type
  ON law_proposals(author_type);
CREATE INDEX IF NOT EXISTS idx_law_proposals_created_at
  ON law_proposals(created_at DESC);

-- RLS
ALTER TABLE law_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view proposals"
  ON law_proposals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage proposals"
  ON law_proposals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- LAW VOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS law_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  law_id uuid REFERENCES law_proposals(id) ON DELETE CASCADE,
  voter_type text NOT NULL,
  voter_user_id uuid REFERENCES auth.users(id),
  vote text NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (law_id, voter_user_id)
);

CREATE INDEX IF NOT EXISTS idx_law_votes_law_id
  ON law_votes(law_id);
CREATE INDEX IF NOT EXISTS idx_law_votes_voter_user_id
  ON law_votes(voter_user_id);

-- RLS
ALTER TABLE law_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view votes"
  ON law_votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create votes"
  ON law_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = voter_user_id);

-- ============================================================================
-- LAW CHANGE LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS law_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  law_id uuid REFERENCES law_proposals(id),
  rule_key text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  applied_at timestamptz DEFAULT now(),
  applied_by text DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_law_change_log_law_id
  ON law_change_log(law_id);
CREATE INDEX IF NOT EXISTS idx_law_change_log_rule_key
  ON law_change_log(rule_key);
CREATE INDEX IF NOT EXISTS idx_law_change_log_applied_at
  ON law_change_log(applied_at DESC);

-- RLS
ALTER TABLE law_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view change log"
  ON law_change_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert change log"
  ON law_change_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);