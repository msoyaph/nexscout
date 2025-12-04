/*
  # Fix Company Multi-Site Data Foreign Key - Final Fix

  1. Purpose
    - Drop foreign key to global_companies
    - Add foreign key to company_profiles (user's actual company)
    - This allows crawl to save with company_profiles.id
  
  2. Changes
    - Drop constraint company_multi_site_data_company_id_fkey
    - Add constraint to company_profiles instead
*/

-- Drop old foreign key constraint
ALTER TABLE company_multi_site_data
  DROP CONSTRAINT IF EXISTS company_multi_site_data_company_id_fkey;

-- Add new foreign key to company_profiles (user's company)
ALTER TABLE company_multi_site_data
  ADD CONSTRAINT company_multi_site_data_company_id_fkey
  FOREIGN KEY (company_id) 
  REFERENCES company_profiles(id) 
  ON DELETE CASCADE;

-- Ensure user_id is indexed
CREATE INDEX IF NOT EXISTS idx_company_multi_site_data_user_created
  ON company_multi_site_data(user_id, created_at DESC);
