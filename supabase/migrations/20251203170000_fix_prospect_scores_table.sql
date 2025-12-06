-- =====================================================
-- FIX: PROSPECT_SCORES TABLE CREATION
-- =====================================================
-- Purpose: Ensure prospect_scores table exists before enhancement migrations
-- Fixes: ERROR: relation "prospect_scores" does not exist (SQLSTATE 42P01)
--
-- This migration runs AFTER the failed migration to create the table
-- that should have been created by 20251125113950_create_messaging_engine_enhanced.sql
-- =====================================================

-- Only create if table doesn't exist
-- If it exists, subsequent migrations will add missing columns
CREATE TABLE IF NOT EXISTS prospect_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  
  -- Core scoring fields
  scout_score NUMERIC DEFAULT 50 CHECK (scout_score >= 0 AND scout_score <= 100),
  bucket TEXT DEFAULT 'warm' CHECK (bucket IN ('hot', 'warm', 'cold')),
  
  -- Compatibility with v2 system
  score NUMERIC DEFAULT 0.5 CHECK (score >= 0 AND score <= 1),
  score_category TEXT DEFAULT 'warm' CHECK (score_category IN ('hot', 'warm', 'cold', 'unknown')),
  
  -- Additional scoring components
  engagement_score NUMERIC DEFAULT 0.5 CHECK (engagement_score >= 0 AND engagement_score <= 1),
  responsiveness_likelihood NUMERIC DEFAULT 0.5 CHECK (responsiveness_likelihood >= 0 AND responsiveness_likelihood <= 1),
  mlm_leadership_potential NUMERIC DEFAULT 0.5 CHECK (mlm_leadership_potential >= 0 AND mlm_leadership_potential <= 1),
  
  -- Explanation and tags
  explanation_tags JSONB DEFAULT '[]'::jsonb,
  reasoning TEXT,
  
  -- v2.0 fields (for ML-based scoring)
  feature_vector JSONB DEFAULT '{}'::jsonb,
  weight_vector JSONB,
  confidence NUMERIC DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  model_version TEXT DEFAULT 'v2.0',
  top_features JSONB DEFAULT '[]'::jsonb,
  recalc_count INTEGER DEFAULT 0,
  last_recalc_reason TEXT,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_prospect_score UNIQUE(user_id, prospect_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_prospect_scores_user 
  ON prospect_scores(user_id);

CREATE INDEX IF NOT EXISTS idx_prospect_scores_prospect 
  ON prospect_scores(prospect_id);

CREATE INDEX IF NOT EXISTS idx_prospect_scores_bucket 
  ON prospect_scores(bucket);

CREATE INDEX IF NOT EXISTS idx_prospect_scores_score 
  ON prospect_scores(scout_score DESC);

CREATE INDEX IF NOT EXISTS idx_prospect_scores_user_bucket 
  ON prospect_scores(user_id, bucket);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE prospect_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own prospect scores" ON prospect_scores;
DROP POLICY IF EXISTS "Users can insert own prospect scores" ON prospect_scores;
DROP POLICY IF EXISTS "Users can update own prospect scores" ON prospect_scores;
DROP POLICY IF EXISTS "Users can delete own prospect scores" ON prospect_scores;
DROP POLICY IF EXISTS "Super admins can view all prospect scores" ON prospect_scores;

-- Users can view their own prospect scores
CREATE POLICY "Users can view own prospect scores"
  ON prospect_scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own prospect scores
CREATE POLICY "Users can insert own prospect scores"
  ON prospect_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own prospect scores
CREATE POLICY "Users can update own prospect scores"
  ON prospect_scores
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own prospect scores
CREATE POLICY "Users can delete own prospect scores"
  ON prospect_scores
  FOR DELETE
  USING (auth.uid() = user_id);

-- Super admins can view all prospect scores
CREATE POLICY "Super admins can view all prospect scores"
  ON prospect_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE prospect_scores IS 
  'Stores ScoutScore and related scoring data for prospects. Supports both v1 and v2 scoring systems.';

COMMENT ON COLUMN prospect_scores.scout_score IS 
  'ScoutScore v1/v2 (0-100 scale). Primary scoring metric.';

COMMENT ON COLUMN prospect_scores.bucket IS 
  'Lead temperature: hot (90-100), warm (70-89), cold (0-69)';

COMMENT ON COLUMN prospect_scores.feature_vector IS 
  'ML feature vector for v2.0 scoring system';

COMMENT ON COLUMN prospect_scores.model_version IS 
  'Scoring model version used (v1.0, v2.0, etc.)';

-- =====================================================
-- Migration Complete
-- =====================================================

/*
This migration ensures prospect_scores table exists with ALL fields needed by:
- ScoutScore v1
- ScoutScore v2
- ML-based scoring
- Feature vector system

If table already exists, this is safe (CREATE TABLE IF NOT EXISTS)
All subsequent enhancement migrations can now run successfully.
*/

