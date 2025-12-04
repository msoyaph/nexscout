/*
  # Fix Company Multi-Site Data Foreign Key

  1. Purpose
    - Allow company_id to be nullable
    - Add user_id for user-scoped queries
    - Keep global_companies relationship for shared data
  
  2. Changes
    - Make company_id nullable
    - Add user_id column
    - Add index for user queries
*/

-- Make company_id nullable (allow data without global company link)
ALTER TABLE company_multi_site_data
  ALTER COLUMN company_id DROP NOT NULL;

-- Add user_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_multi_site_data' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE company_multi_site_data
      ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for user queries
CREATE INDEX IF NOT EXISTS idx_company_multi_site_data_user_id
  ON company_multi_site_data(user_id);

-- Update RLS policies to include user_id
DROP POLICY IF EXISTS "Users can view their company multi-site data" ON company_multi_site_data;

CREATE POLICY "Users can view their company multi-site data"
  ON company_multi_site_data FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR company_id IN (
      SELECT id FROM company_profiles WHERE user_id = (select auth.uid())
    )
    OR company_id IS NULL
  );

DROP POLICY IF EXISTS "Users can insert their company multi-site data" ON company_multi_site_data;

CREATE POLICY "Users can insert their company multi-site data"
  ON company_multi_site_data FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    OR company_id IN (
      SELECT id FROM company_profiles WHERE user_id = (select auth.uid())
    )
    OR company_id IS NULL
  );

DROP POLICY IF EXISTS "Users can update their company multi-site data" ON company_multi_site_data;

CREATE POLICY "Users can update their company multi-site data"
  ON company_multi_site_data FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR company_id IN (
      SELECT id FROM company_profiles WHERE user_id = (select auth.uid())
    )
    OR company_id IS NULL
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR company_id IN (
      SELECT id FROM company_profiles WHERE user_id = (select auth.uid())
    )
    OR company_id IS NULL
  );

DROP POLICY IF EXISTS "Users can delete their company multi-site data" ON company_multi_site_data;

CREATE POLICY "Users can delete their company multi-site data"
  ON company_multi_site_data FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR company_id IN (
      SELECT id FROM company_profiles WHERE user_id = (select auth.uid())
    )
    OR company_id IS NULL
  );
