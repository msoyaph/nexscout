/*
  # Conversation Analysis, Sync, Planning, and Coaching Systems

  1. New Tables
    - conversation_analyses (AI conversation analyzer)
    - prospect_platform_sources (multi-platform sync tracking)
    - meeting_predictions (meeting outcome predictor)
    - daily_action_plans (daily planner)
    - ai_mentor_sessions (recruiter AI mentor coaching)
    - platform_sync_logs (sync history)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

-- conversation_analyses table
CREATE TABLE IF NOT EXISTS conversation_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  sentiment_trend text,
  interest_signals jsonb DEFAULT '[]'::jsonb,
  risk_signals jsonb DEFAULT '[]'::jsonb,
  objection_detected text,
  conversion_probability text,
  recommended_reply text NOT NULL,
  next_action text,
  timing_suggestion text,
  elite_insights text,
  conversation_history jsonb DEFAULT '[]'::jsonb,
  industry text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conv_user ON conversation_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_prospect ON conversation_analyses(prospect_id);
ALTER TABLE conversation_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_policy" ON conversation_analyses FOR ALL TO authenticated 
  USING (auth.uid() = conversation_analyses.user_id) 
  WITH CHECK (auth.uid() = conversation_analyses.user_id);

-- prospect_platform_sources table
CREATE TABLE IF NOT EXISTS prospect_platform_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  platform text NOT NULL,
  platform_user_id text,
  platform_username text,
  data_quality_score integer DEFAULT 0,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(prospect_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_platform_user ON prospect_platform_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_prospect ON prospect_platform_sources(prospect_id);
ALTER TABLE prospect_platform_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_policy" ON prospect_platform_sources FOR ALL TO authenticated 
  USING (auth.uid() = prospect_platform_sources.user_id) 
  WITH CHECK (auth.uid() = prospect_platform_sources.user_id);

-- platform_sync_logs table
CREATE TABLE IF NOT EXISTS platform_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sync_type text NOT NULL,
  merged_count integer DEFAULT 0,
  duplicates_resolved integer DEFAULT 0,
  enriched_count integer DEFAULT 0,
  sync_summary jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_user ON platform_sync_logs(user_id);
ALTER TABLE platform_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_log_policy" ON platform_sync_logs FOR ALL TO authenticated 
  USING (auth.uid() = platform_sync_logs.user_id) 
  WITH CHECK (auth.uid() = platform_sync_logs.user_id);

-- meeting_predictions table
CREATE TABLE IF NOT EXISTS meeting_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  success_probability text,
  risk_warnings jsonb DEFAULT '[]'::jsonb,
  strength_signals jsonb DEFAULT '[]'::jsonb,
  recommended_meeting_style text,
  prep_checklist jsonb DEFAULT '[]'::jsonb,
  pre_meeting_message text,
  post_meeting_followup_plan jsonb DEFAULT '[]'::jsonb,
  elite_insights text,
  meeting_type text,
  industry text,
  actual_outcome text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_user ON meeting_predictions(user_id);
ALTER TABLE meeting_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meeting_policy" ON meeting_predictions FOR ALL TO authenticated 
  USING (auth.uid() = meeting_predictions.user_id) 
  WITH CHECK (auth.uid() = meeting_predictions.user_id);

-- daily_action_plans table
CREATE TABLE IF NOT EXISTS daily_action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_date date NOT NULL,
  priority_tasks jsonb DEFAULT '[]'::jsonb,
  high_value_prospects jsonb DEFAULT '[]'::jsonb,
  followup_list jsonb DEFAULT '[]'::jsonb,
  revival_targets jsonb DEFAULT '[]'::jsonb,
  daily_message_templates jsonb DEFAULT '[]'::jsonb,
  best_times_to_send jsonb DEFAULT '[]'::jsonb,
  pro_tips jsonb DEFAULT '[]'::jsonb,
  elite_mode_boosters jsonb DEFAULT '[]'::jsonb,
  completed boolean DEFAULT false,
  industry text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan_date)
);

CREATE INDEX IF NOT EXISTS idx_plan_user ON daily_action_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_date ON daily_action_plans(plan_date DESC);
ALTER TABLE daily_action_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_policy" ON daily_action_plans FOR ALL TO authenticated 
  USING (auth.uid() = daily_action_plans.user_id) 
  WITH CHECK (auth.uid() = daily_action_plans.user_id);

-- ai_mentor_sessions table
CREATE TABLE IF NOT EXISTS ai_mentor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text,
  situation_analysis text NOT NULL,
  what_to_do_next jsonb DEFAULT '[]'::jsonb,
  recommended_script text NOT NULL,
  psychology_basis text NOT NULL,
  probability_of_success text,
  avoid_doing_this jsonb DEFAULT '[]'::jsonb,
  skill_level_adjustments jsonb DEFAULT '{}'::jsonb,
  elite_level_deep_coaching text,
  goal text,
  pipeline_stage text,
  user_skill_level text,
  industry text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_user ON ai_mentor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_prospect ON ai_mentor_sessions(prospect_id);
ALTER TABLE ai_mentor_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mentor_policy" ON ai_mentor_sessions FOR ALL TO authenticated 
  USING (auth.uid() = ai_mentor_sessions.user_id) 
  WITH CHECK (auth.uid() = ai_mentor_sessions.user_id);