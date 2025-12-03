/*
  # ScoutScore v4 - Behavioral Timeline Engine

  1. New Tables
    - `contact_behavior_timeline` - Daily behavior tracking
    - `prospect_behavior_summary` - Aggregated timeline metrics

  2. Purpose
    - Track prospect behavior over 30-180 days
    - Compute momentum and opportunity phases
    - Power ScoutScore v4 with timeline intelligence

  3. Security
    - RLS on all tables
    - User-scoped access

  4. Indexes
    - Optimized for time-series queries
    - Fast aggregation lookups
*/

-- Contact behavior timeline (daily tracking)
CREATE TABLE IF NOT EXISTS contact_behavior_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES social_contacts(id) ON DELETE CASCADE,
  platform text CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'other')),
  date date NOT NULL,
  interactions integer DEFAULT 0,
  posts integer DEFAULT 0,
  comments integer DEFAULT 0,
  sentiment_score numeric DEFAULT 0,
  pain_point_score numeric DEFAULT 0,
  opportunity_signal_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, date)
);

CREATE INDEX IF NOT EXISTS idx_behavior_timeline_user_id ON contact_behavior_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_timeline_contact_id ON contact_behavior_timeline(contact_id);
CREATE INDEX IF NOT EXISTS idx_behavior_timeline_date ON contact_behavior_timeline(date DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_timeline_contact_date ON contact_behavior_timeline(contact_id, date DESC);

-- Prospect behavior summary (aggregated metrics)
CREATE TABLE IF NOT EXISTS prospect_behavior_summary (
  prospect_id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  last_30d_activity integer DEFAULT 0,
  last_90d_activity integer DEFAULT 0,
  last_90d_trend numeric DEFAULT 0,
  momentum_score numeric DEFAULT 0,
  recent_sentiment_score numeric DEFAULT 0,
  recent_opportunity_signals integer DEFAULT 0,
  timeline_strength numeric DEFAULT 0,
  opportunity_phase text,
  momentum_direction text CHECK (momentum_direction IN ('rising', 'stable', 'dropping')),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_behavior_summary_user_id ON prospect_behavior_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_summary_momentum ON prospect_behavior_summary(momentum_score DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_summary_timeline_strength ON prospect_behavior_summary(timeline_strength DESC);

-- RLS Policies

ALTER TABLE contact_behavior_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own timeline"
  ON contact_behavior_timeline FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own timeline"
  ON contact_behavior_timeline FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own timeline"
  ON contact_behavior_timeline FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE prospect_behavior_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own behavior summaries"
  ON prospect_behavior_summary FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own behavior summaries"
  ON prospect_behavior_summary FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own behavior summaries"
  ON prospect_behavior_summary FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());