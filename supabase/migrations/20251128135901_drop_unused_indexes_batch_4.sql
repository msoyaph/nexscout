/*
  # Drop Unused Indexes - Batch 4

  1. Purpose
    - Continue dropping unused indexes
  
  2. Indexes Dropped
    - Neural, notifications, objections, pain points, payments (next 30)
*/

DROP INDEX IF EXISTS idx_neural_behavior_scores_user_id_fkey;
DROP INDEX IF EXISTS idx_notifications_related_prospect_id_fkey;
DROP INDEX IF EXISTS idx_notifications_related_sequence_id_fkey;
DROP INDEX IF EXISTS idx_objection_responses_prospect_id_fkey;
DROP INDEX IF EXISTS idx_objection_responses_user_id_fkey;
DROP INDEX IF EXISTS idx_pain_point_analyses_prospect_id_fkey;
DROP INDEX IF EXISTS idx_pain_point_analyses_user_id_fkey;
DROP INDEX IF EXISTS idx_payment_history_subscription_id_fkey;
DROP INDEX IF EXISTS idx_pending_coin_transactions_user_id_fkey;
DROP INDEX IF EXISTS idx_persona_learning_logs_user_id_fkey;
DROP INDEX IF EXISTS idx_personality_profiles_prospect_id_fkey;
DROP INDEX IF EXISTS idx_personality_profiles_user_id_fkey;
DROP INDEX IF EXISTS idx_pipeline_stage_changes_prospect_id_fkey;
DROP INDEX IF EXISTS idx_pipeline_stage_changes_user_id_fkey;
DROP INDEX IF EXISTS idx_pitch_angle_recommendations_prospect_id_fkey;
DROP INDEX IF EXISTS idx_pitch_angle_recommendations_user_id_fkey;
DROP INDEX IF EXISTS idx_pitch_decks_prospect_id_fkey;
DROP INDEX IF EXISTS idx_platform_sync_logs_user_id_fkey;
DROP INDEX IF EXISTS idx_processing_queue_candidate_id_fkey;
DROP INDEX IF EXISTS idx_processing_queue_session_id_fkey;
DROP INDEX IF EXISTS idx_processing_queue_user_id_fkey;
DROP INDEX IF EXISTS idx_company_profiles_share_token;
DROP INDEX IF EXISTS idx_prospect_behavior_summary_user_id_fkey;
DROP INDEX IF EXISTS idx_prospect_events_prospect_id_fkey;
DROP INDEX IF EXISTS idx_prospect_events_user_id_fkey;
DROP INDEX IF EXISTS idx_prospect_feature_vectors_user_id_fkey;
DROP INDEX IF EXISTS idx_prospect_platform_sources_user_id_fkey;
DROP INDEX IF EXISTS idx_prospect_profiles_user_id_fkey;
DROP INDEX IF EXISTS idx_prospect_qualifications_prospect_id_fkey;
DROP INDEX IF EXISTS idx_prospect_qualifications_user_id_fkey;
