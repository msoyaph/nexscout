/*
  # Add Sharing and Grouping Features to Library

  1. Updates
    - Add is_public column to pitch_decks
    - Add share_token column to pitch_decks
    - Add is_public column to ai_message_sequences
    - Add share_token column to ai_message_sequences
    - Add group_id column for organizing items

  2. New Tables
    - library_groups: For organizing decks and sequences into groups

  3. Purpose
    - Enable public/private sharing of pitch decks and message sequences
    - Allow users to organize their library items into custom groups
*/

-- Add sharing fields to pitch_decks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN share_token TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN group_id UUID;
  END IF;
END $$;

-- Add sharing fields to ai_message_sequences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_message_sequences' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE ai_message_sequences ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_message_sequences' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE ai_message_sequences ADD COLUMN share_token TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_message_sequences' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE ai_message_sequences ADD COLUMN group_id UUID;
  END IF;
END $$;

-- Add 'generating' status to pitch_decks if not exists
DO $$
BEGIN
  ALTER TABLE pitch_decks DROP CONSTRAINT IF EXISTS pitch_decks_status_check;
  ALTER TABLE pitch_decks ADD CONSTRAINT pitch_decks_status_check 
    CHECK (status IN ('draft', 'completed', 'archived', 'generating'));
END $$;

-- Add 'generating' status to ai_message_sequences if not exists
DO $$
BEGIN
  ALTER TABLE ai_message_sequences DROP CONSTRAINT IF EXISTS ai_message_sequences_status_check;
  ALTER TABLE ai_message_sequences ADD CONSTRAINT ai_message_sequences_status_check 
    CHECK (status IN ('draft', 'active', 'completed', 'archived', 'generating'));
END $$;

-- Create library_groups table
CREATE TABLE IF NOT EXISTS library_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pitch_deck', 'message_sequence')),
  color TEXT DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on library_groups
ALTER TABLE library_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for library_groups
CREATE POLICY "Users can view own groups"
  ON library_groups
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own groups"
  ON library_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own groups"
  ON library_groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own groups"
  ON library_groups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pitch_decks_share_token ON pitch_decks(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pitch_decks_group_id ON pitch_decks(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_message_sequences_share_token ON ai_message_sequences(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_message_sequences_group_id ON ai_message_sequences(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_library_groups_user_id ON library_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_library_groups_type ON library_groups(type);

-- Add public viewing policy for shared pitch decks
CREATE POLICY "Anyone can view public pitch decks"
  ON pitch_decks
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Add public viewing policy for shared message sequences
CREATE POLICY "Anyone can view public message sequences"
  ON ai_message_sequences
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);