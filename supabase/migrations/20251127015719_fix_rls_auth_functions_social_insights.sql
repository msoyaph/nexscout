/*
  # Fix RLS Auth Functions - Social Insights Tables

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid())
    - Prevents re-evaluation for each row

  2. Tables Fixed
    - linkedin_page_insights (1 policy)
    - tiktok_insights (1 policy)
    - twitter_insights (1 policy)
    - diagnostic_logs (1 policy)
*/

-- linkedin_page_insights
DROP POLICY IF EXISTS "Users can read own LinkedIn insights" ON public.linkedin_page_insights;

CREATE POLICY "Users can read own LinkedIn insights"
  ON public.linkedin_page_insights
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- tiktok_insights
DROP POLICY IF EXISTS "Users can read own TikTok insights" ON public.tiktok_insights;

CREATE POLICY "Users can read own TikTok insights"
  ON public.tiktok_insights
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- twitter_insights
DROP POLICY IF EXISTS "Users can read own Twitter insights" ON public.twitter_insights;

CREATE POLICY "Users can read own Twitter insights"
  ON public.twitter_insights
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- diagnostic_logs
DROP POLICY IF EXISTS "Users can view own diagnostic logs" ON public.diagnostic_logs;

CREATE POLICY "Users can view own diagnostic logs"
  ON public.diagnostic_logs
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));
