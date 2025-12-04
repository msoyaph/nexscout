/*
  # Create Super Admin System Tables

  1. New Tables
    - `admin_roles` - Admin user roles and permissions
    - `admin_users` - Super admin users
    - `system_logs` - All system activity logs
    - `ai_usage_logs` - AI model usage tracking
    - `coin_transactions` - Complete coin transaction history
    - `mission_completions` - Mission completion tracking
    - `subscription_events` - Subscription lifecycle events
    - `system_health_metrics` - System health snapshots
    - `feature_flags` - Feature toggle system
    - `enterprise_organizations` - Enterprise customer management

  2. Security
    - Enable RLS on all tables
    - Strict policies for admin-only access
*/

-- Admin Roles Table
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES admin_roles(id),
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- AI Usage Logs Table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_type text NOT NULL,
  model_used text,
  tokens_used integer DEFAULT 0,
  cost_usd decimal(10,4) DEFAULT 0,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Coin Transactions Table
CREATE TABLE IF NOT EXISTS coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  description text,
  reference_id text,
  created_at timestamptz DEFAULT now()
);

-- Mission Completions Table
CREATE TABLE IF NOT EXISTS mission_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mission_type text NOT NULL,
  mission_name text NOT NULL,
  coins_earned integer DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

-- Subscription Events Table
CREATE TABLE IF NOT EXISTS subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  from_tier text,
  to_tier text,
  amount_php decimal(10,2),
  created_at timestamptz DEFAULT now()
);

-- System Health Metrics Table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  value numeric,
  status text,
  details jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz DEFAULT now()
);

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text UNIQUE NOT NULL,
  enabled boolean DEFAULT false,
  description text,
  rollout_percentage integer DEFAULT 100,
  updated_at timestamptz DEFAULT now()
);

-- Enterprise Organizations Table
CREATE TABLE IF NOT EXISTS enterprise_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  admin_user_id uuid REFERENCES auth.users(id),
  seats_purchased integer DEFAULT 0,
  seats_used integer DEFAULT 0,
  contract_start date,
  contract_end date,
  monthly_price_php decimal(10,2),
  status text DEFAULT 'active',
  custom_features jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_organizations ENABLE ROW LEVEL SECURITY;

-- Policies: Only super admins can access
CREATE POLICY "Super admins can view admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "Super admins can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_super_admin = true
    )
  );

CREATE POLICY "Admins can view system logs"
  ON system_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view AI usage logs"
  ON ai_usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view coin transactions"
  ON coin_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view mission completions"
  ON mission_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view subscription events"
  ON subscription_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view health metrics"
  ON system_health_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage feature flags"
  ON feature_flags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "Admins can view enterprise orgs"
  ON enterprise_organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON system_logs(log_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_logs(feature_type);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mission_completions_user ON mission_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON subscription_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_type ON system_health_metrics(metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_status ON enterprise_organizations(status);

-- Insert default admin roles
INSERT INTO admin_roles (role_name, permissions) VALUES
  ('Root Admin', '{"all": true}'::jsonb),
  ('Finance Admin', '{"modules": ["financial", "subscriptions", "coins"]}'::jsonb),
  ('AI Admin', '{"modules": ["ai_analytics", "logs"]}'::jsonb),
  ('Support Admin', '{"modules": ["users", "teams", "compliance"]}'::jsonb),
  ('Moderator', '{"modules": ["compliance", "logs"]}'::jsonb),
  ('Developer', '{"modules": ["system_health", "logs", "platform_settings"]}'::jsonb)
ON CONFLICT (role_name) DO NOTHING;
