/*
  # NexScout Government System

  1. New Tables
    - `government_constitution_versions` - Track constitutional changes
    - `government_executive_orders` - Presidential commands log
    - `government_laws` - Congress-approved rules (versioned)
    - `government_law_rules` - Individual rules within laws
    - `government_audits` - Supreme Court audit results
    - `government_audit_findings` - Detailed audit findings
    - `government_violations` - Constitutional violation log
    - `government_engine_health` - Governor status tracking
    - `government_performance_metrics` - System-wide KPIs
    - `government_decisions` - President's decision audit trail
    - `government_conflicts` - Cross-engine conflict resolution log
    - `government_emergency_events` - Critical incident tracking
    - `government_department_metrics` - Department-level KPIs

  2. Security
    - Enable RLS on all government tables
    - Only admin users can access government data
    - Comprehensive audit logging
    
  3. Indexes
    - Add indexes for all foreign keys
    - Add indexes for commonly queried columns
*/

-- Constitution Versions
CREATE TABLE IF NOT EXISTS government_constitution_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  effective_date timestamptz NOT NULL,
  changes jsonb DEFAULT '[]'::jsonb,
  ratified_by jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'superseded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Executive Orders (Presidential Commands)
CREATE TABLE IF NOT EXISTS government_executive_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type text NOT NULL,
  title text NOT NULL,
  description text,
  issued_by text DEFAULT 'president',
  affected_components jsonb DEFAULT '[]'::jsonb,
  justification text,
  effective_date timestamptz DEFAULT now(),
  expires_date timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'revoked')),
  created_at timestamptz DEFAULT now()
);

-- Congressional Laws
CREATE TABLE IF NOT EXISTS government_laws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  law_type text NOT NULL CHECK (law_type IN ('economy', 'permissions', 'rate_limit', 'compliance', 'safety')),
  title text NOT NULL,
  description text,
  committee text NOT NULL,
  version text NOT NULL,
  effective_date timestamptz DEFAULT now(),
  expires_date timestamptz,
  created_by text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'suspended', 'repealed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Law Rules (Individual rules within laws)
CREATE TABLE IF NOT EXISTS government_law_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  law_id uuid REFERENCES government_laws(id) ON DELETE CASCADE,
  rule_id text NOT NULL,
  condition text NOT NULL,
  action text NOT NULL,
  parameters jsonb DEFAULT '{}'::jsonb,
  priority integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- Audits
CREATE TABLE IF NOT EXISTS government_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type text NOT NULL CHECK (audit_type IN ('code', 'security', 'ai_safety', 'compliance', 'performance')),
  scope text NOT NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  audited_at timestamptz DEFAULT now(),
  audited_by text DEFAULT 'automated',
  status text DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  resolved_at timestamptz,
  resolved_by text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Audit Findings
CREATE TABLE IF NOT EXISTS government_audit_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES government_audits(id) ON DELETE CASCADE,
  finding_id text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_components jsonb DEFAULT '[]'::jsonb,
  evidence jsonb DEFAULT '{}'::jsonb,
  remediation_steps jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Constitutional Violations
CREATE TABLE IF NOT EXISTS government_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_id text UNIQUE NOT NULL,
  article text NOT NULL,
  violator text NOT NULL,
  violation_type text NOT NULL,
  description text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  evidence jsonb DEFAULT '{}'::jsonb,
  action_taken text,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by text
);

-- Engine Health (Governors)
CREATE TABLE IF NOT EXISTS government_engine_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id text UNIQUE NOT NULL,
  engine_name text NOT NULL,
  province text NOT NULL,
  department text NOT NULL,
  version text,
  status text DEFAULT 'healthy' CHECK (status IN ('healthy', 'degraded', 'failed', 'maintenance')),
  uptime_percent numeric DEFAULT 100,
  avg_response_time_ms numeric DEFAULT 0,
  success_rate numeric DEFAULT 1.0,
  error_rate numeric DEFAULT 0,
  tokens_per_request_avg numeric DEFAULT 0,
  cost_per_request_usd numeric DEFAULT 0,
  last_execution timestamptz,
  last_health_check timestamptz DEFAULT now(),
  capabilities jsonb DEFAULT '[]'::jsonb,
  dependencies jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Performance Metrics
CREATE TABLE IF NOT EXISTS government_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  unit text,
  scope text DEFAULT 'system',
  scope_id text,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Presidential Decisions
CREATE TABLE IF NOT EXISTS government_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text UNIQUE NOT NULL,
  user_id uuid,
  feature text NOT NULL,
  decision_type text NOT NULL CHECK (decision_type IN ('approve', 'deny', 'defer', 'escalate')),
  selected_engine text,
  selected_model text,
  reasoning text NOT NULL,
  cost_estimate jsonb DEFAULT '{}'::jsonb,
  execution_time_ms integer,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Conflicts
CREATE TABLE IF NOT EXISTS government_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id text UNIQUE NOT NULL,
  conflict_type text NOT NULL CHECK (conflict_type IN ('engine_overlap', 'resource_contention', 'rule_contradiction', 'priority_dispute')),
  involved_parties jsonb DEFAULT '[]'::jsonb,
  description text NOT NULL,
  resolved_by text,
  resolution text,
  timestamp timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Emergency Events
CREATE TABLE IF NOT EXISTS government_emergency_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id text UNIQUE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('shutdown', 'rollback', 'surge_protection', 'maintenance_mode')),
  triggered_by text NOT NULL,
  reason text NOT NULL,
  affected_components jsonb DEFAULT '[]'::jsonb,
  duration_minutes integer,
  timestamp timestamptz DEFAULT now(),
  ended_at timestamptz,
  post_incident_review_completed boolean DEFAULT false,
  post_incident_notes text
);

-- Department Metrics
CREATE TABLE IF NOT EXISTS government_department_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  total_engines integer DEFAULT 0,
  healthy_engines integer DEFAULT 0,
  degraded_engines integer DEFAULT 0,
  failed_engines integer DEFAULT 0,
  avg_response_time_ms numeric DEFAULT 0,
  total_requests_24h integer DEFAULT 0,
  success_rate numeric DEFAULT 1.0,
  cost_24h_usd numeric DEFAULT 0,
  tokens_used_24h bigint DEFAULT 0,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE government_constitution_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_executive_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_laws ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_law_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_engine_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_emergency_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_department_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only access)
CREATE POLICY "Admins can manage constitution versions"
  ON government_constitution_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage executive orders"
  ON government_executive_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage laws"
  ON government_laws FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage law rules"
  ON government_law_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view audits"
  ON government_audits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view audit findings"
  ON government_audit_findings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view violations"
  ON government_violations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view engine health"
  ON government_engine_health FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view performance metrics"
  ON government_performance_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view decisions"
  ON government_decisions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view conflicts"
  ON government_conflicts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view emergency events"
  ON government_emergency_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view department metrics"
  ON government_department_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_government_laws_law_type ON government_laws(law_type);
CREATE INDEX IF NOT EXISTS idx_government_laws_status ON government_laws(status);
CREATE INDEX IF NOT EXISTS idx_government_law_rules_law_id ON government_law_rules(law_id);
CREATE INDEX IF NOT EXISTS idx_government_audits_audit_type ON government_audits(audit_type);
CREATE INDEX IF NOT EXISTS idx_government_audits_status ON government_audits(status);
CREATE INDEX IF NOT EXISTS idx_government_audit_findings_audit_id ON government_audit_findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_government_violations_resolved ON government_violations(resolved);
CREATE INDEX IF NOT EXISTS idx_government_engine_health_status ON government_engine_health(status);
CREATE INDEX IF NOT EXISTS idx_government_engine_health_department ON government_engine_health(department);
CREATE INDEX IF NOT EXISTS idx_government_decisions_user_id ON government_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_government_decisions_timestamp ON government_decisions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_government_conflicts_resolved_at ON government_conflicts(resolved_at);
CREATE INDEX IF NOT EXISTS idx_government_emergency_events_timestamp ON government_emergency_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_government_department_metrics_department ON government_department_metrics(department);
CREATE INDEX IF NOT EXISTS idx_government_department_metrics_timestamp ON government_department_metrics(timestamp DESC);

-- Insert initial constitution version
INSERT INTO government_constitution_versions (version, effective_date, changes, ratified_by, status)
VALUES (
  '1.0.0',
  '2025-12-01',
  '["Initial constitution ratification", "Established three branches of government", "Defined all departments and governor roles"]'::jsonb,
  '["Architecture Team", "Engineering Team", "Leadership Team"]'::jsonb,
  'active'
);

-- Initialize engine health records for key engines
INSERT INTO government_engine_health (engine_id, engine_name, province, department, version, status)
VALUES
  ('scanning_engine', 'Scanning Engine', 'Population & Discovery', 'engineering', '1.0', 'healthy'),
  ('messaging_engine_v2', 'Messaging Engine V2', 'AI Communication', 'communication', '2.0', 'healthy'),
  ('chatbot_engine', 'Chatbot Engine', 'Public Engagement', 'communication', '1.0', 'healthy'),
  ('company_intelligence_v4', 'Company Intelligence V4', 'Market Intelligence', 'knowledge', '4.0', 'healthy'),
  ('energy_engine_v5', 'Energy Engine V5', 'Resource Economy', 'optimization', '5.0', 'healthy'),
  ('scout_scoring_v5', 'ScoutScore V5', 'Prospect Scoring', 'engineering', '5.0', 'healthy'),
  ('company_ai_orchestrator', 'Company AI Orchestrator', 'Intelligence Coordination', 'knowledge', '1.0', 'healthy'),
  ('ai_productivity_engine', 'AI Productivity Engine', 'Productivity Automation', 'communication', '3.0', 'healthy'),
  ('social_graph_builder', 'Social Graph Builder', 'Relationship Mapping', 'database', '1.0', 'healthy'),
  ('company_ai_safety_engine', 'AI Safety Engine', 'AI Safety & Compliance', 'security', '1.0', 'healthy')
ON CONFLICT (engine_id) DO NOTHING;
