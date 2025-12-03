/*
  # Migrate Elite Users to Pro - Final Migration

  1. Changes
    - Update profiles with elite tier to pro
    - Remove elite as valid tier option
    - Ensure Pro has all necessary features

  2. Migration
    - Found 1 Elite user - migrating to Pro
    - Pro tier now has pricing of ₱1,299/month
*/

-- Update all Elite tier users in profiles to Pro
UPDATE profiles
SET 
  subscription_tier = 'pro',
  updated_at = now()
WHERE subscription_tier = 'elite';

-- Add constraint to prevent future elite tier assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_subscription_tier_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_subscription_tier_check
    CHECK (subscription_tier IN ('starter', 'free', 'pro', 'team', 'enterprise'));
  END IF;
END $$;