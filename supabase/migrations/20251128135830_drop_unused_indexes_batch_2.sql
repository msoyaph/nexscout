/*
  # Drop Unused Indexes - Batch 2

  1. Purpose
    - Continue dropping unused indexes
  
  2. Indexes Dropped
    - Browser, call scripts, coaching, coins (next 30)
*/

DROP INDEX IF EXISTS idx_browser_capture_events_user_id_fkey;
DROP INDEX IF EXISTS idx_browser_extension_tokens_user_id_fkey;
DROP INDEX IF EXISTS idx_call_scripts_prospect_id_fkey;
DROP INDEX IF EXISTS idx_call_scripts_user_id_fkey;
DROP INDEX IF EXISTS idx_closing_scripts_prospect_id_fkey;
DROP INDEX IF EXISTS idx_closing_scripts_user_id_fkey;
DROP INDEX IF EXISTS idx_coaching_sessions_downline_member_id_fkey;
DROP INDEX IF EXISTS idx_coaching_sessions_leader_user_id_fkey;
DROP INDEX IF EXISTS idx_coin_transactions_user_id_fkey;
DROP INDEX IF EXISTS idx_contact_behavior_timeline_user_id_fkey;
DROP INDEX IF EXISTS idx_conversation_analyses_prospect_id_fkey;
DROP INDEX IF EXISTS idx_conversation_analyses_user_id_fkey;
DROP INDEX IF EXISTS idx_csv_validation_logs_user_id_fkey;
DROP INDEX IF EXISTS idx_deal_timeline_forecasts_prospect_id_fkey;
DROP INDEX IF EXISTS idx_deal_timeline_forecasts_user_id_fkey;
DROP INDEX IF EXISTS idx_diagnostic_logs_user_id_fkey;
DROP INDEX IF EXISTS idx_downline_members_leader_user_id_fkey;
DROP INDEX IF EXISTS idx_downline_members_member_user_id_fkey;
DROP INDEX IF EXISTS idx_elite_coaching_sessions_prospect_id_fkey;
DROP INDEX IF EXISTS idx_elite_coaching_sessions_user_id_fkey;
DROP INDEX IF EXISTS idx_emotion_enhanced_messages_prospect_id_fkey;
DROP INDEX IF EXISTS idx_emotion_enhanced_messages_user_id_fkey;
DROP INDEX IF EXISTS idx_emotional_state_analyses_prospect_id_fkey;
DROP INDEX IF EXISTS idx_emotional_state_analyses_user_id_fkey;
DROP INDEX IF EXISTS idx_enterprise_organizations_admin_user_id_fkey;
DROP INDEX IF EXISTS idx_experiment_assignments_variant_id_fkey;
DROP INDEX IF EXISTS idx_experiment_results_variant_id_fkey;
DROP INDEX IF EXISTS idx_experiment_variants_experiment_id_fkey;
DROP INDEX IF EXISTS idx_financial_profiles_prospect_id_fkey;
DROP INDEX IF EXISTS idx_financial_profiles_user_id_fkey;
