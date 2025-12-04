/*
  # Global Company Registry System + Knowledge Graph
  
  1. New Tables
    - `global_companies` - Global company database with multi-site data
    - `company_aliases` - Alternative names for fuzzy matching
    - `company_knowledge_graphs` - Semantic graph data
    - `company_multi_site_data` - Platform-specific scraped data
  
  2. Features
    - Global company registry
    - Fuzzy name matching
    - Multi-site crawling support
    - Knowledge graph storage
    - Auto-population capabilities
    
  3. Security
    - RLS enabled where appropriate
    - Public read access for global_companies
    - User-scoped write access
*/

-- Global companies table (shared across all users)
CREATE TABLE IF NOT EXISTS public.global_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  website text,
  fb_page text,
  linkedin_page text,
  youtube_link text,
  instagram_link text,
  twitter_link text,
  logo_url text,
  industry text,
  description text,
  json_data jsonb DEFAULT '{}'::jsonb,
  knowledge_graph jsonb DEFAULT '{}'::jsonb,
  embeddings_ready boolean DEFAULT false,
  crawl_quality numeric DEFAULT 0,
  data_sources text[] DEFAULT ARRAY[]::text[],
  last_crawled_at timestamptz,
  times_used integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company aliases for fuzzy matching
CREATE TABLE IF NOT EXISTS public.company_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.global_companies(id) ON DELETE CASCADE,
  alias_name text NOT NULL,
  normalized_alias text NOT NULL,
  alias_type text DEFAULT 'manual' CHECK (alias_type IN ('manual', 'auto', 'user_generated')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(normalized_alias)
);

-- Company knowledge graphs (semantic graph data)
CREATE TABLE IF NOT EXISTS public.company_knowledge_graphs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.global_companies(id) ON DELETE CASCADE,
  graph_version integer DEFAULT 1,
  nodes jsonb DEFAULT '[]'::jsonb,
  edges jsonb DEFAULT '[]'::jsonb,
  insights jsonb DEFAULT '{}'::jsonb,
  positioning_summary text,
  unique_selling_points jsonb DEFAULT '[]'::jsonb,
  objection_map jsonb DEFAULT '{}'::jsonb,
  benefit_chains jsonb DEFAULT '[]'::jsonb,
  target_audiences jsonb DEFAULT '[]'::jsonb,
  pain_points jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, graph_version)
);

-- Multi-site scraped data (platform-specific)
CREATE TABLE IF NOT EXISTS public.company_multi_site_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.global_companies(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('website', 'facebook', 'youtube', 'linkedin', 'instagram', 'twitter')),
  url text NOT NULL,
  scraped_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_content text,
  metadata jsonb DEFAULT '{}'::jsonb,
  scrape_quality numeric DEFAULT 0,
  last_scraped_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, platform)
);

-- User company associations (link users to global companies)
CREATE TABLE IF NOT EXISTS public.user_company_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.global_companies(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT true,
  custom_overrides jsonb DEFAULT '{}'::jsonb,
  linked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_global_companies_normalized_name 
ON global_companies(normalized_name);

CREATE INDEX IF NOT EXISTS idx_global_companies_display_name 
ON global_companies(display_name);

CREATE INDEX IF NOT EXISTS idx_global_companies_website 
ON global_companies(website) 
WHERE website IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_company_aliases_normalized 
ON company_aliases(normalized_alias);

CREATE INDEX IF NOT EXISTS idx_company_aliases_company_id 
ON company_aliases(company_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_graphs_company 
ON company_knowledge_graphs(company_id, graph_version DESC);

CREATE INDEX IF NOT EXISTS idx_multi_site_data_company_platform 
ON company_multi_site_data(company_id, platform);

CREATE INDEX IF NOT EXISTS idx_user_company_links_user 
ON user_company_links(user_id);

CREATE INDEX IF NOT EXISTS idx_user_company_links_company 
ON user_company_links(company_id);

-- Enable RLS
ALTER TABLE global_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_knowledge_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_multi_site_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_company_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global_companies is readable by all authenticated users)
CREATE POLICY "Global companies are readable by authenticated users"
ON global_companies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage global companies"
ON global_companies FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Aliases are readable by authenticated users"
ON company_aliases FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage aliases"
ON company_aliases FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Knowledge graphs are readable by authenticated users"
ON company_knowledge_graphs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage knowledge graphs"
ON company_knowledge_graphs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Multi-site data is readable by authenticated users"
ON company_multi_site_data FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage multi-site data"
ON company_multi_site_data FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own company links"
ON user_company_links FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own company links"
ON user_company_links FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Helper function to normalize company names
CREATE OR REPLACE FUNCTION normalize_company_name(name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'),
    '\s+', ' ', 'g'
  ));
END;
$$;