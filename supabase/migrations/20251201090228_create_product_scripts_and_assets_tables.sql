/*
  # Create Product Scripts and Assets Tables for Wizard v3

  1. New Tables
    - `product_scripts`
      - Stores AI-generated persona-based selling scripts
      - Links to products and personas
      - Tracks script performance
    
    - `product_assets`
      - Stores product images, PDFs, videos, documents
      - Supports multiple asset types
      - Tags and labels for organization

  2. Updates to products table
    - Add persona and messaging fields
    - Add completion tracking

  3. Security
    - Enable RLS on both tables
    - Users can only manage their own product data
    - Proper indexing for performance

  4. Performance
    - Indexes on foreign keys
    - Indexes on frequently queried fields
*/

-- Add new columns to products table for wizard v3
DO $$
BEGIN
  -- Personas (JSONB array of target personas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'personas'
  ) THEN
    ALTER TABLE products ADD COLUMN personas JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Pain points (JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'pains'
  ) THEN
    ALTER TABLE products ADD COLUMN pains JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Desires (JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'desires'
  ) THEN
    ALTER TABLE products ADD COLUMN desires JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Objections (JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'objections'
  ) THEN
    ALTER TABLE products ADD COLUMN objections JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Short tagline
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'short_tagline'
  ) THEN
    ALTER TABLE products ADD COLUMN short_tagline TEXT;
  END IF;

  -- Base price (separate from min/max range)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'base_price'
  ) THEN
    ALTER TABLE products ADD COLUMN base_price NUMERIC(12,2);
  END IF;

  -- Completion status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_complete'
  ) THEN
    ALTER TABLE products ADD COLUMN is_complete BOOLEAN DEFAULT false;
  END IF;

  -- Wizard step tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'wizard_step'
  ) THEN
    ALTER TABLE products ADD COLUMN wizard_step INTEGER DEFAULT 1;
  END IF;
END $$;

-- Create product_scripts table
CREATE TABLE IF NOT EXISTS product_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  persona TEXT NOT NULL,
  script_type TEXT DEFAULT 'full_pitch',
  script_content TEXT NOT NULL,
  icebreaker TEXT,
  pain_trigger TEXT,
  benefit_punchline TEXT,
  objection_handler TEXT,
  close_attempt TEXT,
  cta TEXT,
  ai_generated BOOLEAN DEFAULT true,
  performance_score NUMERIC(5,2) DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create product_assets table
CREATE TABLE IF NOT EXISTS product_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  asset_url TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  label TEXT,
  description TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_scripts_product_id 
ON product_scripts(product_id);

CREATE INDEX IF NOT EXISTS idx_product_scripts_persona 
ON product_scripts(persona);

CREATE INDEX IF NOT EXISTS idx_product_scripts_performance 
ON product_scripts(performance_score DESC);

CREATE INDEX IF NOT EXISTS idx_product_assets_product_id 
ON product_assets(product_id);

CREATE INDEX IF NOT EXISTS idx_product_assets_type 
ON product_assets(asset_type);

CREATE INDEX IF NOT EXISTS idx_product_assets_primary 
ON product_assets(is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE product_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_assets ENABLE ROW LEVEL SECURITY;

-- Policies for product_scripts
CREATE POLICY "Users can view own product scripts"
  ON product_scripts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_scripts.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own product scripts"
  ON product_scripts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_scripts.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own product scripts"
  ON product_scripts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_scripts.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_scripts.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own product scripts"
  ON product_scripts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_scripts.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Policies for product_assets
CREATE POLICY "Users can view own product assets"
  ON product_assets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_assets.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own product assets"
  ON product_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_assets.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own product assets"
  ON product_assets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_assets.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_assets.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own product assets"
  ON product_assets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_assets.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_product_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER update_product_scripts_updated_at
  BEFORE UPDATE ON product_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_product_scripts_updated_at();

CREATE OR REPLACE FUNCTION update_product_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER update_product_assets_updated_at
  BEFORE UPDATE ON product_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_product_assets_updated_at();
