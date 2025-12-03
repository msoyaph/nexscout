/*
  # Add Admin Links to User Tables for PLO

  1. Enhance Existing Tables
    - company_profiles: Add admin_company_id, source, is_overridden, last_synced_at
    - products: Add admin_product_id, source, is_overridden, last_synced_at
    - product_variants: Add admin_variant_id, source, is_overridden, last_synced_at
    
  2. Purpose
    - Link user data to admin master data
    - Track data source (admin_seed, user_manual, mixed)
    - Allow users to override admin data
    - Enable "factory reset" functionality
    
  3. Benefits
    - Magic onboarding with auto-population
    - User maintains full control
    - Easy to sync updates from admin
*/

-- Enhance company_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'admin_company_id') THEN
    ALTER TABLE company_profiles ADD COLUMN admin_company_id uuid REFERENCES admin_companies(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'data_source') THEN
    ALTER TABLE company_profiles ADD COLUMN data_source text DEFAULT 'user_manual';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'is_overridden') THEN
    ALTER TABLE company_profiles ADD COLUMN is_overridden boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'last_synced_at') THEN
    ALTER TABLE company_profiles ADD COLUMN last_synced_at timestamptz;
  END IF;
END $$;

-- Enhance products table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'admin_product_id') THEN
    ALTER TABLE products ADD COLUMN admin_product_id uuid REFERENCES admin_products(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'data_source') THEN
    ALTER TABLE products ADD COLUMN data_source text DEFAULT 'user_manual';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_overridden') THEN
    ALTER TABLE products ADD COLUMN is_overridden boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'last_synced_at') THEN
    ALTER TABLE products ADD COLUMN last_synced_at timestamptz;
  END IF;
END $$;

-- Enhance product_variants table  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'admin_variant_id') THEN
    ALTER TABLE product_variants ADD COLUMN admin_variant_id uuid REFERENCES admin_product_variants(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'data_source') THEN
    ALTER TABLE product_variants ADD COLUMN data_source text DEFAULT 'user_manual';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'is_overridden') THEN
    ALTER TABLE product_variants ADD COLUMN is_overridden boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'last_synced_at') THEN
    ALTER TABLE product_variants ADD COLUMN last_synced_at timestamptz;
  END IF;
END $$;

-- Add indexes for admin links
CREATE INDEX IF NOT EXISTS idx_company_profiles_admin_link ON company_profiles(admin_company_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_source ON company_profiles(data_source);

CREATE INDEX IF NOT EXISTS idx_products_admin_link ON products(admin_product_id);
CREATE INDEX IF NOT EXISTS idx_products_source ON products(data_source);

CREATE INDEX IF NOT EXISTS idx_product_variants_admin_link ON product_variants(admin_variant_id);

-- Comment for clarity
COMMENT ON COLUMN company_profiles.data_source IS 'Source of data: admin_seed, user_manual, or mixed';
COMMENT ON COLUMN company_profiles.is_overridden IS 'True if user has modified admin-seeded data';
COMMENT ON COLUMN company_profiles.last_synced_at IS 'Last time data was synced from admin master';

COMMENT ON COLUMN products.data_source IS 'Source of data: admin_seed, user_manual, or mixed';
COMMENT ON COLUMN products.is_overridden IS 'True if user has modified admin-seeded data';
COMMENT ON COLUMN products.last_synced_at IS 'Last time data was synced from admin master';