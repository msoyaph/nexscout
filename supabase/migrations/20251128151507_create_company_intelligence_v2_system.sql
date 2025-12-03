/*
  # Company Intelligence V2 System - Complete Website Intelligence

  1. Purpose
    - Store comprehensive website intelligence data
    - Support multi-page crawling with full extraction
    - Enable MLM structure detection and analysis
    - Power AI-driven company insights

  2. New Tables
    - `company_intelligence_v2`: Main intelligence storage
    - `company_intelligence_pages`: Individual page data
    - `company_intelligence_products`: Extracted products
    - `company_intelligence_mlm`: MLM structure data
    - `crawler_logs`: Crawl history and diagnostics

  3. Features
    - Full HTML and text storage
    - Structured data extraction (JSON)
    - Product catalog management
    - SEO signals tracking
    - MLM structure detection
    - Brand voice analysis
    - Vector embeddings for search
    - Crawl quality scoring
*/

-- Main intelligence table
CREATE TABLE IF NOT EXISTS company_intelligence_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  
  -- Core data
  company_name text NOT NULL,
  primary_url text NOT NULL,
  urls_crawled jsonb DEFAULT '[]'::jsonb,
  
  -- Raw content
  raw_html text,
  raw_text text,
  
  -- Structured extraction
  enriched_json jsonb DEFAULT '{}'::jsonb,
  
  -- Specific extractions
  company_identity jsonb DEFAULT '{}'::jsonb,
  product_catalog jsonb DEFAULT '[]'::jsonb,
  seo_signals jsonb DEFAULT '{}'::jsonb,
  mlm_structure jsonb DEFAULT '{}'::jsonb,
  brand_voice jsonb DEFAULT '{}'::jsonb,
  marketing_intelligence jsonb DEFAULT '{}'::jsonb,
  
  -- Analysis
  extracted_keywords text[],
  embeddings vector(1536),
  
  -- Quality metrics
  crawl_quality_score integer DEFAULT 0,
  pages_crawled integer DEFAULT 0,
  extraction_completeness jsonb DEFAULT '{}'::jsonb,
  
  -- Metadata
  last_crawled_at timestamptz DEFAULT now(),
  crawl_duration_ms integer,
  crawler_version text DEFAULT 'v5.0',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual page data
CREATE TABLE IF NOT EXISTS company_intelligence_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_id uuid REFERENCES company_intelligence_v2(id) ON DELETE CASCADE NOT NULL,
  
  url text NOT NULL,
  page_type text,
  title text,
  
  raw_html text,
  raw_text text,
  parsed_data jsonb DEFAULT '{}'::jsonb,
  
  meta_tags jsonb DEFAULT '{}'::jsonb,
  structured_data jsonb DEFAULT '[]'::jsonb,
  
  extracted_at timestamptz DEFAULT now()
);

-- Extracted products
CREATE TABLE IF NOT EXISTS company_intelligence_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_id uuid REFERENCES company_intelligence_v2(id) ON DELETE CASCADE NOT NULL,
  
  name text NOT NULL,
  category text,
  description text,
  benefits text[],
  features text[],
  
  price numeric,
  currency text DEFAULT 'USD',
  
  images jsonb DEFAULT '[]'::jsonb,
  product_url text,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- MLM structure data
CREATE TABLE IF NOT EXISTS company_intelligence_mlm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_id uuid REFERENCES company_intelligence_v2(id) ON DELETE CASCADE NOT NULL,
  
  plan_type text,
  plan_name text,
  
  compensation_structure jsonb DEFAULT '{}'::jsonb,
  rank_system jsonb DEFAULT '[]'::jsonb,
  bonuses jsonb DEFAULT '[]'::jsonb,
  incentives jsonb DEFAULT '[]'::jsonb,
  
  requirements jsonb DEFAULT '{}'::jsonb,
  
  extracted_text text,
  confidence_score numeric DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- Crawler logs
CREATE TABLE IF NOT EXISTS crawler_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  intelligence_id uuid REFERENCES company_intelligence_v2(id) ON DELETE SET NULL,
  
  crawl_type text NOT NULL,
  target_url text NOT NULL,
  
  status text NOT NULL,
  pages_crawled integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  warnings jsonb DEFAULT '[]'::jsonb,
  
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intelligence_v2_user_id ON company_intelligence_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_v2_company_id ON company_intelligence_v2(company_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_v2_primary_url ON company_intelligence_v2(primary_url);
CREATE INDEX IF NOT EXISTS idx_intelligence_v2_quality_score ON company_intelligence_v2(crawl_quality_score DESC);

CREATE INDEX IF NOT EXISTS idx_intelligence_pages_intelligence_id ON company_intelligence_pages(intelligence_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_pages_url ON company_intelligence_pages(url);

CREATE INDEX IF NOT EXISTS idx_intelligence_products_intelligence_id ON company_intelligence_products(intelligence_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_products_category ON company_intelligence_products(category);

CREATE INDEX IF NOT EXISTS idx_intelligence_mlm_intelligence_id ON company_intelligence_mlm(intelligence_id);

CREATE INDEX IF NOT EXISTS idx_crawler_logs_user_id ON crawler_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_crawler_logs_status ON crawler_logs(status);
CREATE INDEX IF NOT EXISTS idx_crawler_logs_started_at ON crawler_logs(started_at DESC);

-- Enable RLS
ALTER TABLE company_intelligence_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_intelligence_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_intelligence_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_intelligence_mlm ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own intelligence"
  ON company_intelligence_v2 FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intelligence"
  ON company_intelligence_v2 FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intelligence"
  ON company_intelligence_v2 FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own intelligence"
  ON company_intelligence_v2 FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Similar policies for related tables
CREATE POLICY "Users can view pages via intelligence"
  ON company_intelligence_pages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_intelligence_v2
      WHERE id = intelligence_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pages via intelligence"
  ON company_intelligence_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_intelligence_v2
      WHERE id = intelligence_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view products via intelligence"
  ON company_intelligence_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_intelligence_v2
      WHERE id = intelligence_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products via intelligence"
  ON company_intelligence_products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_intelligence_v2
      WHERE id = intelligence_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view MLM via intelligence"
  ON company_intelligence_mlm FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_intelligence_v2
      WHERE id = intelligence_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert MLM via intelligence"
  ON company_intelligence_mlm FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_intelligence_v2
      WHERE id = intelligence_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own crawler logs"
  ON crawler_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crawler logs"
  ON crawler_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
