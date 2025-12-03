/*
  # AI Persona, Script Tone, and Video Pitch Engines

  1. New Tables
    - user_personas (AI persona profiles)
    - generated_scripts (tone-perfect scripts)
    - video_pitch_scripts (video pitch generator)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

-- user_personas table
CREATE TABLE IF NOT EXISTS user_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  persona_name text NOT NULL,
  core_tone text,
  language text DEFAULT 'taglish',
  persona_traits jsonb DEFAULT '[]'::jsonb,
  communication_style text,
  closing_style text,
  humor_level text DEFAULT 'medium',
  respect_level text DEFAULT 'high',
  cultural_cues jsonb DEFAULT '[]'::jsonb,
  signature_phrases jsonb DEFAULT '[]'::jsonb,
  persona_summary text,
  profession text,
  language_preference text,
  tone_preference text,
  industry_experience_level text,
  target_audience text,
  brand_personality jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_persona_user ON user_personas(user_id);
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "persona_policy" ON user_personas FOR ALL TO authenticated 
  USING (auth.uid() = user_personas.user_id) 
  WITH CHECK (auth.uid() = user_personas.user_id);

-- generated_scripts table
CREATE TABLE IF NOT EXISTS generated_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text,
  language text NOT NULL,
  tone text NOT NULL,
  intent text NOT NULL,
  script text NOT NULL,
  recommended_cta text,
  message_length text,
  vibe text,
  cultural_notes jsonb DEFAULT '[]'::jsonb,
  context jsonb DEFAULT '{}'::jsonb,
  industry text,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_script_user ON generated_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_script_prospect ON generated_scripts(prospect_id);
ALTER TABLE generated_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "script_policy" ON generated_scripts FOR ALL TO authenticated 
  USING (auth.uid() = generated_scripts.user_id) 
  WITH CHECK (auth.uid() = generated_scripts.user_id);

-- video_pitch_scripts table
CREATE TABLE IF NOT EXISTS video_pitch_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_type text NOT NULL,
  duration_seconds integer DEFAULT 60,
  language text NOT NULL,
  script text NOT NULL,
  scenes jsonb DEFAULT '[]'::jsonb,
  call_to_action text NOT NULL,
  subtitle_text text,
  recommended_music text,
  video_vibe text,
  prospect_context jsonb DEFAULT '{}'::jsonb,
  industry text,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_user ON video_pitch_scripts(user_id);
ALTER TABLE video_pitch_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video_policy" ON video_pitch_scripts FOR ALL TO authenticated 
  USING (auth.uid() = video_pitch_scripts.user_id) 
  WITH CHECK (auth.uid() = video_pitch_scripts.user_id);