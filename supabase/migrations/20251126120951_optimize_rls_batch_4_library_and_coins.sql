/*
  # RLS Performance Optimization - Batch 4: Library and Coin Tables

  ## Changes
  This migration optimizes RLS policies for library and coin economy tables by wrapping auth.uid() 
  calls in subqueries to prevent per-row function re-evaluation.

  ## Tables Updated
  - library_groups: Library organization tables
  - pending_coin_transactions: Pending coin transaction records
  - uploaded_batches: Batch upload tracking
  - uploaded_files: Individual file tracking

  ## Performance Impact
  - Prevents auth.uid() from being called once per row during queries
  - Improves query performance for large datasets
  - Maintains identical security behavior

  ## Security Notes
  - All policies maintain existing security boundaries
  - No changes to permission logic, only performance optimization
*/

-- ============================================================================
-- library_groups
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_groups' AND policyname = 'Users can view own library groups') THEN
    DROP POLICY "Users can view own library groups" ON library_groups;
  END IF;
END $$;

CREATE POLICY "Users can view own library groups"
  ON library_groups FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_groups' AND policyname = 'Users can insert own library groups') THEN
    DROP POLICY "Users can insert own library groups" ON library_groups;
  END IF;
END $$;

CREATE POLICY "Users can insert own library groups"
  ON library_groups FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_groups' AND policyname = 'Users can update own library groups') THEN
    DROP POLICY "Users can update own library groups" ON library_groups;
  END IF;
END $$;

CREATE POLICY "Users can update own library groups"
  ON library_groups FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_groups' AND policyname = 'Users can delete own library groups') THEN
    DROP POLICY "Users can delete own library groups" ON library_groups;
  END IF;
END $$;

CREATE POLICY "Users can delete own library groups"
  ON library_groups FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- pending_coin_transactions
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pending_coin_transactions' AND policyname = 'Users can view own pending transactions') THEN
    DROP POLICY "Users can view own pending transactions" ON pending_coin_transactions;
  END IF;
END $$;

CREATE POLICY "Users can view own pending transactions"
  ON pending_coin_transactions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pending_coin_transactions' AND policyname = 'Users can insert own pending transactions') THEN
    DROP POLICY "Users can insert own pending transactions" ON pending_coin_transactions;
  END IF;
END $$;

CREATE POLICY "Users can insert own pending transactions"
  ON pending_coin_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pending_coin_transactions' AND policyname = 'Users can update own pending transactions') THEN
    DROP POLICY "Users can update own pending transactions" ON pending_coin_transactions;
  END IF;
END $$;

CREATE POLICY "Users can update own pending transactions"
  ON pending_coin_transactions FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pending_coin_transactions' AND policyname = 'Users can delete own pending transactions') THEN
    DROP POLICY "Users can delete own pending transactions" ON pending_coin_transactions;
  END IF;
END $$;

CREATE POLICY "Users can delete own pending transactions"
  ON pending_coin_transactions FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- uploaded_batches
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uploaded_batches' AND policyname = 'Users can view own batches') THEN
    DROP POLICY "Users can view own batches" ON uploaded_batches;
  END IF;
END $$;

CREATE POLICY "Users can view own batches"
  ON uploaded_batches FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uploaded_batches' AND policyname = 'Users can insert own batches') THEN
    DROP POLICY "Users can insert own batches" ON uploaded_batches;
  END IF;
END $$;

CREATE POLICY "Users can insert own batches"
  ON uploaded_batches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uploaded_batches' AND policyname = 'Users can update own batches') THEN
    DROP POLICY "Users can update own batches" ON uploaded_batches;
  END IF;
END $$;

CREATE POLICY "Users can update own batches"
  ON uploaded_batches FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uploaded_batches' AND policyname = 'Users can delete own batches') THEN
    DROP POLICY "Users can delete own batches" ON uploaded_batches;
  END IF;
END $$;

CREATE POLICY "Users can delete own batches"
  ON uploaded_batches FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- uploaded_files
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uploaded_files' AND policyname = 'Users can view own uploaded files') THEN
    DROP POLICY "Users can view own uploaded files" ON uploaded_files;
  END IF;
END $$;

CREATE POLICY "Users can view own uploaded files"
  ON uploaded_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uploaded_files' AND policyname = 'Users can insert own uploaded files') THEN
    DROP POLICY "Users can insert own uploaded files" ON uploaded_files;
  END IF;
END $$;

CREATE POLICY "Users can insert own uploaded files"
  ON uploaded_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uploaded_files' AND policyname = 'Users can update own uploaded files') THEN
    DROP POLICY "Users can update own uploaded files" ON uploaded_files;
  END IF;
END $$;

CREATE POLICY "Users can update own uploaded files"
  ON uploaded_files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uploaded_files' AND policyname = 'Users can delete own uploaded files') THEN
    DROP POLICY "Users can delete own uploaded files" ON uploaded_files;
  END IF;
END $$;

CREATE POLICY "Users can delete own uploaded files"
  ON uploaded_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = (SELECT auth.uid())
    )
  );