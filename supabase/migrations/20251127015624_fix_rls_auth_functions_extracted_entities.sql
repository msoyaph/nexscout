/*
  # Fix RLS Auth Functions - extracted_entities

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid())
    - Prevents re-evaluation for each row

  2. Tables Fixed
    - extracted_entities (4 policies)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create own entities" ON public.extracted_entities;
DROP POLICY IF EXISTS "Users can delete own entities" ON public.extracted_entities;
DROP POLICY IF EXISTS "Users can update own entities" ON public.extracted_entities;
DROP POLICY IF EXISTS "Users can view own entities" ON public.extracted_entities;

-- Recreate with optimized auth function calls
CREATE POLICY "Users can create own entities"
  ON public.extracted_entities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own entities"
  ON public.extracted_entities
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own entities"
  ON public.extracted_entities
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can view own entities"
  ON public.extracted_entities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = (select auth.uid())
    )
  );
