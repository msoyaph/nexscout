/*
  # Drop Unused Indexes - Batch 3

  1. Performance Optimization
    - Continue removing unused indexes
*/

DROP INDEX IF EXISTS public.idx_prospect_qualifications_prospect_id;
DROP INDEX IF EXISTS public.idx_prospect_qualifications_user_id;
DROP INDEX IF EXISTS public.idx_prospect_scores_prospect_id;
DROP INDEX IF EXISTS public.idx_prospect_scores_user_id;
DROP INDEX IF EXISTS public.idx_prospects_avatar_seed;
DROP INDEX IF EXISTS public.idx_raw_prospect_candidates_user_id;
DROP INDEX IF EXISTS public.idx_referral_messages_prospect_id;
DROP INDEX IF EXISTS public.idx_referral_messages_user_id;
DROP INDEX IF EXISTS public.idx_referral_codes_code;
DROP INDEX IF EXISTS public.idx_referrals_referrer_user_id;
DROP INDEX IF EXISTS public.idx_referrals_referred_user_id;
DROP INDEX IF EXISTS public.idx_referrals_code;
DROP INDEX IF EXISTS public.idx_referrals_status;
DROP INDEX IF EXISTS public.idx_retention_campaign_logs_playbook_id;
DROP INDEX IF EXISTS public.idx_retention_results_playbook_id;
DROP INDEX IF EXISTS public.idx_sales_call_simulations_user_id;
DROP INDEX IF EXISTS public.idx_scanning_sessions_user_id;
DROP INDEX IF EXISTS public.idx_schedule_events_prospect_id;
DROP INDEX IF EXISTS public.idx_scoring_history_prospect_id;
DROP INDEX IF EXISTS public.idx_scoring_history_user_id;
DROP INDEX IF EXISTS public.idx_scoutscore_calculations_prospect_id;
DROP INDEX IF EXISTS public.idx_scoutscore_calculations_user_id;
DROP INDEX IF EXISTS public.idx_sequence_step_logs_sequence_id;
DROP INDEX IF EXISTS public.idx_sequence_step_logs_user_id;
DROP INDEX IF EXISTS public.idx_social_intent_predictions_prospect_id;
DROP INDEX IF EXISTS public.idx_social_intent_predictions_user_id;
DROP INDEX IF EXISTS public.idx_social_media_replies_prospect_id;
DROP INDEX IF EXISTS public.idx_social_media_replies_user_id;
DROP INDEX IF EXISTS public.idx_story_messages_prospect_id;
DROP INDEX IF EXISTS public.idx_story_messages_user_id;
DROP INDEX IF EXISTS public.idx_subscription_events_user_id;
DROP INDEX IF EXISTS public.idx_system_logs_user_id;
DROP INDEX IF EXISTS public.idx_team_training_programs_leader_id;
DROP INDEX IF EXISTS public.idx_training_video_modules_user_id;
DROP INDEX IF EXISTS public.idx_user_activity_logs_user_id;
DROP INDEX IF EXISTS public.idx_user_library_user_id;
DROP INDEX IF EXISTS public.idx_video_pitch_scripts_user_id;
DROP INDEX IF EXISTS public.idx_viral_referral_conversions_share_event_id;
DROP INDEX IF EXISTS public.idx_viral_share_messages_user_id;
DROP INDEX IF EXISTS public.idx_viral_video_scripts_user_id;
DROP INDEX IF EXISTS public.idx_voice_note_analyses_user_id;
DROP INDEX IF EXISTS public.idx_voice_note_analyses_prospect_id;
DROP INDEX IF EXISTS public.idx_social_contacts_user_id;
DROP INDEX IF EXISTS public.idx_social_contacts_platform;
DROP INDEX IF EXISTS public.idx_social_contacts_user_platform;
DROP INDEX IF EXISTS public.idx_social_contacts_prospect_id;
DROP INDEX IF EXISTS public.idx_social_contacts_is_prospect;
DROP INDEX IF EXISTS public.idx_social_contacts_username;
DROP INDEX IF EXISTS public.idx_social_edges_user_id;
DROP INDEX IF EXISTS public.idx_social_edges_from_contact;
