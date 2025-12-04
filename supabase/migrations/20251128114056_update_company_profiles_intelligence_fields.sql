/*
  # Update Company Profiles for Intelligence Engine
  
  1. Changes
    - Add missing intelligence fields to company_profiles table
    - Add columns for AI-generated content
    - Ensure compatibility with enrich-company-data function
    
  2. New Fields
    - website (text) - Company website URL
    - description (text) - Company description
    - tagline (text) - Company tagline
    - employee_count (text) - Employee count range
    - logo_url (text) - Company logo URL
    - ai_generated_description (text) - AI-enhanced description
    - share_token (text) - Public sharing token
*/

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_profiles' AND column_name = 'website'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN website text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_profiles' AND column_name = 'description'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_profiles' AND column_name = 'tagline'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN tagline text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_profiles' AND column_name = 'employee_count'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN employee_count text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_profiles' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN logo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_profiles' AND column_name = 'ai_generated_description'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN ai_generated_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_profiles' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN share_token text UNIQUE;
  END IF;
END $$;

-- Create index on share_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_company_profiles_share_token 
ON company_profiles(share_token) 
WHERE share_token IS NOT NULL;