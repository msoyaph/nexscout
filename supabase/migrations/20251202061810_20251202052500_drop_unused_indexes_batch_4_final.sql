/*
  # Drop Unused Indexes - Batch 4 (Final)

  1. Performance Optimization
    - Remove remaining unused indexes
  
  2. Affected Indexes (Batch 4 - Remaining)
*/

DROP INDEX IF EXISTS idx_product_scripts_user_id;
DROP INDEX IF EXISTS idx_product_variants_user_id;
DROP INDEX IF EXISTS idx_products_user_id;
DROP INDEX IF EXISTS idx_prospect_behavior_timeline_user_id;
DROP INDEX IF EXISTS idx_prospect_feature_vectors_user_id;
DROP INDEX IF EXISTS idx_prospect_intelligence_cache_user_id;
DROP INDEX IF EXISTS idx_prospects_user_id;
DROP INDEX IF EXISTS idx_public_chat_messages_user_id;
DROP INDEX IF EXISTS idx_public_chat_sessions_user_id;
DROP INDEX IF EXISTS idx_public_chatbot_intelligence_user_id;
DROP INDEX IF EXISTS idx_public_chatbot_training_data_user_id;
DROP INDEX IF EXISTS idx_realtime_engine_events_user_id;
DROP INDEX IF EXISTS idx_referral_rewards_user_id;
DROP INDEX IF EXISTS idx_referrals_referrer_id;
DROP INDEX IF EXISTS idx_revenue_snapshots_user_id;
DROP INDEX IF EXISTS idx_scan_diagnostics_user_id;
DROP INDEX IF EXISTS idx_scan_processed_items_user_id;
DROP INDEX IF EXISTS idx_scan_results_user_id;
DROP INDEX IF EXISTS idx_scan_sessions_user_id;
DROP INDEX IF EXISTS idx_scan_status_user_id;
DROP INDEX IF EXISTS idx_scraper_logs_user_id;
DROP INDEX IF EXISTS idx_scout_score_v2_user_id;
DROP INDEX IF EXISTS idx_self_learning_experiments_user_id;
DROP INDEX IF EXISTS idx_sequence_engagement_user_id;
DROP INDEX IF EXISTS idx_sife_conversations_user_id;
DROP INDEX IF EXISTS idx_sife_pipeline_state_user_id;
DROP INDEX IF EXISTS idx_smart_deal_coach_sessions_user_id;
DROP INDEX IF EXISTS idx_social_connect_accounts_user_id;
DROP INDEX IF EXISTS idx_social_connect_scans_user_id;
DROP INDEX IF EXISTS idx_social_graph_edges_user_id;
DROP INDEX IF EXISTS idx_social_graph_nodes_user_id;
DROP INDEX IF EXISTS idx_social_insights_user_id;
DROP INDEX IF EXISTS idx_subscription_cancellations_user_id;
DROP INDEX IF EXISTS idx_support_tickets_user_id;
DROP INDEX IF EXISTS idx_supreme_court_rulings_ruled_by;
DROP INDEX IF EXISTS idx_synergy_insights_user_id;
DROP INDEX IF EXISTS idx_synergy_pipeline_state_user_id;
DROP INDEX IF EXISTS idx_team_members_user_id;
DROP INDEX IF EXISTS idx_team_subscriptions_team_id;
DROP INDEX IF EXISTS idx_training_tasks_user_id;
DROP INDEX IF EXISTS idx_unit_economics_user_id;
DROP INDEX IF EXISTS idx_uploaded_files_user_id;
DROP INDEX IF EXISTS idx_user_activation_checklist_user_id;
DROP INDEX IF EXISTS idx_user_aha_moments_user_id;
DROP INDEX IF EXISTS idx_user_badges_user_id;
DROP INDEX IF EXISTS idx_user_coins_user_id;
DROP INDEX IF EXISTS idx_user_company_links_user_id;
DROP INDEX IF EXISTS idx_user_energy_user_id;
DROP INDEX IF EXISTS idx_user_onboarding_state_user_id;
DROP INDEX IF EXISTS idx_user_sequence_assignments_user_id;
DROP INDEX IF EXISTS idx_user_subscriptions_user_id;
DROP INDEX IF EXISTS idx_weekly_playbooks_user_id;
