/*
  # Self-Learning Onboarding v4.0 - AI that Learns from Real Users

  1. New Tables
    - `onboarding_flow_patterns` - Discovered successful flow patterns per persona
    - `onboarding_flow_assignments` - Which flow each user got (explore/exploit)
    - `onboarding_journey_metrics` - Outcome metrics per user journey
    - `onboarding_learning_jobs` - Log of learning job runs

  2. Features
    - Automatic pattern discovery from real user journeys
    - Epsilon-greedy exploration/exploitation
    - Champion flow election per persona
    - Win score calculation (7d + 30d retention + time-to-win)
    - Safe experimentation with rollback capability

  3. SQL Functions
    - get_recent_onboarding_journeys() - Fetch data for learning
    - record_onboarding_outcome() - Mark activation/retention
    - elect_champion_flows() - Determine best flows per persona

  4. Security
    - Admin-only access to flow patterns and assignments
    - RLS on all tables
*/

-- Onboarding Flow Patterns Table (Discovered Flows)
CREATE TABLE IF NOT EXISTS onboarding_flow_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona text NOT NULL,
  flow_id text NOT NULL,
  steps text[] NOT NULL,
  win_rate_7d float DEFAULT 0,
  win_rate_30d float DEFAULT 0,
  avg_time_to_first_win_minutes float DEFAULT 0,
  sample_size integer DEFAULT 0,
  win_score float DEFAULT 0,
  exploration_priority float DEFAULT 0,
  suggested_variant text DEFAULT 'fast_track_90s',
  is_champion boolean DEFAULT false,
  last_champion_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(persona, flow_id)
);

ALTER TABLE onboarding_flow_patterns ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_flow_patterns_persona ON onboarding_flow_patterns(persona);
CREATE INDEX IF NOT EXISTS idx_flow_patterns_win_score ON onboarding_flow_patterns(win_score DESC);
CREATE INDEX IF NOT EXISTS idx_flow_patterns_champion ON onboarding_flow_patterns(is_champion) WHERE is_champion = true;
CREATE INDEX IF NOT EXISTS idx_flow_patterns_sample_size ON onboarding_flow_patterns(sample_size);

CREATE POLICY "Admins can view flow patterns"
  ON onboarding_flow_patterns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage flow patterns"
  ON onboarding_flow_patterns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Onboarding Flow Assignments Table (User-Flow Mapping)
CREATE TABLE IF NOT EXISTS onboarding_flow_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona text NOT NULL,
  flow_id text,
  assigned_at timestamptz DEFAULT now(),
  mode text CHECK (mode IN ('explore', 'exploit')) DEFAULT 'exploit',
  activated_7d boolean DEFAULT false,
  retained_30d boolean DEFAULT false,
  upgraded boolean DEFAULT false,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE onboarding_flow_assignments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_flow_assignments_user ON onboarding_flow_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_flow_assignments_persona ON onboarding_flow_assignments(persona);
CREATE INDEX IF NOT EXISTS idx_flow_assignments_flow ON onboarding_flow_assignments(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_assignments_mode ON onboarding_flow_assignments(mode);

CREATE POLICY "Users can view own flow assignment"
  ON onboarding_flow_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flow assignment"
  ON onboarding_flow_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flow assignment"
  ON onboarding_flow_assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all flow assignments"
  ON onboarding_flow_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Onboarding Journey Metrics Table (Outcome Tracking)
CREATE TABLE IF NOT EXISTS onboarding_journey_metrics (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  activated_7d boolean DEFAULT false,
  retained_30d boolean DEFAULT false,
  upgraded boolean DEFAULT false,
  time_to_first_win_minutes integer,
  first_aha_moment_at timestamptz,
  activation_event text,
  completion_rate float DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_journey_metrics ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_journey_metrics_activated ON onboarding_journey_metrics(activated_7d);
CREATE INDEX IF NOT EXISTS idx_journey_metrics_retained ON onboarding_journey_metrics(retained_30d);
CREATE INDEX IF NOT EXISTS idx_journey_metrics_upgraded ON onboarding_journey_metrics(upgraded);

CREATE POLICY "Users can view own journey metrics"
  ON onboarding_journey_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey metrics"
  ON onboarding_journey_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journey metrics"
  ON onboarding_journey_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all journey metrics"
  ON onboarding_journey_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Onboarding Learning Jobs Log Table
CREATE TABLE IF NOT EXISTS onboarding_learning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  status text DEFAULT 'running',
  patterns_discovered integer DEFAULT 0,
  champions_updated integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE onboarding_learning_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_learning_jobs_started ON onboarding_learning_jobs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_jobs_status ON onboarding_learning_jobs(status);

CREATE POLICY "Admins can view learning jobs"
  ON onboarding_learning_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage learning jobs"
  ON onboarding_learning_jobs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Function to fetch recent journeys for learning
CREATE OR REPLACE FUNCTION get_recent_onboarding_journeys()
RETURNS TABLE (
  user_id uuid,
  persona text,
  steps text[],
  activated_7d boolean,
  retained_30d boolean,
  time_to_first_win_minutes integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    ojs.user_id,
    COALESCE(op.persona, 'power_user_unknown') as persona,
    ojs.completed_steps as steps,
    COALESCE(ojm.activated_7d, false) as activated_7d,
    COALESCE(ojm.retained_30d, false) as retained_30d,
    ojm.time_to_first_win_minutes
  FROM onboarding_journey_state ojs
  LEFT JOIN onboarding_personalization op ON op.user_id = ojs.user_id
  LEFT JOIN onboarding_journey_metrics ojm ON ojm.user_id = ojs.user_id
  WHERE ojs.last_updated > now() - interval '30 days'
    AND array_length(ojs.completed_steps, 1) > 0
  ORDER BY ojs.last_updated DESC;
$$;

-- Function to record onboarding outcome
CREATE OR REPLACE FUNCTION record_onboarding_outcome(
  p_user_id uuid,
  p_outcome text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO onboarding_flow_assignments (user_id, persona, mode)
  VALUES (p_user_id, 'power_user_unknown', 'exploit')
  ON CONFLICT (user_id) DO NOTHING;

  IF p_outcome = 'activated' THEN
    UPDATE onboarding_flow_assignments
    SET activated_7d = true, last_updated = now()
    WHERE user_id = p_user_id;

    INSERT INTO onboarding_journey_metrics (user_id, activated_7d)
    VALUES (p_user_id, true)
    ON CONFLICT (user_id)
    DO UPDATE SET activated_7d = true, updated_at = now();

  ELSIF p_outcome = 'retained_30d' THEN
    UPDATE onboarding_flow_assignments
    SET retained_30d = true, last_updated = now()
    WHERE user_id = p_user_id;

    INSERT INTO onboarding_journey_metrics (user_id, retained_30d)
    VALUES (p_user_id, true)
    ON CONFLICT (user_id)
    DO UPDATE SET retained_30d = true, updated_at = now();

  ELSIF p_outcome = 'upgraded' THEN
    UPDATE onboarding_flow_assignments
    SET upgraded = true, last_updated = now()
    WHERE user_id = p_user_id;

    INSERT INTO onboarding_journey_metrics (user_id, upgraded)
    VALUES (p_user_id, true)
    ON CONFLICT (user_id)
    DO UPDATE SET upgraded = true, updated_at = now();
  END IF;
END;
$$;

-- Function to elect champion flows per persona
CREATE OR REPLACE FUNCTION elect_champion_flows()
RETURNS TABLE (
  persona text,
  old_champion_flow_id text,
  new_champion_flow_id text,
  win_score_delta float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  persona_rec RECORD;
  old_champ RECORD;
  new_champ RECORD;
BEGIN
  FOR persona_rec IN
    SELECT DISTINCT ofp.persona
    FROM onboarding_flow_patterns ofp
  LOOP
    SELECT * INTO old_champ
    FROM onboarding_flow_patterns
    WHERE persona = persona_rec.persona AND is_champion = true
    LIMIT 1;

    SELECT * INTO new_champ
    FROM onboarding_flow_patterns
    WHERE persona = persona_rec.persona
      AND sample_size >= 30
    ORDER BY win_score DESC, sample_size DESC
    LIMIT 1;

    IF new_champ.id IS NOT NULL AND (old_champ.id IS NULL OR new_champ.id != old_champ.id) THEN
      UPDATE onboarding_flow_patterns
      SET is_champion = false
      WHERE persona = persona_rec.persona AND is_champion = true;

      UPDATE onboarding_flow_patterns
      SET is_champion = true, last_champion_at = now()
      WHERE id = new_champ.id;

      RETURN QUERY SELECT
        persona_rec.persona,
        old_champ.flow_id,
        new_champ.flow_id,
        new_champ.win_score - COALESCE(old_champ.win_score, 0.0);
    END IF;
  END LOOP;
END;
$$;

-- Trigger to update flow pattern timestamp
CREATE OR REPLACE FUNCTION update_flow_pattern_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  NEW.win_score = (
    (COALESCE(NEW.win_rate_7d, 0) * 0.5) +
    (COALESCE(NEW.win_rate_30d, 0) * 0.3) +
    (CASE
      WHEN NEW.avg_time_to_first_win_minutes > 0
      THEN (1.0 - LEAST(NEW.avg_time_to_first_win_minutes / 1440.0, 1.0)) * 0.2
      ELSE 0
    END)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_flow_pattern_timestamp
  BEFORE UPDATE ON onboarding_flow_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_flow_pattern_timestamp();

-- Trigger to update flow assignment timestamp
CREATE OR REPLACE FUNCTION update_flow_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_flow_assignment_timestamp
  BEFORE UPDATE ON onboarding_flow_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_flow_assignment_timestamp();

-- Add flow_id to onboarding_personalization if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onboarding_personalization' AND column_name = 'flow_id'
  ) THEN
    ALTER TABLE onboarding_personalization ADD COLUMN flow_id text;
  END IF;
END $$;