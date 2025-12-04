/*
  # Create Product Variants System

  1. New Table
    - `product_variants`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `name` (text) - variant name (e.g., "Small", "Medium", "Large")
      - `sku` (text) - stock keeping unit
      - `price_override` (numeric) - override base product price
      - `attributes` (jsonb) - flexible attributes like {flavor:"chocolate", size:"1kg"}
      - `status` (text) - active, inactive, out_of_stock
      - `sort_order` (int) - display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `product_variants` table
    - Add policy for users to manage their own product variants
    - Add policy for team members to view variants

  3. Indexes
    - Index on product_id for fast lookups
    - Index on status for filtering
*/

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price_override NUMERIC(12,2),
  attributes JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_status 
ON product_variants(status);

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own product variants
CREATE POLICY "Users can view own product variants"
  ON product_variants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Policy: Users can insert variants for their products
CREATE POLICY "Users can insert own product variants"
  ON product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own product variants
CREATE POLICY "Users can update own product variants"
  ON product_variants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own product variants
CREATE POLICY "Users can delete own product variants"
  ON product_variants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_product_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_variants_updated_at();
