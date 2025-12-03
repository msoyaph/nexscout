/*
  # Company Intelligence Engine v1.0

  1. New Tables
    - `company_profiles` - Store company branding and settings
    - `company_assets` - Track uploaded files and extraction status
    - `company_extracted_data` - Store AI-extracted structured data
    - `company_embeddings` - Vector embeddings for semantic search

  2. Security
    - Enable RLS on all tables
    - Users can only access their own company data
    - Optimized auth functions

  3. Indexes
    - Foreign key indexes
    - Vector similarity search index
    - Query optimization indexes
*/

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Company profiles table
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_slogan text,
  industry text NOT NULL,
  description text,
  logo_url text,
  brand_tone text DEFAULT 'professional',
  pitch_style text DEFAULT 'inspirational',
  sequence_style text DEFAULT 'trust-builder',
  brand_color_primary text DEFAULT '#1877F2',
  brand_color_secondary text DEFAULT '#1EC8FF',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Company assets table
CREATE TABLE IF NOT EXISTS public.company_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint,
  source text DEFAULT 'upload',
  extraction_status text DEFAULT 'pending',
  extraction_error text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company extracted data table
CREATE TABLE IF NOT EXISTS public.company_extracted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES public.company_assets(id) ON DELETE CASCADE,
  data_type text NOT NULL,
  data_json jsonb NOT NULL DEFAULT '{}',
  confidence numeric DEFAULT 0.0,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company embeddings table with vector support
CREATE TABLE IF NOT EXISTS public.company_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES public.company_assets(id) ON DELETE SET NULL,
  data_type text,
  chunk_text text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON public.company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_company_assets_user_id ON public.company_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_company_assets_status ON public.company_assets(extraction_status);
CREATE INDEX IF NOT EXISTS idx_company_extracted_data_user_id ON public.company_extracted_data(user_id);
CREATE INDEX IF NOT EXISTS idx_company_extracted_data_type ON public.company_extracted_data(data_type);
CREATE INDEX IF NOT EXISTS idx_company_embeddings_user_id ON public.company_embeddings(user_id);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_company_embeddings_vector 
  ON public.company_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_profiles
CREATE POLICY "Users can view own company profile"
  ON public.company_profiles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own company profile"
  ON public.company_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own company profile"
  ON public.company_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own company profile"
  ON public.company_profiles FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- RLS Policies for company_assets
CREATE POLICY "Users can view own company assets"
  ON public.company_assets FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own company assets"
  ON public.company_assets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own company assets"
  ON public.company_assets FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own company assets"
  ON public.company_assets FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- RLS Policies for company_extracted_data
CREATE POLICY "Users can view own extracted data"
  ON public.company_extracted_data FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own extracted data"
  ON public.company_extracted_data FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own extracted data"
  ON public.company_extracted_data FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own extracted data"
  ON public.company_extracted_data FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- RLS Policies for company_embeddings
CREATE POLICY "Users can view own embeddings"
  ON public.company_embeddings FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own embeddings"
  ON public.company_embeddings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own embeddings"
  ON public.company_embeddings FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_company_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_updated_at();

CREATE TRIGGER update_company_assets_updated_at
  BEFORE UPDATE ON public.company_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_updated_at();

CREATE TRIGGER update_company_extracted_data_updated_at
  BEFORE UPDATE ON public.company_extracted_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_updated_at();
