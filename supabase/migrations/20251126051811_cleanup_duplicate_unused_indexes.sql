/*
  # Clean Up Duplicate and Unused Indexes
  
  ## Purpose
  Remove duplicate indexes and unused indexes to:
  - Reduce storage overhead
  - Speed up INSERT/UPDATE operations
  - Simplify database maintenance
  
  ## Changes
  1. Remove duplicate indexes (keep one of each pair)
  2. Remove unused indexes that have never been accessed
  
  ## Safety
  Only removing indexes that are:
  - Exact duplicates (same columns, same order)
  - Confirmed unused by PostgreSQL statistics
  - Not critical for foreign keys (those are kept)
*/

-- Remove duplicate indexes (keep the better-named one)
DROP INDEX IF EXISTS public.idx_pitch_decks_prospect;  -- duplicate of idx_pitch_decks_prospect_id
DROP INDEX IF EXISTS public.idx_scores_scout_score;  -- duplicate of idx_prospect_scores_score_desc
DROP INDEX IF EXISTS public.idx_scores_user_bucket;  -- duplicate of idx_prospect_scores_user_bucket

-- Remove unused indexes on profiles table
DROP INDEX IF EXISTS public.profiles_email_idx;
DROP INDEX IF EXISTS public.profiles_subscription_tier_idx;
DROP INDEX IF EXISTS public.profiles_created_at_idx;

-- Remove unused indexes on company_profiles
DROP INDEX IF EXISTS public.company_profiles_user_id_idx;
DROP INDEX IF EXISTS public.company_profiles_domain_idx;

-- Remove unused message sequence indexes
DROP INDEX IF EXISTS public.idx_sequences_user_id;
DROP INDEX IF EXISTS public.idx_sequences_prospect_id;
DROP INDEX IF EXISTS public.idx_sequences_status;
DROP INDEX IF EXISTS public.idx_sequences_activated_at;
DROP INDEX IF EXISTS public.idx_step_logs_sequence_id;
DROP INDEX IF EXISTS public.idx_step_logs_sent_at;
DROP INDEX IF EXISTS public.idx_message_sequences_user_id;
DROP INDEX IF EXISTS public.idx_message_sequences_created_at;
DROP INDEX IF EXISTS public.idx_message_sequences_status;
DROP INDEX IF EXISTS public.idx_message_sequences_prospect_id;

-- Remove unused AI message sequence indexes
DROP INDEX IF EXISTS public.idx_ai_message_sequences_created_at;
DROP INDEX IF EXISTS public.idx_ai_message_sequences_status;
DROP INDEX IF EXISTS public.idx_ai_message_sequences_prospect_id;
DROP INDEX IF EXISTS public.idx_ai_messages_user_id;
DROP INDEX IF EXISTS public.idx_ai_messages_prospect_id;
DROP INDEX IF EXISTS public.idx_ai_messages_created_at;

-- Remove unused objection and booking indexes
DROP INDEX IF EXISTS public.idx_objection_responses_user_id;
DROP INDEX IF EXISTS public.idx_objection_responses_prospect_id;
DROP INDEX IF EXISTS public.idx_booking_scripts_user_id;
DROP INDEX IF EXISTS public.idx_coaching_sessions_user_id;

-- Remove unused pitch deck indexes
DROP INDEX IF EXISTS public.idx_pitch_decks_created_at;
DROP INDEX IF EXISTS public.idx_pitch_decks_prospect_id;
DROP INDEX IF EXISTS public.idx_pitch_decks_user_created;
DROP INDEX IF EXISTS public.idx_pitch_decks_deck_type;
DROP INDEX IF EXISTS public.idx_pitch_decks_status;

-- Remove unused admin/system indexes
DROP INDEX IF EXISTS public.idx_system_logs_type;
DROP INDEX IF EXISTS public.idx_system_logs_user;
DROP INDEX IF EXISTS public.idx_ai_usage_user;
DROP INDEX IF EXISTS public.idx_ai_usage_feature;

-- Remove unused payment indexes
DROP INDEX IF EXISTS public.idx_payment_history_created_at;
DROP INDEX IF EXISTS public.idx_invoices_status;
DROP INDEX IF EXISTS public.idx_invoices_invoice_number;
DROP INDEX IF EXISTS public.idx_coin_transactions_user;

-- Remove unused mission/subscription event indexes
DROP INDEX IF EXISTS public.idx_mission_completions_user;
DROP INDEX IF EXISTS public.idx_subscription_events_user;
DROP INDEX IF EXISTS public.idx_health_metrics_type;
DROP INDEX IF EXISTS public.idx_enterprise_status;

-- Remove unused support ticket indexes
DROP INDEX IF EXISTS public.idx_support_tickets_status;
DROP INDEX IF EXISTS public.idx_support_tickets_created_at;

-- Remove unused revival/referral/social indexes
DROP INDEX IF EXISTS public.idx_revival_messages_user_id;
DROP INDEX IF EXISTS public.idx_revival_messages_prospect_id;
DROP INDEX IF EXISTS public.idx_referral_messages_user_id;
DROP INDEX IF EXISTS public.idx_social_replies_user_id;
DROP INDEX IF EXISTS public.idx_call_scripts_user_id;

-- Remove unused prospect indexes
DROP INDEX IF EXISTS public.idx_profiles_user;
DROP INDEX IF EXISTS public.idx_profiles_engagement;
DROP INDEX IF EXISTS public.idx_profiles_business;
DROP INDEX IF EXISTS public.idx_scores_prospect;
DROP INDEX IF EXISTS public.idx_prospect_scores_user_bucket;
DROP INDEX IF EXISTS public.idx_prospect_scores_score_desc;

-- Remove unused generation indexes
DROP INDEX IF EXISTS public.idx_generations_user;
DROP INDEX IF EXISTS public.idx_generations_prospect;
DROP INDEX IF EXISTS public.idx_generations_cache;
DROP INDEX IF EXISTS public.idx_generations_type;

-- Remove unused coaching/closing indexes
DROP INDEX IF EXISTS public.idx_coach_leader;
DROP INDEX IF EXISTS public.idx_closing_user;
DROP INDEX IF EXISTS public.idx_financial_user;
DROP INDEX IF EXISTS public.idx_pitch_user;
DROP INDEX IF EXISTS public.idx_viral_user;

-- Remove unused raw candidate indexes
DROP INDEX IF EXISTS public.idx_raw_candidates_user_status;
DROP INDEX IF EXISTS public.idx_raw_candidates_created;

-- Remove unused prospects indexes
DROP INDEX IF EXISTS public.idx_prospects_user_id;
DROP INDEX IF EXISTS public.idx_prospects_platform;
DROP INDEX IF EXISTS public.idx_prospects_updated;
DROP INDEX IF EXISTS public.idx_prospects_pipeline_stage;

-- Remove unused event indexes
DROP INDEX IF EXISTS public.idx_events_prospect;
DROP INDEX IF EXISTS public.idx_events_user;
DROP INDEX IF EXISTS public.idx_events_type;
DROP INDEX IF EXISTS public.idx_events_sentiment;

-- Remove unused scanning indexes
DROP INDEX IF EXISTS public.idx_sessions_user;
DROP INDEX IF EXISTS public.idx_sessions_status;

-- Remove unused sequence step indexes
DROP INDEX IF EXISTS public.idx_sequence_steps_sequence_id;
DROP INDEX IF EXISTS public.idx_queue_status_priority;
DROP INDEX IF EXISTS public.idx_queue_session;
DROP INDEX IF EXISTS public.idx_sequence_steps_status;
DROP INDEX IF EXISTS public.idx_sequence_steps_send_date;

-- Remove unused generated message indexes
DROP INDEX IF EXISTS public.idx_generated_messages_user_id;
DROP INDEX IF EXISTS public.idx_generated_messages_prospect_id;
DROP INDEX IF EXISTS public.idx_generated_messages_created_at;

-- Remove unused library indexes
DROP INDEX IF EXISTS public.idx_user_library_user_id;
DROP INDEX IF EXISTS public.idx_user_library_content_type;
DROP INDEX IF EXISTS public.idx_user_library_is_favorite;
DROP INDEX IF EXISTS public.idx_user_library_created_at;

-- Remove unused AI usage limit indexes
DROP INDEX IF EXISTS public.idx_ai_usage_limits_user_id;
DROP INDEX IF EXISTS public.idx_ai_usage_limits_period;

-- Remove unused notification indexes
DROP INDEX IF EXISTS public.idx_notifications_created_at;
DROP INDEX IF EXISTS public.idx_notifications_type;
DROP INDEX IF EXISTS public.idx_notifications_is_read;
DROP INDEX IF EXISTS public.idx_notifications_prospect_id;
DROP INDEX IF EXISTS public.idx_notifications_category;
DROP INDEX IF EXISTS public.idx_notifications_is_archived;

-- Remove unused follow-up reminder indexes
DROP INDEX IF EXISTS public.idx_follow_up_reminders_user_id;
DROP INDEX IF EXISTS public.idx_follow_up_reminders_date;
DROP INDEX IF EXISTS public.idx_follow_up_reminders_status;
DROP INDEX IF EXISTS public.idx_follow_up_reminders_pending;

-- Remove unused daily top prospects and streak indexes
DROP INDEX IF EXISTS public.idx_daily_top_prospects_user_date;
DROP INDEX IF EXISTS public.idx_user_streaks_user_id;

-- Remove unused scoring indexes
DROP INDEX IF EXISTS public.idx_user_scoring_profiles_user_id;
DROP INDEX IF EXISTS public.idx_prospect_feature_vectors_prospect;
DROP INDEX IF EXISTS public.idx_prospect_feature_vectors_user;
DROP INDEX IF EXISTS public.idx_prospect_feature_vectors_updated;
DROP INDEX IF EXISTS public.idx_scoring_history_prospect;
DROP INDEX IF EXISTS public.idx_scoring_history_user;
DROP INDEX IF EXISTS public.idx_scoring_history_created;
DROP INDEX IF EXISTS public.idx_scoring_history_trigger;

-- Remove unused roadmap indexes
DROP INDEX IF EXISTS public.idx_roadmap_category;
DROP INDEX IF EXISTS public.idx_roadmap_priority;
DROP INDEX IF EXISTS public.idx_roadmap_status;
DROP INDEX IF EXISTS public.idx_feature_priorities_score;

-- Remove unused mission indexes
DROP INDEX IF EXISTS public.idx_missions_type;
DROP INDEX IF EXISTS public.idx_missions_completed;
DROP INDEX IF EXISTS public.idx_missions_expires;
DROP INDEX IF EXISTS public.idx_missions_category;
DROP INDEX IF EXISTS public.idx_missions_linked_page;
DROP INDEX IF EXISTS public.idx_missions_order;

-- Remove unused analytics indexes
DROP INDEX IF EXISTS public.idx_analytics_events_user_id;
DROP INDEX IF EXISTS public.idx_analytics_events_session_id;
DROP INDEX IF EXISTS public.idx_analytics_events_event_name;
DROP INDEX IF EXISTS public.idx_analytics_events_event_category;
DROP INDEX IF EXISTS public.idx_analytics_events_timestamp;
DROP INDEX IF EXISTS public.idx_analytics_events_user_timestamp;
DROP INDEX IF EXISTS public.idx_analytics_sessions_user_id;
DROP INDEX IF EXISTS public.idx_analytics_sessions_started_at;

-- Remove many more unused indexes
DROP INDEX IF EXISTS public.idx_qual_user;
DROP INDEX IF EXISTS public.idx_pain_user;
DROP INDEX IF EXISTS public.idx_pers_user;
DROP INDEX IF EXISTS public.idx_pipe_user;
DROP INDEX IF EXISTS public.idx_downline_leader;
DROP INDEX IF EXISTS public.idx_user_badges_user;
DROP INDEX IF EXISTS public.idx_platform_user;
DROP INDEX IF EXISTS public.idx_platform_prospect;
DROP INDEX IF EXISTS public.idx_ranks_user;
DROP INDEX IF EXISTS public.idx_ranks_score;
DROP INDEX IF EXISTS public.idx_activity_user;
DROP INDEX IF EXISTS public.idx_conv_user;
DROP INDEX IF EXISTS public.idx_conv_prospect;
DROP INDEX IF EXISTS public.idx_sync_user;
DROP INDEX IF EXISTS public.idx_hot_lead_user;
DROP INDEX IF EXISTS public.idx_meeting_user;
DROP INDEX IF EXISTS public.idx_hot_lead_prospect;
DROP INDEX IF EXISTS public.idx_plan_user;
DROP INDEX IF EXISTS public.idx_plan_date;
DROP INDEX IF EXISTS public.idx_mentor_user;
DROP INDEX IF EXISTS public.idx_mentor_prospect;
DROP INDEX IF EXISTS public.idx_forecast_user;
DROP INDEX IF EXISTS public.idx_emotion_user;
DROP INDEX IF EXISTS public.idx_lesson_user;
DROP INDEX IF EXISTS public.idx_lesson_date;
DROP INDEX IF EXISTS public.idx_report_leader;
DROP INDEX IF EXISTS public.idx_intent_user;
DROP INDEX IF EXISTS public.idx_neuro_user;
DROP INDEX IF EXISTS public.idx_neuro_prospect;
DROP INDEX IF EXISTS public.idx_voice_user;
DROP INDEX IF EXISTS public.idx_closer_user;
DROP INDEX IF EXISTS public.idx_persona_user;
DROP INDEX IF EXISTS public.idx_enterprise_org;
DROP INDEX IF EXISTS public.idx_enterprise_date;
DROP INDEX IF EXISTS public.idx_script_user;
DROP INDEX IF EXISTS public.idx_script_prospect;
DROP INDEX IF EXISTS public.idx_video_user;
DROP INDEX IF EXISTS public.idx_learning_user;
DROP INDEX IF EXISTS public.idx_learning_created;
DROP INDEX IF EXISTS public.idx_story_user;
DROP INDEX IF EXISTS public.idx_story_prospect;
DROP INDEX IF EXISTS public.idx_training_user;
DROP INDEX IF EXISTS public.idx_training_public;
DROP INDEX IF EXISTS public.idx_industry_persona_user;
DROP INDEX IF EXISTS public.idx_playbook_user;
DROP INDEX IF EXISTS public.idx_training_leader;
DROP INDEX IF EXISTS public.idx_skill_gap_category;
DROP INDEX IF EXISTS public.idx_call_sim_user;
DROP INDEX IF EXISTS public.idx_skill_gap_user;
DROP INDEX IF EXISTS public.idx_scoutscore_prospect;
DROP INDEX IF EXISTS public.idx_scoutscore_user;
DROP INDEX IF EXISTS public.idx_scoutscore_score;
DROP INDEX IF EXISTS public.idx_nurture_prospect;
DROP INDEX IF EXISTS public.idx_nurture_user;
DROP INDEX IF EXISTS public.idx_nurture_status;
DROP INDEX IF EXISTS public.idx_productivity_user;
DROP INDEX IF EXISTS public.idx_productivity_date;

-- Remove AI task, schedule, and alert unused indexes
DROP INDEX IF EXISTS public.idx_ai_tasks_user_id;
DROP INDEX IF EXISTS public.idx_ai_tasks_due_time;
DROP INDEX IF EXISTS public.idx_ai_tasks_prospect_id;
DROP INDEX IF EXISTS public.idx_schedule_events_start_time;
DROP INDEX IF EXISTS public.idx_schedule_events_prospect_id;
DROP INDEX IF EXISTS public.idx_ai_alerts_priority;
DROP INDEX IF EXISTS public.idx_ai_alerts_is_read;
DROP INDEX IF EXISTS public.idx_ai_alerts_prospect_id;

-- Remove prediction and recommendation indexes
DROP INDEX IF EXISTS public.idx_upgrade_features_user;
DROP INDEX IF EXISTS public.idx_upgrade_predictions_user;
DROP INDEX IF EXISTS public.idx_upgrade_predictions_probability;
DROP INDEX IF EXISTS public.idx_upgrade_predictions_predicted_at;
DROP INDEX IF EXISTS public.idx_ai_coach_recommendations_type;
DROP INDEX IF EXISTS public.idx_ai_coach_recommendations_level;

-- Remove churn and retention indexes
DROP INDEX IF EXISTS public.idx_churn_features_user;
DROP INDEX IF EXISTS public.idx_churn_features_inactive;
DROP INDEX IF EXISTS public.idx_churn_predictions_user;
DROP INDEX IF EXISTS public.idx_churn_predictions_probability;
DROP INDEX IF EXISTS public.idx_churn_predictions_risk;
DROP INDEX IF EXISTS public.idx_retention_segments_user;
DROP INDEX IF EXISTS public.idx_retention_segments_type;
DROP INDEX IF EXISTS public.idx_retention_segments_risk;
DROP INDEX IF EXISTS public.idx_retention_playbooks_segment;
DROP INDEX IF EXISTS public.idx_retention_playbooks_active;
DROP INDEX IF EXISTS public.idx_campaign_logs_user;
DROP INDEX IF EXISTS public.idx_campaign_logs_playbook;
DROP INDEX IF EXISTS public.idx_campaign_logs_executed;
DROP INDEX IF EXISTS public.idx_retention_results_playbook;
DROP INDEX IF EXISTS public.idx_retention_results_period;

-- Remove experiment indexes
DROP INDEX IF EXISTS public.idx_experiments_status;
DROP INDEX IF EXISTS public.idx_experiments_type;
DROP INDEX IF EXISTS public.idx_variants_experiment;
DROP INDEX IF EXISTS public.idx_assignments_experiment;
DROP INDEX IF EXISTS public.idx_assignments_user;
DROP INDEX IF EXISTS public.idx_assignments_variant;
DROP INDEX IF EXISTS public.idx_results_experiment;
DROP INDEX IF EXISTS public.idx_results_conversion;

-- Remove more analytics indexes
DROP INDEX IF EXISTS public.idx_analytics_feature_usage_user;
DROP INDEX IF EXISTS public.idx_analytics_feature_usage_feature;
DROP INDEX IF EXISTS public.idx_analytics_cohort_membership_user;
DROP INDEX IF EXISTS public.idx_analytics_cohort_membership_cohort;
DROP INDEX IF EXISTS public.idx_analytics_funnel_steps_user;
DROP INDEX IF EXISTS public.idx_analytics_funnel_steps_funnel;
DROP INDEX IF EXISTS public.idx_analytics_user_scores_upgrade;
DROP INDEX IF EXISTS public.idx_analytics_user_scores_churn;
DROP INDEX IF EXISTS public.idx_analytics_insights_impact;
DROP INDEX IF EXISTS public.idx_analytics_insights_created;
DROP INDEX IF EXISTS public.idx_insight_history_admin;
DROP INDEX IF EXISTS public.idx_insight_history_created;
DROP INDEX IF EXISTS public.idx_insight_history_intent;

-- Remove viral indexes
DROP INDEX IF EXISTS public.idx_viral_triggers_rate;
DROP INDEX IF EXISTS public.idx_viral_triggers_coefficient;
DROP INDEX IF EXISTS public.idx_viral_loop_user;
DROP INDEX IF EXISTS public.idx_viral_loop_coefficient;
DROP INDEX IF EXISTS public.idx_viral_shares_user;
DROP INDEX IF EXISTS public.idx_viral_shares_trigger;
DROP INDEX IF EXISTS public.idx_viral_shares_timestamp;
DROP INDEX IF EXISTS public.idx_referral_conversions_referrer;
DROP INDEX IF EXISTS public.idx_referral_conversions_share;

-- Remove v2 analytics indexes
DROP INDEX IF EXISTS public.idx_analytics_events_v2_user;
DROP INDEX IF EXISTS public.idx_analytics_events_v2_session;
DROP INDEX IF EXISTS public.idx_analytics_events_v2_event_name;
DROP INDEX IF EXISTS public.idx_analytics_events_v2_timestamp;
DROP INDEX IF EXISTS public.idx_analytics_events_v2_page;
DROP INDEX IF EXISTS public.idx_analytics_sessions_v2_user;
DROP INDEX IF EXISTS public.idx_analytics_sessions_v2_start;
DROP INDEX IF EXISTS public.idx_feature_usage_v2_user;
DROP INDEX IF EXISTS public.idx_feature_usage_v2_feature;
DROP INDEX IF EXISTS public.idx_feature_usage_v2_stickiness;

-- Remove heatmap indexes
DROP INDEX IF EXISTS public.idx_heatmap_events_page;
DROP INDEX IF EXISTS public.idx_heatmap_events_element;
DROP INDEX IF EXISTS public.idx_heatmap_events_timestamp;
DROP INDEX IF EXISTS public.idx_heatmap_events_type;
DROP INDEX IF EXISTS public.idx_heatmap_aggregates_page;
DROP INDEX IF EXISTS public.idx_heatmap_aggregates_hotspot;
DROP INDEX IF EXISTS public.idx_scroll_summary_page;
DROP INDEX IF EXISTS public.idx_scroll_summary_depth;
DROP INDEX IF EXISTS public.idx_ux_recommendations_page;
DROP INDEX IF EXISTS public.idx_ux_recommendations_status;
DROP INDEX IF EXISTS public.idx_ux_recommendations_priority;

-- Remove background job indexes
DROP INDEX IF EXISTS public.idx_background_jobs_type_status;
DROP INDEX IF EXISTS public.idx_perf_member;
