/*
  # Remove Duplicate RLS Policies - Batch 2

  1. Purpose
    - Continue removing duplicate RLS policies
  
  2. Tables Fixed
    - browser_extension_tokens
    - coin_transactions
    - company_profiles
    - contact_behavior_timeline
*/

-- Fix browser_extension_tokens
DROP POLICY IF EXISTS "Super admins can view all extension tokens" ON browser_extension_tokens;

-- Fix coin_transactions
DROP POLICY IF EXISTS "Admins can view coin transactions" ON coin_transactions;

-- Fix company_profiles (keep newer policy names)
DROP POLICY IF EXISTS "Users can view own company data" ON company_profiles;
DROP POLICY IF EXISTS "Users can insert own company data" ON company_profiles;
DROP POLICY IF EXISTS "Users can update own company data" ON company_profiles;
DROP POLICY IF EXISTS "Users can delete own company data" ON company_profiles;

-- Fix contact_behavior_timeline (keep newer policy names)
DROP POLICY IF EXISTS "Users can view own contact behavior" ON contact_behavior_timeline;
DROP POLICY IF EXISTS "Users can insert own contact behavior" ON contact_behavior_timeline;
DROP POLICY IF EXISTS "Users can update own contact behavior" ON contact_behavior_timeline;
