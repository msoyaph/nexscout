/*
  # Data Intelligence Layer v3.0 - Foundation

  1. New Tables
    - `knowledge_graph_snapshots` - Versioned knowledge graph state
    - `data_feeder_logs` - Audit trail for all data changes
    - `product_intelligence_cache` - Normalized and classified product data
    - `offer_matching_rules` - Custom matching rules for owners
    - `data_normalization_queue` - Async data processing queue

  2. Security
    - Enable RLS on all tables
    - Super admins → full access
    - Enterprise/Team leaders → their data
    - System → automated processing

  3. Performance
    - Indexes for foreign keys and common queries
    - GiN indexes for JSONB columns
    - Efficient priority-based queries
*/

-- Knowledge Graph Snapshots Table
CREATE TABLE IF NOT EXISTS knowledge_graph_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type feeder_owner_type NOT NULL DEFAULT 'system',
  owner_id uuid,
  version integer NOT NULL DEFAULT 1,
  graph_data jsonb NOT NULL DEFAULT '{}',
  node_count integer NOT NULL DEFAULT 0,
  edge_count integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE knowledge_graph_snapshots ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_kg_owner ON knowledge_graph_snapshots(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_kg_version ON knowledge_graph_snapshots(owner_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_kg_created ON knowledge_graph_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kg_graph_data ON knowledge_graph_snapshots USING gin(graph_data);

-- Data Feeder Logs Table
CREATE TABLE IF NOT EXISTS data_feeder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type feeder_owner_type NOT NULL,
  owner_id uuid,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before_data jsonb DEFAULT '{}',
  after_data jsonb DEFAULT '{}',
  changes jsonb DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE data_feeder_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_dfl_owner ON data_feeder_logs(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_dfl_entity ON data_feeder_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_dfl_user ON data_feeder_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_dfl_created ON data_feeder_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dfl_action ON data_feeder_logs(action_type);

-- Product Intelligence Cache Table
CREATE TABLE IF NOT EXISTS product_intelligence_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES admin_products(id) ON DELETE CASCADE,
  owner_type feeder_owner_type NOT NULL,
  owner_id uuid,
  normalized_data jsonb NOT NULL DEFAULT '{}',
  classification_data jsonb NOT NULL DEFAULT '{}',
  tags text[] DEFAULT '{}',
  detected_personas text[] DEFAULT '{}',
  pain_points_solved text[] DEFAULT '{}',
  use_cases text[] DEFAULT '{}',
  ideal_customer_profile jsonb DEFAULT '{}',
  confidence_scores jsonb DEFAULT '{}',
  last_processed_at timestamptz DEFAULT now(),
  processing_duration_ms integer,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_intelligence_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pic_product ON product_intelligence_cache(product_id);
CREATE INDEX IF NOT EXISTS idx_pic_owner ON product_intelligence_cache(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_pic_tags ON product_intelligence_cache USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_pic_personas ON product_intelligence_cache USING gin(detected_personas);
CREATE INDEX IF NOT EXISTS idx_pic_normalized ON product_intelligence_cache USING gin(normalized_data);
CREATE INDEX IF NOT EXISTS idx_pic_classification ON product_intelligence_cache USING gin(classification_data);
CREATE INDEX IF NOT EXISTS idx_pic_updated ON product_intelligence_cache(updated_at DESC);

-- Offer Matching Rules Table
CREATE TABLE IF NOT EXISTS offer_matching_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type feeder_owner_type NOT NULL,
  owner_id uuid,
  rule_name text NOT NULL,
  rule_type text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '{}',
  priority integer NOT NULL DEFAULT 100,
  is_active boolean DEFAULT true,
  match_count integer DEFAULT 0,
  last_matched_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE offer_matching_rules ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_omr_owner ON offer_matching_rules(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_omr_active ON offer_matching_rules(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_omr_type ON offer_matching_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_omr_conditions ON offer_matching_rules USING gin(conditions);

-- Data Normalization Queue Table
CREATE TABLE IF NOT EXISTS data_normalization_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type feeder_owner_type NOT NULL,
  owner_id uuid,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  raw_data jsonb NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'pending',
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  error_message text,
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE data_normalization_queue ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_dnq_status ON data_normalization_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_dnq_entity ON data_normalization_queue(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_dnq_owner ON data_normalization_queue(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_dnq_created ON data_normalization_queue(created_at DESC);

-- RLS Policies for Knowledge Graph Snapshots
CREATE POLICY "Super admins can view all knowledge graphs"
  ON knowledge_graph_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "Team members can view their knowledge graphs"
  ON knowledge_graph_snapshots FOR SELECT
  TO authenticated
  USING (
    owner_type = 'team' AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
        AND team_members.team_id = knowledge_graph_snapshots.owner_id
    )
  );

CREATE POLICY "Super admins can insert knowledge graphs"
  ON knowledge_graph_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

-- RLS Policies for Data Feeder Logs
CREATE POLICY "Super admins can view all logs"
  ON data_feeder_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "Team members can view their logs"
  ON data_feeder_logs FOR SELECT
  TO authenticated
  USING (
    owner_type = 'team' AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
        AND team_members.team_id = data_feeder_logs.owner_id
    )
  );

CREATE POLICY "Authenticated users can insert logs"
  ON data_feeder_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for Product Intelligence Cache
CREATE POLICY "Super admins can view all cache"
  ON product_intelligence_cache FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "Team members can view their cache"
  ON product_intelligence_cache FOR SELECT
  TO authenticated
  USING (
    owner_type = 'team' AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
        AND team_members.team_id = product_intelligence_cache.owner_id
    )
  );

CREATE POLICY "System can manage cache"
  ON product_intelligence_cache FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Offer Matching Rules
CREATE POLICY "Super admins can manage all rules"
  ON offer_matching_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "Team leaders can manage their rules"
  ON offer_matching_rules FOR ALL
  TO authenticated
  USING (
    owner_type = 'team' AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
        AND team_members.team_id = offer_matching_rules.owner_id
        AND team_members.role = 'leader'
    )
  );

-- RLS Policies for Data Normalization Queue
CREATE POLICY "Super admins can view all queue items"
  ON data_normalization_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "System can manage queue"
  ON data_normalization_queue FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function: Log data changes
CREATE OR REPLACE FUNCTION log_data_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO data_feeder_logs (
    owner_type,
    owner_id,
    action_type,
    entity_type,
    entity_id,
    before_data,
    after_data,
    user_id
  )
  VALUES (
    COALESCE(NEW.owner_type, OLD.owner_type),
    COALESCE(NEW.owner_id, OLD.owner_id),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END,
    CASE WHEN TG_OP = 'DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add logging triggers to admin tables
DROP TRIGGER IF EXISTS log_admin_companies_changes ON admin_companies;
CREATE TRIGGER log_admin_companies_changes
  AFTER INSERT OR UPDATE OR DELETE ON admin_companies
  FOR EACH ROW EXECUTE FUNCTION log_data_change();

DROP TRIGGER IF EXISTS log_admin_products_changes ON admin_products;
CREATE TRIGGER log_admin_products_changes
  AFTER INSERT OR UPDATE OR DELETE ON admin_products
  FOR EACH ROW EXECUTE FUNCTION log_data_change();

DROP TRIGGER IF EXISTS log_product_variants_changes ON product_variants;
CREATE TRIGGER log_product_variants_changes
  AFTER INSERT OR UPDATE OR DELETE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION log_data_change();

DROP TRIGGER IF EXISTS log_admin_services_changes ON admin_services;
CREATE TRIGGER log_admin_services_changes
  AFTER INSERT OR UPDATE OR DELETE ON admin_services
  FOR EACH ROW EXECUTE FUNCTION log_data_change();

-- Function: Update intelligence cache timestamp
CREATE OR REPLACE FUNCTION update_intelligence_cache_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_pic_timestamp ON product_intelligence_cache;
CREATE TRIGGER update_pic_timestamp
  BEFORE UPDATE ON product_intelligence_cache
  FOR EACH ROW EXECUTE FUNCTION update_intelligence_cache_timestamp();

-- Function: Queue data for normalization
CREATE OR REPLACE FUNCTION queue_for_normalization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO data_normalization_queue (
    owner_type,
    owner_id,
    entity_type,
    entity_id,
    raw_data,
    priority
  )
  VALUES (
    NEW.owner_type,
    NEW.owner_id,
    TG_TABLE_NAME,
    NEW.id,
    to_jsonb(NEW),
    CASE
      WHEN NEW.owner_type = 'team' THEN 200
      WHEN NEW.owner_type = 'enterprise' THEN 100
      ELSE 50
    END
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Add normalization queue triggers
DROP TRIGGER IF EXISTS queue_company_normalization ON admin_companies;
CREATE TRIGGER queue_company_normalization
  AFTER INSERT OR UPDATE ON admin_companies
  FOR EACH ROW EXECUTE FUNCTION queue_for_normalization();

DROP TRIGGER IF EXISTS queue_product_normalization ON admin_products;
CREATE TRIGGER queue_product_normalization
  AFTER INSERT OR UPDATE ON admin_products
  FOR EACH ROW EXECUTE FUNCTION queue_for_normalization();
