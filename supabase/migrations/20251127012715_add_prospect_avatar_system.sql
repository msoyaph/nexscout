/*
  # Add Prospect Avatar System

  1. New Columns
    - `avatar_seed` (text) - Deterministic seed for Dicebear avatars
    - `social_image_url` (text) - URL from social media (FB, LinkedIn, IG)
    - `uploaded_image_url` (text) - User-uploaded photo URL from Supabase Storage

  2. Avatar Resolution Priority
    1. uploaded_image_url (highest priority)
    2. social_image_url
    3. Generated Dicebear avatar using avatar_seed
    4. App-wide fallback

  3. Storage
    - Creates a storage bucket for prospect photos
    - Public read access for avatars
*/

-- Add avatar columns to prospects table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prospects' AND column_name = 'avatar_seed'
  ) THEN
    ALTER TABLE prospects ADD COLUMN avatar_seed text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prospects' AND column_name = 'social_image_url'
  ) THEN
    ALTER TABLE prospects ADD COLUMN social_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prospects' AND column_name = 'uploaded_image_url'
  ) THEN
    ALTER TABLE prospects ADD COLUMN uploaded_image_url text;
  END IF;
END $$;

-- Create index on avatar_seed for quick lookups
CREATE INDEX IF NOT EXISTS idx_prospects_avatar_seed ON prospects(avatar_seed) WHERE avatar_seed IS NOT NULL;

-- Function to generate avatar seed from name
CREATE OR REPLACE FUNCTION generate_avatar_seed(name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Generate deterministic seed from name using md5 hash (first 16 chars)
  RETURN substring(md5(lower(trim(name))), 1, 16);
END;
$$;

-- Trigger to auto-generate avatar_seed if not provided
CREATE OR REPLACE FUNCTION set_avatar_seed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If avatar_seed is null and full_name exists, generate seed
  IF NEW.avatar_seed IS NULL AND NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN
    NEW.avatar_seed := generate_avatar_seed(NEW.full_name);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new prospects
DROP TRIGGER IF EXISTS trigger_set_avatar_seed ON prospects;
CREATE TRIGGER trigger_set_avatar_seed
  BEFORE INSERT OR UPDATE OF full_name
  ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION set_avatar_seed();

-- Backfill avatar_seed for existing prospects without one
UPDATE prospects
SET avatar_seed = generate_avatar_seed(full_name)
WHERE avatar_seed IS NULL 
  AND full_name IS NOT NULL 
  AND full_name != '';

-- Create storage bucket for prospect photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('prospect-photos', 'prospect-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can upload to their own prospect photos
DROP POLICY IF EXISTS "Users can upload prospect photos" ON storage.objects;
CREATE POLICY "Users can upload prospect photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prospect-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Anyone can view prospect photos (public bucket)
DROP POLICY IF EXISTS "Public can view prospect photos" ON storage.objects;
CREATE POLICY "Public can view prospect photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'prospect-photos');

-- Storage policy: Users can update their own prospect photos
DROP POLICY IF EXISTS "Users can update prospect photos" ON storage.objects;
CREATE POLICY "Users can update prospect photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prospect-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'prospect-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Users can delete their own prospect photos
DROP POLICY IF EXISTS "Users can delete prospect photos" ON storage.objects;
CREATE POLICY "Users can delete prospect photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prospect-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
