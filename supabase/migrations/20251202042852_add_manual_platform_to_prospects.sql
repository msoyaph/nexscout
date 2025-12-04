/*
  # Add 'manual' Platform to Prospects

  Allows prospects to be added manually through the UI.

  ## Changes
  
  1. Update platform check constraint to include 'manual'
  2. Ensure manually added prospects work correctly
  
  ## Security
  - Maintains existing RLS policies
*/

-- Drop the old constraint
ALTER TABLE public.prospects
DROP CONSTRAINT IF EXISTS prospects_platform_check;

-- Add new constraint with 'manual' included
ALTER TABLE public.prospects
ADD CONSTRAINT prospects_platform_check 
CHECK (platform = ANY (ARRAY[
  'facebook'::text, 
  'instagram'::text, 
  'tiktok'::text, 
  'linkedin'::text, 
  'twitter'::text, 
  'whatsapp'::text, 
  'messenger'::text, 
  'manual'::text,
  'other'::text
]));