/*
  # Add Verified Foreign Key Indexes - Batch 1

  1. Purpose
    - Add indexes to foreign key columns based on actual schema
    - Improves query performance on joins and foreign key lookups
    - Critical for RLS policy evaluation performance

  2. Security Impact
    - Prevents sequential scans on foreign key joins
    - Ensures efficient data access patterns
    - Improves overall system security posture
*/

-- Adaptive follow up
CREATE INDEX IF NOT EXISTS idx_adaptive_follow_up_sequences_prospect_id 
  ON adaptive_follow_up_sequences(prospect_id);

-- Admin tables
CREATE INDEX IF NOT EXISTS idx_admin_offerings_company_id 
  ON admin_offerings(company_id);

CREATE INDEX IF NOT EXISTS idx_admin_product_variants_product_id 
  ON admin_product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_admin_products_company_id 
  ON admin_products(company_id);

CREATE INDEX IF NOT EXISTS idx_admin_services_company_id 
  ON admin_services(company_id);

CREATE INDEX IF NOT EXISTS idx_admin_users_role_id 
  ON admin_users(role_id);

-- Agent tables
CREATE INDEX IF NOT EXISTS idx_agent_skill_gaps_user_id 
  ON agent_skill_gaps(user_id);

-- AI agent results
CREATE INDEX IF NOT EXISTS idx_ai_agent_results_prospect_id 
  ON ai_agent_results(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_agent_results_scan_id 
  ON ai_agent_results(scan_id);

-- AI alerts and sessions
CREATE INDEX IF NOT EXISTS idx_ai_alerts_prospect_id 
  ON ai_alerts(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_prospect_id 
  ON ai_chat_sessions(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_closer_sessions_prospect_id 
  ON ai_closer_sessions(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_closer_sessions_user_id 
  ON ai_closer_sessions(user_id);

-- AI conversation states
CREATE INDEX IF NOT EXISTS idx_ai_conversation_states_prospect_id 
  ON ai_conversation_states(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_states_session_id 
  ON ai_conversation_states(session_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_prospect_id 
  ON ai_conversations(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id 
  ON ai_conversations(session_id);

-- AI drafted and generated messages
CREATE INDEX IF NOT EXISTS idx_ai_drafted_messages_prospect_id 
  ON ai_drafted_messages(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_follow_up_sequences_prospect_id 
  ON ai_follow_up_sequences(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_generated_messages_prospect_id 
  ON ai_generated_messages(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_generated_messages_user_id 
  ON ai_generated_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_generations_prospect_id 
  ON ai_generations(prospect_id);

-- AI learning and mentor
CREATE INDEX IF NOT EXISTS idx_ai_learning_profiles_prospect_id 
  ON ai_learning_profiles(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_prospect_id 
  ON ai_mentor_sessions(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_user_id 
  ON ai_mentor_sessions(user_id);

-- AI message sequences and library
CREATE INDEX IF NOT EXISTS idx_ai_message_sequences_prospect_id 
  ON ai_message_sequences(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_messages_library_prospect_id 
  ON ai_messages_library(prospect_id);

-- AI prospects and tasks
CREATE INDEX IF NOT EXISTS idx_ai_prospects_prospect_id 
  ON ai_prospects(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_prospects_session_id 
  ON ai_prospects(session_id);

CREATE INDEX IF NOT EXISTS idx_ai_specialist_results_pipeline_state_id 
  ON ai_specialist_results(pipeline_state_id);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_prospect_id 
  ON ai_tasks(prospect_id);
