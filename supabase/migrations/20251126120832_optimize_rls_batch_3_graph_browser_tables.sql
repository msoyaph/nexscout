/*
  # Optimize RLS Policies - Batch 3: Graph and Browser Tables

  ## Overview  
  Fix RLS performance for social graph and browser capture tables.

  ## Tables in this batch
  - social_graph_nodes (5 policies)
  - social_graph_edges (5 policies)
  - social_graph_insights (3 policies)
  - browser_captures (5 policies)
  - browser_capture_events (6 policies)
  - browser_extension_tokens (5 policies)
*/

-- social_graph_nodes
DROP POLICY IF EXISTS "Users can view own graph nodes" ON social_graph_nodes;
CREATE POLICY "Users can view own graph nodes"
  ON social_graph_nodes FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own graph nodes" ON social_graph_nodes;
CREATE POLICY "Users can insert own graph nodes"
  ON social_graph_nodes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own graph nodes" ON social_graph_nodes;
CREATE POLICY "Users can update own graph nodes"
  ON social_graph_nodes FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own graph nodes" ON social_graph_nodes;
CREATE POLICY "Users can delete own graph nodes"
  ON social_graph_nodes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- social_graph_edges
DROP POLICY IF EXISTS "Users can view own graph edges" ON social_graph_edges;
CREATE POLICY "Users can view own graph edges"
  ON social_graph_edges FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own graph edges" ON social_graph_edges;
CREATE POLICY "Users can insert own graph edges"
  ON social_graph_edges FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own graph edges" ON social_graph_edges;
CREATE POLICY "Users can update own graph edges"
  ON social_graph_edges FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own graph edges" ON social_graph_edges;
CREATE POLICY "Users can delete own graph edges"
  ON social_graph_edges FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- social_graph_insights
DROP POLICY IF EXISTS "Users can view own graph insights" ON social_graph_insights;
CREATE POLICY "Users can view own graph insights"
  ON social_graph_insights FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own graph insights" ON social_graph_insights;
CREATE POLICY "Users can insert own graph insights"
  ON social_graph_insights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- browser_captures
DROP POLICY IF EXISTS "Users can view own browser captures" ON browser_captures;
CREATE POLICY "Users can view own browser captures"
  ON browser_captures FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own browser captures" ON browser_captures;
CREATE POLICY "Users can insert own browser captures"
  ON browser_captures FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own browser captures" ON browser_captures;
CREATE POLICY "Users can update own browser captures"
  ON browser_captures FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own browser captures" ON browser_captures;
CREATE POLICY "Users can delete own browser captures"
  ON browser_captures FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- browser_capture_events  
DROP POLICY IF EXISTS "Users can read own captures" ON browser_capture_events;
CREATE POLICY "Users can read own captures"
  ON browser_capture_events FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own captures" ON browser_capture_events;
CREATE POLICY "Users can insert own captures"
  ON browser_capture_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own captures" ON browser_capture_events;
CREATE POLICY "Users can update own captures"
  ON browser_capture_events FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own captures" ON browser_capture_events;
CREATE POLICY "Users can delete own captures"
  ON browser_capture_events FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- browser_extension_tokens
DROP POLICY IF EXISTS "Users can view own extension tokens" ON browser_extension_tokens;
CREATE POLICY "Users can view own extension tokens"
  ON browser_extension_tokens FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own extension tokens" ON browser_extension_tokens;
CREATE POLICY "Users can insert own extension tokens"
  ON browser_extension_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own extension tokens" ON browser_extension_tokens;
CREATE POLICY "Users can update own extension tokens"
  ON browser_extension_tokens FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own extension tokens" ON browser_extension_tokens;
CREATE POLICY "Users can delete own extension tokens"
  ON browser_extension_tokens FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));
