/*
  # Add Company Crawl Tracking Tables
  
  1. New Tables
    - `company_crawl_events` - Real-time crawl progress tracking
    - `company_crawl_history` - Historical crawl logs
  
  2. Security
    - RLS enabled
    - User-scoped access
*/

-- Company crawl events table (real-time progress)
CREATE TABLE IF NOT EXISTS public.company_crawl_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid,
  url text NOT NULL,
  step text NOT NULL CHECK (step IN (
    'validating',
    'fetching',
    'scraping',
    'extracting',
    'analyzing',
    'embedding',
    'syncing',
    'completed',
    'failed'
  )),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Company crawl history table
CREATE TABLE IF NOT EXISTS public.company_crawl_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid,
  url text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  pages_crawled integer DEFAULT 0,
  data_quality numeric DEFAULT 0,
  crawl_duration_ms integer,
  error_message text,
  tier_used text,
  crawl_depth_used integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crawl_events_user_company 
ON company_crawl_events(user_id, company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crawl_events_step 
ON company_crawl_events(step) 
WHERE step != 'completed' AND step != 'failed';

CREATE INDEX IF NOT EXISTS idx_crawl_history_user 
ON company_crawl_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE company_crawl_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_crawl_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own crawl events"
ON company_crawl_events FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crawl events"
ON company_crawl_events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own crawl history"
ON company_crawl_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crawl history"
ON company_crawl_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);