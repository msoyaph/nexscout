/*
  # Fix RLS Auth Functions - Behavior Tables

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid())
    - Prevents re-evaluation for each row

  2. Tables Fixed
    - contact_behavior_timeline (3 policies)
    - prospect_behavior_summary (3 policies)
*/

-- contact_behavior_timeline
DROP POLICY IF EXISTS "Users can insert own timeline" ON public.contact_behavior_timeline;
DROP POLICY IF EXISTS "Users can read own timeline" ON public.contact_behavior_timeline;
DROP POLICY IF EXISTS "Users can update own timeline" ON public.contact_behavior_timeline;

CREATE POLICY "Users can insert own timeline"
  ON public.contact_behavior_timeline
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own timeline"
  ON public.contact_behavior_timeline
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own timeline"
  ON public.contact_behavior_timeline
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- prospect_behavior_summary
DROP POLICY IF EXISTS "Users can insert own behavior summaries" ON public.prospect_behavior_summary;
DROP POLICY IF EXISTS "Users can read own behavior summaries" ON public.prospect_behavior_summary;
DROP POLICY IF EXISTS "Users can update own behavior summaries" ON public.prospect_behavior_summary;

CREATE POLICY "Users can insert own behavior summaries"
  ON public.prospect_behavior_summary
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own behavior summaries"
  ON public.prospect_behavior_summary
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own behavior summaries"
  ON public.prospect_behavior_summary
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
