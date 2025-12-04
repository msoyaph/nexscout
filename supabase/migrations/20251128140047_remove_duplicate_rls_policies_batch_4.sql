/*
  # Remove Duplicate RLS Policies - Batch 4

  1. Purpose
    - Continue removing duplicate RLS policies
  
  2. Tables Fixed
    - prospect_behavior_summary
    - referral_codes
    - referrals
    - scan_ocr_results
*/

-- Fix prospect_behavior_summary (keep newer policy names)
DROP POLICY IF EXISTS "Users can read own behavior summaries" ON prospect_behavior_summary;
DROP POLICY IF EXISTS "Users can insert own behavior summaries" ON prospect_behavior_summary;
DROP POLICY IF EXISTS "Users can update own behavior summaries" ON prospect_behavior_summary;

-- Fix referral_codes (keep newer policy names)
DROP POLICY IF EXISTS "Users can view own referral code" ON referral_codes;
DROP POLICY IF EXISTS "Users can update own referral stats" ON referral_codes;

-- Fix referrals (keep most specific policies)
DROP POLICY IF EXISTS "Users can view referrals they made" ON referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are referred" ON referrals;
DROP POLICY IF EXISTS "System can insert referrals" ON referrals;
DROP POLICY IF EXISTS "System can update referrals" ON referrals;

-- Recreate referrals policies (combined)
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    referrer_user_id = (select auth.uid()) OR 
    referred_user_id = (select auth.uid())
  );

-- Fix scan_ocr_results (keep newer policy names)
DROP POLICY IF EXISTS "Users can view own OCR results" ON scan_ocr_results;
DROP POLICY IF EXISTS "Users can insert own OCR results" ON scan_ocr_results;
