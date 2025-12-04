/*
  # Drop Unused Indexes - Batch 3

  1. Performance Optimization
    - Continue removing unused indexes
  
  2. Affected Indexes (Batch 3 - Next 50)
*/

DROP INDEX IF EXISTS idx_ethical_follow_up_sequences_user_id;
DROP INDEX IF EXISTS idx_extracted_entities_user_id;
DROP INDEX IF EXISTS idx_fb_lead_ads_campaigns_user_id;
DROP INDEX IF EXISTS idx_fb_lead_ads_forms_user_id;
DROP INDEX IF EXISTS idx_fb_lead_followup_tasks_user_id;
DROP INDEX IF EXISTS idx_fb_leads_user_id;
DROP INDEX IF EXISTS idx_fb_messenger_conversations_user_id;
DROP INDEX IF EXISTS idx_fb_messenger_messages_user_id;
DROP INDEX IF EXISTS idx_feature_usage_logs_user_id;
DROP INDEX IF EXISTS idx_file_scan_progress_user_id;
DROP INDEX IF EXISTS idx_funnel_stage_performance_user_id;
DROP INDEX IF EXISTS idx_government_decisions_decided_by;
DROP INDEX IF EXISTS idx_health_check_results_checked_by;
DROP INDEX IF EXISTS idx_heatmap_events_user_id;
DROP INDEX IF EXISTS idx_industry_benchmarks_user_id;
DROP INDEX IF EXISTS idx_industry_learning_data_user_id;
DROP INDEX IF EXISTS idx_insight_assistant_history_user_id;
DROP INDEX IF EXISTS idx_invoices_user_id;
DROP INDEX IF EXISTS idx_lead_revival_attempts_user_id;
DROP INDEX IF EXISTS idx_legislative_proposals_proposed_by;
DROP INDEX IF EXISTS idx_library_items_user_id;
DROP INDEX IF EXISTS idx_message_sequences_user_id;
DROP INDEX IF EXISTS idx_missions_user_id;
DROP INDEX IF EXISTS idx_model_performance_logs_user_id;
DROP INDEX IF EXISTS idx_multi_agent_conversations_user_id;
DROP INDEX IF EXISTS idx_multi_page_crawl_results_user_id;
DROP INDEX IF EXISTS idx_multi_pass_results_user_id;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_nudge_analytics_user_id;
DROP INDEX IF EXISTS idx_nudge_events_user_id;
DROP INDEX IF EXISTS idx_nudge_impressions_user_id;
DROP INDEX IF EXISTS idx_objection_handler_scripts_user_id;
DROP INDEX IF EXISTS idx_onboarding_aha_moments_user_id;
DROP INDEX IF EXISTS idx_onboarding_experiments_user_id;
DROP INDEX IF EXISTS idx_onboarding_missions_user_id;
DROP INDEX IF EXISTS idx_onboarding_recovery_attempts_user_id;
DROP INDEX IF EXISTS idx_onboarding_sequences_user_id;
DROP INDEX IF EXISTS idx_onboarding_session_logs_user_id;
DROP INDEX IF EXISTS idx_onboarding_variant_assignments_user_id;
DROP INDEX IF EXISTS idx_orchestrator_decisions_user_id;
DROP INDEX IF EXISTS idx_orchestrator_tasks_user_id;
DROP INDEX IF EXISTS idx_paid_upgrades_user_id;
DROP INDEX IF EXISTS idx_payment_history_user_id;
DROP INDEX IF EXISTS idx_pending_coin_transactions_user_id;
DROP INDEX IF EXISTS idx_persona_adaptive_pathways_user_id;
DROP INDEX IF EXISTS idx_persona_classification_logs_user_id;
DROP INDEX IF EXISTS idx_pitch_decks_user_id;
DROP INDEX IF EXISTS idx_product_assets_user_id;
DROP INDEX IF EXISTS idx_product_personas_user_id;
DROP INDEX IF EXISTS idx_product_recommendations_user_id;
