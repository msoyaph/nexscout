/*
  # Fix Company Embeddings Schema - Complete

  1. Purpose
    - Add missing columns that code expects
    - Align schema with companyEmbeddingEngine.ts requirements
  
  2. Columns Added
    - company_id: Link to company_profiles
    - extracted_data_id: Link to company_multi_site_data
    - chunk_index: Order of chunks
    - source: Data source type (description, mission, product, etc.)
    - source_url: Original URL
    - embedding_text: Text used for embedding
*/

-- Add missing columns
ALTER TABLE company_embeddings
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS extracted_data_id uuid,
  ADD COLUMN IF NOT EXISTS chunk_index integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS source_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS embedding_text text;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_embeddings_company_id 
  ON company_embeddings(company_id) WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_company_embeddings_source 
  ON company_embeddings(user_id, source) WHERE source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_company_embeddings_extracted_data 
  ON company_embeddings(extracted_data_id) WHERE extracted_data_id IS NOT NULL;
