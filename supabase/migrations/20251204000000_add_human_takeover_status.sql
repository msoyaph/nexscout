/*
  # Add 'human_takeover' Status to Chat Sessions
  
  Adds 'human_takeover' as a valid status value for public_chat_sessions
  to support AI pause/resume functionality where humans can take over conversations.
  
  This status indicates:
  - AI chatbot is paused for this session
  - Human is in control
  - Status persists indefinitely until manually resumed
  - Survives page refreshes, logout/login, server restarts
*/

-- Drop the existing constraint
ALTER TABLE public_chat_sessions
  DROP CONSTRAINT IF EXISTS public_chat_sessions_status_check;

-- Add the new constraint with 'human_takeover' included
ALTER TABLE public_chat_sessions
  ADD CONSTRAINT public_chat_sessions_status_check
  CHECK (status IN ('active', 'archived', 'converted', 'abandoned', 'human_takeover'));

-- Create index for filtering by human_takeover status
CREATE INDEX IF NOT EXISTS idx_chat_sessions_human_takeover
  ON public_chat_sessions(user_id, status)
  WHERE status = 'human_takeover';

-- Comment for documentation
COMMENT ON COLUMN public_chat_sessions.status IS 'Session status: active (AI responding), human_takeover (AI paused, human control), archived, converted (to prospect), abandoned';

  # Add 'human_takeover' Status to Chat Sessions
  
  Adds 'human_takeover' as a valid status value for public_chat_sessions
  to support AI pause/resume functionality where humans can take over conversations.
  
  This status indicates:
  - AI chatbot is paused for this session
  - Human is in control
  - Status persists indefinitely until manually resumed
  - Survives page refreshes, logout/login, server restarts
*/

-- Drop the existing constraint
ALTER TABLE public_chat_sessions
  DROP CONSTRAINT IF EXISTS public_chat_sessions_status_check;

-- Add the new constraint with 'human_takeover' included
ALTER TABLE public_chat_sessions
  ADD CONSTRAINT public_chat_sessions_status_check
  CHECK (status IN ('active', 'archived', 'converted', 'abandoned', 'human_takeover'));

-- Create index for filtering by human_takeover status
CREATE INDEX IF NOT EXISTS idx_chat_sessions_human_takeover
  ON public_chat_sessions(user_id, status)
  WHERE status = 'human_takeover';

-- Comment for documentation
COMMENT ON COLUMN public_chat_sessions.status IS 'Session status: active (AI responding), human_takeover (AI paused, human control), archived, converted (to prospect), abandoned';

