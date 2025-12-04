/*
  # NexScout AI Qualification & Coaching Engines

  1. New Tables
    - `ai_prospect_qualifications` - AI-powered prospect qualification results
    - `ai_pain_point_analysis` - Deep pain point extraction and analysis
    - `ai_personality_profiles` - NLP-based personality profiling
    - `ai_pipeline_recommendations` - AI pipeline stage recommendations
    - `ai_team_coaching_insights` - Team leader coaching recommendations

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- AI Prospect Qualifications
CREATE TABLE IF NOT EXISTS ai_prospect_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL,
  qualification_label TEXT NOT NULL,
  qualification_score NUMERIC(5,2) NOT NULL,
  reasoning JSONB DEFAULT '[]'::jsonb,
  recommended_approach TEXT,
  priority_level TEXT,
  pipeline_stage_suggested TEXT,
  elite_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_qualifications_user_id ON ai_prospect_qualifications(user_id);
CREATE INDEX idx_ai_qualifications_prospect_id ON ai_prospect_qualifications(prospect_id);
CREATE INDEX idx_ai_qualifications_score ON ai_prospect_qualifications(qualification_score DESC);

-- AI Pain Point Analysis
CREATE TABLE IF NOT EXISTS ai_pain_point_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL,
  pain_points JSONB DEFAULT '[]'::jsonb,
  root_cause TEXT,
  urgency_score NUMERIC(5,2) DEFAULT 0,
  emotional_tone TEXT,
  recommended_angle TEXT,
  message_hooks JSONB DEFAULT '[]'::jsonb,
  elite_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_pain_points_user_id ON ai_pain_point_analysis(user_id);
CREATE INDEX idx_ai_pain_points_prospect_id ON ai_pain_point_analysis(prospect_id);
CREATE INDEX idx_ai_pain_points_urgency ON ai_pain_point_analysis(urgency_score DESC);

-- AI Personality Profiles
CREATE TABLE IF NOT EXISTS ai_personality_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL,
  personality_type TEXT,
  traits JSONB DEFAULT '[]'::jsonb,
  communication_style TEXT,
  motivation_triggers JSONB DEFAULT '[]'::jsonb,
  risk_sensitivity TEXT,
  best_messaging_style TEXT,
  do_not_do JSONB DEFAULT '[]'::jsonb,
  elite_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_personality_user_id ON ai_personality_profiles(user_id);
CREATE INDEX idx_ai_personality_prospect_id ON ai_personality_profiles(prospect_id);
CREATE INDEX idx_ai_personality_type ON ai_personality_profiles(personality_type);

-- AI Pipeline Recommendations
CREATE TABLE IF NOT EXISTS ai_pipeline_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL,
  recommended_stage TEXT NOT NULL,
  stage_reasoning JSONB DEFAULT '[]'::jsonb,
  urgency_level TEXT,
  next_action TEXT,
  timing TEXT,
  elite_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_pipeline_user_id ON ai_pipeline_recommendations(user_id);
CREATE INDEX idx_ai_pipeline_prospect_id ON ai_pipeline_recommendations(prospect_id);
CREATE INDEX idx_ai_pipeline_stage ON ai_pipeline_recommendations(recommended_stage);

-- AI Team Coaching Insights
CREATE TABLE IF NOT EXISTS ai_team_coaching_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  performance_summary TEXT,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  priority_coaching_focus TEXT,
  training_plan JSONB DEFAULT '[]'::jsonb,
  recommended_kpis JSONB DEFAULT '[]'::jsonb,
  team_leader_action_script TEXT,
  next_review_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_coaching_owner_id ON ai_team_coaching_insights(team_owner_id);
CREATE INDEX idx_ai_coaching_member_id ON ai_team_coaching_insights(team_member_id);
CREATE INDEX idx_ai_coaching_focus ON ai_team_coaching_insights(priority_coaching_focus);

-- Enable RLS
ALTER TABLE ai_prospect_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pain_point_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pipeline_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_team_coaching_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own qualifications" ON ai_prospect_qualifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own qualifications" ON ai_prospect_qualifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own qualifications" ON ai_prospect_qualifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own pain point analysis" ON ai_pain_point_analysis FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pain point analysis" ON ai_pain_point_analysis FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pain point analysis" ON ai_pain_point_analysis FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own personality profiles" ON ai_personality_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own personality profiles" ON ai_personality_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personality profiles" ON ai_personality_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own pipeline recommendations" ON ai_pipeline_recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pipeline recommendations" ON ai_pipeline_recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pipeline recommendations" ON ai_pipeline_recommendations FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Team owners can view team coaching" ON ai_team_coaching_insights FOR SELECT TO authenticated USING (auth.uid() = team_owner_id);
CREATE POLICY "Team members can view own coaching" ON ai_team_coaching_insights FOR SELECT TO authenticated USING (auth.uid() = team_member_id);
CREATE POLICY "Team owners can insert coaching" ON ai_team_coaching_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() = team_owner_id);
CREATE POLICY "Team owners can update coaching" ON ai_team_coaching_insights FOR UPDATE TO authenticated USING (auth.uid() = team_owner_id);
