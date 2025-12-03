/*
  # Migrate Subscription Tiers to New Names

  1. Changes
    - Update 'free' to 'starter' in profiles
    - Drop and recreate constraint with new tier names
    
  2. Safe Migration
    - Update data first
    - Then update constraint
*/

-- Drop old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

-- Update existing data
UPDATE profiles SET subscription_tier = 'starter' WHERE subscription_tier = 'free';

-- Add new constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_subscription_tier_check 
CHECK (subscription_tier IN ('starter', 'pro', 'elite', 'team', 'enterprise'));
