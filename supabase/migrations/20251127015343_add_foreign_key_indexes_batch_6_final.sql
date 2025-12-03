/*
  # Add Foreign Key Indexes - Batch 6 (Final)

  1. Performance Optimization
    - Complete adding indexes for all remaining unindexed foreign keys
    - Tables: scan_smartness_events through voice_note_analyses
*/

-- scan_smartness_events
CREATE INDEX IF NOT EXISTS idx_scan_smartness_events_user_id_fkey ON public.scan_smartness_events(user_id);

-- scan_taglish_analysis
CREATE INDEX IF NOT EXISTS idx_scan_taglish_analysis_scan_id_fkey ON public.scan_taglish_analysis(scan_id);

-- scanning_sessions
CREATE INDEX IF NOT EXISTS idx_scanning_sessions_user_id_fkey ON public.scanning_sessions(user_id);

-- schedule_events
CREATE INDEX IF NOT EXISTS idx_schedule_events_prospect_id_fkey ON public.schedule_events(prospect_id);

-- scoring_history
CREATE INDEX IF NOT EXISTS idx_scoring_history_prospect_id_fkey ON public.scoring_history(prospect_id);
CREATE INDEX IF NOT EXISTS idx_scoring_history_user_id_fkey ON public.scoring_history(user_id);

-- scoutscore_calculations
CREATE INDEX IF NOT EXISTS idx_scoutscore_calculations_prospect_id_fkey ON public.scoutscore_calculations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_scoutscore_calculations_user_id_fkey ON public.scoutscore_calculations(user_id);

-- scraper_logs
CREATE INDEX IF NOT EXISTS idx_scraper_logs_user_id_fkey ON public.scraper_logs(user_id);

-- sequence_step_logs
CREATE INDEX IF NOT EXISTS idx_sequence_step_logs_sequence_id_fkey ON public.sequence_step_logs(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_step_logs_user_id_fkey ON public.sequence_step_logs(user_id);

-- social_connect_logs
CREATE INDEX IF NOT EXISTS idx_social_connect_logs_user_id_fkey ON public.social_connect_logs(user_id);

-- social_contact_features
CREATE INDEX IF NOT EXISTS idx_social_contact_features_user_id_fkey ON public.social_contact_features(user_id);

-- social_contacts
CREATE INDEX IF NOT EXISTS idx_social_contacts_user_id_fkey ON public.social_contacts(user_id);

-- social_edges
CREATE INDEX IF NOT EXISTS idx_social_edges_from_contact_id_fkey ON public.social_edges(from_contact_id);
CREATE INDEX IF NOT EXISTS idx_social_edges_to_contact_id_fkey ON public.social_edges(to_contact_id);
CREATE INDEX IF NOT EXISTS idx_social_edges_user_id_fkey ON public.social_edges(user_id);

-- social_graph_edges
CREATE INDEX IF NOT EXISTS idx_social_graph_edges_user_id_fkey ON public.social_graph_edges(user_id);

-- social_graph_insights
CREATE INDEX IF NOT EXISTS idx_social_graph_insights_user_id_fkey ON public.social_graph_insights(user_id);

-- social_graph_nodes
CREATE INDEX IF NOT EXISTS idx_social_graph_nodes_user_id_fkey ON public.social_graph_nodes(user_id);

-- social_intent_predictions
CREATE INDEX IF NOT EXISTS idx_social_intent_predictions_prospect_id_fkey ON public.social_intent_predictions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_social_intent_predictions_user_id_fkey ON public.social_intent_predictions(user_id);

-- social_interactions
CREATE INDEX IF NOT EXISTS idx_social_interactions_contact_id_fkey ON public.social_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_social_interactions_user_id_fkey ON public.social_interactions(user_id);

-- social_media_replies
CREATE INDEX IF NOT EXISTS idx_social_media_replies_prospect_id_fkey ON public.social_media_replies(prospect_id);
CREATE INDEX IF NOT EXISTS idx_social_media_replies_user_id_fkey ON public.social_media_replies(user_id);

-- social_page_insights
CREATE INDEX IF NOT EXISTS idx_social_page_insights_user_id_fkey ON public.social_page_insights(user_id);

-- story_messages
CREATE INDEX IF NOT EXISTS idx_story_messages_prospect_id_fkey ON public.story_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_story_messages_user_id_fkey ON public.story_messages(user_id);

-- subscription_events
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id_fkey ON public.subscription_events(user_id);

-- system_logs
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id_fkey ON public.system_logs(user_id);

-- team_members
CREATE INDEX IF NOT EXISTS idx_team_members_user_id_fkey ON public.team_members(user_id);

-- team_subscriptions
CREATE INDEX IF NOT EXISTS idx_team_subscriptions_subscription_id_fkey ON public.team_subscriptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_team_subscriptions_team_leader_id_fkey ON public.team_subscriptions(team_leader_id);

-- team_training_programs
CREATE INDEX IF NOT EXISTS idx_team_training_programs_leader_id_fkey ON public.team_training_programs(leader_id);

-- tiktok_insights
CREATE INDEX IF NOT EXISTS idx_tiktok_insights_user_id_fkey ON public.tiktok_insights(user_id);

-- training_video_modules
CREATE INDEX IF NOT EXISTS idx_training_video_modules_user_id_fkey ON public.training_video_modules(user_id);

-- twitter_insights
CREATE INDEX IF NOT EXISTS idx_twitter_insights_user_id_fkey ON public.twitter_insights(user_id);

-- uploaded_files
CREATE INDEX IF NOT EXISTS idx_uploaded_files_batch_id_fkey ON public.uploaded_files(batch_id);

-- user_activity_logs
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id_fkey ON public.user_activity_logs(user_id);

-- user_badges
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id_fkey ON public.user_badges(badge_id);

-- user_library
CREATE INDEX IF NOT EXISTS idx_user_library_user_id_fkey ON public.user_library(user_id);

-- user_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id_fkey ON public.user_subscriptions(plan_id);

-- video_pitch_scripts
CREATE INDEX IF NOT EXISTS idx_video_pitch_scripts_user_id_fkey ON public.video_pitch_scripts(user_id);

-- viral_referral_conversions
CREATE INDEX IF NOT EXISTS idx_viral_referral_conversions_share_event_id_fkey ON public.viral_referral_conversions(share_event_id);

-- viral_share_messages
CREATE INDEX IF NOT EXISTS idx_viral_share_messages_user_id_fkey ON public.viral_share_messages(user_id);

-- viral_video_scripts
CREATE INDEX IF NOT EXISTS idx_viral_video_scripts_user_id_fkey ON public.viral_video_scripts(user_id);

-- voice_note_analyses
CREATE INDEX IF NOT EXISTS idx_voice_note_analyses_prospect_id_fkey ON public.voice_note_analyses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_analyses_user_id_fkey ON public.voice_note_analyses(user_id);
