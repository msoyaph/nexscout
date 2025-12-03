/*
  # Social Graph and Intelligence Tables

  1. New Tables
    - `social_graph_nodes`
      - Stores person nodes in the social graph
      - Tracks centrality, influence, and opportunity signals
      - User-scoped with RLS
    
    - `social_graph_edges`
      - Stores relationships between nodes
      - Tracks interaction weight and recency
      - Multiple edge types (like, comment, mutual, etc.)
    
    - `social_graph_insights`
      - Stores generated insights from graph analysis
      - Recommendations and cluster information
      - User-scoped with RLS

  2. Security
    - Enable RLS on all tables
    - Users can only access their own graph data
    - Super admins can view all data

  3. Indexes
    - Performance indexes on user_id, cluster_id, scores
*/

-- Create social_graph_nodes table
CREATE TABLE IF NOT EXISTS social_graph_nodes (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  platform text NOT NULL,
  platform_url text,
  last_seen timestamptz DEFAULT now(),
  interaction_count integer DEFAULT 0,
  sentiment numeric DEFAULT 0.5,
  opportunity_signals text[] DEFAULT '{}'::text[],
  pain_points text[] DEFAULT '{}'::text[],
  cluster_id text,
  centrality_score numeric,
  influence_score numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create social_graph_edges table
CREATE TABLE IF NOT EXISTS social_graph_edges (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_node_id text NOT NULL,
  to_node_id text NOT NULL,
  weight numeric DEFAULT 1.0,
  type text NOT NULL,
  recency_score numeric DEFAULT 1.0,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create social_graph_insights table
CREATE TABLE IF NOT EXISTS social_graph_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insights text[] DEFAULT '{}'::text[],
  top_influencers text[] DEFAULT '{}'::text[],
  weak_connections text[] DEFAULT '{}'::text[],
  opportunity_clusters text[] DEFAULT '{}'::text[],
  recommendations text[] DEFAULT '{}'::text[],
  statistics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for social_graph_nodes
CREATE INDEX IF NOT EXISTS idx_social_graph_nodes_user_id ON social_graph_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_social_graph_nodes_cluster_id ON social_graph_nodes(cluster_id);
CREATE INDEX IF NOT EXISTS idx_social_graph_nodes_influence_score ON social_graph_nodes(influence_score DESC);
CREATE INDEX IF NOT EXISTS idx_social_graph_nodes_platform ON social_graph_nodes(platform);

-- Create indexes for social_graph_edges
CREATE INDEX IF NOT EXISTS idx_social_graph_edges_user_id ON social_graph_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_social_graph_edges_from_node ON social_graph_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_social_graph_edges_to_node ON social_graph_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_social_graph_edges_type ON social_graph_edges(type);
CREATE INDEX IF NOT EXISTS idx_social_graph_edges_recency ON social_graph_edges(recency_score DESC);

-- Create indexes for social_graph_insights
CREATE INDEX IF NOT EXISTS idx_social_graph_insights_user_id ON social_graph_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_social_graph_insights_created_at ON social_graph_insights(created_at DESC);

-- Enable RLS
ALTER TABLE social_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_graph_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_graph_nodes
CREATE POLICY "Users can view own graph nodes"
  ON social_graph_nodes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own graph nodes"
  ON social_graph_nodes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own graph nodes"
  ON social_graph_nodes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own graph nodes"
  ON social_graph_nodes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Super admin policies for social_graph_nodes
CREATE POLICY "Super admins can view all graph nodes"
  ON social_graph_nodes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  );

-- RLS Policies for social_graph_edges
CREATE POLICY "Users can view own graph edges"
  ON social_graph_edges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own graph edges"
  ON social_graph_edges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own graph edges"
  ON social_graph_edges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own graph edges"
  ON social_graph_edges FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Super admin policies for social_graph_edges
CREATE POLICY "Super admins can view all graph edges"
  ON social_graph_edges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  );

-- RLS Policies for social_graph_insights
CREATE POLICY "Users can view own graph insights"
  ON social_graph_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own graph insights"
  ON social_graph_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Super admin policies for social_graph_insights
CREATE POLICY "Super admins can view all graph insights"
  ON social_graph_insights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_graph_nodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating updated_at
CREATE TRIGGER update_social_graph_nodes_updated_at_trigger
  BEFORE UPDATE ON social_graph_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_social_graph_nodes_updated_at();