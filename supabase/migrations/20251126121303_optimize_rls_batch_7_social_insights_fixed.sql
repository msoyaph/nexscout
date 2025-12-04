/*
  # RLS Performance Optimization - Batch 7: Social Platform Insights (Fixed)

  ## Changes
  This migration optimizes RLS policies for social media platform insights tables by wrapping 
  auth.uid() calls in subqueries to prevent per-row function re-evaluation.

  ## Tables Updated
  - linkedin_page_insights: LinkedIn page analytics
  - tiktok_insights: TikTok analytics (has user_id directly)
  - twitter_insights: Twitter analytics
  - scan_smartness_events: Smartness scoring events (has user_id directly)

  ## Performance Impact
  - Prevents auth.uid() from being called once per row during queries
  - Improves query performance for large datasets
  - Maintains identical security behavior

  ## Security Notes
  - All policies maintain existing security boundaries
  - No changes to permission logic, only performance optimization
*/

-- ============================================================================
-- linkedin_page_insights
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'linkedin_page_insights' AND policyname = 'Users can view own LinkedIn insights') THEN
    DROP POLICY "Users can view own LinkedIn insights" ON linkedin_page_insights;
  END IF;
END $$;

CREATE POLICY "Users can view own LinkedIn insights"
  ON linkedin_page_insights FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'linkedin_page_insights' AND policyname = 'Users can insert own LinkedIn insights') THEN
    DROP POLICY "Users can insert own LinkedIn insights" ON linkedin_page_insights;
  END IF;
END $$;

CREATE POLICY "Users can insert own LinkedIn insights"
  ON linkedin_page_insights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'linkedin_page_insights' AND policyname = 'Users can update own LinkedIn insights') THEN
    DROP POLICY "Users can update own LinkedIn insights" ON linkedin_page_insights;
  END IF;
END $$;

CREATE POLICY "Users can update own LinkedIn insights"
  ON linkedin_page_insights FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'linkedin_page_insights' AND policyname = 'Users can delete own LinkedIn insights') THEN
    DROP POLICY "Users can delete own LinkedIn insights" ON linkedin_page_insights;
  END IF;
END $$;

CREATE POLICY "Users can delete own LinkedIn insights"
  ON linkedin_page_insights FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- tiktok_insights
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tiktok_insights' AND policyname = 'Users can view own TikTok insights') THEN
    DROP POLICY "Users can view own TikTok insights" ON tiktok_insights;
  END IF;
END $$;

CREATE POLICY "Users can view own TikTok insights"
  ON tiktok_insights FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tiktok_insights' AND policyname = 'Users can insert own TikTok insights') THEN
    DROP POLICY "Users can insert own TikTok insights" ON tiktok_insights;
  END IF;
END $$;

CREATE POLICY "Users can insert own TikTok insights"
  ON tiktok_insights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tiktok_insights' AND policyname = 'Users can update own TikTok insights') THEN
    DROP POLICY "Users can update own TikTok insights" ON tiktok_insights;
  END IF;
END $$;

CREATE POLICY "Users can update own TikTok insights"
  ON tiktok_insights FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tiktok_insights' AND policyname = 'Users can delete own TikTok insights') THEN
    DROP POLICY "Users can delete own TikTok insights" ON tiktok_insights;
  END IF;
END $$;

CREATE POLICY "Users can delete own TikTok insights"
  ON tiktok_insights FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- twitter_insights
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'twitter_insights' AND policyname = 'Users can view own Twitter insights') THEN
    DROP POLICY "Users can view own Twitter insights" ON twitter_insights;
  END IF;
END $$;

CREATE POLICY "Users can view own Twitter insights"
  ON twitter_insights FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'twitter_insights' AND policyname = 'Users can insert own Twitter insights') THEN
    DROP POLICY "Users can insert own Twitter insights" ON twitter_insights;
  END IF;
END $$;

CREATE POLICY "Users can insert own Twitter insights"
  ON twitter_insights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'twitter_insights' AND policyname = 'Users can update own Twitter insights') THEN
    DROP POLICY "Users can update own Twitter insights" ON twitter_insights;
  END IF;
END $$;

CREATE POLICY "Users can update own Twitter insights"
  ON twitter_insights FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'twitter_insights' AND policyname = 'Users can delete own Twitter insights') THEN
    DROP POLICY "Users can delete own Twitter insights" ON twitter_insights;
  END IF;
END $$;

CREATE POLICY "Users can delete own Twitter insights"
  ON twitter_insights FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- scan_smartness_events
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_smartness_events' AND policyname = 'Users can view own smartness events') THEN
    DROP POLICY "Users can view own smartness events" ON scan_smartness_events;
  END IF;
END $$;

CREATE POLICY "Users can view own smartness events"
  ON scan_smartness_events FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_smartness_events' AND policyname = 'Users can insert own smartness events') THEN
    DROP POLICY "Users can insert own smartness events" ON scan_smartness_events;
  END IF;
END $$;

CREATE POLICY "Users can insert own smartness events"
  ON scan_smartness_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_smartness_events' AND policyname = 'Users can update own smartness events') THEN
    DROP POLICY "Users can update own smartness events" ON scan_smartness_events;
  END IF;
END $$;

CREATE POLICY "Users can update own smartness events"
  ON scan_smartness_events FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_smartness_events' AND policyname = 'Users can delete own smartness events') THEN
    DROP POLICY "Users can delete own smartness events" ON scan_smartness_events;
  END IF;
END $$;

CREATE POLICY "Users can delete own smartness events"
  ON scan_smartness_events FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));