/*
  # Optimize RLS Policies - Batch 2: Social Tables

  ## Overview  
  Fix RLS performance for social networking tables.

  ## Tables in this batch
  - social_contacts (4 policies)
  - social_edges (3 policies)
  - social_interactions (2 policies)
  - social_contact_features (3 policies)
  - social_graph_metrics (3 policies)
  - social_connections (4 policies)
  - social_identities (4 policies)
  - social_page_insights (2 policies)
  - social_connect_logs (2 policies)
*/

-- social_contacts
DROP POLICY IF EXISTS "Users can read own contacts" ON social_contacts;
CREATE POLICY "Users can read own contacts"
  ON social_contacts FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own contacts" ON social_contacts;
CREATE POLICY "Users can insert own contacts"
  ON social_contacts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own contacts" ON social_contacts;
CREATE POLICY "Users can update own contacts"
  ON social_contacts FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own contacts" ON social_contacts;
CREATE POLICY "Users can delete own contacts"
  ON social_contacts FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- social_edges
DROP POLICY IF EXISTS "Users can read own edges" ON social_edges;
CREATE POLICY "Users can read own edges"
  ON social_edges FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own edges" ON social_edges;
CREATE POLICY "Users can insert own edges"
  ON social_edges FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own edges" ON social_edges;
CREATE POLICY "Users can update own edges"
  ON social_edges FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- social_interactions
DROP POLICY IF EXISTS "Users can read own interactions" ON social_interactions;
CREATE POLICY "Users can read own interactions"
  ON social_interactions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own interactions" ON social_interactions;
CREATE POLICY "Users can insert own interactions"
  ON social_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- social_contact_features
DROP POLICY IF EXISTS "Users can read own contact features" ON social_contact_features;
CREATE POLICY "Users can read own contact features"
  ON social_contact_features FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own contact features" ON social_contact_features;
CREATE POLICY "Users can insert own contact features"
  ON social_contact_features FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own contact features" ON social_contact_features;
CREATE POLICY "Users can update own contact features"
  ON social_contact_features FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- social_graph_metrics
DROP POLICY IF EXISTS "Users can read own graph metrics" ON social_graph_metrics;
CREATE POLICY "Users can read own graph metrics"
  ON social_graph_metrics FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own graph metrics" ON social_graph_metrics;
CREATE POLICY "Users can insert own graph metrics"
  ON social_graph_metrics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own graph metrics" ON social_graph_metrics;
CREATE POLICY "Users can update own graph metrics"
  ON social_graph_metrics FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- social_connections
DROP POLICY IF EXISTS "Users can view own social connections" ON social_connections;
CREATE POLICY "Users can view own social connections"
  ON social_connections FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own social connections" ON social_connections;
CREATE POLICY "Users can create own social connections"
  ON social_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own social connections" ON social_connections;
CREATE POLICY "Users can update own social connections"
  ON social_connections FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own social connections" ON social_connections;
CREATE POLICY "Users can delete own social connections"
  ON social_connections FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- social_identities
DROP POLICY IF EXISTS "Users can read own social identities" ON social_identities;
CREATE POLICY "Users can read own social identities"
  ON social_identities FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own social identities" ON social_identities;
CREATE POLICY "Users can insert own social identities"
  ON social_identities FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own social identities" ON social_identities;
CREATE POLICY "Users can update own social identities"
  ON social_identities FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own social identities" ON social_identities;
CREATE POLICY "Users can delete own social identities"
  ON social_identities FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- social_page_insights
DROP POLICY IF EXISTS "Users can read own page insights" ON social_page_insights;
CREATE POLICY "Users can read own page insights"
  ON social_page_insights FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own page insights" ON social_page_insights;
CREATE POLICY "Users can insert own page insights"
  ON social_page_insights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- social_connect_logs
DROP POLICY IF EXISTS "Users can read own connect logs" ON social_connect_logs;
CREATE POLICY "Users can read own connect logs"
  ON social_connect_logs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own connect logs" ON social_connect_logs;
CREATE POLICY "Users can insert own connect logs"
  ON social_connect_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
