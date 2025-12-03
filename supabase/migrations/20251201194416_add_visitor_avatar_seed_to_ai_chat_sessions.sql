/*
  # Add visitor avatar seed to AI chat sessions

  1. Changes
    - Add `visitor_avatar_seed` text column to `ai_chat_sessions` table
    - Stores unique seed for generating consistent Gravatar-style avatars
    - Generated once per session for consistent visitor identity
    
  2. Purpose
    - Enable automatic unique avatar generation for chat visitors
    - Maintain consistent visual identity across all chat interfaces
    - Sync avatars between internal and public-facing chats
*/

-- Add visitor_avatar_seed column
ALTER TABLE ai_chat_sessions 
ADD COLUMN IF NOT EXISTS visitor_avatar_seed text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_avatar_seed 
ON ai_chat_sessions(visitor_avatar_seed);

-- Add comment
COMMENT ON COLUMN ai_chat_sessions.visitor_avatar_seed IS 'Unique seed for generating consistent Gravatar-style avatar for visitor';
