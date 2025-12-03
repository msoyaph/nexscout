/*
  # Add Contact Fields to Prospects Table

  Add fields for manually entered prospect information.

  ## New Columns
  - email: Email address for contact
  - phone: Phone number for contact
  - company: Company/organization name
  - position: Job title or position

  ## Security
  RLS policies already exist for prospects table.
*/

-- Add email column
ALTER TABLE public.prospects
ADD COLUMN IF NOT EXISTS email text;

-- Add phone column
ALTER TABLE public.prospects
ADD COLUMN IF NOT EXISTS phone text;

-- Add company column
ALTER TABLE public.prospects
ADD COLUMN IF NOT EXISTS company text;

-- Add position column
ALTER TABLE public.prospects
ADD COLUMN IF NOT EXISTS position text;

-- Create indexes for searching
CREATE INDEX IF NOT EXISTS idx_prospects_email ON public.prospects(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospects_company ON public.prospects(company) WHERE company IS NOT NULL;