/*
  # Optimize RLS Auth Functions - Batch 3

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid())
  
  2. Affected Tables (Batch 3)
    - ai_pipeline_jobs
    - ai_pipeline_recommendations
    - ai_pipeline_actions (complex policy with subquery)
  
  3. Security
    - Maintains identical security rules
*/

-- ai_pipeline_jobs policies
DROP POLICY IF EXISTS "Users can view own pipeline jobs" ON ai_pipeline_jobs;
CREATE POLICY "Users can view own pipeline jobs"
  ON ai_pipeline_jobs FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own pipeline jobs" ON ai_pipeline_jobs;
CREATE POLICY "Users can update own pipeline jobs"
  ON ai_pipeline_jobs FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own pipeline jobs" ON ai_pipeline_jobs;
CREATE POLICY "Users can delete own pipeline jobs"
  ON ai_pipeline_jobs FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ai_pipeline_recommendations policies
DROP POLICY IF EXISTS "Users can view own pipeline recommendations" ON ai_pipeline_recommendations;
CREATE POLICY "Users can view own pipeline recommendations"
  ON ai_pipeline_recommendations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own pipeline recommendations" ON ai_pipeline_recommendations;
CREATE POLICY "Users can update own pipeline recommendations"
  ON ai_pipeline_recommendations FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ai_pipeline_actions policies (with subquery optimization)
DROP POLICY IF EXISTS "Users can view own pipeline actions" ON ai_pipeline_actions;
CREATE POLICY "Users can view own pipeline actions"
  ON ai_pipeline_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM ai_pipeline_jobs
      WHERE ai_pipeline_jobs.id = ai_pipeline_actions.job_id 
        AND ai_pipeline_jobs.user_id = (select auth.uid())
    )
  );
