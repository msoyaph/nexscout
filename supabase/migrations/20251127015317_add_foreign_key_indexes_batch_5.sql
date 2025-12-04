/*
  # Add Foreign Key Indexes - Batch 5

  1. Performance Optimization
    - Continue adding indexes for unindexed foreign keys
    - Tables: prospect_behavior_summary through scan_sessions
*/

-- prospect_behavior_summary
CREATE INDEX IF NOT EXISTS idx_prospect_behavior_summary_user_id_fkey ON public.prospect_behavior_summary(user_id);

-- prospect_events
CREATE INDEX IF NOT EXISTS idx_prospect_events_prospect_id_fkey ON public.prospect_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_events_user_id_fkey ON public.prospect_events(user_id);

-- prospect_feature_vectors
CREATE INDEX IF NOT EXISTS idx_prospect_feature_vectors_user_id_fkey ON public.prospect_feature_vectors(user_id);

-- prospect_platform_sources
CREATE INDEX IF NOT EXISTS idx_prospect_platform_sources_user_id_fkey ON public.prospect_platform_sources(user_id);

-- prospect_profiles
CREATE INDEX IF NOT EXISTS idx_prospect_profiles_user_id_fkey ON public.prospect_profiles(user_id);

-- prospect_qualifications
CREATE INDEX IF NOT EXISTS idx_prospect_qualifications_prospect_id_fkey ON public.prospect_qualifications(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_qualifications_user_id_fkey ON public.prospect_qualifications(user_id);

-- prospect_scores
CREATE INDEX IF NOT EXISTS idx_prospect_scores_prospect_id_fkey ON public.prospect_scores(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_scores_user_id_fkey ON public.prospect_scores(user_id);

-- raw_prospect_candidates
CREATE INDEX IF NOT EXISTS idx_raw_prospect_candidates_user_id_fkey ON public.raw_prospect_candidates(user_id);

-- referral_messages
CREATE INDEX IF NOT EXISTS idx_referral_messages_prospect_id_fkey ON public.referral_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_referral_messages_user_id_fkey ON public.referral_messages(user_id);

-- referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id_fkey ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id_fkey ON public.referrals(referrer_user_id);

-- retention_campaign_logs
CREATE INDEX IF NOT EXISTS idx_retention_campaign_logs_playbook_id_fkey ON public.retention_campaign_logs(playbook_id);

-- retention_results
CREATE INDEX IF NOT EXISTS idx_retention_results_playbook_id_fkey ON public.retention_results(playbook_id);

-- sales_call_simulations
CREATE INDEX IF NOT EXISTS idx_sales_call_simulations_user_id_fkey ON public.sales_call_simulations(user_id);

-- scan_benchmarks
CREATE INDEX IF NOT EXISTS idx_scan_benchmarks_user_id_fkey ON public.scan_benchmarks(user_id);

-- scan_extracted_data
CREATE INDEX IF NOT EXISTS idx_scan_extracted_data_scan_id_fkey ON public.scan_extracted_data(scan_id);

-- scan_ocr_results
CREATE INDEX IF NOT EXISTS idx_scan_ocr_results_scan_id_fkey ON public.scan_ocr_results(scan_id);

-- scan_progress
CREATE INDEX IF NOT EXISTS idx_scan_progress_scan_id_fkey ON public.scan_progress(scan_id);

-- scan_session_files
CREATE INDEX IF NOT EXISTS idx_scan_session_files_session_id_fkey ON public.scan_session_files(session_id);

-- scan_session_prospects
CREATE INDEX IF NOT EXISTS idx_scan_session_prospects_session_id_fkey ON public.scan_session_prospects(session_id);

-- scan_session_social_data
CREATE INDEX IF NOT EXISTS idx_scan_session_social_data_session_id_fkey ON public.scan_session_social_data(session_id);

-- scan_sessions
CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_id_fkey ON public.scan_sessions(user_id);
