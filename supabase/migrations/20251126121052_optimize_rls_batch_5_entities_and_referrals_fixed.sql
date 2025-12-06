/*
  # RLS Performance Optimization - Batch 5: Entities and Referrals (Fixed)

  ## Changes
  This migration optimizes RLS policies for extracted entities, AI smartness, and referral tables 
  by wrapping auth.uid() calls in subqueries to prevent per-row function re-evaluation.

  ## Tables Updated
  - extracted_entities: Extracted data from scans (uses batch_id)
  - ai_smartness: AI smartness tracking
  - referral_codes: User referral codes
  - referrals: Referral relationships (uses referrer_user_id and referred_user_id)

  ## Performance Impact
  - Prevents auth.uid() from being called once per row during queries
  - Improves query performance for large datasets
  - Maintains identical security behavior

  ## Security Notes
  - All policies maintain existing security boundaries
  - No changes to permission logic, only performance optimization
*/

-- ============================================================================
-- extracted_entities
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extracted_entities' AND policyname = 'Users can view own extracted entities') THEN
    DROP POLICY "Users can view own extracted entities" ON extracted_entities;
  END IF;
END $$;

CREATE POLICY "Users can view own extracted entities"
  ON extracted_entities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extracted_entities' AND policyname = 'Users can insert own extracted entities') THEN
    DROP POLICY "Users can insert own extracted entities" ON extracted_entities;
  END IF;
END $$;

CREATE POLICY "Users can insert own extracted entities"
  ON extracted_entities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extracted_entities' AND policyname = 'Users can update own extracted entities') THEN
    DROP POLICY "Users can update own extracted entities" ON extracted_entities;
  END IF;
END $$;

CREATE POLICY "Users can update own extracted entities"
  ON extracted_entities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extracted_entities' AND policyname = 'Users can delete own extracted entities') THEN
    DROP POLICY "Users can delete own extracted entities" ON extracted_entities;
  END IF;
END $$;

CREATE POLICY "Users can delete own extracted entities"
  ON extracted_entities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- ai_smartness
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_smartness' AND policyname = 'Users can view own smartness data') THEN
    DROP POLICY "Users can view own smartness data" ON ai_smartness;
  END IF;
END $$;

CREATE POLICY "Users can view own smartness data"
  ON ai_smartness FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_smartness' AND policyname = 'Users can insert own smartness data') THEN
    DROP POLICY "Users can insert own smartness data" ON ai_smartness;
  END IF;
END $$;

CREATE POLICY "Users can insert own smartness data"
  ON ai_smartness FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_smartness' AND policyname = 'Users can update own smartness data') THEN
    DROP POLICY "Users can update own smartness data" ON ai_smartness;
  END IF;
END $$;

CREATE POLICY "Users can update own smartness data"
  ON ai_smartness FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_smartness' AND policyname = 'Users can delete own smartness data') THEN
    DROP POLICY "Users can delete own smartness data" ON ai_smartness;
  END IF;
END $$;

CREATE POLICY "Users can delete own smartness data"
  ON ai_smartness FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- referral_codes
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Users can view own referral codes') THEN
    DROP POLICY "Users can view own referral codes" ON referral_codes;
  END IF;
END $$;

CREATE POLICY "Users can view own referral codes"
  ON referral_codes FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Users can insert own referral codes') THEN
    DROP POLICY "Users can insert own referral codes" ON referral_codes;
  END IF;
END $$;

CREATE POLICY "Users can insert own referral codes"
  ON referral_codes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Users can update own referral codes') THEN
    DROP POLICY "Users can update own referral codes" ON referral_codes;
  END IF;
END $$;

CREATE POLICY "Users can update own referral codes"
  ON referral_codes FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- referrals
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Users can view referrals they made or received') THEN
    DROP POLICY "Users can view referrals they made or received" ON referrals;
  END IF;
END $$;

CREATE POLICY "Users can view referrals they made or received"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    referrer_user_id = (SELECT auth.uid()) OR 
    referred_user_id = (SELECT auth.uid())
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Users can insert referrals where they are referrer') THEN
    DROP POLICY "Users can insert referrals where they are referrer" ON referrals;
  END IF;
END $$;

CREATE POLICY "Users can insert referrals where they are referrer"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (referrer_user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Users can update referrals they made') THEN
    DROP POLICY "Users can update referrals they made" ON referrals;
  END IF;
END $$;

CREATE POLICY "Users can update referrals they made"
  ON referrals FOR UPDATE
  TO authenticated
  USING (referrer_user_id = (SELECT auth.uid()))
  WITH CHECK (referrer_user_id = (SELECT auth.uid()));