/*
  # Company Profiles Table

  1. New Tables
    - `company_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company_name` (text, required)
      - `company_domain` (text)
      - `company_description` (text)
      - `industry` (text)
      - `company_size` (text)
      - `founded_year` (integer)
      - `location` (text)
      - `products` (jsonb) - Array of product/service info
      - `faqs` (jsonb) - Array of FAQ items
      - `value_propositions` (jsonb) - Key selling points
      - `target_audience` (text)
      - `company_logo_url` (text)
      - `website_content` (text) - Extracted website data
      - `social_media` (jsonb) - Social media links
      - `ai_enriched_at` (timestamptz) - When AI last updated the data
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `company_profiles` table
    - Add policy for users to read their own company data
    - Add policy for users to update their own company data
    - Add policy for users to insert their own company data

  3. Indexes
    - Index on user_id for fast lookups
    - Index on company_domain for company matching
*/

-- Create company_profiles table
CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  company_domain text,
  company_description text,
  industry text,
  company_size text,
  founded_year integer,
  location text,
  products jsonb DEFAULT '[]'::jsonb,
  faqs jsonb DEFAULT '[]'::jsonb,
  value_propositions jsonb DEFAULT '[]'::jsonb,
  target_audience text,
  company_logo_url text,
  website_content text,
  social_media jsonb DEFAULT '{}'::jsonb,
  ai_enriched_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS company_profiles_user_id_idx ON company_profiles(user_id);
CREATE INDEX IF NOT EXISTS company_profiles_domain_idx ON company_profiles(company_domain);

-- Enable RLS
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for company_profiles
CREATE POLICY "Users can view own company data"
  ON company_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company data"
  ON company_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company data"
  ON company_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company data"
  ON company_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_company_profiles_updated_at_trigger ON company_profiles;
CREATE TRIGGER update_company_profiles_updated_at_trigger
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_company_profiles_updated_at();
