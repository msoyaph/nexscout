/*
  # Product-Led Onboarding System Tables

  1. New Tables
    - `onboarding_sessions`
      - Track each user's onboarding attempt
      - Time-to-value metrics
      - Drop-off tracking
      
    - `user_activation_checklist`
      - 5 Quick Wins checklist
      - Tracks completion status
      - Awards XP on completion
      
    - `aha_moments`
      - Definition of aha moment triggers
      - Celebration rules
      
    - `user_aha_moments`
      - Track when users hit milestones
      - Time from signup
      - Celebration history
      
    - `lifecycle_milestones`
      - Day 0, 1, 3, 7, 14, 30, 90 targets
      - Success criteria
      
    - `user_lifecycle_progress`
      - Track user progress through lifecycle
      - Current stage
      
    - `feature_unlock_rules`
      - Progressive disclosure rules
      - Conditions for unlocking features
      
    - `user_feature_unlocks`
      - Track which features user has unlocked
      - Unlock timestamp
      
    - `onboarding_analytics`
      - Aggregated analytics
      - Drop-off rates
      - Time-to-value by cohort
      
  2. Security
    - Enable RLS on all tables
    - Users can only see their own data
    - Super admins can see all
*/

-- Onboarding Sessions Table
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  industry_selected text,
  company_type text,
  channels_selected text[] DEFAULT '{}',
  admin_company_id uuid REFERENCES admin_companies(id),
  auto_populated boolean DEFAULT false,
  completed boolean DEFAULT false,
  time_to_completion_seconds integer,
  drop_off_step text,
  created_at timestamptz DEFAULT now()
);

-- Activation Checklist Items Definition
CREATE TABLE IF NOT EXISTS activation_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  action_type text NOT NULL,
  estimated_time_seconds integer DEFAULT 120,
  xp_reward integer DEFAULT 100,
  sort_order integer DEFAULT 0,
  is_required boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Activation Checklist Progress
CREATE TABLE IF NOT EXISTS user_activation_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  checklist_item_id uuid REFERENCES activation_checklist_items(id),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  time_to_complete_seconds integer,
  xp_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, checklist_item_id)
);

-- Aha Moments Definition
CREATE TABLE IF NOT EXISTS aha_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL,
  trigger_conditions jsonb DEFAULT '{}',
  celebration_type text DEFAULT 'confetti',
  xp_reward integer DEFAULT 200,
  energy_reward integer DEFAULT 50,
  badge_id uuid,
  target_time_minutes integer,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Aha Moments Achieved
CREATE TABLE IF NOT EXISTS user_aha_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  aha_moment_id uuid REFERENCES aha_moments(id),
  triggered_at timestamptz DEFAULT now(),
  time_from_signup_minutes integer,
  xp_awarded integer DEFAULT 0,
  energy_awarded integer DEFAULT 0,
  celebration_shown boolean DEFAULT false,
  context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, aha_moment_id)
);

-- Lifecycle Milestones Definition
CREATE TABLE IF NOT EXISTS lifecycle_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phase text NOT NULL,
  day_target integer NOT NULL,
  success_criteria jsonb NOT NULL,
  recommended_actions text[] DEFAULT '{}',
  nudge_message text,
  xp_reward integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Lifecycle Progress
CREATE TABLE IF NOT EXISTS user_lifecycle_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_phase text DEFAULT 'quick_win',
  current_day integer DEFAULT 0,
  last_milestone_id uuid REFERENCES lifecycle_milestones(id),
  last_milestone_reached_at timestamptz,
  total_milestones_reached integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Feature Unlock Rules
CREATE TABLE IF NOT EXISTS feature_unlock_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  unlock_phase text DEFAULT 'activation',
  unlock_day integer DEFAULT 0,
  unlock_conditions jsonb DEFAULT '{}',
  is_premium_only boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Feature Unlocks
CREATE TABLE IF NOT EXISTS user_feature_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_name text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  unlock_method text DEFAULT 'auto',
  celebration_shown boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature_name)
);

-- Onboarding Analytics Aggregated
CREATE TABLE IF NOT EXISTS onboarding_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  industry text,
  total_sessions integer DEFAULT 0,
  completed_sessions integer DEFAULT 0,
  avg_time_to_value_seconds numeric,
  drop_off_q1 integer DEFAULT 0,
  drop_off_q2 integer DEFAULT 0,
  drop_off_q3 integer DEFAULT 0,
  drop_off_setup integer DEFAULT 0,
  activation_rate numeric,
  day_7_retention_rate numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(date, industry)
);

-- Enable RLS
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activation_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE aha_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_aha_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifecycle_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lifecycle_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_unlock_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can read/write their own data
CREATE POLICY "Users can manage own onboarding sessions"
  ON onboarding_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read checklist items"
  ON activation_checklist_items FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can manage own checklist progress"
  ON user_activation_checklist FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read aha moments"
  ON aha_moments FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can manage own aha moments"
  ON user_aha_moments FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read lifecycle milestones"
  ON lifecycle_milestones FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can manage own lifecycle progress"
  ON user_lifecycle_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read feature unlock rules"
  ON feature_unlock_rules FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can read own feature unlocks"
  ON user_feature_unlocks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feature unlocks"
  ON user_feature_unlocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Super Admin policies
CREATE POLICY "Super admin full access to onboarding sessions"
  ON onboarding_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "Super admin can manage checklist items"
  ON activation_checklist_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "Super admin full access to analytics"
  ON onboarding_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user ON onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_completed ON onboarding_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_industry ON onboarding_sessions(industry_selected);

CREATE INDEX IF NOT EXISTS idx_user_checklist_user ON user_activation_checklist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_checklist_completed ON user_activation_checklist(completed);

CREATE INDEX IF NOT EXISTS idx_user_aha_moments_user ON user_aha_moments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_aha_moments_time ON user_aha_moments(time_from_signup_minutes);

CREATE INDEX IF NOT EXISTS idx_user_lifecycle_user ON user_lifecycle_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lifecycle_phase ON user_lifecycle_progress(current_phase);

CREATE INDEX IF NOT EXISTS idx_user_feature_unlocks_user ON user_feature_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_unlocks_feature ON user_feature_unlocks(feature_name);

CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_date ON onboarding_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_industry ON onboarding_analytics(industry);