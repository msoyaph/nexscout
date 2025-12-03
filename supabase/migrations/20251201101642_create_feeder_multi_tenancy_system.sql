/*
  # Multi-Tenancy Data Feeder System

  1. Create Owner Type Enum
    - system: Global templates (SuperAdmin only)
    - enterprise: Enterprise-wide templates
    - team: Team-specific templates

  2. Add Owner Fields to Master Tables
    - owner_type: Type of owner
    - owner_id: ID of enterprise or team
    
  3. Create RLS Helper Functions
    - is_super_admin(): Check if user is super admin
    - current_enterprise_ids(): Get user's enterprise IDs
    - current_team_ids(): Get user's team IDs
    
  4. Purpose
    - Enable multi-tenant data isolation
    - Priority: team > enterprise > system
    - Secure access control via RLS
*/

-- 1. Create owner type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feeder_owner_type') THEN
    CREATE TYPE feeder_owner_type AS ENUM ('system', 'enterprise', 'team');
  END IF;
END $$;

-- 2. Add owner columns to admin tables
DO $$
BEGIN
  -- admin_companies
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_companies' AND column_name = 'owner_type') THEN
    ALTER TABLE admin_companies ADD COLUMN owner_type feeder_owner_type NOT NULL DEFAULT 'system';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_companies' AND column_name = 'owner_id') THEN
    ALTER TABLE admin_companies ADD COLUMN owner_id uuid;
  END IF;

  -- admin_products
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'owner_type') THEN
    ALTER TABLE admin_products ADD COLUMN owner_type feeder_owner_type NOT NULL DEFAULT 'system';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'owner_id') THEN
    ALTER TABLE admin_products ADD COLUMN owner_id uuid;
  END IF;

  -- admin_product_variants
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_product_variants' AND column_name = 'owner_type') THEN
    ALTER TABLE admin_product_variants ADD COLUMN owner_type feeder_owner_type NOT NULL DEFAULT 'system';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_product_variants' AND column_name = 'owner_id') THEN
    ALTER TABLE admin_product_variants ADD COLUMN owner_id uuid;
  END IF;

  -- admin_services
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_services' AND column_name = 'owner_type') THEN
    ALTER TABLE admin_services ADD COLUMN owner_type feeder_owner_type NOT NULL DEFAULT 'system';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_services' AND column_name = 'owner_id') THEN
    ALTER TABLE admin_services ADD COLUMN owner_id uuid;
  END IF;

  -- admin_offerings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_offerings' AND column_name = 'owner_type') THEN
    ALTER TABLE admin_offerings ADD COLUMN owner_type feeder_owner_type NOT NULL DEFAULT 'system';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_offerings' AND column_name = 'owner_id') THEN
    ALTER TABLE admin_offerings ADD COLUMN owner_id uuid;
  END IF;
END $$;

-- 3. Create RLS helper functions

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
  );
$$;

-- Get current user's enterprise IDs
CREATE OR REPLACE FUNCTION current_enterprise_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT team_id as enterprise_id
  FROM team_members
  WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner');
$$;

-- Get current user's team IDs
CREATE OR REPLACE FUNCTION current_team_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT team_id
  FROM team_members
  WHERE user_id = auth.uid();
$$;

-- 4. Add indexes for owner queries
CREATE INDEX IF NOT EXISTS idx_admin_companies_owner ON admin_companies(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_admin_products_owner ON admin_products(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_admin_product_variants_owner ON admin_product_variants(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_admin_services_owner ON admin_services(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_admin_offerings_owner ON admin_offerings(owner_type, owner_id);

-- 5. Update RLS policies to use multi-tenancy

-- Drop existing policies
DROP POLICY IF EXISTS "Super admin full access to admin_companies" ON admin_companies;
DROP POLICY IF EXISTS "Super admin full access to admin_products" ON admin_products;
DROP POLICY IF EXISTS "Super admin full access to admin_product_variants" ON admin_product_variants;

-- admin_companies policies
CREATE POLICY "Admin companies read access"
  ON admin_companies FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
    OR owner_type = 'system'
  );

CREATE POLICY "Admin companies write access"
  ON admin_companies FOR ALL
  TO authenticated
  USING (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
  )
  WITH CHECK (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
  );

-- admin_products policies
CREATE POLICY "Admin products read access"
  ON admin_products FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
    OR owner_type = 'system'
  );

CREATE POLICY "Admin products write access"
  ON admin_products FOR ALL
  TO authenticated
  USING (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
  )
  WITH CHECK (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
  );

-- admin_product_variants policies
CREATE POLICY "Admin variants read access"
  ON admin_product_variants FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
    OR owner_type = 'system'
  );

CREATE POLICY "Admin variants write access"
  ON admin_product_variants FOR ALL
  TO authenticated
  USING (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
  )
  WITH CHECK (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
  );

-- admin_services policies
CREATE POLICY "Admin services read access"
  ON admin_services FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
    OR owner_type = 'system'
  );

CREATE POLICY "Admin services write access"
  ON admin_services FOR ALL
  TO authenticated
  USING (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
  )
  WITH CHECK (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
  );

-- admin_offerings policies
CREATE POLICY "Admin offerings read access"
  ON admin_offerings FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
    OR owner_type = 'system'
  );

CREATE POLICY "Admin offerings write access"
  ON admin_offerings FOR ALL
  TO authenticated
  USING (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
  )
  WITH CHECK (
    is_super_admin()
    OR (owner_type = 'enterprise' AND owner_id IN (SELECT current_enterprise_ids()))
    OR (owner_type = 'team' AND owner_id IN (SELECT current_team_ids()))
  );

-- Comment for documentation
COMMENT ON TYPE feeder_owner_type IS 'Defines who owns the master data: system (global), enterprise, or team';
COMMENT ON COLUMN admin_companies.owner_type IS 'Type of owner: system, enterprise, or team';
COMMENT ON COLUMN admin_companies.owner_id IS 'ID of enterprise or team (null for system)';
COMMENT ON FUNCTION is_super_admin() IS 'Returns true if current user is a super admin';
COMMENT ON FUNCTION current_enterprise_ids() IS 'Returns enterprise IDs that current user is admin of';
COMMENT ON FUNCTION current_team_ids() IS 'Returns team IDs that current user belongs to';