/*
  # Add Missing Foreign Key Indexes - Batch 13

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in public chat, referral, and retention systems
    
  2. Indexes Added
    - Public chat: public_chat_followups
    - Raw prospects: raw_prospect_candidates
    - Referral: referral_messages, referrals
    - Retention: retention_campaign_logs, retention_results
    - Sales: sales_call_simulations
    - Scan: scan_benchmarks, scan_extracted_data, scan_ocr_results
*/

-- Public chat indexes
CREATE INDEX IF NOT EXISTS idx_public_chat_followups_session_id ON public_chat_followups(session_id);

-- Raw prospect indexes
CREATE INDEX IF NOT EXISTS idx_raw_prospect_candidates_user_id ON raw_prospect_candidates(user_id);

-- Referral indexes
CREATE INDEX IF NOT EXISTS idx_referral_messages_prospect_id ON referral_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_referral_messages_user_id ON referral_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON referrals(referrer_user_id);

-- Retention indexes
CREATE INDEX IF NOT EXISTS idx_retention_campaign_logs_playbook_id ON retention_campaign_logs(playbook_id);
CREATE INDEX IF NOT EXISTS idx_retention_results_playbook_id ON retention_results(playbook_id);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_call_simulations_user_id ON sales_call_simulations(user_id);

-- Scan indexes
CREATE INDEX IF NOT EXISTS idx_scan_benchmarks_user_id ON scan_benchmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_extracted_data_scan_id ON scan_extracted_data(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_ocr_results_scan_id ON scan_ocr_results(scan_id);
