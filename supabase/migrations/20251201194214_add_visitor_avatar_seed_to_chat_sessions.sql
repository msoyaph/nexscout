/*
  # Add visitor avatar seed to public chat sessions

  1. Changes
    - Add `visitor_avatar_seed` text column to `public_chat_sessions` table
    - Stores unique seed for generating consistent Gravatar-style avatars
    - Generated once per session for consistent visitor identity
    
  2. Purpose
    - Enable automatic unique avatar generation for anonymous visitors
    - Maintain consistent visual identity across chat interface
    - Sync avatars between chat list and message views
*/

-- Add visitor_avatar_seed column
ALTER TABLE public_chat_sessions 
ADD COLUMN IF NOT EXISTS visitor_avatar_seed text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_avatar_seed 
ON public_chat_sessions(visitor_avatar_seed);

-- Add comment
COMMENT ON COLUMN public_chat_sessions.visitor_avatar_seed IS 'Unique seed for generating consistent Gravatar-style avatar for visitor';
