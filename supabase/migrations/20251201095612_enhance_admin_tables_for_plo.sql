/*
  # Enhance Admin Tables for Product-Led Onboarding

  1. Add Missing Fields
    - admin_companies: brand_personality, target_market, is_featured
    - admin_products: product_type, main_category, primary_promise, key_benefits, pain_points_solved, price_min, price_max, product_url, sales_page_url, image_url, video_url, is_featured
    - admin_product_variants: sku, objection_responses, attributes, sort_order, used_by_count
    
  2. Updates
    - Ensure all tables have proper indexes
    - Add full-text search capabilities
*/

-- Enhance admin_companies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_companies' AND column_name = 'brand_personality') THEN
    ALTER TABLE admin_companies ADD COLUMN brand_personality text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_companies' AND column_name = 'target_market') THEN
    ALTER TABLE admin_companies ADD COLUMN target_market text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_companies' AND column_name = 'is_featured') THEN
    ALTER TABLE admin_companies ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

-- Enhance admin_products
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'product_type') THEN
    ALTER TABLE admin_products ADD COLUMN product_type text DEFAULT 'product';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'main_category') THEN
    ALTER TABLE admin_products ADD COLUMN main_category text DEFAULT 'other';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'primary_promise') THEN
    ALTER TABLE admin_products ADD COLUMN primary_promise text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'key_benefits') THEN
    ALTER TABLE admin_products ADD COLUMN key_benefits text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'pain_points_solved') THEN
    ALTER TABLE admin_products ADD COLUMN pain_points_solved text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'price_min') THEN
    ALTER TABLE admin_products ADD COLUMN price_min numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'price_max') THEN
    ALTER TABLE admin_products ADD COLUMN price_max numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'currency') THEN
    ALTER TABLE admin_products ADD COLUMN currency text DEFAULT 'PHP';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'product_url') THEN
    ALTER TABLE admin_products ADD COLUMN product_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'sales_page_url') THEN
    ALTER TABLE admin_products ADD COLUMN sales_page_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'image_url') THEN
    ALTER TABLE admin_products ADD COLUMN image_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'video_url') THEN
    ALTER TABLE admin_products ADD COLUMN video_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_products' AND column_name = 'is_featured') THEN
    ALTER TABLE admin_products ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

-- Enhance admin_product_variants
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_product_variants' AND column_name = 'sku') THEN
    ALTER TABLE admin_product_variants ADD COLUMN sku text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_product_variants' AND column_name = 'objection_responses') THEN
    ALTER TABLE admin_product_variants ADD COLUMN objection_responses text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_product_variants' AND column_name = 'attributes') THEN
    ALTER TABLE admin_product_variants ADD COLUMN attributes jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_product_variants' AND column_name = 'sort_order') THEN
    ALTER TABLE admin_product_variants ADD COLUMN sort_order integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_product_variants' AND column_name = 'used_by_count') THEN
    ALTER TABLE admin_product_variants ADD COLUMN used_by_count integer DEFAULT 0;
  END IF;
END $$;

-- Add search indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_admin_companies_search 
  ON admin_companies USING gin(to_tsvector('english', name || ' ' || COALESCE(short_description, '')));

CREATE INDEX IF NOT EXISTS idx_admin_products_search 
  ON admin_products USING gin(to_tsvector('english', name || ' ' || COALESCE(short_description, '')));

CREATE INDEX IF NOT EXISTS idx_admin_companies_featured 
  ON admin_companies(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_admin_products_featured 
  ON admin_products(is_featured) WHERE is_featured = true;