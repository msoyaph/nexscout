/*
  # Fix RLS Auth Initialization - Batch 3

  1. Purpose
    - Fix ai_messages_library RLS policies
    - Replace auth.uid() with (select auth.uid())
  
  2. Tables Fixed
    - ai_messages_library (all 4 policies)
*/

-- Fix ai_messages_library policies
DROP POLICY IF EXISTS "Users can view own AI messages" ON ai_messages_library;
DROP POLICY IF EXISTS "Users can insert own AI messages" ON ai_messages_library;
DROP POLICY IF EXISTS "Users can update own AI messages" ON ai_messages_library;
DROP POLICY IF EXISTS "Users can delete own AI messages" ON ai_messages_library;

CREATE POLICY "Users can view own AI messages"
  ON ai_messages_library FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own AI messages"
  ON ai_messages_library FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own AI messages"
  ON ai_messages_library FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own AI messages"
  ON ai_messages_library FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));
