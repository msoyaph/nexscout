/*
  # Deal Closing, Financial Profiling, and Gamification Systems

  1. New Tables
    - closing_scripts (deal closing engine)
    - financial_profiles (financial estimator)
    - pitch_angle_recommendations (pitch recommender)
    - viral_share_messages (viral share generator)
    - user_badges (badge system)
    - user_ranks (rank progression)
    - badge_definitions (badge catalog)
    - user_activity_logs (activity tracking for gamification)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

-- closing_scripts table
CREATE TABLE IF NOT EXISTS closing_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  closing_message text NOT NULL,
  value_stack jsonb DEFAULT '[]'::jsonb,
  risk_reversal text,
  primary_cta text NOT NULL,
  fallback_cta text NOT NULL,
  objection_preempt jsonb DEFAULT '[]'::jsonb,
  elite_negotiation_insight text,
  closing_style text,
  industry text,
  used boolean DEFAULT false,
  successful boolean,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_closing_user ON closing_scripts(user_id);
ALTER TABLE closing_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "closing_policy" ON closing_scripts FOR ALL TO authenticated 
  USING (auth.uid() = closing_scripts.user_id) 
  WITH CHECK (auth.uid() = closing_scripts.user_id);

-- financial_profiles table
CREATE TABLE IF NOT EXISTS financial_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  estimated_income_bracket text,
  spending_capacity text,
  risk_comfort text,
  financial_priorities jsonb DEFAULT '[]'::jsonb,
  recommended_offer_tier text,
  pitch_sensitivity text,
  elite_insights text,
  industry text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_user ON financial_profiles(user_id);
ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financial_policy" ON financial_profiles FOR ALL TO authenticated 
  USING (auth.uid() = financial_profiles.user_id) 
  WITH CHECK (auth.uid() = financial_profiles.user_id);

-- pitch_angle_recommendations table
CREATE TABLE IF NOT EXISTS pitch_angle_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  recommended_pitch_angle text NOT NULL,
  three_second_hook text NOT NULL,
  core_message_points jsonb DEFAULT '[]'::jsonb,
  avoid_this jsonb DEFAULT '[]'::jsonb,
  supporting_data text,
  elite_insights text,
  industry text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pitch_user ON pitch_angle_recommendations(user_id);
ALTER TABLE pitch_angle_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pitch_policy" ON pitch_angle_recommendations FOR ALL TO authenticated 
  USING (auth.uid() = pitch_angle_recommendations.user_id) 
  WITH CHECK (auth.uid() = pitch_angle_recommendations.user_id);

-- viral_share_messages table
CREATE TABLE IF NOT EXISTS viral_share_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viral_share_text text NOT NULL,
  hashtags jsonb DEFAULT '[]'::jsonb,
  emotion_trigger text,
  preview_card_title text,
  preview_card_subtitle text,
  elite_rewrite_options jsonb DEFAULT '[]'::jsonb,
  share_goal text,
  reward_type text,
  shared boolean DEFAULT false,
  share_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_viral_user ON viral_share_messages(user_id);
ALTER TABLE viral_share_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "viral_policy" ON viral_share_messages FOR ALL TO authenticated 
  USING (auth.uid() = viral_share_messages.user_id) 
  WITH CHECK (auth.uid() = viral_share_messages.user_id);

-- badge_definitions table (catalog of all badges)
CREATE TABLE IF NOT EXISTS badge_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_name text UNIQUE NOT NULL,
  badge_category text NOT NULL,
  description text NOT NULL,
  icon text,
  threshold_value integer,
  threshold_metric text,
  coin_reward integer DEFAULT 0,
  tier_requirement text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badge_def_read" ON badge_definitions FOR SELECT TO authenticated USING (true);

-- user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_policy" ON user_badges FOR ALL TO authenticated 
  USING (auth.uid() = user_badges.user_id) 
  WITH CHECK (auth.uid() = user_badges.user_id);

-- user_ranks table
CREATE TABLE IF NOT EXISTS user_ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_rank text DEFAULT 'Bronze',
  rank_points integer DEFAULT 0,
  next_rank text DEFAULT 'Silver',
  percent_to_next integer DEFAULT 0,
  leaderboard_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ranks_user ON user_ranks(user_id);
CREATE INDEX IF NOT EXISTS idx_ranks_score ON user_ranks(leaderboard_score DESC);
ALTER TABLE user_ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ranks_policy" ON user_ranks FOR ALL TO authenticated 
  USING (auth.uid() = user_ranks.user_id) 
  WITH CHECK (auth.uid() = user_ranks.user_id);

-- user_activity_logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scans integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  meetings_booked integer DEFAULT 0,
  deals_closed integer DEFAULT 0,
  referrals integer DEFAULT 0,
  active_days integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_logs(user_id);
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_policy" ON user_activity_logs FOR ALL TO authenticated 
  USING (auth.uid() = user_activity_logs.user_id) 
  WITH CHECK (auth.uid() = user_activity_logs.user_id);

-- Insert default badge definitions
INSERT INTO badge_definitions (badge_name, badge_category, description, threshold_value, threshold_metric, coin_reward, tier_requirement) VALUES
  ('Daily Scanner', 'activity', 'Scan at least 5 prospects in a day', 5, 'daily_scans', 10, 'free'),
  ('Streak Master', 'activity', 'Maintain 7-day activity streak', 7, 'streak_days', 50, 'free'),
  ('Messaging Hustler', 'activity', 'Send 20+ messages in a week', 20, 'weekly_messages', 25, 'free'),
  ('Follow-Up Warrior', 'activity', 'Complete 10 follow-ups in a week', 10, 'weekly_followups', 30, 'pro'),
  ('Hot Lead Master', 'conversion', 'Identify 10 A+ prospects', 10, 'a_plus_prospects', 100, 'pro'),
  ('Closing Titan', 'conversion', 'Close 5 deals in a month', 5, 'monthly_deals', 200, 'pro'),
  ('Meeting Machine', 'conversion', 'Book 10 meetings in a month', 10, 'monthly_meetings', 75, 'free'),
  ('Coach of the Week', 'team_leader', 'Provide 5+ coaching sessions', 5, 'coaching_sessions', 150, 'elite'),
  ('Recruiter Elite', 'team_leader', 'Recruit 10 team members', 10, 'team_recruits', 300, 'elite'),
  ('Team Builder Legend', 'team_leader', 'Build team of 25+ active members', 25, 'active_team', 500, 'elite'),
  ('Viral Hero', 'referral', 'Refer 5 new users', 5, 'referrals', 100, 'free'),
  ('Share-to-Win', 'referral', 'Share NexScout 10 times', 10, 'shares', 50, 'free'),
  ('Connector Pro', 'referral', 'Refer 20 users', 20, 'referrals', 300, 'pro')
ON CONFLICT (badge_name) DO NOTHING;