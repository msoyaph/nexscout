/*
  # Drop Unused Indexes - Batch 2

  1. Performance Optimization
    - Continue removing unused indexes
*/

DROP INDEX IF EXISTS public.idx_follow_up_reminders_notification_id;
DROP INDEX IF EXISTS public.idx_follow_up_reminders_sequence_id;
DROP INDEX IF EXISTS public.idx_follow_up_sequences_prospect_id;
DROP INDEX IF EXISTS public.idx_follow_up_sequences_user_id;
DROP INDEX IF EXISTS public.idx_generated_messages_prospect_id;
DROP INDEX IF EXISTS public.idx_generated_messages_user_id;
DROP INDEX IF EXISTS public.idx_generated_scripts_prospect_id;
DROP INDEX IF EXISTS public.idx_generated_scripts_user_id;
DROP INDEX IF EXISTS public.idx_hot_lead_accelerations_prospect_id;
DROP INDEX IF EXISTS public.idx_hot_lead_accelerations_user_id;
DROP INDEX IF EXISTS public.idx_insight_assistant_history_admin_user_id;
DROP INDEX IF EXISTS public.idx_lead_nurture_pathways_prospect_id;
DROP INDEX IF EXISTS public.idx_lead_nurture_pathways_user_id;
DROP INDEX IF EXISTS public.idx_lead_revival_messages_prospect_id;
DROP INDEX IF EXISTS public.idx_lead_revival_messages_user_id;
DROP INDEX IF EXISTS public.idx_leadership_playbooks_user_id;
DROP INDEX IF EXISTS public.idx_meeting_booking_scripts_user_id;
DROP INDEX IF EXISTS public.idx_meeting_booking_scripts_prospect_id;
DROP INDEX IF EXISTS public.idx_meeting_predictions_user_id;
DROP INDEX IF EXISTS public.idx_meeting_predictions_prospect_id;
DROP INDEX IF EXISTS public.idx_member_performance_logs_downline_member_id;
DROP INDEX IF EXISTS public.idx_message_sequences_prospect_id;
DROP INDEX IF EXISTS public.idx_message_sequences_user_id;
DROP INDEX IF EXISTS public.idx_mission_completions_user_id;
DROP INDEX IF EXISTS public.idx_neural_behavior_scores_user_id;
DROP INDEX IF EXISTS public.idx_notifications_related_prospect_id;
DROP INDEX IF EXISTS public.idx_notifications_related_sequence_id;
DROP INDEX IF EXISTS public.idx_objection_responses_prospect_id;
DROP INDEX IF EXISTS public.idx_objection_responses_user_id;
DROP INDEX IF EXISTS public.idx_pain_point_analyses_user_id;
DROP INDEX IF EXISTS public.idx_pain_point_analyses_prospect_id;
DROP INDEX IF EXISTS public.idx_personality_profiles_prospect_id;
DROP INDEX IF EXISTS public.idx_personality_profiles_user_id;
DROP INDEX IF EXISTS public.idx_persona_learning_logs_user_id;
DROP INDEX IF EXISTS public.idx_pipeline_stage_changes_prospect_id;
DROP INDEX IF EXISTS public.idx_pipeline_stage_changes_user_id;
DROP INDEX IF EXISTS public.idx_pitch_angle_recommendations_prospect_id;
DROP INDEX IF EXISTS public.idx_pitch_angle_recommendations_user_id;
DROP INDEX IF EXISTS public.idx_pitch_decks_prospect_id;
DROP INDEX IF EXISTS public.idx_pitch_decks_share_token;
DROP INDEX IF EXISTS public.idx_pitch_decks_group_id;
DROP INDEX IF EXISTS public.idx_platform_sync_logs_user_id;
DROP INDEX IF EXISTS public.idx_processing_queue_session_id;
DROP INDEX IF EXISTS public.idx_processing_queue_candidate_id;
DROP INDEX IF EXISTS public.idx_processing_queue_user_id;
DROP INDEX IF EXISTS public.idx_prospect_events_prospect_id;
DROP INDEX IF EXISTS public.idx_prospect_events_user_id;
DROP INDEX IF EXISTS public.idx_prospect_feature_vectors_user_id;
DROP INDEX IF EXISTS public.idx_prospect_platform_sources_user_id;
DROP INDEX IF EXISTS public.idx_prospect_profiles_user_id;
