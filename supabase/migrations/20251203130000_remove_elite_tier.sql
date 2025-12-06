-- =====================================================
-- REMOVE ELITE TIER - Migration to 2-Tier System
-- =====================================================
-- Purpose: Consolidate Elite tier into Pro tier
-- All Elite features now available in Pro
-- =====================================================

-- Step 1: Migrate existing Elite users to Pro
UPDATE profiles
SET subscription_tier = 'pro'
WHERE subscription_tier = 'elite';

-- Step 2: Update any workspace configs
UPDATE workspace_configs
SET updated_at = NOW()
WHERE workspace_id IN (
  SELECT workspace_id FROM profiles WHERE subscription_tier = 'pro'
);

-- Step 3: Update subscription history
UPDATE subscription_history
SET tier = 'pro'
WHERE tier = 'elite';

-- Step 4: Add comment for documentation
COMMENT ON COLUMN profiles.subscription_tier IS 
  'User subscription tier: free or pro. Elite tier removed as of 2025-12-03.';

-- Step 5: Update any tier-specific configs
-- Note: RLS policies already use normalizeTier() function which maps elite -> pro

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if any elite users remain (should be 0)
DO $$
DECLARE
  elite_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO elite_count
  FROM profiles
  WHERE subscription_tier = 'elite';
  
  IF elite_count > 0 THEN
    RAISE WARNING 'Found % users still on elite tier', elite_count;
  ELSE
    RAISE NOTICE 'Successfully migrated all elite users to pro tier';
  END IF;
END $$;

-- =====================================================
-- Summary of Changes
-- =====================================================

/*
Elite Tier Removal - Summary:

BEFORE (3 tiers):
- Free: Basic features, 5 energy, 15 daily limit
- Pro: Advanced features, 25 energy, 150 daily limit  
- Elite: Premium features, 99 energy, 400 daily limit

AFTER (2 tiers):
- Free: Basic features, 5 energy, 15 daily limit
- Pro: ALL features, 99 energy, 400 daily limit

Pro tier now includes ALL former Elite features:
✅ Unlimited scans
✅ Unlimited messages
✅ Unlimited presentations
✅ AI DeepScan 2.0
✅ AI Affordability Score
✅ AI Leadership Potential
✅ Multi-Step Sequences
✅ Advanced templates
✅ ALL cards unlocked
✅ Personalized AI insights
✅ Lead Timeline & Affinity
✅ Full 8-stage pipeline
✅ Priority queue
✅ +500 weekly coins
✅ 99 max energy
✅ 400 daily energy limit

Users migrated: All Elite → Pro (no data loss)
*/




