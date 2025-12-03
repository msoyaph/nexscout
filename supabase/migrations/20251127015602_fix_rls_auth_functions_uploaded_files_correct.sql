/*
  # Fix RLS Auth Functions - uploaded_files

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid())
    - Prevents re-evaluation for each row
    - Uses proper JOIN through batch_id

  2. Tables Fixed
    - uploaded_files (4 policies)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create own files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can delete own files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can update own files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can view own files" ON public.uploaded_files;

-- Recreate with optimized auth function calls
CREATE POLICY "Users can create own files"
  ON public.uploaded_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own files"
  ON public.uploaded_files
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own files"
  ON public.uploaded_files
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can view own files"
  ON public.uploaded_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = (select auth.uid())
    )
  );
