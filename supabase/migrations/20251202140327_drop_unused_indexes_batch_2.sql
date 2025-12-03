/*
  # Drop Unused Indexes - Batch 2

  1. Performance Optimization
    - Continue removing unused indexes
    - Additional tables from security audit
    
  2. Indexes to Drop (Batch 2 - 50 indexes)
    
  3. Security
    - Safe to drop as these indexes are not used
*/

DROP INDEX IF EXISTS idx_uploaded_files_file_type;
DROP INDEX IF EXISTS idx_uploaded_files_status;
DROP INDEX IF EXISTS idx_uploaded_files_created_at;
DROP INDEX IF EXISTS idx_user_profiles_tier;
DROP INDEX IF EXISTS idx_user_profiles_created_at;
DROP INDEX IF EXISTS idx_ai_chat_sessions_status;
DROP INDEX IF EXISTS idx_ai_chat_sessions_created_at;
DROP INDEX IF EXISTS idx_ai_message_sequences_status;
DROP INDEX IF EXISTS idx_ai_message_sequences_created_at;
DROP INDEX IF EXISTS idx_chatbot_settings_enabled;
DROP INDEX IF EXISTS idx_company_profiles_status;
DROP INDEX IF EXISTS idx_company_profiles_created_at;
DROP INDEX IF EXISTS idx_diagnostic_logs_level;
DROP INDEX IF EXISTS idx_diagnostic_logs_created_at;
DROP INDEX IF EXISTS idx_missions_category;
DROP INDEX IF EXISTS idx_missions_tier;
DROP INDEX IF EXISTS idx_payment_history_status;
DROP INDEX IF EXISTS idx_payment_history_created_at;
DROP INDEX IF EXISTS idx_pending_coin_transactions_status;
DROP INDEX IF EXISTS idx_pending_coin_transactions_created_at;
DROP INDEX IF EXISTS idx_scan_processed_items_status;
DROP INDEX IF EXISTS idx_scan_processed_items_created_at;
DROP INDEX IF EXISTS idx_scraper_logs_status;
DROP INDEX IF EXISTS idx_scraper_logs_created_at;
DROP INDEX IF EXISTS idx_social_entities_entity_type;
DROP INDEX IF EXISTS idx_social_entities_created_at;
DROP INDEX IF EXISTS idx_social_insights_insight_type;
DROP INDEX IF EXISTS idx_social_insights_created_at;
DROP INDEX IF EXISTS idx_subscription_plans_tier;
DROP INDEX IF EXISTS idx_support_tickets_status;
DROP INDEX IF EXISTS idx_support_tickets_created_at;
DROP INDEX IF EXISTS idx_user_coins_created_at;
DROP INDEX IF EXISTS idx_user_energy_created_at;
DROP INDEX IF EXISTS idx_user_subscriptions_status;
DROP INDEX IF EXISTS idx_user_subscriptions_created_at;
DROP INDEX IF EXISTS idx_behavior_timeline_event_type;
DROP INDEX IF EXISTS idx_behavior_timeline_created_at;
DROP INDEX IF EXISTS idx_fb_lead_ads_leads_status;
DROP INDEX IF EXISTS idx_fb_lead_ads_leads_created_at;
DROP INDEX IF EXISTS idx_onboarding_analytics_step;
DROP INDEX IF EXISTS idx_onboarding_analytics_created_at;
DROP INDEX IF EXISTS idx_product_recommendations_status;
DROP INDEX IF EXISTS idx_product_recommendations_created_at;
DROP INDEX IF EXISTS idx_scan_optimization_metrics_created_at;
DROP INDEX IF EXISTS idx_social_scan_results_status;
DROP INDEX IF EXISTS idx_social_scan_results_created_at;
DROP INDEX IF EXISTS idx_team_members_role;
DROP INDEX IF EXISTS idx_team_members_created_at;
DROP INDEX IF EXISTS idx_workspace_configs_created_at;