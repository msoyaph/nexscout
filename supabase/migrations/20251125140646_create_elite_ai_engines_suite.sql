/*
  # Elite AI Engines Suite - 10 Advanced Systems

  1. New Tables
    - hot_lead_accelerations (hot lead accelerator)
    - deal_timeline_forecasts (deal probability forecaster)
    - emotional_state_analyses (emotional state detector)
    - masterclass_lessons (recruiter masterclass)
    - team_performance_reports (team leader reporting)
    - social_intent_predictions (cross-platform intent)
    - neural_behavior_scores (AI lead scoring v3.0)
    - voice_note_analyses (voice note analyzer)
    - ai_closer_sessions (agent-like closer)
    - enterprise_analytics (admin intelligence suite)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Team leaders can access their team data
    - Enterprise admins have org-wide access
*/

-- hot_lead_accelerations table
CREATE TABLE IF NOT EXISTS hot_lead_accelerations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  hot_lead_status text,
  reasoning jsonb DEFAULT '[]'::jsonb,
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  accelerator_script text NOT NULL,
  best_timing text,
  followup_protocol jsonb DEFAULT '[]'::jsonb,
  elite_insights text,
  industry text,
  triggered_at timestamptz DEFAULT now(),
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hot_lead_user ON hot_lead_accelerations(user_id);
CREATE INDEX IF NOT EXISTS idx_hot_lead_prospect ON hot_lead_accelerations(prospect_id);
ALTER TABLE hot_lead_accelerations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hot_lead_policy" ON hot_lead_accelerations FOR ALL TO authenticated 
  USING (auth.uid() = hot_lead_accelerations.user_id) 
  WITH CHECK (auth.uid() = hot_lead_accelerations.user_id);

-- deal_timeline_forecasts table
CREATE TABLE IF NOT EXISTS deal_timeline_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  deal_probability text,
  estimated_closing_window text,
  timeline_factors jsonb DEFAULT '[]'::jsonb,
  risk_signals jsonb DEFAULT '[]'::jsonb,
  speed_boost_actions jsonb DEFAULT '[]'::jsonb,
  custom_messenger_script text,
  elite_insights text,
  industry text,
  actual_close_date date,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forecast_user ON deal_timeline_forecasts(user_id);
ALTER TABLE deal_timeline_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forecast_policy" ON deal_timeline_forecasts FOR ALL TO authenticated 
  USING (auth.uid() = deal_timeline_forecasts.user_id) 
  WITH CHECK (auth.uid() = deal_timeline_forecasts.user_id);

-- emotional_state_analyses table
CREATE TABLE IF NOT EXISTS emotional_state_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  emotional_state text,
  confidence_score integer DEFAULT 0,
  evidence jsonb DEFAULT '[]'::jsonb,
  recommended_tone text,
  suggested_message_style text,
  calming_phrases jsonb DEFAULT '[]'::jsonb,
  trigger_warnings jsonb DEFAULT '[]'::jsonb,
  elite_insights text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emotion_user ON emotional_state_analyses(user_id);
ALTER TABLE emotional_state_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emotion_policy" ON emotional_state_analyses FOR ALL TO authenticated 
  USING (auth.uid() = emotional_state_analyses.user_id) 
  WITH CHECK (auth.uid() = emotional_state_analyses.user_id);

-- masterclass_lessons table
CREATE TABLE IF NOT EXISTS masterclass_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_date date NOT NULL,
  daily_lesson text NOT NULL,
  today_skill_focus text,
  action_steps jsonb DEFAULT '[]'::jsonb,
  example_scripts jsonb DEFAULT '[]'::jsonb,
  quiz_question text,
  quiz_answer text,
  reward_coins integer DEFAULT 0,
  elite_mastery_bonus text,
  skill_level text,
  industry text,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_date)
);

CREATE INDEX IF NOT EXISTS idx_lesson_user ON masterclass_lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_date ON masterclass_lessons(lesson_date DESC);
ALTER TABLE masterclass_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_policy" ON masterclass_lessons FOR ALL TO authenticated 
  USING (auth.uid() = masterclass_lessons.user_id) 
  WITH CHECK (auth.uid() = masterclass_lessons.user_id);

-- team_performance_reports table
CREATE TABLE IF NOT EXISTS team_performance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  team_performance_summary text NOT NULL,
  top_performers jsonb DEFAULT '[]'::jsonb,
  at_risk_members jsonb DEFAULT '[]'::jsonb,
  bottlenecks_detected jsonb DEFAULT '[]'::jsonb,
  team_closing_rate numeric DEFAULT 0,
  forecasted_performance text,
  recommended_leader_actions jsonb DEFAULT '[]'::jsonb,
  member_coaching_cards jsonb DEFAULT '[]'::jsonb,
  elite_leadership_insights text,
  industry text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(leader_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_report_leader ON team_performance_reports(leader_id);
ALTER TABLE team_performance_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_policy" ON team_performance_reports FOR ALL TO authenticated 
  USING (auth.uid() = team_performance_reports.leader_id) 
  WITH CHECK (auth.uid() = team_performance_reports.leader_id);

-- social_intent_predictions table
CREATE TABLE IF NOT EXISTS social_intent_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  intent_level text,
  intent_category text,
  platform_influence jsonb DEFAULT '{}'::jsonb,
  intent_reasons jsonb DEFAULT '[]'::jsonb,
  recommended_approach text,
  optimized_message_script text,
  predicted_best_platform text,
  confidence_score integer DEFAULT 0,
  industry text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intent_user ON social_intent_predictions(user_id);
ALTER TABLE social_intent_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intent_policy" ON social_intent_predictions FOR ALL TO authenticated 
  USING (auth.uid() = social_intent_predictions.user_id) 
  WITH CHECK (auth.uid() = social_intent_predictions.user_id);

-- neural_behavior_scores table (v3.0)
CREATE TABLE IF NOT EXISTS neural_behavior_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  neuro_score integer DEFAULT 0,
  primary_drivers jsonb DEFAULT '[]'::jsonb,
  behavioral_profile text,
  buying_mode text,
  timing_score integer DEFAULT 0,
  objection_sensitivity text,
  closing_prediction text,
  recommended_script_style text,
  elite_insights text,
  industry text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prospect_id)
);

CREATE INDEX IF NOT EXISTS idx_neuro_user ON neural_behavior_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_neuro_prospect ON neural_behavior_scores(prospect_id);
ALTER TABLE neural_behavior_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "neuro_policy" ON neural_behavior_scores FOR ALL TO authenticated 
  USING (auth.uid() = neural_behavior_scores.user_id) 
  WITH CHECK (auth.uid() = neural_behavior_scores.user_id);

-- voice_note_analyses table
CREATE TABLE IF NOT EXISTS voice_note_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text,
  transcript_taglish text NOT NULL,
  sentiment text,
  emotion_detected text,
  voice_confidence integer DEFAULT 0,
  hesitation_patterns jsonb DEFAULT '[]'::jsonb,
  keyword_detections jsonb DEFAULT '[]'::jsonb,
  recommended_response_style text,
  optimized_reply_script text,
  elite_insights text,
  industry text,
  audio_duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_user ON voice_note_analyses(user_id);
ALTER TABLE voice_note_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_policy" ON voice_note_analyses FOR ALL TO authenticated 
  USING (auth.uid() = voice_note_analyses.user_id) 
  WITH CHECK (auth.uid() = voice_note_analyses.user_id);

-- ai_closer_sessions table
CREATE TABLE IF NOT EXISTS ai_closer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  ideal_closing_path jsonb DEFAULT '[]'::jsonb,
  trial_close_questions jsonb DEFAULT '[]'::jsonb,
  final_close_script text NOT NULL,
  fear_neutralizers jsonb DEFAULT '[]'::jsonb,
  trust_boosters jsonb DEFAULT '[]'::jsonb,
  objection_deflectors jsonb DEFAULT '[]'::jsonb,
  meeting_cta text,
  fallback_close text,
  elite_insights text,
  closing_style text,
  industry text,
  successful boolean,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_closer_user ON ai_closer_sessions(user_id);
ALTER TABLE ai_closer_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "closer_policy" ON ai_closer_sessions FOR ALL TO authenticated 
  USING (auth.uid() = ai_closer_sessions.user_id) 
  WITH CHECK (auth.uid() = ai_closer_sessions.user_id);

-- enterprise_analytics table
CREATE TABLE IF NOT EXISTS enterprise_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  enterprise_overview text NOT NULL,
  team_rankings jsonb DEFAULT '[]'::jsonb,
  conversion_forecasts jsonb DEFAULT '{}'::jsonb,
  recruitment_trend_lines jsonb DEFAULT '{}'::jsonb,
  risk_alerts jsonb DEFAULT '[]'::jsonb,
  attrition_warnings jsonb DEFAULT '[]'::jsonb,
  revenue_projections jsonb DEFAULT '{}'::jsonb,
  system_load_forecast text,
  admin_recommendations jsonb DEFAULT '[]'::jsonb,
  enterprise_ai_insights text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_org ON enterprise_analytics(org_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_date ON enterprise_analytics(report_date DESC);
ALTER TABLE enterprise_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enterprise_policy" ON enterprise_analytics FOR ALL TO authenticated 
  USING (auth.uid() = enterprise_analytics.org_id) 
  WITH CHECK (auth.uid() = enterprise_analytics.org_id);