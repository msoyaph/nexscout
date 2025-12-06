/*
  # Drop Unused Indexes - Batch 5

  1. Purpose
    - Continue dropping unused indexes
  
  2. Indexes Dropped
    - Prospect scores, referrals, retention, sales, scans (next 40)
*/

DROP INDEX IF EXISTS idx_prospect_scores_prospect_id_fkey;
DROP INDEX IF EXISTS idx_prospect_scores_user_id_fkey;
DROP INDEX IF EXISTS idx_raw_prospect_candidates_user_id_fkey;
DROP INDEX IF EXISTS idx_referral_messages_prospect_id_fkey;
DROP INDEX IF EXISTS idx_referral_messages_user_id_fkey;
DROP INDEX IF EXISTS idx_referrals_referred_user_id_fkey;
DROP INDEX IF EXISTS idx_referrals_referrer_user_id_fkey;
DROP INDEX IF EXISTS idx_retention_campaign_logs_playbook_id_fkey;
DROP INDEX IF EXISTS idx_retention_results_playbook_id_fkey;
DROP INDEX IF EXISTS idx_sales_call_simulations_user_id_fkey;
DROP INDEX IF EXISTS idx_scan_benchmarks_user_id_fkey;
DROP INDEX IF EXISTS idx_scan_extracted_data_scan_id_fkey;
DROP INDEX IF EXISTS idx_scan_ocr_results_scan_id_fkey;
DROP INDEX IF EXISTS idx_scan_progress_scan_id_fkey;
DROP INDEX IF EXISTS idx_scan_session_files_session_id_fkey;
DROP INDEX IF EXISTS idx_scan_session_prospects_session_id_fkey;
DROP INDEX IF EXISTS idx_scan_session_social_data_session_id_fkey;
DROP INDEX IF EXISTS idx_scan_sessions_user_id_fkey;
DROP INDEX IF EXISTS idx_scan_smartness_events_user_id_fkey;
DROP INDEX IF EXISTS idx_scan_taglish_analysis_scan_id_fkey;
DROP INDEX IF EXISTS idx_scanning_sessions_user_id_fkey;
DROP INDEX IF EXISTS idx_schedule_events_prospect_id_fkey;
DROP INDEX IF EXISTS idx_scoring_history_prospect_id_fkey;
DROP INDEX IF EXISTS idx_scoring_history_user_id_fkey;
DROP INDEX IF EXISTS idx_scoutscore_calculations_prospect_id_fkey;
DROP INDEX IF EXISTS idx_scoutscore_calculations_user_id_fkey;
DROP INDEX IF EXISTS idx_scraper_logs_user_id_fkey;
DROP INDEX IF EXISTS idx_sequence_step_logs_sequence_id_fkey;
DROP INDEX IF EXISTS idx_sequence_step_logs_user_id_fkey;
DROP INDEX IF EXISTS idx_social_connect_logs_user_id_fkey;
DROP INDEX IF EXISTS idx_social_contact_features_user_id_fkey;
DROP INDEX IF EXISTS idx_social_contacts_user_id_fkey;
DROP INDEX IF EXISTS idx_social_edges_from_contact_id_fkey;
DROP INDEX IF EXISTS idx_social_edges_to_contact_id_fkey;
DROP INDEX IF EXISTS idx_social_edges_user_id_fkey;
DROP INDEX IF EXISTS idx_social_graph_edges_user_id_fkey;
DROP INDEX IF EXISTS idx_social_graph_insights_user_id_fkey;
DROP INDEX IF EXISTS idx_social_graph_nodes_user_id_fkey;
DROP INDEX IF EXISTS idx_social_intent_predictions_prospect_id_fkey;
DROP INDEX IF EXISTS idx_social_intent_predictions_user_id_fkey;
