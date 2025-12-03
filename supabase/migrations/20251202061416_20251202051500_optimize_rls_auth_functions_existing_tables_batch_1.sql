/*
  # Optimize RLS Auth Functions - Existing Tables Batch 1

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid())
    - Improves RLS policy execution performance by allowing better query planning
  
  2. Affected Tables (Batch 1)
    - profiles
    - prospects
    - ai_generations
    - ai_smartness
    - ai_tasks
    - browser_capture_events
  
  3. Security
    - Maintains identical security rules
    - Only changes function call format for performance
*/

-- profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- prospects policies
DROP POLICY IF EXISTS "Users can view own prospects" ON prospects;
CREATE POLICY "Users can view own prospects"
  ON prospects FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own prospects" ON prospects;
CREATE POLICY "Users can insert own prospects"
  ON prospects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own prospects" ON prospects;
CREATE POLICY "Users can update own prospects"
  ON prospects FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own prospects" ON prospects;
CREATE POLICY "Users can delete own prospects"
  ON prospects FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ai_generations policies
DROP POLICY IF EXISTS "Users can view own generations" ON ai_generations;
CREATE POLICY "Users can view own generations"
  ON ai_generations FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own generations" ON ai_generations;
CREATE POLICY "Users can insert own generations"
  ON ai_generations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ai_smartness policies
DROP POLICY IF EXISTS "Users can view own smartness" ON ai_smartness;
CREATE POLICY "Users can view own smartness"
  ON ai_smartness FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own smartness" ON ai_smartness;
CREATE POLICY "Users can update own smartness"
  ON ai_smartness FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ai_tasks policies
DROP POLICY IF EXISTS "Users can view own tasks" ON ai_tasks;
CREATE POLICY "Users can view own tasks"
  ON ai_tasks FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own tasks" ON ai_tasks;
CREATE POLICY "Users can insert own tasks"
  ON ai_tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own tasks" ON ai_tasks;
CREATE POLICY "Users can update own tasks"
  ON ai_tasks FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- browser_capture_events policies
DROP POLICY IF EXISTS "Users can view own capture events" ON browser_capture_events;
CREATE POLICY "Users can view own capture events"
  ON browser_capture_events FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own capture events" ON browser_capture_events;
CREATE POLICY "Users can insert own capture events"
  ON browser_capture_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
