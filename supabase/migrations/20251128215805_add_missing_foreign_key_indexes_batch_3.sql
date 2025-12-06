/*
  # Add Missing Foreign Key Indexes - Batch 3

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in browser capture and chatbot systems
    
  2. Indexes Added
    - Browser capture: browser_capture_events, browser_extension_tokens
    - Caching: cached_ai_responses
    - Call scripts: call_scripts
    - Channel orchestration: channel_orchestration_history, channel_queue_state
*/

-- Browser capture indexes
CREATE INDEX IF NOT EXISTS idx_browser_capture_events_user_id ON browser_capture_events(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_extension_tokens_user_id ON browser_extension_tokens(user_id);

-- Caching indexes
CREATE INDEX IF NOT EXISTS idx_cached_ai_responses_user_id ON cached_ai_responses(user_id);

-- Call scripts indexes
CREATE INDEX IF NOT EXISTS idx_call_scripts_prospect_id ON call_scripts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_call_scripts_user_id ON call_scripts(user_id);

-- Channel orchestration indexes
CREATE INDEX IF NOT EXISTS idx_channel_orchestration_history_user_id ON channel_orchestration_history(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_queue_state_prospect_id ON channel_queue_state(prospect_id);

-- Closing scripts indexes
CREATE INDEX IF NOT EXISTS idx_closing_scripts_prospect_id ON closing_scripts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_closing_scripts_user_id ON closing_scripts(user_id);
