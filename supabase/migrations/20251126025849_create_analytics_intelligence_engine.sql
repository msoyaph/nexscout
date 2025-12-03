/*
  # NexScout Analytics Intelligence Engine v1.0

  ## Overview
  Complete Mixpanel + Amplitude style analytics system with AI-powered insights,
  funnel tracking, cohort analysis, and predictive analytics.

  ## New Tables

  ### Core Event Tracking
  - `analytics_events` - All user events with full context
  - `analytics_sessions` - Session tracking and metadata
  - `analytics_daily_summary` - Aggregated daily metrics

  ### Feature & Usage Analytics
  - `analytics_feature_usage` - Feature usage patterns
  - `analytics_page_views` - Page navigation tracking
  - `analytics_user_journey` - Sequential user paths

  ### Cohort & Retention
  - `analytics_user_cohorts` - Cohort definitions
  - `analytics_cohort_membership` - User cohort assignments
  - `analytics_retention_metrics` - Retention calculations

  ### Funnel System
  - `analytics_funnels` - Funnel definitions
  - `analytics_funnel_steps` - Funnel step progress
  - `analytics_funnel_performance` - Funnel metrics

  ### Predictive Analytics
  - `analytics_prediction_signals` - ML signals for predictions
  - `analytics_user_scores` - Upgrade/churn/viral scores

  ### AI Insights
  - `analytics_insights` - Auto-generated insights
  - `analytics_recommendations` - Actionable recommendations

  ### A/B Testing
  - `analytics_experiments` - Experiment definitions
  - `analytics_experiment_variants` - Variant configurations
  - `analytics_experiment_assignments` - User assignments
  - `analytics_experiment_results` - Performance metrics

  ## Security
  - Admin-only access
  - Super admin read/write access
  - Optimized indexes for fast queries
*/

-- Core event tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  event_name text NOT NULL,
  event_category text NOT NULL,
  page text,
  element text,
  timestamp timestamptz DEFAULT now() NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  device_info jsonb DEFAULT '{}'::jsonb,
  app_version text DEFAULT '1.0.0',
  subscription_tier text,
  mlm_level text,
  coins_balance integer,
  streak_days integer,
  time_spent_seconds numeric,
  scroll_depth_percent integer,
  referral_code_used text,
  user_agent text,
  ip_address inet,
  referrer text
);

CREATE TABLE IF NOT EXISTS analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  duration_seconds integer,
  device_type text,
  device_os text,
  browser text,
  screen_size text,
  pages_viewed integer DEFAULT 0,
  events_count integer DEFAULT 0,
  actions_taken integer DEFAULT 0,
  entry_page text,
  exit_page text,
  referrer_url text,
  converted_to_paid boolean DEFAULT false,
  shared_app boolean DEFAULT false,
  completed_mission boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS analytics_daily_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_users integer DEFAULT 0,
  new_users integer DEFAULT 0,
  active_users integer DEFAULT 0,
  returning_users integer DEFAULT 0,
  free_users integer DEFAULT 0,
  pro_users integer DEFAULT 0,
  elite_users integer DEFAULT 0,
  team_users integer DEFAULT 0,
  upgrades integer DEFAULT 0,
  downgrades integer DEFAULT 0,
  cancellations integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  avg_session_duration_seconds numeric,
  total_events integer DEFAULT 0,
  scans_performed integer DEFAULT 0,
  messages_generated integer DEFAULT 0,
  decks_generated integer DEFAULT 0,
  sequences_generated integer DEFAULT 0,
  revenue_php numeric DEFAULT 0,
  coins_purchased integer DEFAULT 0,
  coins_spent integer DEFAULT 0,
  referrals_sent integer DEFAULT 0,
  referrals_converted integer DEFAULT 0,
  shares integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  feature_category text NOT NULL,
  first_used_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  usage_count integer DEFAULT 1,
  total_time_spent_seconds numeric DEFAULT 0,
  avg_time_per_use_seconds numeric DEFAULT 0,
  completed_successfully integer DEFAULT 0,
  abandoned integer DEFAULT 0,
  errors_encountered integer DEFAULT 0,
  led_to_upgrade boolean DEFAULT false,
  led_to_share boolean DEFAULT false,
  led_to_retention boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature_name)
);

CREATE TABLE IF NOT EXISTS analytics_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  page_name text NOT NULL,
  page_url text,
  viewed_at timestamptz DEFAULT now(),
  time_on_page_seconds numeric,
  scroll_depth_percent integer,
  rage_clicks integer DEFAULT 0,
  back_button_used boolean DEFAULT false,
  previous_page text,
  next_page text
);

CREATE TABLE IF NOT EXISTS analytics_user_journey (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  journey_path text[] NOT NULL,
  journey_timestamps timestamptz[] NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  total_steps integer NOT NULL,
  completed_goal boolean DEFAULT false,
  goal_type text,
  abandoned boolean DEFAULT false,
  abandon_step integer
);

CREATE TABLE IF NOT EXISTS analytics_user_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_name text UNIQUE NOT NULL,
  cohort_type text NOT NULL,
  description text,
  definition_criteria jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS analytics_cohort_membership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES analytics_user_cohorts(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  cohort_entry_date date NOT NULL,
  UNIQUE(user_id, cohort_id)
);

CREATE TABLE IF NOT EXISTS analytics_retention_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES analytics_user_cohorts(id) ON DELETE CASCADE,
  period_type text NOT NULL,
  period_number integer NOT NULL,
  cohort_size integer NOT NULL,
  retained_users integer NOT NULL,
  retention_rate numeric NOT NULL,
  avg_sessions numeric,
  avg_events numeric,
  avg_revenue_php numeric,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(cohort_id, period_type, period_number)
);

CREATE TABLE IF NOT EXISTS analytics_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_name text UNIQUE NOT NULL,
  funnel_category text NOT NULL,
  description text,
  steps jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_funnel_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  funnel_id uuid REFERENCES analytics_funnels(id) ON DELETE CASCADE,
  current_step integer NOT NULL,
  step_name text NOT NULL,
  reached_at timestamptz DEFAULT now(),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  time_to_reach_ms bigint,
  dropped_off boolean DEFAULT false,
  drop_reason text
);

CREATE TABLE IF NOT EXISTS analytics_funnel_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid REFERENCES analytics_funnels(id) ON DELETE CASCADE,
  date date NOT NULL,
  step_number integer NOT NULL,
  step_name text NOT NULL,
  users_entered integer NOT NULL,
  users_completed integer NOT NULL,
  users_dropped integer NOT NULL,
  conversion_rate numeric NOT NULL,
  avg_time_to_complete_ms bigint,
  median_time_to_complete_ms bigint,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(funnel_id, date, step_number)
);

CREATE TABLE IF NOT EXISTS analytics_prediction_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  days_since_signup integer,
  days_since_last_active integer,
  total_sessions integer,
  avg_session_duration_minutes numeric,
  scans_count integer DEFAULT 0,
  messages_count integer DEFAULT 0,
  decks_count integer DEFAULT 0,
  sequences_count integer DEFAULT 0,
  training_completed integer DEFAULT 0,
  missions_completed integer DEFAULT 0,
  scan_limit_hits integer DEFAULT 0,
  message_limit_hits integer DEFAULT 0,
  paywall_views integer DEFAULT 0,
  coins_spent integer DEFAULT 0,
  prospects_unlocked integer DEFAULT 0,
  pipeline_active_count integer DEFAULT 0,
  referrals_sent integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  consecutive_active_days integer DEFAULT 0,
  weekly_active_weeks integer DEFAULT 0,
  monthly_active_months integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS analytics_user_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  upgrade_probability numeric NOT NULL CHECK (upgrade_probability >= 0 AND upgrade_probability <= 1),
  churn_probability numeric NOT NULL CHECK (churn_probability >= 0 AND churn_probability <= 1),
  referral_probability numeric NOT NULL CHECK (referral_probability >= 0 AND referral_probability <= 1),
  churn_risk_level text NOT NULL,
  upgrade_likelihood text NOT NULL,
  viral_potential text NOT NULL,
  key_indicators jsonb DEFAULT '{}'::jsonb,
  recommended_actions text[],
  calculated_at timestamptz DEFAULT now(),
  next_calculation_at timestamptz,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS analytics_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL,
  insight_category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  insight_text text NOT NULL,
  impact_score integer NOT NULL CHECK (impact_score >= 1 AND impact_score <= 100),
  confidence_score numeric NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  severity_level text NOT NULL,
  related_feature text,
  related_funnel text,
  related_cohort text,
  supporting_data jsonb DEFAULT '{}'::jsonb,
  metrics jsonb DEFAULT '{}'::jsonb,
  recommended_actions text[],
  estimated_impact text,
  created_at timestamptz DEFAULT now(),
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz,
  implemented boolean DEFAULT false,
  implementation_notes text
);

CREATE TABLE IF NOT EXISTS analytics_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id uuid REFERENCES analytics_insights(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  priority text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  action_required text NOT NULL,
  estimated_lift_percent numeric,
  estimated_revenue_impact_php numeric,
  estimated_retention_impact_percent numeric,
  difficulty_level text,
  estimated_effort_hours numeric,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS analytics_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name text UNIQUE NOT NULL,
  experiment_type text NOT NULL,
  description text,
  hypothesis text,
  feature_flag text,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  status text DEFAULT 'draft',
  target_sample_size integer,
  traffic_allocation_percent integer DEFAULT 100,
  primary_metric text NOT NULL,
  secondary_metrics text[],
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS analytics_experiment_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid REFERENCES analytics_experiments(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  variant_type text NOT NULL,
  description text,
  configuration jsonb DEFAULT '{}'::jsonb,
  traffic_weight integer DEFAULT 50,
  is_control boolean DEFAULT false,
  UNIQUE(experiment_id, variant_name)
);

CREATE TABLE IF NOT EXISTS analytics_experiment_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id uuid REFERENCES analytics_experiments(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES analytics_experiment_variants(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, experiment_id)
);

CREATE TABLE IF NOT EXISTS analytics_experiment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid REFERENCES analytics_experiments(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES analytics_experiment_variants(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  sample_size integer NOT NULL,
  metric_value numeric NOT NULL,
  confidence_level numeric,
  p_value numeric,
  is_statistically_significant boolean DEFAULT false,
  is_winner boolean DEFAULT false,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(experiment_id, variant_id, metric_name, calculated_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON analytics_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_feature_usage_user ON analytics_feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_feature_usage_feature ON analytics_feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_analytics_cohort_membership_user ON analytics_cohort_membership(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cohort_membership_cohort ON analytics_cohort_membership(cohort_id);
CREATE INDEX IF NOT EXISTS idx_analytics_funnel_steps_user ON analytics_funnel_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_funnel_steps_funnel ON analytics_funnel_steps(funnel_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_scores_upgrade ON analytics_user_scores(upgrade_probability DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_scores_churn ON analytics_user_scores(churn_probability DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_impact ON analytics_insights(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_created ON analytics_insights(created_at DESC);

-- RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_user_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_user_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cohort_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_retention_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnel_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_prediction_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_experiment_results ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Super admins access events" ON analytics_events FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access sessions" ON analytics_sessions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access summary" ON analytics_daily_summary FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access features" ON analytics_feature_usage FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access pages" ON analytics_page_views FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access journey" ON analytics_user_journey FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access cohorts" ON analytics_user_cohorts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access membership" ON analytics_cohort_membership FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access retention" ON analytics_retention_metrics FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access funnels" ON analytics_funnels FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access funnel_steps" ON analytics_funnel_steps FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access funnel_perf" ON analytics_funnel_performance FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access signals" ON analytics_prediction_signals FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access scores" ON analytics_user_scores FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access insights" ON analytics_insights FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access recommendations" ON analytics_recommendations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access experiments" ON analytics_experiments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access variants" ON analytics_experiment_variants FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access assignments" ON analytics_experiment_assignments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));
CREATE POLICY "Super admins access results" ON analytics_experiment_results FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.role_id IN (SELECT id FROM admin_roles WHERE role_name = 'super_admin')));