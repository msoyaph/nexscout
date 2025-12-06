-- =====================================================
-- AI INSTRUCTIONS STORAGE BUCKETS
-- =====================================================
-- Purpose: Create storage buckets for rich editor media
-- Buckets: ai-instructions-assets, ai-instructions-docs
-- =====================================================

-- Create storage buckets if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('ai-instructions-assets', 'ai-instructions-assets', true),
  ('ai-instructions-docs', 'ai-instructions-docs', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage Policies - ai-instructions-assets
-- =====================================================

-- Allow authenticated users to upload their own assets
CREATE POLICY "Users can upload own AI instruction assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-instructions-assets' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow authenticated users to read their own assets
CREATE POLICY "Users can read own AI instruction assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ai-instructions-assets' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow authenticated users to update their own assets
CREATE POLICY "Users can update own AI instruction assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'ai-instructions-assets' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow authenticated users to delete their own assets
CREATE POLICY "Users can delete own AI instruction assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ai-instructions-assets' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- =====================================================
-- Storage Policies - ai-instructions-docs
-- =====================================================

-- Allow authenticated users to upload their own docs
CREATE POLICY "Users can upload own AI instruction docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-instructions-docs' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow authenticated users to read their own docs
CREATE POLICY "Users can read own AI instruction docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ai-instructions-docs' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow authenticated users to update their own docs
CREATE POLICY "Users can update own AI instruction docs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'ai-instructions-docs' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow authenticated users to delete their own docs
CREATE POLICY "Users can delete own AI instruction docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ai-instructions-docs' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- =====================================================
-- Super Admin Access
-- =====================================================

-- Super admins can view all assets
CREATE POLICY "Super admins can view all AI assets"
  ON storage.objects FOR SELECT
  USING (
    (bucket_id = 'ai-instructions-assets' OR bucket_id = 'ai-instructions-docs') AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON CONSTRAINT "Users can upload own AI instruction assets" ON storage.objects IS
  'Users can upload images (products, logos, catalogs) for AI instructions';

COMMENT ON CONSTRAINT "Users can upload own AI instruction docs" ON storage.objects IS
  'Users can upload files (brochures, PDFs, docs) for AI instructions';

-- =====================================================
-- Migration Complete
-- =====================================================

/*
Storage buckets created:
✅ ai-instructions-assets - For images (products, logos, catalogs)
✅ ai-instructions-docs - For files (brochures, PDFs, docs)

Policies:
✅ Users can upload/read/update/delete own files
✅ Files organized by user_id folders
✅ Super admins can view all
✅ Public read access for embedded images

File structure:
ai-instructions-assets/
  └── {user_id}/
      ├── product/
      │   ├── 1234567890.jpg
      │   └── 1234567891.png
      ├── logo/
      │   └── company-logo.png
      └── catalog/
          └── catalog-2024.pdf

ai-instructions-docs/
  └── {user_id}/
      ├── brochure/
      │   └── company-brochure.pdf
      └── doc/
          └── product-specs.pdf
*/




