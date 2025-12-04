/*
  # Add Conversation State Tracking for Filipino Sales Pipeline

  1. New Columns to public_chat_sessions
    - `current_intent` (text) - Latest detected intent
    - `current_funnel_stage` (text) - Current stage in sales funnel
    - `lead_temperature` (text) - cold, warm, hot, readyToBuy
    - `conversation_state` (jsonb) - Full conversation context
    - `buying_signals_detected` (text[]) - Array of detected signals
    - `last_intent_update` (timestamptz) - When intent was last updated

  2. Purpose
    - Track conversation progression through sales funnel
    - Persist intent and stage across messages
    - Enable analytics on conversation flows
    - Support AI to maintain context
*/

-- Add conversation state tracking columns
ALTER TABLE public_chat_sessions
ADD COLUMN IF NOT EXISTS current_intent text,
ADD COLUMN IF NOT EXISTS current_funnel_stage text DEFAULT 'awareness',
ADD COLUMN IF NOT EXISTS lead_temperature text DEFAULT 'cold',
ADD COLUMN IF NOT EXISTS conversation_state jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS buying_signals_detected text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS last_intent_update timestamptz DEFAULT now();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_funnel_stage
  ON public_chat_sessions(user_id, current_funnel_stage)
  WHERE current_funnel_stage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_intent
  ON public_chat_sessions(user_id, current_intent)
  WHERE current_intent IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_temperature
  ON public_chat_sessions(user_id, lead_temperature)
  WHERE lead_temperature IS NOT NULL;

-- Add same fields to ai_chat_sessions (for internal chatbot)
ALTER TABLE ai_chat_sessions
ADD COLUMN IF NOT EXISTS current_intent text,
ADD COLUMN IF NOT EXISTS current_funnel_stage text DEFAULT 'awareness',
ADD COLUMN IF NOT EXISTS lead_temperature text DEFAULT 'cold',
ADD COLUMN IF NOT EXISTS conversation_state jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS buying_signals_detected text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS last_intent_update timestamptz DEFAULT now();

-- Create indexes for ai_chat_sessions
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_funnel_stage
  ON ai_chat_sessions(user_id, current_funnel_stage)
  WHERE current_funnel_stage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_intent
  ON ai_chat_sessions(user_id, current_intent)
  WHERE current_intent IS NOT NULL;

COMMENT ON COLUMN public_chat_sessions.current_intent IS 'Latest detected intent: greeting, price, benefits, ordering_process, ready_to_buy, etc.';
COMMENT ON COLUMN public_chat_sessions.current_funnel_stage IS 'Current sales funnel stage: awareness, interest, evaluation, decision, closing';
COMMENT ON COLUMN public_chat_sessions.lead_temperature IS 'Lead temperature: cold, warm, hot, readyToBuy';
COMMENT ON COLUMN public_chat_sessions.buying_signals_detected IS 'Array of detected buying signals throughout conversation';
