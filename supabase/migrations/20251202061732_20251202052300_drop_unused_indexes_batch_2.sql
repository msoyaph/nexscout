/*
  # Drop Unused Indexes - Batch 2

  1. Performance Optimization
    - Continue removing unused indexes
  
  2. Affected Indexes (Batch 2 - Next 50)
*/

DROP INDEX IF EXISTS idx_channel_queue_state_user_id;
DROP INDEX IF EXISTS idx_chatbot_analytics_user_id;
DROP INDEX IF EXISTS idx_chatbot_appointment_slots_user_id;
DROP INDEX IF EXISTS idx_chatbot_automation_settings_user_id;
DROP INDEX IF EXISTS idx_chatbot_closing_attempts_user_id;
DROP INDEX IF EXISTS idx_chatbot_configurations_user_id;
DROP INDEX IF EXISTS idx_chatbot_conversation_analysis_user_id;
DROP INDEX IF EXISTS idx_chatbot_decision_logs_user_id;
DROP INDEX IF EXISTS idx_chatbot_detection_logs_user_id;
DROP INDEX IF EXISTS idx_chatbot_escalations_user_id;
DROP INDEX IF EXISTS idx_chatbot_handoff_triggers_user_id;
DROP INDEX IF EXISTS idx_chatbot_insights_user_id;
DROP INDEX IF EXISTS idx_chatbot_intent_training_user_id;
DROP INDEX IF EXISTS idx_chatbot_knowledge_items_user_id;
DROP INDEX IF EXISTS idx_chatbot_lead_assignments_user_id;
DROP INDEX IF EXISTS idx_chatbot_learning_cycles_user_id;
DROP INDEX IF EXISTS idx_chatbot_messages_user_id;
DROP INDEX IF EXISTS idx_chatbot_optimization_logs_user_id;
DROP INDEX IF EXISTS idx_chatbot_pricing_triggers_user_id;
DROP INDEX IF EXISTS idx_chatbot_product_matches_user_id;
DROP INDEX IF EXISTS idx_chatbot_script_assignments_user_id;
DROP INDEX IF EXISTS idx_chatbot_training_data_user_id;
DROP INDEX IF EXISTS idx_chatbot_visitor_intents_user_id;
DROP INDEX IF EXISTS idx_citizen_feedback_user_id;
DROP INDEX IF EXISTS idx_closing_attempt_logs_user_id;
DROP INDEX IF EXISTS idx_coin_transactions_user_id;
DROP INDEX IF EXISTS idx_company_ai_learning_user_id;
DROP INDEX IF EXISTS idx_company_crawl_sessions_user_id;
DROP INDEX IF EXISTS idx_company_embeddings_user_id;
DROP INDEX IF EXISTS idx_company_intelligence_user_id;
DROP INDEX IF EXISTS idx_company_knowledge_posts_user_id;
DROP INDEX IF EXISTS idx_company_multi_site_data_user_id;
DROP INDEX IF EXISTS idx_company_profiles_user_id;
DROP INDEX IF EXISTS idx_constitution_rules_created_by;
DROP INDEX IF EXISTS idx_conversion_events_user_id;
DROP INDEX IF EXISTS idx_crisis_alerts_user_id;
DROP INDEX IF EXISTS idx_crisis_responses_user_id;
DROP INDEX IF EXISTS idx_custom_instructions_user_id;
DROP INDEX IF EXISTS idx_deal_genome_profiles_user_id;
DROP INDEX IF EXISTS idx_department_communications_sent_by;
DROP INDEX IF EXISTS idx_department_jobs_assigned_to;
DROP INDEX IF EXISTS idx_diagnostic_logs_user_id;
DROP INDEX IF EXISTS idx_dynamic_nudges_user_id;
DROP INDEX IF EXISTS idx_economic_simulations_user_id;
DROP INDEX IF EXISTS idx_engine_audit_logs_user_id;
DROP INDEX IF EXISTS idx_engine_certifications_certified_by;
DROP INDEX IF EXISTS idx_engine_health_user_id;
DROP INDEX IF EXISTS idx_enterprise_data_feeds_user_id;
DROP INDEX IF EXISTS idx_enterprise_teams_owner_id;
