/*
  # Remove Duplicate RLS Policies - Batch 5 (Final)

  1. Purpose
    - Remove remaining duplicate RLS policies
  
  2. Tables Fixed
    - scan_processed_items
    - scan_smartness_events
    - scan_taglish_analysis
    - social_graph_* tables
    - team_* tables
    - tiktok/twitter insights
    - training_video_modules
    - uploaded_* tables
    - user_company_links
*/

-- Fix scan_processed_items (keep newer)
DROP POLICY IF EXISTS "Users can read own scan processed items" ON scan_processed_items;

-- Fix scan_smartness_events (keep newer)
DROP POLICY IF EXISTS "Users can read own smartness events" ON scan_smartness_events;

-- Fix scan_taglish_analysis (keep newer policy names)
DROP POLICY IF EXISTS "Users can view own taglish analysis" ON scan_taglish_analysis;
DROP POLICY IF EXISTS "Users can insert own taglish analysis" ON scan_taglish_analysis;
DROP POLICY IF EXISTS "Users can update own taglish analysis" ON scan_taglish_analysis;

-- Fix social_graph_edges (keep user policy)
DROP POLICY IF EXISTS "Super admins can view all graph edges" ON social_graph_edges;

-- Fix social_graph_insights (keep user policy)
DROP POLICY IF EXISTS "Super admins can view all graph insights" ON social_graph_insights;

-- Fix social_graph_nodes (keep user policy)
DROP POLICY IF EXISTS "Super admins can view all graph nodes" ON social_graph_nodes;

-- Fix team_members (keep both but combine)
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;
CREATE POLICY "Team leaders can manage members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM team_subscriptions WHERE team_leader_id = (select auth.uid())
    ) OR user_id = (select auth.uid())
  )
  WITH CHECK (
    team_id IN (
      SELECT id FROM team_subscriptions WHERE team_leader_id = (select auth.uid())
    )
  );

-- Fix team_subscriptions (keep one)
DROP POLICY IF EXISTS "Team leaders can manage own teams" ON team_subscriptions;

-- Fix tiktok_insights (keep one)
DROP POLICY IF EXISTS "Users can read own TikTok insights" ON tiktok_insights;

-- Fix training_video_modules (keep named policies)
DROP POLICY IF EXISTS training_owner_policy ON training_video_modules;
DROP POLICY IF EXISTS training_public_read ON training_video_modules;

CREATE POLICY "Training owners and public can view"
  ON training_video_modules FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = (select auth.uid()));

-- Fix twitter_insights (keep one)
DROP POLICY IF EXISTS "Users can read own Twitter insights" ON twitter_insights;

-- Fix uploaded_batches (keep newer)
DROP POLICY IF EXISTS "Users can create own batches" ON uploaded_batches;

-- Fix uploaded_files (keep newer policy names)
DROP POLICY IF EXISTS "Users can view own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can create own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can update own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can delete own files" ON uploaded_files;

-- Fix user_company_links (already fixed in earlier migration, just drop old)
DROP POLICY IF EXISTS "Users can manage own company links" ON user_company_links;
