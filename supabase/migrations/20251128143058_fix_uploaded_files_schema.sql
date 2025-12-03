/*
  # Fix Uploaded Files Schema

  1. Purpose
    - Add user_id column for direct user ownership
    - Make batch_id nullable (not all files need batches)
    - Support both batch uploads and individual file uploads
  
  2. Changes
    - Add user_id column with foreign key
    - Make batch_id nullable
    - Add index for user queries
*/

-- Add user_id column
ALTER TABLE uploaded_files
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make batch_id nullable
ALTER TABLE uploaded_files
  ALTER COLUMN batch_id DROP NOT NULL;

-- Add index for user queries
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id 
  ON uploaded_files(user_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view own uploaded files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can insert own uploaded files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can update own uploaded files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can delete own uploaded files" ON uploaded_files;

CREATE POLICY "Users can view own uploaded files"
  ON uploaded_files FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR batch_id IN (SELECT id FROM uploaded_batches WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can insert own uploaded files"
  ON uploaded_files FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    OR batch_id IN (SELECT id FROM uploaded_batches WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can update own uploaded files"
  ON uploaded_files FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR batch_id IN (SELECT id FROM uploaded_batches WHERE user_id = (select auth.uid()))
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR batch_id IN (SELECT id FROM uploaded_batches WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can delete own uploaded files"
  ON uploaded_files FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR batch_id IN (SELECT id FROM uploaded_batches WHERE user_id = (select auth.uid()))
  );
