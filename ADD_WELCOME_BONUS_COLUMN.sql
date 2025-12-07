-- Add welcome_bonus_claimed column to profiles table
-- This ensures the welcome bonus modal only appears once per user lifetime
-- Works across all devices and browsers (database is source of truth)

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS welcome_bonus_claimed BOOLEAN DEFAULT FALSE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_bonus_claimed ON profiles(welcome_bonus_claimed);

-- Add comment
COMMENT ON COLUMN profiles.welcome_bonus_claimed IS 'Tracks if user has claimed their welcome bonus. Prevents modal from showing again.';

-- Optional: Mark existing users as having claimed (if you don't want to show to existing users)
-- UPDATE profiles SET welcome_bonus_claimed = TRUE WHERE onboarding_completed = TRUE;

