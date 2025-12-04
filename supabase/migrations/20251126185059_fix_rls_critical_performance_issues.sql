/*
  # Fix Critical RLS Performance Issues

  Optimizes RLS policies by wrapping auth.uid() in subqueries to prevent
  re-evaluation for each row. This dramatically improves query performance.

  Only updates policies for tables that have been confirmed to exist with
  proper column structures.
*/

-- ai_generations
DROP POLICY IF EXISTS "Users can view own generations" ON ai_generations;
CREATE POLICY "Users can view own generations"
  ON ai_generations FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own generations" ON ai_generations;
CREATE POLICY "Users can insert own generations"
  ON ai_generations FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own generations" ON ai_generations;
CREATE POLICY "Users can update own generations"
  ON ai_generations FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- library_groups
DROP POLICY IF EXISTS "Users can view own groups" ON library_groups;
CREATE POLICY "Users can view own groups"
  ON library_groups FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create own groups" ON library_groups;
CREATE POLICY "Users can create own groups"
  ON library_groups FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own groups" ON library_groups;
CREATE POLICY "Users can update own groups"
  ON library_groups FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own groups" ON library_groups;
CREATE POLICY "Users can delete own groups"
  ON library_groups FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- uploaded_batches
DROP POLICY IF EXISTS "Users can create own batches" ON uploaded_batches;
CREATE POLICY "Users can create own batches"
  ON uploaded_batches FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ai_smartness
DROP POLICY IF EXISTS "Users can view own smartness" ON ai_smartness;
CREATE POLICY "Users can view own smartness"
  ON ai_smartness FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create own smartness" ON ai_smartness;
CREATE POLICY "Users can create own smartness"
  ON ai_smartness FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own smartness" ON ai_smartness;
CREATE POLICY "Users can update own smartness"
  ON ai_smartness FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ai_usage_logs
DROP POLICY IF EXISTS "Users can view own usage logs" ON ai_usage_logs;
CREATE POLICY "Users can view own usage logs"
  ON ai_usage_logs FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own usage logs" ON ai_usage_logs;
CREATE POLICY "Users can insert own usage logs"
  ON ai_usage_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- referral_codes
DROP POLICY IF EXISTS "Users can view own referral code" ON referral_codes;
CREATE POLICY "Users can view own referral code"
  ON referral_codes FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own referral stats" ON referral_codes;
CREATE POLICY "Users can update own referral stats"
  ON referral_codes FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- referrals
DROP POLICY IF EXISTS "Users can view referrals they made" ON referrals;
CREATE POLICY "Users can view referrals they made"
  ON referrals FOR SELECT TO authenticated
  USING (referrer_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view referrals where they are referred" ON referrals;
CREATE POLICY "Users can view referrals where they are referred"
  ON referrals FOR SELECT TO authenticated
  USING (referred_user_id = (SELECT auth.uid()));

-- scan_benchmarks
DROP POLICY IF EXISTS "Admins can view all scan benchmarks" ON scan_benchmarks;
CREATE POLICY "Admins can view all scan benchmarks"
  ON scan_benchmarks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can insert scan benchmarks" ON scan_benchmarks;
CREATE POLICY "Admins can insert scan benchmarks"
  ON scan_benchmarks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (SELECT auth.uid())));

-- llm_load_tests
DROP POLICY IF EXISTS "Admins can view all LLM load tests" ON llm_load_tests;
CREATE POLICY "Admins can view all LLM load tests"
  ON llm_load_tests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can insert LLM load tests" ON llm_load_tests;
CREATE POLICY "Admins can insert LLM load tests"
  ON llm_load_tests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (SELECT auth.uid())));

-- csv_validation_logs
DROP POLICY IF EXISTS "Users can view own CSV validation logs" ON csv_validation_logs;
CREATE POLICY "Users can view own CSV validation logs"
  ON csv_validation_logs FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own CSV validation logs" ON csv_validation_logs;
CREATE POLICY "Users can insert own CSV validation logs"
  ON csv_validation_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
