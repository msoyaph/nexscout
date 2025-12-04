/*
  # ScoutScore v2.0 - ML-Tuned Lead Scoring Engine

  ## Overview
  Upgrades NexScout's scoring from static rules to dynamic ML-like scoring with:
  - Feature-based weighted scoring
  - Reinforcement learning from user actions
  - Personalized weight vectors per user
  - Explainable AI with reason tags
  - HOT/WARM/COLD classification

  ## New Tables

  ### 1. `user_scoring_profiles`
  Stores personalized weight vectors for each user
  - Each user develops their own scoring model over time
  - Weights adjust based on wins/losses
  - Allows niche-specific tuning (MLM vs Insurance)

  ### 2. `prospect_feature_vectors`
  Stores computed feature vectors for each prospect
  - Engagement metrics
  - Interest scores
  - Pain point indicators
  - Life event flags
  - Personality signals
  - Behavioral patterns

  ### 3. `scoring_history`
  Audit trail of all score changes
  - Tracks what triggered recalculation
  - Records deltas for analysis
  - Enables backtesting and model improvement

  ### 4. Enhanced `prospect_scores`
  Adds new fields:
  - Feature vector snapshot
  - Weight vector used
  - Confidence score
  - Explanation details

  ## Security
  - RLS enabled on all tables
  - Users can only access their own scoring data
  - Audit trails are immutable

  ## Philippine MLM/Insurance Context
  Default weights optimized for:
  - Family-oriented decision making
  - Income stress signals
  - Trust and relationship building
  - Leadership potential identification
*/

-- =====================================================
-- 1. USER SCORING PROFILES (Personalized Weights)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_scoring_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Weight Vector (adjusts over time)
  weights jsonb NOT NULL DEFAULT '{
    "engagement_score": 0.18,
    "business_interest_score": 0.20,
    "pain_point_score": 0.20,
    "life_event_score": 0.15,
    "responsiveness_score": 0.15,
    "leadership_score": 0.12,
    "relationship_score": 0.10
  }'::jsonb,
  
  -- Learning Metadata
  total_scored integer DEFAULT 0,
  total_wins integer DEFAULT 0,
  total_losses integer DEFAULT 0,
  win_rate numeric DEFAULT 0,
  
  -- Model Version
  model_version text DEFAULT 'v2.0',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

ALTER TABLE user_scoring_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scoring profile"
  ON user_scoring_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own scoring profile"
  ON user_scoring_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own scoring profile"
  ON user_scoring_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_scoring_profiles_user_id ON user_scoring_profiles(user_id);

-- =====================================================
-- 2. PROSPECT FEATURE VECTORS (ML Inputs)
-- =====================================================

CREATE TABLE IF NOT EXISTS prospect_feature_vectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feature Categories (0-100 normalized scores)
  engagement_score numeric DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  business_interest_score numeric DEFAULT 0 CHECK (business_interest_score >= 0 AND business_interest_score <= 100),
  pain_point_score numeric DEFAULT 0 CHECK (pain_point_score >= 0 AND pain_point_score <= 100),
  life_event_score numeric DEFAULT 0 CHECK (life_event_score >= 0 AND life_event_score <= 100),
  responsiveness_score numeric DEFAULT 0 CHECK (responsiveness_score >= 0 AND responsiveness_score <= 100),
  leadership_score numeric DEFAULT 0 CHECK (leadership_score >= 0 AND leadership_score <= 100),
  relationship_score numeric DEFAULT 0 CHECK (relationship_score >= 0 AND relationship_score <= 100),
  
  -- Full Feature Vector (detailed breakdown)
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Raw Signals (for debugging)
  raw_signals jsonb DEFAULT '{}'::jsonb,
  
  -- Metadata
  confidence numeric DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  data_quality text DEFAULT 'medium' CHECK (data_quality IN ('high', 'medium', 'low')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(prospect_id, user_id)
);

ALTER TABLE prospect_feature_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prospect features"
  ON prospect_feature_vectors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prospect features"
  ON prospect_feature_vectors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prospect features"
  ON prospect_feature_vectors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_prospect_feature_vectors_prospect ON prospect_feature_vectors(prospect_id);
CREATE INDEX idx_prospect_feature_vectors_user ON prospect_feature_vectors(user_id);
CREATE INDEX idx_prospect_feature_vectors_updated ON prospect_feature_vectors(updated_at DESC);

-- =====================================================
-- 3. SCORING HISTORY (Audit Trail & Learning)
-- =====================================================

CREATE TABLE IF NOT EXISTS scoring_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Score Change
  old_score numeric,
  new_score numeric,
  score_delta numeric,
  
  old_bucket text,
  new_bucket text,
  
  -- What Triggered This
  action_trigger text NOT NULL CHECK (action_trigger IN (
    'initial_scan',
    'manual_recalculate',
    'bulk_recalculate',
    'won',
    'lost',
    'positive_reply',
    'no_response',
    'pipeline_advance',
    'new_data',
    'weight_adjustment'
  )),
  
  -- Details
  delta_details jsonb DEFAULT '{}'::jsonb,
  weight_vector_used jsonb,
  feature_vector_used jsonb,
  
  -- Metadata
  triggered_by text,
  notes text,
  
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scoring_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scoring history"
  ON scoring_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert scoring history"
  ON scoring_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for analytics
CREATE INDEX idx_scoring_history_prospect ON scoring_history(prospect_id);
CREATE INDEX idx_scoring_history_user ON scoring_history(user_id);
CREATE INDEX idx_scoring_history_created ON scoring_history(created_at DESC);
CREATE INDEX idx_scoring_history_trigger ON scoring_history(action_trigger);

-- =====================================================
-- 4. ENHANCE PROSPECT_SCORES TABLE
-- =====================================================

-- Add v2.0 fields to existing prospect_scores table
DO $$
BEGIN
  -- Feature vector snapshot
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect_scores' AND column_name = 'feature_vector'
  ) THEN
    ALTER TABLE prospect_scores ADD COLUMN feature_vector jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Weight vector used
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect_scores' AND column_name = 'weight_vector'
  ) THEN
    ALTER TABLE prospect_scores ADD COLUMN weight_vector jsonb;
  END IF;

  -- Confidence score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect_scores' AND column_name = 'confidence'
  ) THEN
    ALTER TABLE prospect_scores ADD COLUMN confidence numeric DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1);
  END IF;

  -- Model version
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect_scores' AND column_name = 'model_version'
  ) THEN
    ALTER TABLE prospect_scores ADD COLUMN model_version text DEFAULT 'v2.0';
  END IF;

  -- Top contributing features (for explainability)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect_scores' AND column_name = 'top_features'
  ) THEN
    ALTER TABLE prospect_scores ADD COLUMN top_features jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Recalculation count (for monitoring)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect_scores' AND column_name = 'recalc_count'
  ) THEN
    ALTER TABLE prospect_scores ADD COLUMN recalc_count integer DEFAULT 0;
  END IF;

  -- Last recalculation reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect_scores' AND column_name = 'last_recalc_reason'
  ) THEN
    ALTER TABLE prospect_scores ADD COLUMN last_recalc_reason text;
  END IF;
END $$;

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to initialize default scoring profile for new users
CREATE OR REPLACE FUNCTION initialize_user_scoring_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_scoring_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create scoring profile
DROP TRIGGER IF EXISTS on_user_created_scoring_profile ON auth.users;
CREATE TRIGGER on_user_created_scoring_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_scoring_profile();

-- =====================================================
-- 6. UTILITY VIEWS
-- =====================================================

-- View: Latest scores with features
CREATE OR REPLACE VIEW v_prospect_scores_enriched AS
SELECT 
  ps.prospect_id,
  ps.user_id,
  ps.scout_score,
  ps.bucket,
  ps.explanation_tags,
  ps.confidence,
  ps.model_version,
  ps.top_features,
  ps.last_calculated_at,
  ps.recalc_count,
  pf.engagement_score,
  pf.business_interest_score,
  pf.pain_point_score,
  pf.life_event_score,
  pf.responsiveness_score,
  pf.leadership_score,
  pf.relationship_score,
  pf.features as full_features
FROM prospect_scores ps
LEFT JOIN prospect_feature_vectors pf ON ps.prospect_id = pf.prospect_id AND ps.user_id = pf.user_id;

-- =====================================================
-- 7. PERFORMANCE INDEXES
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_prospect_scores_user_bucket 
  ON prospect_scores(user_id, bucket, scout_score DESC);

CREATE INDEX IF NOT EXISTS idx_prospect_scores_score_desc 
  ON prospect_scores(scout_score DESC);

-- =====================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_scoring_profiles IS 'Personalized ML weight vectors that learn from user behavior';
COMMENT ON TABLE prospect_feature_vectors IS 'Computed feature vectors for ML-based scoring';
COMMENT ON TABLE scoring_history IS 'Audit trail of all score changes for analysis and improvement';

COMMENT ON COLUMN user_scoring_profiles.weights IS 'JSON weight vector that adjusts based on wins/losses';
COMMENT ON COLUMN user_scoring_profiles.win_rate IS 'Success rate used to tune reinforcement learning';

COMMENT ON COLUMN prospect_feature_vectors.confidence IS 'Data quality confidence (0-1) for scoring reliability';
COMMENT ON COLUMN prospect_feature_vectors.features IS 'Detailed feature breakdown for explainability';

COMMENT ON COLUMN scoring_history.action_trigger IS 'Event that caused score recalculation';
COMMENT ON COLUMN scoring_history.delta_details IS 'Detailed explanation of what changed';