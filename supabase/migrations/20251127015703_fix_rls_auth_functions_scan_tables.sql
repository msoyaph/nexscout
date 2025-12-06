/*
  # Fix RLS Auth Functions - Scan Tables

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid())
    - Prevents re-evaluation for each row

  2. Tables Fixed
    - scan_processed_items (1 policy)
    - scan_ocr_results (2 policies)
    - scan_taglish_analysis (3 policies)
    - scan_smartness_events (1 policy)
*/

-- scan_processed_items
DROP POLICY IF EXISTS "Users can read own scan processed items" ON public.scan_processed_items;

CREATE POLICY "Users can read own scan processed items"
  ON public.scan_processed_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = scan_processed_items.scan_id
      AND scans.user_id = (select auth.uid())
    )
  );

-- scan_ocr_results
DROP POLICY IF EXISTS "Users can insert own scan OCR results" ON public.scan_ocr_results;
DROP POLICY IF EXISTS "Users can read own scan OCR results" ON public.scan_ocr_results;

CREATE POLICY "Users can insert own scan OCR results"
  ON public.scan_ocr_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = scan_ocr_results.scan_id
      AND scans.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can read own scan OCR results"
  ON public.scan_ocr_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = scan_ocr_results.scan_id
      AND scans.user_id = (select auth.uid())
    )
  );

-- scan_taglish_analysis
DROP POLICY IF EXISTS "Users can insert own scan Taglish analysis" ON public.scan_taglish_analysis;
DROP POLICY IF EXISTS "Users can read own scan Taglish analysis" ON public.scan_taglish_analysis;
DROP POLICY IF EXISTS "Users can update own scan Taglish analysis" ON public.scan_taglish_analysis;

CREATE POLICY "Users can insert own scan Taglish analysis"
  ON public.scan_taglish_analysis
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can read own scan Taglish analysis"
  ON public.scan_taglish_analysis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own scan Taglish analysis"
  ON public.scan_taglish_analysis
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = (select auth.uid())
    )
  );

-- scan_smartness_events
DROP POLICY IF EXISTS "Users can read own smartness events" ON public.scan_smartness_events;

CREATE POLICY "Users can read own smartness events"
  ON public.scan_smartness_events
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));
