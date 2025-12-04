/*
  # Add Prospect Linking to Chat Sessions

  1. Changes
    - Add `prospect_id` column to public_chat_sessions
    - Create `chat_session_prospects` link table
    - Add indexes for performance
    - Add RLS policies

  2. Purpose
    - Enable automatic prospect creation from qualified chat conversations
    - Track which prospects came from which chat sessions
    - Support prospect updates from multiple chat interactions

  3. Security
    - Users can only link their own chat sessions
    - Prospect linkage respects existing RLS on prospects table
*/

-- Add prospect_id to public_chat_sessions
ALTER TABLE public_chat_sessions
ADD COLUMN IF NOT EXISTS prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL;

-- Create index for prospect lookup
CREATE INDEX IF NOT EXISTS idx_public_chat_sessions_prospect_id 
ON public_chat_sessions(prospect_id) WHERE prospect_id IS NOT NULL;

-- Create chat_session_prospects link table
CREATE TABLE IF NOT EXISTS chat_session_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id uuid NOT NULL REFERENCES public_chat_sessions(id) ON DELETE CASCADE,
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(chat_session_id, prospect_id)
);

-- Enable RLS
ALTER TABLE chat_session_prospects ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_session_prospects_chat_session_id 
ON chat_session_prospects(chat_session_id);

CREATE INDEX IF NOT EXISTS idx_chat_session_prospects_prospect_id 
ON chat_session_prospects(prospect_id);

-- RLS Policies for chat_session_prospects
CREATE POLICY "Users can view their own chat-prospect links"
  ON chat_session_prospects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public_chat_sessions
      WHERE public_chat_sessions.id = chat_session_prospects.chat_session_id
      AND public_chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chat-prospect links for their sessions"
  ON chat_session_prospects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public_chat_sessions
      WHERE public_chat_sessions.id = chat_session_prospects.chat_session_id
      AND public_chat_sessions.user_id = auth.uid()
    )
  );

-- Add columns to prospects table for chat tracking
ALTER TABLE prospects
ADD COLUMN IF NOT EXISTS buying_intent_score integer DEFAULT 0 CHECK (buying_intent_score >= 0 AND buying_intent_score <= 100),
ADD COLUMN IF NOT EXISTS lead_temperature text DEFAULT 'cold' CHECK (lead_temperature IN ('cold', 'warm', 'hot', 'readyToBuy')),
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_prospects_metadata ON prospects USING gin(metadata);

-- Add comment
COMMENT ON COLUMN public_chat_sessions.prospect_id IS 'Links chat session to prospect record when visitor qualifies as lead';
COMMENT ON TABLE chat_session_prospects IS 'Tracks relationship between chat sessions and prospects for multi-touch attribution';
