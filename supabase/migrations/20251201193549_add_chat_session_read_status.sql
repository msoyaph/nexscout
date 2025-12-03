/*
  # Add read/unread status to chat sessions

  1. Changes
    - Add `is_read` boolean column to `public_chat_sessions` table
    - Defaults to false (unread)
    - Add index for faster filtering of unread sessions
    
  2. Purpose
    - Track which chat sessions have been viewed by the user
    - Enable visual distinction between read/unread messages
    - Update notification counts when messages are marked as read
*/

-- Add is_read column
ALTER TABLE public_chat_sessions 
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Add index for faster queries on unread sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_read 
ON public_chat_sessions(user_id, is_read, last_message_at DESC);

-- Add comment
COMMENT ON COLUMN public_chat_sessions.is_read IS 'Whether the user has viewed this chat session';
