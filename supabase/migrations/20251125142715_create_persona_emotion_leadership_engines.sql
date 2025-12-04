/*
  # Persona Switch, Emotion, Leadership, Team Training, and Call Simulator Engines

  1. New Tables
    - industry_persona_profiles (persona switching profiles)
    - emotion_enhanced_messages (emotional persuasion layer)
    - leadership_playbooks (leadership academy content)
    - team_training_programs (automated team training)
    - sales_call_simulations (AI roleplay sessions)

  2. Security
    - Enable RLS on all tables
    - Users/leaders can access their own data
    - Team leaders can access their team data
*/

-- industry_persona_profiles table
CREATE TABLE IF NOT EXISTS industry_persona_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  industry text NOT NULL,
  target_audience text NOT NULL,
  industry_voice text NOT NULL,
  audience_tone text NOT NULL,
  recommended_vocabulary jsonb DEFAULT '[]'::jsonb,
  recommended_examples jsonb DEFAULT '[]'::jsonb,
  pitch_angles jsonb DEFAULT '[]'::jsonb,
  closing_techniques jsonb DEFAULT '[]'::jsonb,
  updated_persona jsonb DEFAULT '{}'::jsonb,
  language text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, industry, target_audience)
);

CREATE INDEX IF NOT EXISTS idx_industry_persona_user ON industry_persona_profiles(user_id);
ALTER TABLE industry_persona_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "industry_persona_policy" ON industry_persona_profiles FOR ALL TO authenticated 
  USING (auth.uid() = industry_persona_profiles.user_id) 
  WITH CHECK (auth.uid() = industry_persona_profiles.user_id);

-- emotion_enhanced_messages table
CREATE TABLE IF NOT EXISTS emotion_enhanced_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  base_message text NOT NULL,
  emotion_type text NOT NULL,
  intensity text NOT NULL,
  emotion_enhanced_message text NOT NULL,
  emotion_tags_used jsonb DEFAULT '[]'::jsonb,
  language text,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emotion_user ON emotion_enhanced_messages(user_id);
ALTER TABLE emotion_enhanced_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emotion_policy" ON emotion_enhanced_messages FOR ALL TO authenticated 
  USING (auth.uid() = emotion_enhanced_messages.user_id) 
  WITH CHECK (auth.uid() = emotion_enhanced_messages.user_id);

-- leadership_playbooks table
CREATE TABLE IF NOT EXISTS leadership_playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leader_level text NOT NULL,
  team_size integer DEFAULT 0,
  team_challenges jsonb DEFAULT '[]'::jsonb,
  industry text NOT NULL,
  academy_outline jsonb DEFAULT '[]'::jsonb,
  leader_playbook text NOT NULL,
  coaching_scripts jsonb DEFAULT '[]'::jsonb,
  team_training_schedule jsonb DEFAULT '[]'::jsonb,
  tracking_checklist jsonb DEFAULT '[]'::jsonb,
  recommended_metrics jsonb DEFAULT '[]'::jsonb,
  language text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbook_user ON leadership_playbooks(user_id);
ALTER TABLE leadership_playbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "playbook_policy" ON leadership_playbooks FOR ALL TO authenticated 
  USING (auth.uid() = leadership_playbooks.user_id) 
  WITH CHECK (auth.uid() = leadership_playbooks.user_id);

-- team_training_programs table
CREATE TABLE IF NOT EXISTS team_training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_name text NOT NULL,
  industry text NOT NULL,
  team_weaknesses jsonb DEFAULT '[]'::jsonb,
  team_strengths jsonb DEFAULT '[]'::jsonb,
  training_style text DEFAULT 'structured',
  team_training_program jsonb DEFAULT '[]'::jsonb,
  member_assignments jsonb DEFAULT '[]'::jsonb,
  weekly_action_plan jsonb DEFAULT '[]'::jsonb,
  leader_dashboard_summary text,
  auto_generated_roleplays jsonb DEFAULT '[]'::jsonb,
  language text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_leader ON team_training_programs(leader_id);
ALTER TABLE team_training_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_policy" ON team_training_programs FOR ALL TO authenticated 
  USING (auth.uid() = team_training_programs.leader_id) 
  WITH CHECK (auth.uid() = team_training_programs.leader_id);

-- sales_call_simulations table
CREATE TABLE IF NOT EXISTS sales_call_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  industry text NOT NULL,
  scenario_type text NOT NULL,
  prospect_personality text NOT NULL,
  call_script jsonb DEFAULT '[]'::jsonb,
  objection_triggers jsonb DEFAULT '[]'::jsonb,
  scenario_notes text,
  recommended_response_patterns jsonb DEFAULT '[]'::jsonb,
  user_performance_score integer,
  language text,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_sim_user ON sales_call_simulations(user_id);
ALTER TABLE sales_call_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_sim_policy" ON sales_call_simulations FOR ALL TO authenticated 
  USING (auth.uid() = sales_call_simulations.user_id) 
  WITH CHECK (auth.uid() = sales_call_simulations.user_id);