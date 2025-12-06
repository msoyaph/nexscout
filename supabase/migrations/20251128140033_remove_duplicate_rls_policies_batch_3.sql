/*
  # Remove Duplicate RLS Policies - Batch 3

  1. Purpose
    - Continue removing duplicate RLS policies
  
  2. Tables Fixed
    - extracted_entities
    - library_groups
    - linkedin_page_insights
    - pitch_decks
*/

-- Fix extracted_entities (keep newer policy names)
DROP POLICY IF EXISTS "Users can view own entities" ON extracted_entities;
DROP POLICY IF EXISTS "Users can create own entities" ON extracted_entities;
DROP POLICY IF EXISTS "Users can update own entities" ON extracted_entities;
DROP POLICY IF EXISTS "Users can delete own entities" ON extracted_entities;

-- Fix library_groups (keep newer policy names)
DROP POLICY IF EXISTS "Users can view own groups" ON library_groups;
DROP POLICY IF EXISTS "Users can create own groups" ON library_groups;
DROP POLICY IF EXISTS "Users can update own groups" ON library_groups;
DROP POLICY IF EXISTS "Users can delete own groups" ON library_groups;

-- Fix linkedin_page_insights (keep one)
DROP POLICY IF EXISTS "Users can read own LinkedIn insights" ON linkedin_page_insights;

-- Fix pitch_decks (combine into one policy with OR)
DROP POLICY IF EXISTS "Anyone can view public pitch decks" ON pitch_decks;
CREATE POLICY "Anyone can view public pitch decks"
  ON pitch_decks FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = (select auth.uid()));
