/*
  # Add Missing Foreign Key Indexes for Performance
  
  ## Purpose
  This migration adds indexes to all foreign key columns that currently lack covering indexes.
  Foreign key columns without indexes can cause severe performance degradation during:
  - JOIN operations
  - CASCADE deletes/updates
  - Foreign key constraint checks
  
  ## Changes
  Creates indexes on 50+ foreign key columns across multiple tables including:
  - admin_users (role_id, user_id)
  - analytics tables (experiment_id, variant_id, etc.)
  - prospect-related tables (prospect_id)
  - user-related tables (user_id)
  - notification and messaging tables
  
  ## Performance Impact
  - Improves query performance on foreign key lookups
  - Speeds up CASCADE operations
  - Reduces lock contention on related tables
*/

-- Admin tables
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON public.admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- AI and prospect-related tables
CREATE INDEX IF NOT EXISTS idx_ai_closer_sessions_prospect_id ON public.ai_closer_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_call_scripts_prospect_id ON public.call_scripts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_closing_scripts_prospect_id ON public.closing_scripts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_downline_member_id ON public.coaching_sessions(downline_member_id);
CREATE INDEX IF NOT EXISTS idx_deal_timeline_forecasts_prospect_id ON public.deal_timeline_forecasts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_elite_coaching_sessions_prospect_id ON public.elite_coaching_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_emotion_enhanced_messages_prospect_id ON public.emotion_enhanced_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_emotion_enhanced_messages_user_id ON public.emotion_enhanced_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_state_analyses_prospect_id ON public.emotional_state_analyses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_financial_profiles_prospect_id ON public.financial_profiles(prospect_id);
CREATE INDEX IF NOT EXISTS idx_meeting_booking_scripts_prospect_id ON public.meeting_booking_scripts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_meeting_predictions_prospect_id ON public.meeting_predictions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_pain_point_analyses_prospect_id ON public.pain_point_analyses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_personality_profiles_prospect_id ON public.personality_profiles(prospect_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_changes_prospect_id ON public.pipeline_stage_changes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_pitch_angle_recommendations_prospect_id ON public.pitch_angle_recommendations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_qualifications_prospect_id ON public.prospect_qualifications(prospect_id);
CREATE INDEX IF NOT EXISTS idx_referral_messages_prospect_id ON public.referral_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_social_intent_predictions_prospect_id ON public.social_intent_predictions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_social_media_replies_prospect_id ON public.social_media_replies(prospect_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_analyses_prospect_id ON public.voice_note_analyses(prospect_id);

-- Analytics tables
CREATE INDEX IF NOT EXISTS idx_analytics_experiment_assignments_experiment_id ON public.analytics_experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_analytics_experiment_assignments_variant_id ON public.analytics_experiment_assignments(variant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_experiment_results_variant_id ON public.analytics_experiment_results(variant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_experiments_created_by ON public.analytics_experiments(created_by);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_acknowledged_by ON public.analytics_insights(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_user_id ON public.analytics_page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_recommendations_insight_id ON public.analytics_recommendations(insight_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_journey_user_id ON public.analytics_user_journey(user_id);

-- Enterprise and team tables
CREATE INDEX IF NOT EXISTS idx_enterprise_organizations_admin_user_id ON public.enterprise_organizations(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_subscriptions_subscription_id ON public.team_subscriptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_team_subscriptions_team_leader_id ON public.team_subscriptions(team_leader_id);
CREATE INDEX IF NOT EXISTS idx_downline_members_member_user_id ON public.downline_members(member_user_id);

-- Follow-up and notification tables
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_notification_id ON public.follow_up_reminders(notification_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_prospect_id ON public.follow_up_reminders(prospect_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_sequence_id ON public.follow_up_reminders(sequence_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_sequence_id ON public.notifications(related_sequence_id);

-- Payment and subscription tables
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON public.invoices(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON public.payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Processing and queue tables
CREATE INDEX IF NOT EXISTS idx_processing_queue_candidate_id ON public.processing_queue(candidate_id);
CREATE INDEX IF NOT EXISTS idx_processing_queue_user_id ON public.processing_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sequence_step_logs_user_id ON public.sequence_step_logs(user_id);

-- Miscellaneous tables
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_viral_video_scripts_user_id ON public.viral_video_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_results_variant_id ON public.experiment_results(variant_id);
