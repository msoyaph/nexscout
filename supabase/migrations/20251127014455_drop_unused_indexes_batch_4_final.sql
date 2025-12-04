/*
  # Drop Unused Indexes - Batch 4 (Final)

  1. Performance Optimization
    - Complete removal of unused indexes
*/

DROP INDEX IF EXISTS public.idx_social_edges_to_contact;
DROP INDEX IF EXISTS public.idx_social_edges_relationship;
DROP INDEX IF EXISTS public.idx_library_groups_user_id;
DROP INDEX IF EXISTS public.idx_library_groups_type;
DROP INDEX IF EXISTS public.idx_social_interactions_user_id;
DROP INDEX IF EXISTS public.idx_social_interactions_contact_id;
DROP INDEX IF EXISTS public.idx_social_interactions_platform;
DROP INDEX IF EXISTS public.idx_social_interactions_occurred_at;
DROP INDEX IF EXISTS public.idx_social_interactions_type;
DROP INDEX IF EXISTS public.idx_browser_capture_processed;
DROP INDEX IF EXISTS public.idx_browser_capture_created_at;
DROP INDEX IF EXISTS public.idx_browser_capture_type;
DROP INDEX IF EXISTS public.idx_browser_capture_user_id;
DROP INDEX IF EXISTS public.idx_browser_capture_scan_id;
DROP INDEX IF EXISTS public.idx_social_contact_features_user_id;
DROP INDEX IF EXISTS public.idx_social_contact_features_strength;
DROP INDEX IF EXISTS public.idx_pending_coin_transactions_user_id;
DROP INDEX IF EXISTS public.idx_pending_coin_transactions_status;
DROP INDEX IF EXISTS public.idx_pending_coin_transactions_reference_id;
DROP INDEX IF EXISTS public.idx_pending_coin_transactions_created_at;
DROP INDEX IF EXISTS public.idx_social_graph_metrics_user_id;
DROP INDEX IF EXISTS public.idx_uploaded_batches_created_at;
DROP INDEX IF EXISTS public.idx_uploaded_files_batch_id;
DROP INDEX IF EXISTS public.idx_scan_session_social_data_session_id;
DROP INDEX IF EXISTS public.idx_scan_session_prospects_session_id;
DROP INDEX IF EXISTS public.idx_scan_session_prospects_bucket;
DROP INDEX IF EXISTS public.idx_scan_sessions_user_id;
DROP INDEX IF EXISTS public.idx_scan_sessions_status;
DROP INDEX IF EXISTS public.idx_scan_sessions_created_at;
DROP INDEX IF EXISTS public.idx_scan_session_files_session_id;
DROP INDEX IF EXISTS public.idx_social_connections_platform;
DROP INDEX IF EXISTS public.idx_behavior_timeline_user_id;
DROP INDEX IF EXISTS public.idx_behavior_timeline_contact_id;
DROP INDEX IF EXISTS public.idx_behavior_timeline_date;
DROP INDEX IF EXISTS public.idx_behavior_timeline_contact_date;
DROP INDEX IF EXISTS public.idx_behavior_summary_user_id;
DROP INDEX IF EXISTS public.idx_behavior_summary_momentum;
DROP INDEX IF EXISTS public.idx_behavior_summary_timeline_strength;
DROP INDEX IF EXISTS public.idx_admin_users_role_id;
DROP INDEX IF EXISTS public.idx_admin_users_user_id;
DROP INDEX IF EXISTS public.idx_scan_processed_items_type;
DROP INDEX IF EXISTS public.idx_scan_processed_items_score;
DROP INDEX IF EXISTS public.idx_scan_ocr_results_scan_id;
DROP INDEX IF EXISTS public.idx_scan_ocr_results_confidence;
DROP INDEX IF EXISTS public.idx_scan_taglish_analysis_scan_id;
DROP INDEX IF EXISTS public.idx_scan_taglish_analysis_business;
DROP INDEX IF EXISTS public.idx_scan_taglish_analysis_communication;
DROP INDEX IF EXISTS public.idx_scans_pipeline_state;
DROP INDEX IF EXISTS public.idx_scans_user_id_status;
