/*
  # RLS Performance Optimization - Batch 6: Behavior Timeline and Scan Data (Fixed)

  ## Changes
  This migration optimizes RLS policies for behavior timeline, prospect summaries, and scan-related 
  tables by wrapping auth.uid() calls in subqueries to prevent per-row function re-evaluation.

  ## Tables Updated
  - contact_behavior_timeline: Behavior tracking for contacts
  - prospect_behavior_summary: Aggregated prospect behavior data (uses prospect_id)
  - scan_processed_items: Items processed during scans (uses scan_id)
  - scan_ocr_results: OCR extraction results (uses scan_id)
  - scan_taglish_analysis: Taglish language analysis results (uses scan_id)

  ## Performance Impact
  - Prevents auth.uid() from being called once per row during queries
  - Improves query performance for large datasets
  - Maintains identical security behavior

  ## Security Notes
  - All policies maintain existing security boundaries
  - No changes to permission logic, only performance optimization
*/

-- ============================================================================
-- contact_behavior_timeline
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_behavior_timeline' AND policyname = 'Users can view own contact behavior') THEN
    DROP POLICY "Users can view own contact behavior" ON contact_behavior_timeline;
  END IF;
END $$;

CREATE POLICY "Users can view own contact behavior"
  ON contact_behavior_timeline FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_behavior_timeline' AND policyname = 'Users can insert own contact behavior') THEN
    DROP POLICY "Users can insert own contact behavior" ON contact_behavior_timeline;
  END IF;
END $$;

CREATE POLICY "Users can insert own contact behavior"
  ON contact_behavior_timeline FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_behavior_timeline' AND policyname = 'Users can update own contact behavior') THEN
    DROP POLICY "Users can update own contact behavior" ON contact_behavior_timeline;
  END IF;
END $$;

CREATE POLICY "Users can update own contact behavior"
  ON contact_behavior_timeline FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_behavior_timeline' AND policyname = 'Users can delete own contact behavior') THEN
    DROP POLICY "Users can delete own contact behavior" ON contact_behavior_timeline;
  END IF;
END $$;

CREATE POLICY "Users can delete own contact behavior"
  ON contact_behavior_timeline FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- prospect_behavior_summary
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prospect_behavior_summary' AND policyname = 'Users can view own prospect summaries') THEN
    DROP POLICY "Users can view own prospect summaries" ON prospect_behavior_summary;
  END IF;
END $$;

CREATE POLICY "Users can view own prospect summaries"
  ON prospect_behavior_summary FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prospect_behavior_summary' AND policyname = 'Users can insert own prospect summaries') THEN
    DROP POLICY "Users can insert own prospect summaries" ON prospect_behavior_summary;
  END IF;
END $$;

CREATE POLICY "Users can insert own prospect summaries"
  ON prospect_behavior_summary FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prospect_behavior_summary' AND policyname = 'Users can update own prospect summaries') THEN
    DROP POLICY "Users can update own prospect summaries" ON prospect_behavior_summary;
  END IF;
END $$;

CREATE POLICY "Users can update own prospect summaries"
  ON prospect_behavior_summary FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prospect_behavior_summary' AND policyname = 'Users can delete own prospect summaries') THEN
    DROP POLICY "Users can delete own prospect summaries" ON prospect_behavior_summary;
  END IF;
END $$;

CREATE POLICY "Users can delete own prospect summaries"
  ON prospect_behavior_summary FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- scan_processed_items
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_processed_items' AND policyname = 'Users can view own scan processed items') THEN
    DROP POLICY "Users can view own scan processed items" ON scan_processed_items;
  END IF;
END $$;

CREATE POLICY "Users can view own scan processed items"
  ON scan_processed_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_processed_items.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_processed_items' AND policyname = 'Users can insert own scan processed items') THEN
    DROP POLICY "Users can insert own scan processed items" ON scan_processed_items;
  END IF;
END $$;

CREATE POLICY "Users can insert own scan processed items"
  ON scan_processed_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_processed_items.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_processed_items' AND policyname = 'Users can update own scan processed items') THEN
    DROP POLICY "Users can update own scan processed items" ON scan_processed_items;
  END IF;
END $$;

CREATE POLICY "Users can update own scan processed items"
  ON scan_processed_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_processed_items.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_processed_items.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_processed_items' AND policyname = 'Users can delete own scan processed items') THEN
    DROP POLICY "Users can delete own scan processed items" ON scan_processed_items;
  END IF;
END $$;

CREATE POLICY "Users can delete own scan processed items"
  ON scan_processed_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_processed_items.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- scan_ocr_results
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_ocr_results' AND policyname = 'Users can view own OCR results') THEN
    DROP POLICY "Users can view own OCR results" ON scan_ocr_results;
  END IF;
END $$;

CREATE POLICY "Users can view own OCR results"
  ON scan_ocr_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_ocr_results.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_ocr_results' AND policyname = 'Users can insert own OCR results') THEN
    DROP POLICY "Users can insert own OCR results" ON scan_ocr_results;
  END IF;
END $$;

CREATE POLICY "Users can insert own OCR results"
  ON scan_ocr_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_ocr_results.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_ocr_results' AND policyname = 'Users can update own OCR results') THEN
    DROP POLICY "Users can update own OCR results" ON scan_ocr_results;
  END IF;
END $$;

CREATE POLICY "Users can update own OCR results"
  ON scan_ocr_results FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_ocr_results.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_ocr_results.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_ocr_results' AND policyname = 'Users can delete own OCR results') THEN
    DROP POLICY "Users can delete own OCR results" ON scan_ocr_results;
  END IF;
END $$;

CREATE POLICY "Users can delete own OCR results"
  ON scan_ocr_results FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_ocr_results.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- scan_taglish_analysis
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_taglish_analysis' AND policyname = 'Users can view own taglish analysis') THEN
    DROP POLICY "Users can view own taglish analysis" ON scan_taglish_analysis;
  END IF;
END $$;

CREATE POLICY "Users can view own taglish analysis"
  ON scan_taglish_analysis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_taglish_analysis' AND policyname = 'Users can insert own taglish analysis') THEN
    DROP POLICY "Users can insert own taglish analysis" ON scan_taglish_analysis;
  END IF;
END $$;

CREATE POLICY "Users can insert own taglish analysis"
  ON scan_taglish_analysis FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_taglish_analysis' AND policyname = 'Users can update own taglish analysis') THEN
    DROP POLICY "Users can update own taglish analysis" ON scan_taglish_analysis;
  END IF;
END $$;

CREATE POLICY "Users can update own taglish analysis"
  ON scan_taglish_analysis FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_taglish_analysis' AND policyname = 'Users can delete own taglish analysis') THEN
    DROP POLICY "Users can delete own taglish analysis" ON scan_taglish_analysis;
  END IF;
END $$;

CREATE POLICY "Users can delete own taglish analysis"
  ON scan_taglish_analysis FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );