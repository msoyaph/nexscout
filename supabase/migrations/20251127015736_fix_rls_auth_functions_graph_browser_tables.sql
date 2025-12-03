/*
  # Fix RLS Auth Functions - Graph and Browser Tables

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid())
    - Prevents re-evaluation for each row
    - Includes super admin checks

  2. Tables Fixed
    - social_graph_nodes (1 policy)
    - social_graph_edges (1 policy)
    - social_graph_insights (1 policy)
    - browser_capture_events (2 policies)
    - browser_captures (1 policy)
    - browser_extension_tokens (1 policy)
*/

-- Check if super admin function exists, create if not
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.role_id IN (
      SELECT id FROM public.admin_roles WHERE role_name = 'super_admin'
    )
  );
END;
$$;

-- social_graph_nodes
DROP POLICY IF EXISTS "Super admins can view all graph nodes" ON public.social_graph_nodes;

CREATE POLICY "Super admins can view all graph nodes"
  ON public.social_graph_nodes
  FOR SELECT
  TO authenticated
  USING ((select public.is_super_admin()) = true);

-- social_graph_edges
DROP POLICY IF EXISTS "Super admins can view all graph edges" ON public.social_graph_edges;

CREATE POLICY "Super admins can view all graph edges"
  ON public.social_graph_edges
  FOR SELECT
  TO authenticated
  USING ((select public.is_super_admin()) = true);

-- social_graph_insights
DROP POLICY IF EXISTS "Super admins can view all graph insights" ON public.social_graph_insights;

CREATE POLICY "Super admins can view all graph insights"
  ON public.social_graph_insights
  FOR SELECT
  TO authenticated
  USING ((select public.is_super_admin()) = true);

-- browser_capture_events
DROP POLICY IF EXISTS "Users can insert own browser captures" ON public.browser_capture_events;
DROP POLICY IF EXISTS "Users can read own browser captures" ON public.browser_capture_events;

CREATE POLICY "Users can insert own browser captures"
  ON public.browser_capture_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own browser captures"
  ON public.browser_capture_events
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- browser_captures
DROP POLICY IF EXISTS "Super admins can view all browser captures" ON public.browser_captures;

CREATE POLICY "Super admins can view all browser captures"
  ON public.browser_captures
  FOR SELECT
  TO authenticated
  USING ((select public.is_super_admin()) = true);

-- browser_extension_tokens
DROP POLICY IF EXISTS "Super admins can view all extension tokens" ON public.browser_extension_tokens;

CREATE POLICY "Super admins can view all extension tokens"
  ON public.browser_extension_tokens
  FOR SELECT
  TO authenticated
  USING ((select public.is_super_admin()) = true);
