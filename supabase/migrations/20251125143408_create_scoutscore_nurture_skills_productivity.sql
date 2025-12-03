/*
  # ScoutScore, Nurture Pathways, Skill Gaps, and Productivity Coach

  1. New Tables
    - scoutscore_calculations (math-based scoring)
    - lead_nurture_pathways (personalized sequences)
    - agent_skill_gaps (skill detection)
    - daily_productivity_plans (AI coach plans)

  2. Security
    - Enable RLS on all tables
    - Users can access their own data
*/

-- scoutscore_calculations table
CREATE TABLE IF NOT EXISTS scoutscore_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  final_score integer NOT NULL,
  intent_score numeric(5,2) DEFAULT 0,
  financial_readiness numeric(5,2) DEFAULT 0,
  engagement_behavior numeric(5,2) DEFAULT 0,
  personality_match numeric(5,2) DEFAULT 0,
  vouch_score numeric(5,2) DEFAULT 0,
  pain_point_indicators jsonb DEFAULT '[]'::jsonb,
  opportunity_language_count integer DEFAULT 0,
  decision_signals jsonb DEFAULT '[]'::jsonb,
  income_keywords integer DEFAULT 0,
  employment_stability integer DEFAULT 0,
  debt_pressure_signals integer DEFAULT 0,
  avg_response_speed numeric(5,2) DEFAULT 0,
  comment_ratio numeric(5,2) DEFAULT 0,
  like_ratio numeric(5,2) DEFAULT 0,
  curiosity_markers integer DEFAULT 0,
  personality_type text,
  referral_source text,
  calculation_breakdown jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scoutscore_prospect ON scoutscore_calculations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_scoutscore_user ON scoutscore_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_scoutscore_score ON scoutscore_calculations(final_score DESC);
ALTER TABLE scoutscore_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scoutscore_policy" ON scoutscore_calculations FOR ALL TO authenticated 
  USING (auth.uid() = scoutscore_calculations.user_id) 
  WITH CHECK (auth.uid() = scoutscore_calculations.user_id);

-- lead_nurture_pathways table
CREATE TABLE IF NOT EXISTS lead_nurture_pathways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_temperature text NOT NULL,
  emotional_state text,
  scout_score integer,
  pipeline_position text,
  nurture_sequence jsonb DEFAULT '[]'::jsonb,
  recommended_timing jsonb DEFAULT '[]'::jsonb,
  content_angles jsonb DEFAULT '[]'::jsonb,
  next_action text,
  next_action_date timestamptz,
  pathway_status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nurture_prospect ON lead_nurture_pathways(prospect_id);
CREATE INDEX IF NOT EXISTS idx_nurture_user ON lead_nurture_pathways(user_id);
CREATE INDEX IF NOT EXISTS idx_nurture_status ON lead_nurture_pathways(pathway_status);
ALTER TABLE lead_nurture_pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nurture_policy" ON lead_nurture_pathways FOR ALL TO authenticated 
  USING (auth.uid() = lead_nurture_pathways.user_id) 
  WITH CHECK (auth.uid() = lead_nurture_pathways.user_id);

-- agent_skill_gaps table
CREATE TABLE IF NOT EXISTS agent_skill_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_category text NOT NULL,
  gap_severity text NOT NULL,
  detected_patterns jsonb DEFAULT '[]'::jsonb,
  evidence jsonb DEFAULT '[]'::jsonb,
  improvement_recommendations jsonb DEFAULT '[]'::jsonb,
  training_modules jsonb DEFAULT '[]'::jsonb,
  progress_score numeric(5,2) DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_skill_gap_user ON agent_skill_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_gap_category ON agent_skill_gaps(skill_category);
ALTER TABLE agent_skill_gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_gap_policy" ON agent_skill_gaps FOR ALL TO authenticated 
  USING (auth.uid() = agent_skill_gaps.user_id) 
  WITH CHECK (auth.uid() = agent_skill_gaps.user_id);

-- daily_productivity_plans table
CREATE TABLE IF NOT EXISTS daily_productivity_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_date date NOT NULL,
  contacts_to_message jsonb DEFAULT '[]'::jsonb,
  follow_ups jsonb DEFAULT '[]'::jsonb,
  closing_attempts jsonb DEFAULT '[]'::jsonb,
  training_lesson jsonb DEFAULT '{}'::jsonb,
  priority_tasks jsonb DEFAULT '[]'::jsonb,
  time_blocks jsonb DEFAULT '[]'::jsonb,
  daily_goal text,
  completion_status jsonb DEFAULT '{}'::jsonb,
  actual_completion integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan_date)
);

CREATE INDEX IF NOT EXISTS idx_productivity_user ON daily_productivity_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_productivity_date ON daily_productivity_plans(plan_date DESC);
ALTER TABLE daily_productivity_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "productivity_policy" ON daily_productivity_plans FOR ALL TO authenticated 
  USING (auth.uid() = daily_productivity_plans.user_id) 
  WITH CHECK (auth.uid() = daily_productivity_plans.user_id);