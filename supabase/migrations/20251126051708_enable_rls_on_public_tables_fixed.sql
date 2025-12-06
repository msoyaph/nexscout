/*
  # Enable RLS on Public Tables (Fixed)
  
  ## Purpose
  Enable Row Level Security on all public tables that currently have it disabled.
  This is critical for data security - tables without RLS can be accessed by anyone.
  
  ## Tables Enabled (24 tables)
  All analytics, heatmap, prediction, retention, experiment, and viral tables.
  
  ## Security Impact
  After enabling RLS, these tables will be locked down by default.
  Admin-only policies are added to allow super admin access.
*/

-- Enable RLS on all public tables
ALTER TABLE public.product_feature_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_feature_usage_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heatmap_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heatmap_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heatmap_scroll_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ux_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upgrade_prediction_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upgrade_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churn_prediction_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churn_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_trigger_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_loop_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_roadmap_items ENABLE ROW LEVEL SECURITY;

-- Create simplified admin-only access policies
-- Super admins can access all analytics and system tables

CREATE POLICY "Super admins full access"
  ON public.product_feature_priorities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.analytics_events_v2 FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.analytics_sessions_v2 FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.analytics_feature_usage_v2 FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.heatmap_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.heatmap_aggregates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.heatmap_scroll_summary FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.ux_recommendations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.upgrade_prediction_features FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.upgrade_predictions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.churn_prediction_features FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.churn_predictions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.retention_segments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.retention_playbooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.retention_campaign_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.retention_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.experiment_definitions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.experiment_variants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.experiment_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.experiment_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.viral_trigger_scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.viral_loop_scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.viral_share_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.viral_referral_conversions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins full access"
  ON public.product_roadmap_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );
