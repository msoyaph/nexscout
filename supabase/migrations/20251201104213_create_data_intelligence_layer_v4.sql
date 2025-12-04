/*
  # Data Intelligence Layer v4.0 - Adaptive Intelligence

  1. New Tables
    - `taxonomy_entities` - Auto-generated taxonomy structures
    - `product_clusters` - ML-based product clustering
    - `competitor_analysis` - Competitive intelligence data
    - `product_personas` - AI-generated buyer personas
    - `knowledge_graph_v2` - Enhanced multi-layer graph
    - `universal_context_cache` - Unified context for all AI systems
    - `enterprise_sync_records` - Enterprise data push tracking
    - `team_script_analytics` - Team script performance tracking
    - `embeddings_store` - Vector embeddings for semantic search
    - `language_normalization_logs` - Multi-lingual processing logs
    - `performance_metrics` - Learning data from user behavior
    - `selling_scripts` - Auto-generated sales scripts
    - `sales_playbooks` - Complete sales playbook templates

  2. Security
    - Enable RLS on all tables
    - System admins → global data
    - Enterprise admins → enterprise + team + users
    - Team leaders → team + members
    - Users → their own overrides

  3. Performance
    - Vector indexes for embedding search
    - Composite indexes for complex queries
    - Materialized views for analytics
*/

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Taxonomy Entities Table
CREATE TABLE IF NOT EXISTS taxonomy_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  category text,
  sub_category text,
  sub_sub_category text,
  tags jsonb DEFAULT '[]',
  key_benefits text[] DEFAULT '{}',
  common_objections text[] DEFAULT '{}',
  emotional_triggers text[] DEFAULT '{}',
  ideal_personas text[] DEFAULT '{}',
  confidence_score float DEFAULT 0.0,
  learning_iterations integer DEFAULT 0,
  last_learned_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE taxonomy_entities ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_taxonomy_entity ON taxonomy_entities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_taxonomy_category ON taxonomy_entities(category, sub_category);
CREATE INDEX IF NOT EXISTS idx_taxonomy_tags ON taxonomy_entities USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_taxonomy_confidence ON taxonomy_entities(confidence_score DESC);

-- Product Clusters Table
CREATE TABLE IF NOT EXISTS product_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_name text NOT NULL,
  cluster_type text NOT NULL,
  member_products uuid[] DEFAULT '{}',
  center_point jsonb,
  characteristics jsonb DEFAULT '{}',
  performance_metrics jsonb DEFAULT '{}',
  owner_type feeder_owner_type NOT NULL DEFAULT 'system',
  owner_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_clusters ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_clusters_owner ON product_clusters(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_clusters_type ON product_clusters(cluster_type);
CREATE INDEX IF NOT EXISTS idx_clusters_members ON product_clusters USING gin(member_products);

-- Competitor Analysis Table
CREATE TABLE IF NOT EXISTS competitor_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  product_id uuid,
  competitor_name text NOT NULL,
  competitor_type text,
  industry text,
  unique_selling_points text[] DEFAULT '{}',
  their_strengths text[] DEFAULT '{}',
  our_advantages text[] DEFAULT '{}',
  differentiators jsonb DEFAULT '{}',
  positioning_strategy text,
  counter_objections jsonb DEFAULT '{}',
  market_share_estimate float,
  confidence_score float DEFAULT 0.0,
  data_sources text[] DEFAULT '{}',
  last_analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_competitor_company ON competitor_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_competitor_product ON competitor_analysis(product_id);
CREATE INDEX IF NOT EXISTS idx_competitor_industry ON competitor_analysis(industry);
CREATE INDEX IF NOT EXISTS idx_competitor_name ON competitor_analysis(competitor_name);

-- Product Personas Table
CREATE TABLE IF NOT EXISTS product_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES admin_products(id) ON DELETE CASCADE,
  persona_name text NOT NULL,
  persona_type text,
  demographics jsonb DEFAULT '{}',
  pain_points text[] DEFAULT '{}',
  emotional_triggers text[] DEFAULT '{}',
  buying_motivations text[] DEFAULT '{}',
  objections text[] DEFAULT '{}',
  preferred_channels text[] DEFAULT '{}',
  communication_style text,
  decision_factors jsonb DEFAULT '{}',
  conversion_rate float,
  avg_deal_size float,
  sales_cycle_days integer,
  best_selling_script_id uuid,
  ai_generated boolean DEFAULT true,
  confidence_score float DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_personas ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_personas_product ON product_personas(product_id);
CREATE INDEX IF NOT EXISTS idx_personas_type ON product_personas(persona_type);
CREATE INDEX IF NOT EXISTS idx_personas_conversion ON product_personas(conversion_rate DESC);

-- Knowledge Graph v2 Table
CREATE TABLE IF NOT EXISTS knowledge_graph_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type feeder_owner_type NOT NULL DEFAULT 'system',
  owner_id uuid,
  version integer NOT NULL DEFAULT 1,
  graph_layers jsonb NOT NULL DEFAULT '{}',
  nodes jsonb NOT NULL DEFAULT '[]',
  edges jsonb NOT NULL DEFAULT '[]',
  node_count integer DEFAULT 0,
  edge_count integer DEFAULT 0,
  layer_types text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE knowledge_graph_v2 ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_kg_v2_owner ON knowledge_graph_v2(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_kg_v2_version ON knowledge_graph_v2(owner_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_kg_v2_layers ON knowledge_graph_v2 USING gin(layer_types);
CREATE INDEX IF NOT EXISTS idx_kg_v2_embedding ON knowledge_graph_v2 USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Universal Context Cache Table
CREATE TABLE IF NOT EXISTS universal_context_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  context_type text NOT NULL,
  context_data jsonb NOT NULL,
  company_profile jsonb,
  products jsonb DEFAULT '[]',
  services jsonb DEFAULT '[]',
  personas jsonb DEFAULT '[]',
  competitors jsonb DEFAULT '[]',
  scripts jsonb DEFAULT '[]',
  knowledge_graph_id uuid,
  embedding vector(1536),
  priority_score integer DEFAULT 0,
  cache_version integer DEFAULT 1,
  expires_at timestamptz,
  last_accessed_at timestamptz DEFAULT now(),
  access_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE universal_context_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_context_user ON universal_context_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_context_type ON universal_context_cache(context_type);
CREATE INDEX IF NOT EXISTS idx_context_expires ON universal_context_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_context_embedding ON universal_context_cache USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Enterprise Sync Records Table
CREATE TABLE IF NOT EXISTS enterprise_sync_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id uuid NOT NULL,
  sync_type text NOT NULL,
  entity_type text NOT NULL,
  entity_ids uuid[] DEFAULT '{}',
  target_users uuid[] DEFAULT '{}',
  target_teams uuid[] DEFAULT '{}',
  sync_action text NOT NULL,
  override_user_data boolean DEFAULT false,
  enforce_compliance boolean DEFAULT false,
  sync_status text DEFAULT 'pending',
  synced_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  error_logs jsonb DEFAULT '[]',
  initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE enterprise_sync_records ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sync_enterprise ON enterprise_sync_records(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_sync_status ON enterprise_sync_records(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_type ON enterprise_sync_records(sync_type, entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_created ON enterprise_sync_records(created_at DESC);

-- Team Script Analytics Table
CREATE TABLE IF NOT EXISTS team_script_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  script_id uuid,
  script_type text NOT NULL,
  script_content text,
  usage_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  conversion_rate float DEFAULT 0.0,
  avg_response_time integer,
  engagement_score float DEFAULT 0.0,
  best_performing_time jsonb DEFAULT '{}',
  best_performing_personas text[] DEFAULT '{}',
  used_by_members uuid[] DEFAULT '{}',
  performance_trend jsonb DEFAULT '{}',
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_script_analytics ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_script_team ON team_script_analytics(team_id);
CREATE INDEX IF NOT EXISTS idx_script_type ON team_script_analytics(script_type);
CREATE INDEX IF NOT EXISTS idx_script_conversion ON team_script_analytics(conversion_rate DESC);
CREATE INDEX IF NOT EXISTS idx_script_usage ON team_script_analytics(usage_count DESC);

-- Embeddings Store Table
CREATE TABLE IF NOT EXISTS embeddings_store (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  content_text text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb DEFAULT '{}',
  owner_type feeder_owner_type NOT NULL DEFAULT 'system',
  owner_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE embeddings_store ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_embed_entity ON embeddings_store(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_embed_owner ON embeddings_store(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_embed_vector ON embeddings_store USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Language Normalization Logs Table
CREATE TABLE IF NOT EXISTS language_normalization_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text text NOT NULL,
  detected_language text,
  detected_dialect text,
  normalized_text text,
  taglish_patterns jsonb DEFAULT '[]',
  slang_detected text[] DEFAULT '{}',
  normalization_rules_applied text[] DEFAULT '{}',
  confidence_score float DEFAULT 0.0,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE language_normalization_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_lang_detected ON language_normalization_logs(detected_language, detected_dialect);
CREATE INDEX IF NOT EXISTS idx_lang_created ON language_normalization_logs(created_at DESC);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metric_name text NOT NULL,
  metric_value float NOT NULL,
  context_data jsonb DEFAULT '{}',
  owner_type feeder_owner_type NOT NULL DEFAULT 'system',
  owner_id uuid,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_metrics_entity ON performance_metrics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON performance_metrics(metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_recorded ON performance_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_owner ON performance_metrics(owner_type, owner_id);

-- Selling Scripts Table
CREATE TABLE IF NOT EXISTS selling_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_name text NOT NULL,
  script_type text NOT NULL,
  product_id uuid REFERENCES admin_products(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES product_personas(id) ON DELETE SET NULL,
  script_content text NOT NULL,
  script_stages jsonb DEFAULT '[]',
  objection_handlers jsonb DEFAULT '{}',
  tone text,
  language text DEFAULT 'taglish',
  channel text,
  ai_generated boolean DEFAULT true,
  performance_score float DEFAULT 0.0,
  usage_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  owner_type feeder_owner_type NOT NULL DEFAULT 'system',
  owner_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE selling_scripts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_scripts_product ON selling_scripts(product_id);
CREATE INDEX IF NOT EXISTS idx_scripts_persona ON selling_scripts(persona_id);
CREATE INDEX IF NOT EXISTS idx_scripts_type ON selling_scripts(script_type);
CREATE INDEX IF NOT EXISTS idx_scripts_owner ON selling_scripts(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_scripts_performance ON selling_scripts(performance_score DESC);

-- Sales Playbooks Table
CREATE TABLE IF NOT EXISTS sales_playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_name text NOT NULL,
  playbook_type text NOT NULL,
  industry text,
  target_personas text[] DEFAULT '{}',
  stages jsonb NOT NULL DEFAULT '[]',
  scripts_included uuid[] DEFAULT '{}',
  recommended_tools text[] DEFAULT '{}',
  success_metrics jsonb DEFAULT '{}',
  ai_generated boolean DEFAULT true,
  performance_data jsonb DEFAULT '{}',
  owner_type feeder_owner_type NOT NULL DEFAULT 'system',
  owner_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sales_playbooks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_playbooks_type ON sales_playbooks(playbook_type);
CREATE INDEX IF NOT EXISTS idx_playbooks_industry ON sales_playbooks(industry);
CREATE INDEX IF NOT EXISTS idx_playbooks_owner ON sales_playbooks(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_playbooks_scripts ON sales_playbooks USING gin(scripts_included);

-- RLS Policies for Taxonomy Entities
CREATE POLICY "System can manage taxonomy"
  ON taxonomy_entities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Product Clusters
CREATE POLICY "Super admins can manage all clusters"
  ON product_clusters FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "Team members can view their clusters"
  ON product_clusters FOR SELECT
  TO authenticated
  USING (
    owner_type = 'team' AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
        AND team_members.team_id = product_clusters.owner_id
    )
  );

-- RLS Policies for Competitor Analysis
CREATE POLICY "Users can view competitor analysis"
  ON competitor_analysis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage competitor analysis"
  ON competitor_analysis FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

-- RLS Policies for Product Personas
CREATE POLICY "Users can view product personas"
  ON product_personas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage personas"
  ON product_personas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Knowledge Graph v2
CREATE POLICY "Super admins can manage all graphs v2"
  ON knowledge_graph_v2 FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "Team members can view their graphs v2"
  ON knowledge_graph_v2 FOR SELECT
  TO authenticated
  USING (
    owner_type = 'team' AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
        AND team_members.team_id = knowledge_graph_v2.owner_id
    )
  );

-- RLS Policies for Universal Context Cache
CREATE POLICY "Users can manage their context cache"
  ON universal_context_cache FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Enterprise Sync Records
CREATE POLICY "Super admins can manage sync records"
  ON enterprise_sync_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

-- RLS Policies for Team Script Analytics
CREATE POLICY "Team members can view their analytics"
  ON team_script_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
        AND team_members.team_id = team_script_analytics.team_id
    )
  );

CREATE POLICY "Team leaders can manage their analytics"
  ON team_script_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
        AND team_members.team_id = team_script_analytics.team_id
        AND team_members.role = 'leader'
    )
  );

-- RLS Policies for Embeddings Store
CREATE POLICY "System can manage embeddings"
  ON embeddings_store FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Language Normalization Logs
CREATE POLICY "System can manage language logs"
  ON language_normalization_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Performance Metrics
CREATE POLICY "System can record metrics"
  ON performance_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins can view all metrics"
  ON performance_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

-- RLS Policies for Selling Scripts
CREATE POLICY "Users can view scripts"
  ON selling_scripts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage scripts"
  ON selling_scripts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "Team leaders can manage team scripts"
  ON selling_scripts FOR ALL
  TO authenticated
  USING (
    owner_type = 'team' AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
        AND team_members.team_id = selling_scripts.owner_id
        AND team_members.role = 'leader'
    )
  );

-- RLS Policies for Sales Playbooks
CREATE POLICY "Users can view playbooks"
  ON sales_playbooks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage playbooks"
  ON sales_playbooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_super_admin = true
    )
  );

-- Function: Update context cache timestamp
CREATE OR REPLACE FUNCTION update_context_cache_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_accessed_at = now();
  NEW.access_count = NEW.access_count + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_context_timestamp ON universal_context_cache;
CREATE TRIGGER update_context_timestamp
  BEFORE UPDATE ON universal_context_cache
  FOR EACH ROW EXECUTE FUNCTION update_context_cache_timestamp();

-- Function: Cleanup expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM universal_context_cache
  WHERE expires_at IS NOT NULL
    AND expires_at < now();
END;
$$;
