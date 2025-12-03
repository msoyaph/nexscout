/*
  # Create Product Recommendations and Analytics System

  1. New Tables
    - `product_recommendations`
      - Stores auto-matched products for prospects
      - Includes match score and reasoning
      - Tracks recommendation status
    
    - `product_analytics_events`
      - Tracks all product-related events
      - Views, offers, clicks, conversions
      - For analytics and optimization

  2. Security
    - Enable RLS on both tables
    - Users can only see their own data
    - Proper indexing for performance

  3. Performance
    - Indexes on foreign keys
    - Indexes on frequently queried fields
    - Composite indexes for common queries
*/

-- Create product_recommendations table
CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  confidence_level TEXT NOT NULL DEFAULT 'medium',
  match_reasons JSONB DEFAULT '[]'::jsonb,
  persona_match TEXT,
  pain_points_matched JSONB DEFAULT '[]'::jsonb,
  benefits_aligned JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  offered_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create product_analytics_events table
CREATE TABLE IF NOT EXISTS product_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  channel TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for product_recommendations
CREATE INDEX IF NOT EXISTS idx_product_recommendations_prospect 
ON product_recommendations(prospect_id);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_product 
ON product_recommendations(product_id);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_user 
ON product_recommendations(user_id);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_score 
ON product_recommendations(match_score DESC);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_status 
ON product_recommendations(status);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_composite 
ON product_recommendations(user_id, prospect_id, status);

-- Add indexes for product_analytics_events
CREATE INDEX IF NOT EXISTS idx_product_analytics_user 
ON product_analytics_events(user_id);

CREATE INDEX IF NOT EXISTS idx_product_analytics_product 
ON product_analytics_events(product_id);

CREATE INDEX IF NOT EXISTS idx_product_analytics_prospect 
ON product_analytics_events(prospect_id);

CREATE INDEX IF NOT EXISTS idx_product_analytics_type 
ON product_analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_product_analytics_category 
ON product_analytics_events(event_category);

CREATE INDEX IF NOT EXISTS idx_product_analytics_created 
ON product_analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_analytics_composite 
ON product_analytics_events(user_id, event_category, created_at DESC);

-- Enable RLS
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies for product_recommendations
CREATE POLICY "Users can view own recommendations"
  ON product_recommendations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recommendations"
  ON product_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recommendations"
  ON product_recommendations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own recommendations"
  ON product_recommendations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for product_analytics_events
CREATE POLICY "Users can view own analytics"
  ON product_analytics_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own analytics"
  ON product_analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_product_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER update_product_recommendations_updated_at
  BEFORE UPDATE ON product_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_product_recommendations_updated_at();
