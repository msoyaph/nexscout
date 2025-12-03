/*
  # Onboarding System v2.0 - Time-to-Value < 90 Seconds

  1. New Tables
    - `onboarding_progress` - Track user onboarding stage and completion
    - `aha_events` - Record critical "aha moments" that predict retention
    - `onboarding_nudges` - Contextual nudges during onboarding
    - `quick_wins` - Track first 5 wins checklist
    - `onboarding_analytics` - Funnel metrics and dropoff analysis

  2. Features
    - 90-second quickstart wizard
    - Aha moment detection and rewards
    - Contextual nudge system
    - Industry-specific templates
    - Auto-setup for chatbot, pipeline, missions
    - Progress tracking and analytics

  3. Security
    - Full RLS on all tables
    - User-scoped access
    - Admin analytics access
*/

-- Onboarding Progress Table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stage text DEFAULT 'started',
  last_step text,
  industry text,
  product_added boolean DEFAULT false,
  company_added boolean DEFAULT false,
  chatbot_setup boolean DEFAULT false,
  pipeline_setup boolean DEFAULT false,
  first_lead_captured boolean DEFAULT false,
  first_followup_sent boolean DEFAULT false,
  quick_win boolean DEFAULT false,
  completed_at timestamptz,
  wizard_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_stage ON onboarding_progress(stage);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_quick_win ON onboarding_progress(quick_win);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_created ON onboarding_progress(created_at DESC);

CREATE POLICY "Users can view own onboarding progress"
  ON onboarding_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress"
  ON onboarding_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
  ON onboarding_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Aha Events Table
CREATE TABLE IF NOT EXISTS aha_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  xp_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aha_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_aha_events_user ON aha_events(user_id);
CREATE INDEX IF NOT EXISTS idx_aha_events_type ON aha_events(type);
CREATE INDEX IF NOT EXISTS idx_aha_events_created ON aha_events(created_at DESC);

CREATE POLICY "Users can view own aha events"
  ON aha_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own aha events"
  ON aha_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Onboarding Nudges Table
CREATE TABLE IF NOT EXISTS onboarding_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  nudge_type text NOT NULL,
  action_url text,
  action_label text,
  seen boolean DEFAULT false,
  dismissed boolean DEFAULT false,
  acted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_nudges ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_nudges_user ON onboarding_nudges(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_nudges_seen ON onboarding_nudges(seen);
CREATE INDEX IF NOT EXISTS idx_onboarding_nudges_created ON onboarding_nudges(created_at DESC);

CREATE POLICY "Users can view own onboarding nudges"
  ON onboarding_nudges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding nudges"
  ON onboarding_nudges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding nudges"
  ON onboarding_nudges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quick Wins Checklist Table
CREATE TABLE IF NOT EXISTS quick_wins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  win_type text NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quick_wins ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_quick_wins_user ON quick_wins(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_wins_completed ON quick_wins(completed);
CREATE INDEX IF NOT EXISTS idx_quick_wins_type ON quick_wins(win_type);

CREATE POLICY "Users can view own quick wins"
  ON quick_wins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quick wins"
  ON quick_wins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quick wins"
  ON quick_wins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Onboarding Analytics Table (Admin Access)
CREATE TABLE IF NOT EXISTS onboarding_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  industry text,
  total_started integer DEFAULT 0,
  completed_wizard integer DEFAULT 0,
  product_added integer DEFAULT 0,
  company_added integer DEFAULT 0,
  chatbot_setup integer DEFAULT 0,
  first_lead integer DEFAULT 0,
  quick_wins integer DEFAULT 0,
  avg_ttv_seconds integer DEFAULT 0,
  aha_moments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_analytics ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_date ON onboarding_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_industry ON onboarding_analytics(industry);

CREATE POLICY "Admins can view onboarding analytics"
  ON onboarding_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage onboarding analytics"
  ON onboarding_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Function to initialize quick wins for new user
CREATE OR REPLACE FUNCTION initialize_quick_wins()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO quick_wins (user_id, win_type)
  VALUES
    (NEW.user_id, 'add_product'),
    (NEW.user_id, 'setup_chatbot'),
    (NEW.user_id, 'capture_first_lead'),
    (NEW.user_id, 'send_first_followup'),
    (NEW.user_id, 'book_first_appointment');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_initialize_quick_wins
  AFTER INSERT ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION initialize_quick_wins();

-- Function to update onboarding_progress timestamp
CREATE OR REPLACE FUNCTION update_onboarding_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_progress_timestamp
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress_timestamp();