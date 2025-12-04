/*
  # Add Foreign Key Indexes - Batch 4

  1. Performance Optimization
    - Continue adding indexes for unindexed foreign keys
    - Tables: member_performance_logs through processing_queue
*/

-- member_performance_logs
CREATE INDEX IF NOT EXISTS idx_member_performance_logs_downline_member_id_fkey ON public.member_performance_logs(downline_member_id);

-- message_sequences
CREATE INDEX IF NOT EXISTS idx_message_sequences_prospect_id_fkey ON public.message_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_message_sequences_user_id_fkey ON public.message_sequences(user_id);

-- mission_completions
CREATE INDEX IF NOT EXISTS idx_mission_completions_user_id_fkey ON public.mission_completions(user_id);

-- neural_behavior_scores
CREATE INDEX IF NOT EXISTS idx_neural_behavior_scores_user_id_fkey ON public.neural_behavior_scores(user_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_related_prospect_id_fkey ON public.notifications(related_prospect_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_sequence_id_fkey ON public.notifications(related_sequence_id);

-- objection_responses
CREATE INDEX IF NOT EXISTS idx_objection_responses_prospect_id_fkey ON public.objection_responses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_objection_responses_user_id_fkey ON public.objection_responses(user_id);

-- pain_point_analyses
CREATE INDEX IF NOT EXISTS idx_pain_point_analyses_prospect_id_fkey ON public.pain_point_analyses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_pain_point_analyses_user_id_fkey ON public.pain_point_analyses(user_id);

-- payment_history
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id_fkey ON public.payment_history(subscription_id);

-- pending_coin_transactions
CREATE INDEX IF NOT EXISTS idx_pending_coin_transactions_user_id_fkey ON public.pending_coin_transactions(user_id);

-- persona_learning_logs
CREATE INDEX IF NOT EXISTS idx_persona_learning_logs_user_id_fkey ON public.persona_learning_logs(user_id);

-- personality_profiles
CREATE INDEX IF NOT EXISTS idx_personality_profiles_prospect_id_fkey ON public.personality_profiles(prospect_id);
CREATE INDEX IF NOT EXISTS idx_personality_profiles_user_id_fkey ON public.personality_profiles(user_id);

-- pipeline_stage_changes
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_changes_prospect_id_fkey ON public.pipeline_stage_changes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_changes_user_id_fkey ON public.pipeline_stage_changes(user_id);

-- pitch_angle_recommendations
CREATE INDEX IF NOT EXISTS idx_pitch_angle_recommendations_prospect_id_fkey ON public.pitch_angle_recommendations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_pitch_angle_recommendations_user_id_fkey ON public.pitch_angle_recommendations(user_id);

-- pitch_decks
CREATE INDEX IF NOT EXISTS idx_pitch_decks_prospect_id_fkey ON public.pitch_decks(prospect_id);

-- platform_sync_logs
CREATE INDEX IF NOT EXISTS idx_platform_sync_logs_user_id_fkey ON public.platform_sync_logs(user_id);

-- processing_queue
CREATE INDEX IF NOT EXISTS idx_processing_queue_candidate_id_fkey ON public.processing_queue(candidate_id);
CREATE INDEX IF NOT EXISTS idx_processing_queue_session_id_fkey ON public.processing_queue(session_id);
CREATE INDEX IF NOT EXISTS idx_processing_queue_user_id_fkey ON public.processing_queue(user_id);
