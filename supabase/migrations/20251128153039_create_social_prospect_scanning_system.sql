/*
  # Social Prospect Scanning System - Complete Integration

  1. Purpose
    - Enable prospect scanning from connected social media accounts
    - Process social data into scann able prospects
    - Track scanning jobs and results

  2. New Tables
    - `social_scan_jobs`: Track scanning operations
    - `social_prospects_raw`: Raw data from social platforms
    - `social_prospect_enrichment`: Enriched prospect data

  3. Features
    - Scan jobs with status tracking
    - Raw social data storage
    - Automatic prospect enrichment
    - Integration with existing prospects table
*/

-- Social scan jobs
CREATE TABLE IF NOT EXISTS social_scan_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  social_identity_id uuid REFERENCES social_identities(id) ON DELETE CASCADE NOT NULL,
  
  provider text NOT NULL,
  scan_type text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  
  -- Progress tracking
  total_items integer DEFAULT 0,
  processed_items integer DEFAULT 0,
  prospects_found integer DEFAULT 0,
  
  -- Configuration
  scan_config jsonb DEFAULT '{}'::jsonb,
  
  -- Results
  results_summary jsonb DEFAULT '{}'::jsonb,
  error_message text,
  
  -- Timestamps
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Raw social prospects data
CREATE TABLE IF NOT EXISTS social_prospects_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_job_id uuid REFERENCES social_scan_jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  provider text NOT NULL,
  platform_user_id text NOT NULL,
  
  -- Raw data
  raw_data jsonb DEFAULT '{}'::jsonb,
  
  -- Extracted basics
  name text,
  username text,
  profile_url text,
  avatar_url text,
  bio text,
  location text,
  
  -- Engagement metrics
  followers_count integer,
  following_count integer,
  posts_count integer,
  
  -- Processing status
  processed boolean DEFAULT false,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now()
);

-- Social prospect enrichment
CREATE TABLE IF NOT EXISTS social_prospect_enrichment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_prospect_id uuid REFERENCES social_prospects_raw(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  
  -- Enriched data
  detected_interests text[],
  detected_pain_points text[],
  detected_lifestyle text[],
  business_indicators text[],
  
  -- Scoring
  engagement_score integer DEFAULT 0,
  quality_score integer DEFAULT 0,
  mlm_affinity_score integer DEFAULT 0,
  
  -- AI insights
  ai_summary text,
  recommended_approach text,
  
  enriched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_scan_jobs_user_id ON social_scan_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_social_scan_jobs_status ON social_scan_jobs(status);
CREATE INDEX IF NOT EXISTS idx_social_scan_jobs_social_identity ON social_scan_jobs(social_identity_id);

CREATE INDEX IF NOT EXISTS idx_social_prospects_raw_scan_job ON social_prospects_raw(scan_job_id);
CREATE INDEX IF NOT EXISTS idx_social_prospects_raw_user_id ON social_prospects_raw(user_id);
CREATE INDEX IF NOT EXISTS idx_social_prospects_raw_processed ON social_prospects_raw(processed);
CREATE INDEX IF NOT EXISTS idx_social_prospects_raw_prospect_id ON social_prospects_raw(prospect_id);

CREATE INDEX IF NOT EXISTS idx_social_prospect_enrichment_social_prospect ON social_prospect_enrichment(social_prospect_id);
CREATE INDEX IF NOT EXISTS idx_social_prospect_enrichment_prospect ON social_prospect_enrichment(prospect_id);

-- Enable RLS
ALTER TABLE social_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_prospects_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_prospect_enrichment ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own scan jobs"
  ON social_scan_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan jobs"
  ON social_scan_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scan jobs"
  ON social_scan_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own social prospects"
  ON social_prospects_raw FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social prospects"
  ON social_prospects_raw FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social prospects"
  ON social_prospects_raw FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view enrichment via prospect"
  ON social_prospect_enrichment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_prospects_raw
      WHERE id = social_prospect_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert enrichment via prospect"
  ON social_prospect_enrichment FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM social_prospects_raw
      WHERE id = social_prospect_id AND user_id = auth.uid()
    )
  );
