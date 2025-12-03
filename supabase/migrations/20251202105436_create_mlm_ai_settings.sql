/*
  # MLM AI Settings Table

  1. New Tables
    - `mlm_ai_settings`
      - `user_id` (uuid, primary key, references users)
      - `ranks` (jsonb, array of rank settings)
      - `funnels` (jsonb, funnel configurations)
      - `default_voice_for_closing` (text)
      - `default_voice_for_revival` (text)
      - `default_voice_for_training` (text)
      - `allow_auto_followups` (boolean)
      - `use_rank_based_coaching` (boolean)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `mlm_ai_settings` table
    - Add policy for authenticated users to manage their own settings
    - Add admin policy for viewing all settings

  3. Notes
    - Stores all AI behavior configuration
    - Single source of truth for ranks, funnels, voice models
    - Used by all AI engines for consistent behavior
*/

-- Create mlm_ai_settings table
CREATE TABLE IF NOT EXISTS mlm_ai_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Rank settings (array of {name, minVolume})
  ranks jsonb DEFAULT '[
    {"name": "Starter", "minVolume": 0},
    {"name": "Silver", "minVolume": 1000},
    {"name": "Gold", "minVolume": 5000},
    {"name": "Platinum", "minVolume": 15000},
    {"name": "Diamond", "minVolume": 50000}
  ]'::jsonb,

  -- Funnel configurations
  funnels jsonb DEFAULT '{
    "recruiting": {
      "stages": ["awareness", "interest", "evaluation", "decision", "closing"],
      "labels": {
        "awareness": "Building Awareness",
        "interest": "Generating Interest",
        "evaluation": "Evaluating Fit",
        "decision": "Making Decision",
        "closing": "Closing the Deal"
      }
    },
    "customerOnboarding": {
      "stages": ["discovery", "education", "trial", "conversion", "retention"],
      "labels": {
        "discovery": "Discovery Phase",
        "education": "Product Education",
        "trial": "Trial Period",
        "conversion": "Conversion",
        "retention": "Retention & Upsell"
      }
    },
    "revival": {
      "stages": ["revive1", "revive2", "revive3", "closing"],
      "labels": {
        "revive1": "First Touch",
        "revive2": "Second Touch",
        "revive3": "Final Touch",
        "closing": "Last Chance Close"
      }
    }
  }'::jsonb,

  -- Voice model defaults
  default_voice_for_closing text DEFAULT 'aggressiveCloser' CHECK (
    default_voice_for_closing IN (
      'aggressiveCloser',
      'softNurturer',
      'professionalAdvisor',
      'energeticCoach',
      'empathicSupport'
    )
  ),

  default_voice_for_revival text DEFAULT 'softNurturer' CHECK (
    default_voice_for_revival IN (
      'aggressiveCloser',
      'softNurturer',
      'professionalAdvisor',
      'energeticCoach',
      'empathicSupport'
    )
  ),

  default_voice_for_training text DEFAULT 'professionalAdvisor' CHECK (
    default_voice_for_training IN (
      'aggressiveCloser',
      'softNurturer',
      'professionalAdvisor',
      'energeticCoach',
      'empathicSupport'
    )
  ),

  -- Behavior flags
  allow_auto_followups boolean DEFAULT true,
  use_rank_based_coaching boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_mlm_ai_settings_user_id ON mlm_ai_settings(user_id);

-- Enable RLS
ALTER TABLE mlm_ai_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own settings
CREATE POLICY "Users can view own AI settings"
  ON mlm_ai_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI settings"
  ON mlm_ai_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI settings"
  ON mlm_ai_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all settings
CREATE POLICY "Admins can view all AI settings"
  ON mlm_ai_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mlm_ai_settings_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS mlm_ai_settings_updated_at_trigger ON mlm_ai_settings;
CREATE TRIGGER mlm_ai_settings_updated_at_trigger
  BEFORE UPDATE ON mlm_ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_mlm_ai_settings_updated_at();

-- Function to initialize AI settings for new users
CREATE OR REPLACE FUNCTION initialize_ai_settings_for_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO mlm_ai_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger to auto-initialize AI settings when user profile is created
DROP TRIGGER IF EXISTS auto_init_ai_settings_trigger ON profiles;
CREATE TRIGGER auto_init_ai_settings_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_ai_settings_for_user();
