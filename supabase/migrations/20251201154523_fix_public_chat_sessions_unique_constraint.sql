/*
  # Fix Public Chat Sessions - Remove Unique Constraint on session_slug
  
  ## Problem
  The `session_slug` column has a UNIQUE constraint, which causes errors when multiple visitors
  try to create sessions for the same chatbot. Each visitor needs their own unique session.
  
  ## Changes
  1. Drop the unique constraint on `session_slug`
  2. Add a unique constraint on `id` only (primary key already exists)
  3. `session_slug` will store the chatbot slug (e.g., "cddfbb98")
  4. Multiple sessions can have the same `session_slug` (one per visitor)
  
  ## Security
  - No changes to RLS policies needed
  - Sessions remain isolated by visitor
*/

-- Drop the unique constraint on session_slug
ALTER TABLE public_chat_sessions
DROP CONSTRAINT IF EXISTS public_chat_sessions_session_slug_key;

-- Add comment for clarity
COMMENT ON COLUMN public_chat_sessions.session_slug IS 
'The chatbot slug this session belongs to (e.g., cddfbb98). Multiple sessions can have the same slug.';
