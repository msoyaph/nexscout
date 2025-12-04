/*
  # Add Operating Mode to User Profiles

  1. Changes
    - Add `operating_mode` column to profiles table
    - Add `mode_preferences` JSONB column for mode-specific settings
    - Add index for efficient querying by operating mode
    - Set default to 'hybrid' for new users

  2. Operating Modes
    - **autopilot**: Full AI automation (FB ads → qualified prospects → closed deals)
    - **manual**: Human control with AI assistance (manual prospecting, AI-generated messages)
    - **hybrid**: AI suggests and automates low-risk actions, human approves high-impact decisions

  3. Security
    - Users can only update their own operating mode
    - No additional RLS policies needed (uses existing profile policies)
*/

-- Add operating mode column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS operating_mode text DEFAULT 'hybrid' CHECK (operating_mode IN ('autopilot', 'manual', 'hybrid')),
ADD COLUMN IF NOT EXISTS mode_preferences jsonb DEFAULT '{
  "autopilot": {
    "auto_qualify_threshold": 50,
    "auto_close_threshold": 70,
    "max_daily_prospects": 50,
    "enable_fb_ads_automation": true
  },
  "manual": {
    "show_ai_suggestions": true,
    "auto_generate_messages": true,
    "require_approval_for_send": true
  },
  "hybrid": {
    "auto_qualify_threshold": 60,
    "auto_nurture_enabled": true,
    "require_approval_for_close": true,
    "enable_pipeline_automation": true
  }
}'::jsonb;

-- Create index for operating mode queries
CREATE INDEX IF NOT EXISTS idx_profiles_operating_mode ON profiles(operating_mode);

-- Add comment explaining the column
COMMENT ON COLUMN profiles.operating_mode IS 'User operating mode: autopilot (full automation), manual (human control with AI assist), or hybrid (AI suggests, human approves)';
COMMENT ON COLUMN profiles.mode_preferences IS 'Mode-specific settings and thresholds for automation behavior';

-- Function to validate mode preferences structure
CREATE OR REPLACE FUNCTION validate_mode_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure mode_preferences has the required structure
  IF NEW.mode_preferences IS NULL THEN
    NEW.mode_preferences := '{
      "autopilot": {"auto_qualify_threshold": 50, "auto_close_threshold": 70, "max_daily_prospects": 50, "enable_fb_ads_automation": true},
      "manual": {"show_ai_suggestions": true, "auto_generate_messages": true, "require_approval_for_send": true},
      "hybrid": {"auto_qualify_threshold": 60, "auto_nurture_enabled": true, "require_approval_for_close": true, "enable_pipeline_automation": true}
    }'::jsonb;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate mode preferences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'validate_mode_preferences_trigger'
  ) THEN
    CREATE TRIGGER validate_mode_preferences_trigger
      BEFORE INSERT OR UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION validate_mode_preferences();
  END IF;
END $$;