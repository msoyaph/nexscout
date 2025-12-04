/*
  # Drop Unused Indexes - Batch 1

  1. Performance Optimization
    - Remove unused indexes to improve write performance
    - Reduce storage overhead
    - Speed up table maintenance operations
    
  2. Indexes to Drop (Batch 1 - 50 indexes)
    - Various duplicate and unused indexes identified in security audit
    
  3. Security
    - Safe to drop as these indexes are not used by any queries
    - No impact on query performance
    - Improves overall database performance
*/

-- Drop unused indexes from various tables
DROP INDEX IF EXISTS idx_admin_data_audit_log_table_name;
DROP INDEX IF EXISTS idx_admin_data_audit_log_action;
DROP INDEX IF EXISTS idx_admin_products_status;
DROP INDEX IF EXISTS idx_ai_agent_results_created_at;
DROP INDEX IF EXISTS idx_ai_generations_generation_type;
DROP INDEX IF EXISTS idx_ai_generations_created_at;
DROP INDEX IF EXISTS idx_browser_captures_url;
DROP INDEX IF EXISTS idx_browser_captures_created_at;
DROP INDEX IF EXISTS idx_chatbot_integrations_platform;
DROP INDEX IF EXISTS idx_chatbot_integrations_enabled;
DROP INDEX IF EXISTS idx_coin_transactions_transaction_type;
DROP INDEX IF EXISTS idx_coin_transactions_created_at;
DROP INDEX IF EXISTS idx_company_crawl_pages_url;
DROP INDEX IF EXISTS idx_company_crawl_pages_status;
DROP INDEX IF EXISTS idx_company_embeddings_content_type;
DROP INDEX IF EXISTS idx_company_embeddings_created_at;
DROP INDEX IF EXISTS idx_company_knowledge_posts_status;
DROP INDEX IF EXISTS idx_company_knowledge_posts_created_at;
DROP INDEX IF EXISTS idx_company_multi_site_data_url;
DROP INDEX IF EXISTS idx_company_multi_site_data_created_at;
DROP INDEX IF EXISTS idx_custom_instructions_instruction_type;
DROP INDEX IF EXISTS idx_custom_instructions_enabled;
DROP INDEX IF EXISTS idx_energy_transactions_transaction_type;
DROP INDEX IF EXISTS idx_energy_transactions_created_at;
DROP INDEX IF EXISTS idx_extracted_entities_entity_type;
DROP INDEX IF EXISTS idx_extracted_entities_created_at;
DROP INDEX IF EXISTS idx_mission_completions_completed_at;
DROP INDEX IF EXISTS idx_mission_completions_created_at;
DROP INDEX IF EXISTS idx_notifications_type;
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_onboarding_sequences_sequence_type;
DROP INDEX IF EXISTS idx_onboarding_sequences_status;
DROP INDEX IF EXISTS idx_onboarding_sequences_created_at;
DROP INDEX IF EXISTS idx_pitch_decks_status;
DROP INDEX IF EXISTS idx_pitch_decks_created_at;
DROP INDEX IF EXISTS idx_prospects_status;
DROP INDEX IF EXISTS idx_prospects_created_at;
DROP INDEX IF EXISTS idx_public_chat_messages_created_at;
DROP INDEX IF EXISTS idx_public_chat_sessions_status;
DROP INDEX IF EXISTS idx_public_chat_sessions_created_at;
DROP INDEX IF EXISTS idx_referrals_status;
DROP INDEX IF EXISTS idx_referrals_created_at;
DROP INDEX IF EXISTS idx_scan_progress_status;
DROP INDEX IF EXISTS idx_scan_progress_created_at;
DROP INDEX IF EXISTS idx_scan_results_status;
DROP INDEX IF EXISTS idx_scan_results_created_at;
DROP INDEX IF EXISTS idx_scan_sessions_status;
DROP INDEX IF EXISTS idx_scan_sessions_created_at;
DROP INDEX IF EXISTS idx_social_graph_connections_connection_type;
DROP INDEX IF EXISTS idx_social_graph_connections_created_at;