/*
  # Fix Company Multi-Site Data Unique Constraint

  1. Purpose
    - Drop unique constraint on (company_id, platform)
    - Add unique constraint on (user_id, url) instead
    - Allow multiple crawls of same URL over time
  
  2. Changes
    - Drop company_multi_site_data_company_id_platform_key
    - Add index for efficient queries
*/

-- Drop the problematic unique constraint
ALTER TABLE company_multi_site_data
  DROP CONSTRAINT IF EXISTS company_multi_site_data_company_id_platform_key;

-- Add index for efficient queries (non-unique, allows duplicates)
CREATE INDEX IF NOT EXISTS idx_company_multi_site_data_company_platform
  ON company_multi_site_data(company_id, platform)
  WHERE company_id IS NOT NULL;

-- Add index for user queries
CREATE INDEX IF NOT EXISTS idx_company_multi_site_data_user_url
  ON company_multi_site_data(user_id, url);
