-- =====================================================
-- FIX: Add INSERT policy for ambassador_profiles
-- =====================================================
-- Issue: Users cannot join program because INSERT policy is missing
-- Solution: Allow users to create their own ambassador profile

-- Add INSERT policy for ambassador_profiles
CREATE POLICY "Users can create own ambassador profile"
  ON ambassador_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for referrals (for when users sign up via referral link)
CREATE POLICY "System can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);  -- Allow anyone to create (referral tracking)

-- Add INSERT policy for commission_transactions (for automatic commission awarding)
CREATE POLICY "System can create commission transactions"
  ON commission_transactions FOR INSERT
  WITH CHECK (true);  -- Allow system functions to create transactions




