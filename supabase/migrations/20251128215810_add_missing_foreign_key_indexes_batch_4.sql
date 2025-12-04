/*
  # Add Missing Foreign Key Indexes - Batch 4

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in chatbot systems
    
  2. Indexes Added
    - Chatbot appointments: chatbot_appointment_slots
    - Chatbot closing: chatbot_closing_attempts
    - Chatbot configurations: chatbot_configurations
    - Chatbot pipeline: chatbot_to_prospect_pipeline
*/

-- Chatbot appointment indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_appointment_slots_prospect_id ON chatbot_appointment_slots(prospect_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_appointment_slots_session_id ON chatbot_appointment_slots(session_id);

-- Chatbot closing indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_closing_attempts_prospect_id ON chatbot_closing_attempts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_closing_attempts_user_id ON chatbot_closing_attempts(user_id);

-- Chatbot configuration indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_configurations_user_id ON chatbot_configurations(user_id);

-- Chatbot pipeline indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_to_prospect_pipeline_prospect_id ON chatbot_to_prospect_pipeline(prospect_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_to_prospect_pipeline_session_id ON chatbot_to_prospect_pipeline(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_to_prospect_pipeline_visitor_id ON chatbot_to_prospect_pipeline(visitor_id);
