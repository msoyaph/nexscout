/*
  # Personal About Page System

  1. New Tables
    - `user_about_content`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `bio_headline` (text) - AI-generated headline
      - `bio_story` (text) - AI-generated personal story
      - `career_journey` (text) - Career background
      - `achievements` (jsonb) - Array of achievements
      - `social_profiles` (jsonb) - FB, LinkedIn, Instagram, etc.
      - `personality_traits` (jsonb) - AI-analyzed traits
      - `last_generated_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `company_products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `company_name` (text)
      - `company_description` (text)
      - `company_logo_url` (text)
      - `products` (jsonb) - Array of products
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ai_coach_recommendations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `recommendation_type` (text) - encouragement, challenge, growth_path, skill_focus
      - `title` (text)
      - `content` (text)
      - `current_level` (text) - newbie, rising_star, professional, top_earner
      - `target_level` (text)
      - `priority` (text) - low, medium, high
      - `action_items` (jsonb) - Specific action steps
      - `expires_at` (timestamptz)
      - `is_completed` (boolean)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

-- Create user_about_content table
CREATE TABLE IF NOT EXISTS user_about_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bio_headline text,
  bio_story text,
  career_journey text,
  achievements jsonb DEFAULT '[]'::jsonb,
  social_profiles jsonb DEFAULT '{}'::jsonb,
  personality_traits jsonb DEFAULT '[]'::jsonb,
  last_generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create company_products table
CREATE TABLE IF NOT EXISTS company_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  company_description text,
  company_logo_url text,
  products jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create ai_coach_recommendations table
CREATE TABLE IF NOT EXISTS ai_coach_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recommendation_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  current_level text NOT NULL DEFAULT 'newbie',
  target_level text,
  priority text NOT NULL DEFAULT 'medium',
  action_items jsonb DEFAULT '[]'::jsonb,
  expires_at timestamptz,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_about_content_user_id ON user_about_content(user_id);
CREATE INDEX IF NOT EXISTS idx_company_products_user_id ON company_products(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_recommendations_user_id ON ai_coach_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_recommendations_type ON ai_coach_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_ai_coach_recommendations_level ON ai_coach_recommendations(current_level);

-- Enable RLS
ALTER TABLE user_about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_about_content
CREATE POLICY "Users can view own about content"
  ON user_about_content
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own about content"
  ON user_about_content
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own about content"
  ON user_about_content
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for company_products
CREATE POLICY "Users can view own company products"
  ON company_products
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company products"
  ON company_products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company products"
  ON company_products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company products"
  ON company_products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ai_coach_recommendations
CREATE POLICY "Users can view own coach recommendations"
  ON ai_coach_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coach recommendations"
  ON ai_coach_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coach recommendations"
  ON ai_coach_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_about_content_updated_at ON user_about_content;
CREATE TRIGGER update_user_about_content_updated_at
  BEFORE UPDATE ON user_about_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_products_updated_at ON company_products;
CREATE TRIGGER update_company_products_updated_at
  BEFORE UPDATE ON company_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();