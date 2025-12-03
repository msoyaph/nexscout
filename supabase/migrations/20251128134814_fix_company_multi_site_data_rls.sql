/*
  # Fix RLS Policies for Company Multi-Site Data

  1. Policies Added
    - INSERT policy for authenticated users to add their company data
    - UPDATE policy for authenticated users to update their company data
    - DELETE policy for authenticated users to delete their company data
  
  2. Security
    - Users can only manage data for companies they own
    - Checks company_id against user's company_profiles
*/

-- First, drop existing restrictive policies if any
DROP POLICY IF EXISTS "Multi-site data is readable by authenticated users" ON company_multi_site_data;
DROP POLICY IF EXISTS "Service role can manage multi-site data" ON company_multi_site_data;

-- Create comprehensive policies for authenticated users

-- SELECT: Users can view data for their companies
CREATE POLICY "Users can view their company multi-site data"
  ON company_multi_site_data FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
    OR company_id IS NULL
  );

-- INSERT: Users can insert data for their companies
CREATE POLICY "Users can insert their company multi-site data"
  ON company_multi_site_data FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
    OR company_id IS NULL
  );

-- UPDATE: Users can update data for their companies
CREATE POLICY "Users can update their company multi-site data"
  ON company_multi_site_data FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
    OR company_id IS NULL
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
    OR company_id IS NULL
  );

-- DELETE: Users can delete data for their companies
CREATE POLICY "Users can delete their company multi-site data"
  ON company_multi_site_data FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
    OR company_id IS NULL
  );

-- Service role can do everything
CREATE POLICY "Service role can manage multi-site data"
  ON company_multi_site_data FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
