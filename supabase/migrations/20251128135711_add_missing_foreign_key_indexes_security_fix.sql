/*
  # Add Missing Foreign Key Indexes - Security Fix

  1. Purpose
    - Add indexes for foreign keys that are missing coverage
    - Improves query performance and prevents suboptimal execution
  
  2. Indexes Added
    - company_embeddings.asset_id
    - company_extracted_data.asset_id
    - company_image_intelligence.company_id
*/

-- Add index for company_embeddings.asset_id foreign key
CREATE INDEX IF NOT EXISTS idx_company_embeddings_asset_id 
  ON company_embeddings(asset_id);

-- Add index for company_extracted_data.asset_id foreign key
CREATE INDEX IF NOT EXISTS idx_company_extracted_data_asset_id 
  ON company_extracted_data(asset_id);

-- Add index for company_image_intelligence.company_id foreign key
CREATE INDEX IF NOT EXISTS idx_company_image_intelligence_company_id 
  ON company_image_intelligence(company_id);
