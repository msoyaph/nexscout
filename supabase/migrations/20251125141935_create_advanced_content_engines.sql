/*
  # Advanced Content Engines - Persona Memory, Story, Viral, Training

  1. New Tables
    - persona_learning_logs (persona memory evolution tracking)
    - story_messages (story-based messages)
    - viral_video_scripts (viral TikTok/Reels scripts)
    - training_video_modules (training academy content)

  2. Updates
    - Extend user_personas table with learning fields

  3. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

-- Add learning fields to user_personas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_personas' AND column_name = 'persona_version') THEN
    ALTER TABLE user_personas ADD COLUMN persona_version text DEFAULT '2.0';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_personas' AND column_name = 'language_ratio') THEN
    ALTER TABLE user_personas ADD COLUMN language_ratio jsonb DEFAULT '{"tagalog": 0.5, "english": 0.5}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_personas' AND column_name = 'sentence_length_preference') THEN
    ALTER TABLE user_personas ADD COLUMN sentence_length_preference text DEFAULT 'medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_personas' AND column_name = 'cta_style') THEN
    ALTER TABLE user_personas ADD COLUMN cta_style text DEFAULT 'consultative';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_personas' AND column_name = 'emotion_pattern') THEN
    ALTER TABLE user_personas ADD COLUMN emotion_pattern text DEFAULT 'warm';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_personas' AND column_name = 'learning_count') THEN
    ALTER TABLE user_personas ADD COLUMN learning_count integer DEFAULT 0;
  END IF;
END $$;

-- persona_learning_logs table
CREATE TABLE IF NOT EXISTS persona_learning_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learning_type text NOT NULL,
  user_input text,
  user_edit text,
  detected_patterns jsonb DEFAULT '{}'::jsonb,
  tone_shift text,
  language_shift text,
  behavior_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_user ON persona_learning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_created ON persona_learning_logs(created_at DESC);
ALTER TABLE persona_learning_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_policy" ON persona_learning_logs FOR ALL TO authenticated 
  USING (auth.uid() = persona_learning_logs.user_id) 
  WITH CHECK (auth.uid() = persona_learning_logs.user_id);

-- story_messages table
CREATE TABLE IF NOT EXISTS story_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  intent text NOT NULL,
  story_message text NOT NULL,
  story_structure jsonb NOT NULL,
  emotion_color text,
  language text,
  industry text,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_user ON story_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_story_prospect ON story_messages(prospect_id);
ALTER TABLE story_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "story_policy" ON story_messages FOR ALL TO authenticated 
  USING (auth.uid() = story_messages.user_id) 
  WITH CHECK (auth.uid() = story_messages.user_id);

-- viral_video_scripts table
CREATE TABLE IF NOT EXISTS viral_video_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic text NOT NULL,
  industry text NOT NULL,
  duration_seconds integer DEFAULT 15,
  tone text NOT NULL,
  script_beats jsonb DEFAULT '[]'::jsonb,
  viral_hook text NOT NULL,
  recommended_hashtags jsonb DEFAULT '[]'::jsonb,
  pattern_interrupts_used jsonb DEFAULT '[]'::jsonb,
  cta text NOT NULL,
  target_audience text,
  language text,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_viral_user ON viral_video_scripts(user_id);
ALTER TABLE viral_video_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "viral_policy" ON viral_video_scripts FOR ALL TO authenticated 
  USING (auth.uid() = viral_video_scripts.user_id) 
  WITH CHECK (auth.uid() = viral_video_scripts.user_id);

-- training_video_modules table
CREATE TABLE IF NOT EXISTS training_video_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  topic text NOT NULL,
  academy_level text NOT NULL,
  industry text NOT NULL,
  duration_minutes integer DEFAULT 5,
  lesson_outline jsonb DEFAULT '[]'::jsonb,
  full_trainer_script text NOT NULL,
  slide_deck jsonb DEFAULT '[]'::jsonb,
  broll_suggestions jsonb DEFAULT '[]'::jsonb,
  practice_exercises jsonb DEFAULT '[]'::jsonb,
  quiz_questions jsonb DEFAULT '[]'::jsonb,
  promo_short_version text,
  language text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_user ON training_video_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_training_public ON training_video_modules(is_public) WHERE is_public = true;
ALTER TABLE training_video_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_owner_policy" ON training_video_modules FOR ALL TO authenticated 
  USING (auth.uid() = training_video_modules.user_id OR training_video_modules.is_public = true) 
  WITH CHECK (auth.uid() = training_video_modules.user_id);
CREATE POLICY "training_public_read" ON training_video_modules FOR SELECT TO authenticated 
  USING (training_video_modules.is_public = true);