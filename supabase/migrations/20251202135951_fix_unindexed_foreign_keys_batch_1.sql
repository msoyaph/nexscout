/*
  # Fix Unindexed Foreign Keys - Batch 1
  
  1. Security Fix
    - Add indexes for foreign key columns that are missing them
    - Improves query performance and prevents suboptimal execution plans
  
  2. Tables Fixed (Batch 1 - 50 tables)
    - adaptive_follow_up_sequences
    - ai_agent_results
    - ai_alerts
    - ai_coach_recommendations
    - ai_conversations
    - ai_drafted_messages
    - ai_follow_up_sequences
    - ai_generated_messages
    - ai_generated_tasks
    - ai_generations
    - ai_pipeline_jobs
    - ai_prospects
    - ai_tasks
    - ai_usage_logs
    - api_calls_cost
    - blocked_outputs
    - browser_capture_events
    - browser_extension_tokens
    - cached_ai_responses
    - call_scripts
    - channel_messages_raw
    - channel_orchestration_history
    - chatbot_closing_attempts
    - chatbot_configurations
    - citizen_feedback
    - company_embeddings
    - consistency_warnings
    - diagnostic_logs
    - funnel_step_logs (2 indexes)
    - invoices
    - lead_attributes
    - lead_temperature_scores
    - message_ai_decisions
    - message_sequences
    - missions
    - ml_training_data
    - mlm_member_ranks
    - mlm_sales
    - payment_history
    - pending_coin_transactions
    - pitch_decks
    - products
    - prospect_feature_vectors
    - realtime_engine_events
    - scan_sessions
    - scraper_logs
    - social_graph_edges
    - social_graph_nodes
    - support_tickets
    - team_members
*/

-- adaptive_follow_up_sequences
CREATE INDEX IF NOT EXISTS idx_adaptive_follow_up_sequences_user_id 
ON adaptive_follow_up_sequences(user_id);

-- ai_agent_results
CREATE INDEX IF NOT EXISTS idx_ai_agent_results_user_id 
ON ai_agent_results(user_id);

-- ai_alerts
CREATE INDEX IF NOT EXISTS idx_ai_alerts_user_id 
ON ai_alerts(user_id);

-- ai_coach_recommendations
CREATE INDEX IF NOT EXISTS idx_ai_coach_recommendations_user_id 
ON ai_coach_recommendations(user_id);

-- ai_conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id 
ON ai_conversations(user_id);

-- ai_drafted_messages
CREATE INDEX IF NOT EXISTS idx_ai_drafted_messages_user_id 
ON ai_drafted_messages(user_id);

-- ai_follow_up_sequences
CREATE INDEX IF NOT EXISTS idx_ai_follow_up_sequences_user_id 
ON ai_follow_up_sequences(user_id);

-- ai_generated_messages
CREATE INDEX IF NOT EXISTS idx_ai_generated_messages_user_id 
ON ai_generated_messages(user_id);

-- ai_generated_tasks
CREATE INDEX IF NOT EXISTS idx_ai_generated_tasks_user_id 
ON ai_generated_tasks(user_id);

-- ai_generations
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id 
ON ai_generations(user_id);

-- ai_pipeline_jobs
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_jobs_user_id_new 
ON ai_pipeline_jobs(user_id);

-- ai_prospects
CREATE INDEX IF NOT EXISTS idx_ai_prospects_user_id 
ON ai_prospects(user_id);

-- ai_tasks
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_id 
ON ai_tasks(user_id);

-- ai_usage_logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id 
ON ai_usage_logs(user_id);

-- api_calls_cost
CREATE INDEX IF NOT EXISTS idx_api_calls_cost_user_id_new 
ON api_calls_cost(user_id);

-- blocked_outputs
CREATE INDEX IF NOT EXISTS idx_blocked_outputs_user_id_new 
ON blocked_outputs(user_id);

-- browser_capture_events
CREATE INDEX IF NOT EXISTS idx_browser_capture_events_user_id_new 
ON browser_capture_events(user_id);

-- browser_extension_tokens
CREATE INDEX IF NOT EXISTS idx_browser_extension_tokens_user_id 
ON browser_extension_tokens(user_id);

-- cached_ai_responses
CREATE INDEX IF NOT EXISTS idx_cached_ai_responses_user_id_new 
ON cached_ai_responses(user_id);

-- call_scripts
CREATE INDEX IF NOT EXISTS idx_call_scripts_user_id_new 
ON call_scripts(user_id);

-- channel_messages_raw
CREATE INDEX IF NOT EXISTS idx_channel_messages_raw_prospect_id 
ON channel_messages_raw(prospect_id);

-- channel_orchestration_history
CREATE INDEX IF NOT EXISTS idx_channel_orchestration_history_user_id_new 
ON channel_orchestration_history(user_id);

-- chatbot_closing_attempts
CREATE INDEX IF NOT EXISTS idx_chatbot_closing_attempts_user_id_new 
ON chatbot_closing_attempts(user_id);

-- chatbot_configurations
CREATE INDEX IF NOT EXISTS idx_chatbot_configurations_user_id 
ON chatbot_configurations(user_id);

-- citizen_feedback
CREATE INDEX IF NOT EXISTS idx_citizen_feedback_user_id_new 
ON citizen_feedback(user_id);

-- company_embeddings
CREATE INDEX IF NOT EXISTS idx_company_embeddings_user_id_new 
ON company_embeddings(user_id);

-- consistency_warnings
CREATE INDEX IF NOT EXISTS idx_consistency_warnings_custom_instruction_id 
ON consistency_warnings(custom_instruction_id);

-- diagnostic_logs
CREATE INDEX IF NOT EXISTS idx_diagnostic_logs_user_id_new 
ON diagnostic_logs(user_id);

-- funnel_step_logs (2 foreign keys)
CREATE INDEX IF NOT EXISTS idx_funnel_step_logs_funnel_id_new 
ON funnel_step_logs(funnel_id);

CREATE INDEX IF NOT EXISTS idx_funnel_step_logs_user_id_new 
ON funnel_step_logs(user_id);

-- invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id_new 
ON invoices(user_id);

-- lead_attributes
CREATE INDEX IF NOT EXISTS idx_lead_attributes_user_id_new 
ON lead_attributes(user_id);

-- lead_temperature_scores
CREATE INDEX IF NOT EXISTS idx_lead_temperature_scores_user_id_new 
ON lead_temperature_scores(user_id);

-- message_ai_decisions
CREATE INDEX IF NOT EXISTS idx_message_ai_decisions_conversation_id 
ON message_ai_decisions(conversation_id);

-- message_sequences
CREATE INDEX IF NOT EXISTS idx_message_sequences_user_id_new 
ON message_sequences(user_id);

-- missions
CREATE INDEX IF NOT EXISTS idx_missions_user_id_new 
ON missions(user_id);

-- ml_training_data
CREATE INDEX IF NOT EXISTS idx_ml_training_data_prospect_id_new 
ON ml_training_data(prospect_id);

-- mlm_member_ranks
CREATE INDEX IF NOT EXISTS idx_mlm_member_ranks_user_id_new 
ON mlm_member_ranks(user_id);

-- mlm_sales
CREATE INDEX IF NOT EXISTS idx_mlm_sales_prospect_id_new 
ON mlm_sales(prospect_id);

-- payment_history
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id_new 
ON payment_history(user_id);

-- pending_coin_transactions
CREATE INDEX IF NOT EXISTS idx_pending_coin_transactions_user_id_new 
ON pending_coin_transactions(user_id);

-- pitch_decks
CREATE INDEX IF NOT EXISTS idx_pitch_decks_user_id_new 
ON pitch_decks(user_id);

-- products
CREATE INDEX IF NOT EXISTS idx_products_user_id_new 
ON products(user_id);

-- prospect_feature_vectors
CREATE INDEX IF NOT EXISTS idx_prospect_feature_vectors_user_id 
ON prospect_feature_vectors(user_id);

-- realtime_engine_events
CREATE INDEX IF NOT EXISTS idx_realtime_engine_events_user_id_new 
ON realtime_engine_events(user_id);

-- scan_sessions
CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_id_new 
ON scan_sessions(user_id);

-- scraper_logs
CREATE INDEX IF NOT EXISTS idx_scraper_logs_user_id_new 
ON scraper_logs(user_id);

-- social_graph_edges
CREATE INDEX IF NOT EXISTS idx_social_graph_edges_user_id_new 
ON social_graph_edges(user_id);

-- social_graph_nodes
CREATE INDEX IF NOT EXISTS idx_social_graph_nodes_user_id_new 
ON social_graph_nodes(user_id);

-- support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id_new 
ON support_tickets(user_id);

-- team_members
CREATE INDEX IF NOT EXISTS idx_team_members_user_id_new 
ON team_members(user_id);

-- uploaded_files
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id_new 
ON uploaded_files(user_id);
