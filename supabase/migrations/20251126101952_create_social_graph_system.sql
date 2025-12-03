/*
  # NexScout Social Graph + Browser Capture Suite v1.0

  1. New Tables
    - `social_contacts` - Unified contact registry from all sources
    - `social_edges` - Relationships between contacts
    - `social_interactions` - All social engagement activities
    - `social_contact_features` - Computed graph features
    - `social_graph_metrics` - Per-user graph statistics

  2. Updates
    - Enhanced `browser_capture_events` table

  3. Security
    - RLS on all tables
    - User-scoped policies

  4. Indexes
    - Optimized for lookups and aggregations
*/

-- Social contacts (unified contact registry)
CREATE TABLE IF NOT EXISTS social_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'other')),
  external_id text,
  full_name text NOT NULL,
  username text,
  profile_url text,
  avatar_url text,
  mutual_friends_estimate integer,
  follower_count integer,
  following_count integer,
  contact_type text CHECK (contact_type IN ('person', 'page', 'group', 'unknown')) DEFAULT 'person',
  source_types text[] DEFAULT ARRAY[]::text[],
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  last_interaction_at timestamptz,
  is_prospect boolean DEFAULT false,
  prospect_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_contacts_user_id ON social_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_contacts_platform ON social_contacts(platform);
CREATE INDEX IF NOT EXISTS idx_social_contacts_user_platform ON social_contacts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_contacts_prospect_id ON social_contacts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_social_contacts_is_prospect ON social_contacts(is_prospect);
CREATE INDEX IF NOT EXISTS idx_social_contacts_username ON social_contacts(username);

-- Social edges (relationships)
CREATE TABLE IF NOT EXISTS social_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  from_contact_id uuid REFERENCES social_contacts(id) ON DELETE CASCADE,
  to_contact_id uuid REFERENCES social_contacts(id) ON DELETE CASCADE,
  relationship_type text CHECK (relationship_type IN ('friend', 'follower', 'following', 'commenter', 'liker', 'group_member', 'unknown')) DEFAULT 'unknown',
  platform text CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'other')),
  weight numeric DEFAULT 1.0,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_edges_user_id ON social_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_social_edges_from_contact ON social_edges(from_contact_id);
CREATE INDEX IF NOT EXISTS idx_social_edges_to_contact ON social_edges(to_contact_id);
CREATE INDEX IF NOT EXISTS idx_social_edges_relationship ON social_edges(relationship_type);

-- Social interactions (engagement activities)
CREATE TABLE IF NOT EXISTS social_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES social_contacts(id) ON DELETE CASCADE,
  platform text CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'other')),
  interaction_type text CHECK (interaction_type IN ('post', 'comment', 'reaction', 'share', 'tag', 'message', 'view', 'profile_visit')) NOT NULL,
  text_content text,
  raw_payload jsonb DEFAULT '{}'::jsonb,
  url text,
  occurred_at timestamptz DEFAULT now(),
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  topics text[] DEFAULT ARRAY[]::text[],
  engagement_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_interactions_user_id ON social_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_social_interactions_contact_id ON social_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_social_interactions_platform ON social_interactions(platform);
CREATE INDEX IF NOT EXISTS idx_social_interactions_occurred_at ON social_interactions(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_interactions_type ON social_interactions(interaction_type);

-- Update browser_capture_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'browser_capture_events' AND column_name = 'platform_guess'
  ) THEN
    ALTER TABLE browser_capture_events ADD COLUMN platform_guess text;
    ALTER TABLE browser_capture_events ADD COLUMN processed boolean DEFAULT false;
    ALTER TABLE browser_capture_events ADD COLUMN processed_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_browser_capture_processed ON browser_capture_events(processed);

-- Social contact features (computed graph metrics)
CREATE TABLE IF NOT EXISTS social_contact_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES social_contacts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  degree integer DEFAULT 0,
  total_interactions integer DEFAULT 0,
  recent_interactions_30d integer DEFAULT 0,
  recency_score numeric DEFAULT 0,
  relationship_strength numeric DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  last_computed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(contact_id)
);

CREATE INDEX IF NOT EXISTS idx_social_contact_features_user_id ON social_contact_features(user_id);
CREATE INDEX IF NOT EXISTS idx_social_contact_features_strength ON social_contact_features(relationship_strength DESC);

-- Social graph metrics (per-user statistics)
CREATE TABLE IF NOT EXISTS social_graph_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  total_contacts integer DEFAULT 0,
  total_edges integer DEFAULT 0,
  total_interactions integer DEFAULT 0,
  contacts_with_recent_interaction_30d integer DEFAULT 0,
  prospects_with_social_context integer DEFAULT 0,
  average_degree numeric DEFAULT 0,
  platform_breakdown jsonb DEFAULT '{}'::jsonb,
  last_built_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_graph_metrics_user_id ON social_graph_metrics(user_id);

-- RLS Policies

ALTER TABLE social_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own contacts"
  ON social_contacts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own contacts"
  ON social_contacts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own contacts"
  ON social_contacts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own contacts"
  ON social_contacts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE social_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own edges"
  ON social_edges FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own edges"
  ON social_edges FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own edges"
  ON social_edges FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE social_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own interactions"
  ON social_interactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own interactions"
  ON social_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

ALTER TABLE social_contact_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own contact features"
  ON social_contact_features FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own contact features"
  ON social_contact_features FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own contact features"
  ON social_contact_features FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE social_graph_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own graph metrics"
  ON social_graph_metrics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own graph metrics"
  ON social_graph_metrics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own graph metrics"
  ON social_graph_metrics FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());