/*
  # Fix RLS Auth Initialization - Batch 2

  1. Purpose
    - Fix company_multi_site_data RLS policies
    - Replace auth.uid() with (select auth.uid())
  
  2. Tables Fixed
    - company_multi_site_data (all 4 policies)
*/

-- Fix company_multi_site_data policies
DROP POLICY IF EXISTS "Users can view their company multi-site data" ON company_multi_site_data;
DROP POLICY IF EXISTS "Users can insert their company multi-site data" ON company_multi_site_data;
DROP POLICY IF EXISTS "Users can update their company multi-site data" ON company_multi_site_data;
DROP POLICY IF EXISTS "Users can delete their company multi-site data" ON company_multi_site_data;

CREATE POLICY "Users can view their company multi-site data"
  ON company_multi_site_data FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = (select auth.uid())
    )
    OR company_id IS NULL
  );

CREATE POLICY "Users can insert their company multi-site data"
  ON company_multi_site_data FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = (select auth.uid())
    )
    OR company_id IS NULL
  );

CREATE POLICY "Users can update their company multi-site data"
  ON company_multi_site_data FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = (select auth.uid())
    )
    OR company_id IS NULL
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = (select auth.uid())
    )
    OR company_id IS NULL
  );

CREATE POLICY "Users can delete their company multi-site data"
  ON company_multi_site_data FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = (select auth.uid())
    )
    OR company_id IS NULL
  );
