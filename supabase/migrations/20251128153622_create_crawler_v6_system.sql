/*
  # Website Intelligence Crawler v6.0 - Browser Automation + OCR + Forms

  1. Purpose
    - Support headless browser automation crawling
    - Store screenshot OCR data
    - Track form detection and lead flows
    - Record detailed crawl sessions

  2. New Tables
    - `company_crawl_sessions`: Track browser crawl sessions
    - `company_crawl_pages`: Individual page data with screenshots
    - `company_detected_forms`: Form detection results
    - `company_lead_flows`: Lead flow mapping

  3. Enhancements to existing tables
    - Add v6.0 fields to company_intelligence_v2
*/

-- Company crawl sessions
CREATE TABLE IF NOT EXISTS company_crawl_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  intelligence_id uuid REFERENCES company_intelligence_v2(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  crawler_version text DEFAULT '6.0' NOT NULL,
  entry_url text NOT NULL,
  
  start_time timestamptz DEFAULT now() NOT NULL,
  end_time timestamptz,
  duration_ms integer,
  
  pages_crawled integer DEFAULT 0,
  sources jsonb DEFAULT '["browser"]'::jsonb,
  
  quality_score integer DEFAULT 0,
  status text DEFAULT 'running',
  
  session_log jsonb DEFAULT '{}'::jsonb,
  notes text,
  
  created_at timestamptz DEFAULT now()
);

-- Company crawl pages (from browser automation)
CREATE TABLE IF NOT EXISTS company_crawl_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES company_crawl_sessions(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  
  url text NOT NULL,
  title text,
  
  html_excerpt text,
  screenshot_url text,
  screenshot_base64 text,
  
  ocr_text text,
  ocr_blocks jsonb DEFAULT '[]'::jsonb,
  
  is_primary_page boolean DEFAULT false,
  page_type text,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  
  crawled_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Detected forms
CREATE TABLE IF NOT EXISTS company_detected_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES company_crawl_sessions(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  
  page_url text NOT NULL,
  form_type text NOT NULL,
  
  cta_text text,
  fields_json jsonb DEFAULT '[]'::jsonb,
  
  form_action text,
  form_method text,
  
  complexity_score integer DEFAULT 0,
  barrier_score integer DEFAULT 0,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- Lead flows
CREATE TABLE IF NOT EXISTS company_lead_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES company_crawl_sessions(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  
  flow_name text NOT NULL,
  
  nodes_json jsonb DEFAULT '[]'::jsonb,
  edges_json jsonb DEFAULT '[]'::jsonb,
  
  entry_points text[],
  conversion_points text[],
  
  complexity_rating text,
  
  created_at timestamptz DEFAULT now()
);

-- Extend company_intelligence_v2
ALTER TABLE company_intelligence_v2
ADD COLUMN IF NOT EXISTS lead_flows jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS detected_forms jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS data_sources text[] DEFAULT ARRAY['html'],
ADD COLUMN IF NOT EXISTS ocr_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS form_patterns jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS lead_generation_strategy text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crawl_sessions_company_id ON company_crawl_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_crawl_sessions_user_id ON company_crawl_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_crawl_sessions_status ON company_crawl_sessions(status);
CREATE INDEX IF NOT EXISTS idx_crawl_sessions_intelligence_id ON company_crawl_sessions(intelligence_id);

CREATE INDEX IF NOT EXISTS idx_crawl_pages_session_id ON company_crawl_pages(session_id);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_company_id ON company_crawl_pages(company_id);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_is_primary ON company_crawl_pages(is_primary_page);

CREATE INDEX IF NOT EXISTS idx_detected_forms_session_id ON company_detected_forms(session_id);
CREATE INDEX IF NOT EXISTS idx_detected_forms_company_id ON company_detected_forms(company_id);
CREATE INDEX IF NOT EXISTS idx_detected_forms_type ON company_detected_forms(form_type);

CREATE INDEX IF NOT EXISTS idx_lead_flows_session_id ON company_lead_flows(session_id);
CREATE INDEX IF NOT EXISTS idx_lead_flows_company_id ON company_lead_flows(company_id);

-- Enable RLS
ALTER TABLE company_crawl_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_crawl_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_detected_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_lead_flows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own crawl sessions"
  ON company_crawl_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crawl sessions"
  ON company_crawl_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crawl sessions"
  ON company_crawl_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view pages via session"
  ON company_crawl_pages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_crawl_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pages via session"
  ON company_crawl_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_crawl_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view forms via session"
  ON company_detected_forms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_crawl_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert forms via session"
  ON company_detected_forms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_crawl_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view lead flows via session"
  ON company_lead_flows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_crawl_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert lead flows via session"
  ON company_lead_flows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_crawl_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );
