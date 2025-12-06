/*
  # Optimize RLS Policies Part 2 - Remaining Tables
  
  ## Purpose
  Continue optimizing RLS policies for remaining tables by wrapping
  auth functions in subqueries for better performance.
  
  ## Tables Updated
  - prospects and related tables
  - admin tables
  - notifications
  - scanning and processing
  - ai_tasks, ai_alerts
  - missions
  - follow_up_sequences
  - And many more
*/

-- prospects table
DROP POLICY IF EXISTS "Users can view own prospects" ON public.prospects;
CREATE POLICY "Users can view own prospects"
  ON public.prospects FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own prospects" ON public.prospects;
CREATE POLICY "Users can insert own prospects"
  ON public.prospects FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own prospects" ON public.prospects;
CREATE POLICY "Users can update own prospects"
  ON public.prospects FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own prospects" ON public.prospects;
CREATE POLICY "Users can delete own prospects"
  ON public.prospects FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- raw_prospect_candidates table
DROP POLICY IF EXISTS "Users can view own raw prospect candidates" ON public.raw_prospect_candidates;
CREATE POLICY "Users can view own raw prospect candidates"
  ON public.raw_prospect_candidates FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own raw prospect candidates" ON public.raw_prospect_candidates;
CREATE POLICY "Users can insert own raw prospect candidates"
  ON public.raw_prospect_candidates FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own raw prospect candidates" ON public.raw_prospect_candidates;
CREATE POLICY "Users can update own raw prospect candidates"
  ON public.raw_prospect_candidates FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- prospect_events table
DROP POLICY IF EXISTS "Users can view own prospect events" ON public.prospect_events;
CREATE POLICY "Users can view own prospect events"
  ON public.prospect_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_events.prospect_id
      AND prospects.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own prospect events" ON public.prospect_events;
CREATE POLICY "Users can insert own prospect events"
  ON public.prospect_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_events.prospect_id
      AND prospects.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own prospect events" ON public.prospect_events;
CREATE POLICY "Users can delete own prospect events"
  ON public.prospect_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_events.prospect_id
      AND prospects.user_id = (SELECT auth.uid())
    )
  );

-- prospect_profiles table
DROP POLICY IF EXISTS "Users can view own prospect profiles" ON public.prospect_profiles;
CREATE POLICY "Users can view own prospect profiles"
  ON public.prospect_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_profiles.prospect_id
      AND prospects.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own prospect profiles" ON public.prospect_profiles;
CREATE POLICY "Users can insert own prospect profiles"
  ON public.prospect_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_profiles.prospect_id
      AND prospects.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own prospect profiles" ON public.prospect_profiles;
CREATE POLICY "Users can update own prospect profiles"
  ON public.prospect_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_profiles.prospect_id
      AND prospects.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_profiles.prospect_id
      AND prospects.user_id = (SELECT auth.uid())
    )
  );

-- prospect_scores table
DROP POLICY IF EXISTS "Users can view own prospect scores" ON public.prospect_scores;
CREATE POLICY "Users can view own prospect scores"
  ON public.prospect_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_scores.prospect_id
      AND prospects.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own prospect scores" ON public.prospect_scores;
CREATE POLICY "Users can insert own prospect scores"
  ON public.prospect_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_scores.prospect_id
      AND prospects.user_id = (SELECT auth.uid())
    )
  );

-- ai_generations table
DROP POLICY IF EXISTS "Users can view own ai generations" ON public.ai_generations;
CREATE POLICY "Users can view own ai generations"
  ON public.ai_generations FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own ai generations" ON public.ai_generations;
CREATE POLICY "Users can insert own ai generations"
  ON public.ai_generations FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- scanning_sessions table
DROP POLICY IF EXISTS "Users can view own scanning sessions" ON public.scanning_sessions;
CREATE POLICY "Users can view own scanning sessions"
  ON public.scanning_sessions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own scanning sessions" ON public.scanning_sessions;
CREATE POLICY "Users can insert own scanning sessions"
  ON public.scanning_sessions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own scanning sessions" ON public.scanning_sessions;
CREATE POLICY "Users can update own scanning sessions"
  ON public.scanning_sessions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- processing_queue table
DROP POLICY IF EXISTS "Users can view own processing queue" ON public.processing_queue;
CREATE POLICY "Users can view own processing queue"
  ON public.processing_queue FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own processing queue" ON public.processing_queue;
CREATE POLICY "Users can insert own processing queue"
  ON public.processing_queue FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own processing queue" ON public.processing_queue;
CREATE POLICY "Users can update own processing queue"
  ON public.processing_queue FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- notifications table
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own notifications" ON public.notifications;
CREATE POLICY "Users can create own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ai_tasks table
DROP POLICY IF EXISTS "Users can view own tasks" ON public.ai_tasks;
CREATE POLICY "Users can view own tasks"
  ON public.ai_tasks FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.ai_tasks;
CREATE POLICY "Users can insert own tasks"
  ON public.ai_tasks FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.ai_tasks;
CREATE POLICY "Users can update own tasks"
  ON public.ai_tasks FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.ai_tasks;
CREATE POLICY "Users can delete own tasks"
  ON public.ai_tasks FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ai_alerts table
DROP POLICY IF EXISTS "Users can view own alerts" ON public.ai_alerts;
CREATE POLICY "Users can view own alerts"
  ON public.ai_alerts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own alerts" ON public.ai_alerts;
CREATE POLICY "Users can insert own alerts"
  ON public.ai_alerts FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own alerts" ON public.ai_alerts;
CREATE POLICY "Users can update own alerts"
  ON public.ai_alerts FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own alerts" ON public.ai_alerts;
CREATE POLICY "Users can delete own alerts"
  ON public.ai_alerts FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- missions table
DROP POLICY IF EXISTS "Users can view own missions" ON public.missions;
CREATE POLICY "Users can view own missions"
  ON public.missions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own missions" ON public.missions;
CREATE POLICY "Users can update own missions"
  ON public.missions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own missions" ON public.missions;
CREATE POLICY "Users can delete own missions"
  ON public.missions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- follow_up_sequences table
DROP POLICY IF EXISTS "Users can view own sequences" ON public.follow_up_sequences;
CREATE POLICY "Users can view own sequences"
  ON public.follow_up_sequences FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own sequences" ON public.follow_up_sequences;
CREATE POLICY "Users can create own sequences"
  ON public.follow_up_sequences FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own sequences" ON public.follow_up_sequences;
CREATE POLICY "Users can update own sequences"
  ON public.follow_up_sequences FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own sequences" ON public.follow_up_sequences;
CREATE POLICY "Users can delete own sequences"
  ON public.follow_up_sequences FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
