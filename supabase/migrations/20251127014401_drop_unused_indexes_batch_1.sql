/*
  # Drop Unused Indexes - Batch 1

  1. Performance Optimization
    - Remove indexes that have not been used
    - Reduces database bloat
    - Improves write performance
    - Frees up storage space

  2. Indexes Dropped (50 indexes)
    - Various unused indexes across multiple tables
*/

DROP INDEX IF EXISTS public.idx_agent_skill_gaps_user_id;
DROP INDEX IF EXISTS public.idx_ai_alerts_prospect_id;
DROP INDEX IF EXISTS public.idx_ai_closer_sessions_user_id;
DROP INDEX IF EXISTS public.idx_ai_closer_sessions_prospect_id;
DROP INDEX IF EXISTS public.idx_ai_generated_messages_prospect_id;
DROP INDEX IF EXISTS public.idx_ai_generated_messages_user_id;
DROP INDEX IF EXISTS public.idx_ai_generations_prospect_id;
DROP INDEX IF EXISTS public.idx_ai_generations_user_id;
DROP INDEX IF EXISTS public.idx_ai_generations_type;
DROP INDEX IF EXISTS public.idx_ai_generations_created_at;
DROP INDEX IF EXISTS public.idx_ai_mentor_sessions_prospect_id;
DROP INDEX IF EXISTS public.idx_ai_mentor_sessions_user_id;
DROP INDEX IF EXISTS public.idx_ai_message_sequences_prospect_id;
DROP INDEX IF EXISTS public.idx_ai_message_sequences_share_token;
DROP INDEX IF EXISTS public.idx_ai_message_sequences_group_id;
DROP INDEX IF EXISTS public.idx_ai_tasks_prospect_id;
DROP INDEX IF EXISTS public.idx_ai_usage_logs_user_id;
DROP INDEX IF EXISTS public.idx_ai_usage_logs_created_at;
DROP INDEX IF EXISTS public.idx_analytics_cohort_membership_cohort_id;
DROP INDEX IF EXISTS public.idx_analytics_events_user_id;
DROP INDEX IF EXISTS public.idx_analytics_funnel_steps_funnel_id;
DROP INDEX IF EXISTS public.idx_analytics_funnel_steps_user_id;
DROP INDEX IF EXISTS public.idx_analytics_sessions_user_id;
DROP INDEX IF EXISTS public.idx_call_scripts_user_id;
DROP INDEX IF EXISTS public.idx_call_scripts_prospect_id;
DROP INDEX IF EXISTS public.idx_closing_scripts_user_id;
DROP INDEX IF EXISTS public.idx_closing_scripts_prospect_id;
DROP INDEX IF EXISTS public.idx_coaching_sessions_leader_user_id;
DROP INDEX IF EXISTS public.idx_coaching_sessions_downline_member_id;
DROP INDEX IF EXISTS public.idx_coin_transactions_user_id;
DROP INDEX IF EXISTS public.idx_coin_transactions_reference_id;
DROP INDEX IF EXISTS public.idx_conversation_analyses_prospect_id;
DROP INDEX IF EXISTS public.idx_conversation_analyses_user_id;
DROP INDEX IF EXISTS public.idx_deal_timeline_forecasts_user_id;
DROP INDEX IF EXISTS public.idx_deal_timeline_forecasts_prospect_id;
DROP INDEX IF EXISTS public.idx_downline_members_leader_user_id;
DROP INDEX IF EXISTS public.idx_downline_members_member_user_id;
DROP INDEX IF EXISTS public.idx_elite_coaching_sessions_user_id;
DROP INDEX IF EXISTS public.idx_elite_coaching_sessions_prospect_id;
DROP INDEX IF EXISTS public.idx_emotional_state_analyses_user_id;
DROP INDEX IF EXISTS public.idx_emotional_state_analyses_prospect_id;
DROP INDEX IF EXISTS public.idx_emotion_enhanced_messages_prospect_id;
DROP INDEX IF EXISTS public.idx_emotion_enhanced_messages_user_id;
DROP INDEX IF EXISTS public.idx_experiment_assignments_variant_id;
DROP INDEX IF EXISTS public.idx_experiment_variants_experiment_id;
DROP INDEX IF EXISTS public.idx_experiment_results_variant_id;
DROP INDEX IF EXISTS public.idx_financial_profiles_user_id;
DROP INDEX IF EXISTS public.idx_financial_profiles_prospect_id;
DROP INDEX IF EXISTS public.idx_follow_up_reminders_user_id;
DROP INDEX IF EXISTS public.idx_follow_up_reminders_prospect_id;
