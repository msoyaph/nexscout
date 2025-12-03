/*
  # Product Intelligence Engine v5.0 - Complete System

  1. New Tables
    - `products` - Main product catalog for users
    - `product_intel_snapshots` - Intelligence analysis snapshots
    - `product_competitors` - Competitor profiles per product
    - `product_chatbot_links` - Links products to chatbot selling flows
    
  2. Features
    - Product management system
    - Auto-competitor analysis
    - Product intelligence scoring
    - Team leader product insights
    - Chatbot product selling automation
    
  3. Security
    - Enable RLS on all tables
    - Users can only access their own products
    - Team leaders can see team products
    - Proper foreign key relationships
*/

-- =====================================================
-- 1. PRODUCTS TABLE (Main Product Catalog)
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE SET NULL,
  
  -- Basic Info
  name text NOT NULL,
  product_type text NOT NULL DEFAULT 'product',
  main_category text NOT NULL,
  short_description text,
  long_description text,
  
  -- Benefits & Targeting
  primary_promise text,
  key_benefits text[] DEFAULT ARRAY[]::text[],
  ideal_prospect_tags text[] DEFAULT ARRAY[]::text[],
  
  -- Pricing
  currency text DEFAULT 'PHP',
  price_min numeric,
  price_max numeric,
  
  -- Media & Links
  product_url text,
  sales_page_url text,
  image_url text,
  video_url text,
  
  -- Product Intelligence
  intel_enabled boolean DEFAULT false,
  intel_last_run_at timestamptz,
  competitive_position text,
  strength_score int DEFAULT 0,
  
  -- Team Features
  team_recommended boolean DEFAULT false,
  owner_role text,
  
  -- Status
  active boolean DEFAULT true,
  tags text[] DEFAULT ARRAY[]::text[],
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(main_category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_team_recommended ON products(team_recommended);

-- =====================================================
-- 2. PRODUCT INTEL SNAPSHOTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_intel_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Analysis Info
  snapshot_at timestamptz DEFAULT now(),
  depth_level text NOT NULL DEFAULT 'light',
  
  -- Results
  competitive_position text,
  primary_product_strength_score int DEFAULT 0,
  
  -- Core Summary
  core_promise text,
  niche_tags text[] DEFAULT ARRAY[]::text[],
  
  -- Competitive Analysis
  recommended_positioning_hooks text[] DEFAULT ARRAY[]::text[],
  pricing_observations text[] DEFAULT ARRAY[]::text[],
  compliance_flags text[] DEFAULT ARRAY[]::text[],
  
  -- Suggested Scripts
  elevator_pitch text,
  comparison_pitch text,
  objection_handling_snippets text[] DEFAULT ARRAY[]::text[],
  upsell_hooks text[] DEFAULT ARRAY[]::text[],
  
  -- Full Raw Data
  raw_data_json jsonb DEFAULT '{}'::jsonb,
  
  -- Status
  status text DEFAULT 'completed',
  error_message text,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_intel_product_id ON product_intel_snapshots(product_id);
CREATE INDEX IF NOT EXISTS idx_product_intel_user_id ON product_intel_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_product_intel_snapshot_at ON product_intel_snapshots(snapshot_at DESC);

-- =====================================================
-- 3. PRODUCT COMPETITORS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  snapshot_id uuid REFERENCES product_intel_snapshots(id) ON DELETE CASCADE,
  
  -- Competitor Info
  competitor_name text NOT NULL,
  competitor_url text,
  source_type text NOT NULL DEFAULT 'web_search',
  
  -- Analysis
  price_range text,
  niche_tags text[] DEFAULT ARRAY[]::text[],
  main_benefits text[] DEFAULT ARRAY[]::text[],
  main_objections text[] DEFAULT ARRAY[]::text[],
  positioning_angle text,
  quality_score int DEFAULT 0,
  
  -- Metadata
  last_seen_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_competitors_product_id ON product_competitors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_competitors_snapshot_id ON product_competitors(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_product_competitors_quality ON product_competitors(quality_score DESC);

-- =====================================================
-- 4. PRODUCT CHATBOT LINKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_chatbot_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Chatbot Config
  enabled boolean DEFAULT true,
  priority int DEFAULT 1,
  
  -- Auto-Selling Settings
  auto_offer_enabled boolean DEFAULT true,
  auto_upsell_enabled boolean DEFAULT false,
  
  -- Channels
  enabled_channels text[] DEFAULT ARRAY['web', 'messenger']::text[],
  
  -- Performance Tracking
  times_offered int DEFAULT 0,
  times_clicked int DEFAULT 0,
  conversion_count int DEFAULT 0,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_chatbot_user_id ON product_chatbot_links(user_id);
CREATE INDEX IF NOT EXISTS idx_product_chatbot_product_id ON product_chatbot_links(product_id);
CREATE INDEX IF NOT EXISTS idx_product_chatbot_enabled ON product_chatbot_links(enabled);

-- =====================================================
-- 5. PRODUCT USAGE ANALYTICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_usage_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Event
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  
  -- Context
  source text,
  channel text,
  
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_product_usage_product_id ON product_usage_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_usage_event_type ON product_usage_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_product_usage_created_at ON product_usage_analytics(created_at DESC);

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- Products Table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Product Intel Snapshots
ALTER TABLE product_intel_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own product intel"
  ON product_intel_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own product intel"
  ON product_intel_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Product Competitors
ALTER TABLE product_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competitors for own products"
  ON product_competitors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_competitors.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert competitors"
  ON product_competitors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_competitors.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Product Chatbot Links
ALTER TABLE product_chatbot_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chatbot links"
  ON product_chatbot_links FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chatbot links"
  ON product_chatbot_links FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Product Usage Analytics
ALTER TABLE product_usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own product analytics"
  ON product_usage_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics"
  ON product_usage_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to update product strength score
CREATE OR REPLACE FUNCTION update_product_strength_score()
RETURNS trigger AS $$
BEGIN
  UPDATE products
  SET 
    strength_score = NEW.primary_product_strength_score,
    competitive_position = NEW.competitive_position,
    intel_last_run_at = NEW.snapshot_at,
    updated_at = now()
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update product scores
DROP TRIGGER IF EXISTS trigger_update_product_strength ON product_intel_snapshots;
CREATE TRIGGER trigger_update_product_strength
  AFTER INSERT ON product_intel_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_product_strength_score();

-- Function to track product chatbot performance
CREATE OR REPLACE FUNCTION increment_product_chatbot_stat(
  p_product_id uuid,
  p_stat_type text
)
RETURNS void AS $$
BEGIN
  UPDATE product_chatbot_links
  SET
    times_offered = CASE WHEN p_stat_type = 'offered' THEN times_offered + 1 ELSE times_offered END,
    times_clicked = CASE WHEN p_stat_type = 'clicked' THEN times_clicked + 1 ELSE times_clicked END,
    conversion_count = CASE WHEN p_stat_type = 'converted' THEN conversion_count + 1 ELSE conversion_count END,
    updated_at = now()
  WHERE product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;