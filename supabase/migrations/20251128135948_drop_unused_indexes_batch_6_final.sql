/*
  # Drop Unused Indexes - Batch 6 (Final)

  1. Purpose
    - Drop remaining unused indexes
  
  2. Indexes Dropped
    - Social, team, training, upload, viral, voice (remaining ~70)
*/

DROP INDEX IF EXISTS idx_social_interactions_contact_id_fkey;
DROP INDEX IF EXISTS idx_social_interactions_user_id_fkey;
DROP INDEX IF EXISTS idx_social_media_replies_prospect_id_fkey;
DROP INDEX IF EXISTS idx_social_media_replies_user_id_fkey;
DROP INDEX IF EXISTS idx_social_page_insights_user_id_fkey;
DROP INDEX IF EXISTS idx_story_messages_prospect_id_fkey;
DROP INDEX IF EXISTS idx_story_messages_user_id_fkey;
DROP INDEX IF EXISTS idx_subscription_events_user_id_fkey;
DROP INDEX IF EXISTS idx_system_logs_user_id_fkey;
DROP INDEX IF EXISTS idx_team_members_user_id_fkey;
DROP INDEX IF EXISTS idx_team_subscriptions_subscription_id_fkey;
DROP INDEX IF EXISTS idx_team_subscriptions_team_leader_id_fkey;
DROP INDEX IF EXISTS idx_team_training_programs_leader_id_fkey;
DROP INDEX IF EXISTS idx_tiktok_insights_user_id_fkey;
DROP INDEX IF EXISTS idx_training_video_modules_user_id_fkey;
DROP INDEX IF EXISTS idx_twitter_insights_user_id_fkey;
DROP INDEX IF EXISTS idx_uploaded_files_batch_id_fkey;
DROP INDEX IF EXISTS idx_user_activity_logs_user_id_fkey;
DROP INDEX IF EXISTS idx_user_badges_badge_id_fkey;
DROP INDEX IF EXISTS idx_user_library_user_id_fkey;
DROP INDEX IF EXISTS idx_user_subscriptions_plan_id_fkey;
DROP INDEX IF EXISTS idx_video_pitch_scripts_user_id_fkey;
DROP INDEX IF EXISTS idx_viral_referral_conversions_share_event_id_fkey;
DROP INDEX IF EXISTS idx_viral_share_messages_user_id_fkey;
DROP INDEX IF EXISTS idx_viral_video_scripts_user_id_fkey;
DROP INDEX IF EXISTS idx_voice_note_analyses_prospect_id_fkey;
DROP INDEX IF EXISTS idx_voice_note_analyses_user_id_fkey;

-- Company-related unused indexes
DROP INDEX IF EXISTS idx_global_companies_normalized_name;
DROP INDEX IF EXISTS idx_global_companies_display_name;
DROP INDEX IF EXISTS idx_global_companies_website;
DROP INDEX IF EXISTS idx_company_aliases_normalized;
DROP INDEX IF EXISTS idx_company_aliases_company_id;
DROP INDEX IF EXISTS idx_knowledge_graphs_company;
DROP INDEX IF EXISTS idx_multi_site_data_company_platform;
DROP INDEX IF EXISTS idx_company_profiles_user_id;
DROP INDEX IF EXISTS idx_company_assets_user_id;
DROP INDEX IF EXISTS idx_company_assets_status;
DROP INDEX IF EXISTS idx_company_extracted_data_user_id;
DROP INDEX IF EXISTS idx_company_extracted_data_type;
DROP INDEX IF EXISTS idx_company_embeddings_user_id;
DROP INDEX IF EXISTS idx_company_embeddings_vector;
DROP INDEX IF EXISTS idx_user_company_links_user;
DROP INDEX IF EXISTS idx_user_company_links_company;
DROP INDEX IF EXISTS idx_company_personas_user_id;
DROP INDEX IF EXISTS idx_company_personas_company_id;
DROP INDEX IF EXISTS idx_company_personas_default;
DROP INDEX IF EXISTS idx_company_ai_events_user_id;
DROP INDEX IF EXISTS idx_company_ai_events_company_id;
DROP INDEX IF EXISTS idx_company_ai_events_content;
DROP INDEX IF EXISTS idx_company_ai_events_prospect;
DROP INDEX IF EXISTS idx_company_ai_events_type;
DROP INDEX IF EXISTS idx_company_ai_events_created;
DROP INDEX IF EXISTS idx_company_experiments_user_id;
DROP INDEX IF EXISTS idx_company_experiments_company_id;
DROP INDEX IF EXISTS idx_company_experiments_status;
DROP INDEX IF EXISTS idx_company_experiment_variants_experiment;
DROP INDEX IF EXISTS idx_company_experiment_variants_winner;
DROP INDEX IF EXISTS idx_company_persona_learning_logs_user_id;
DROP INDEX IF EXISTS idx_company_persona_learning_logs_company_id;
DROP INDEX IF EXISTS idx_company_persona_learning_logs_persona;
DROP INDEX IF EXISTS idx_company_style_overrides_user_id;
DROP INDEX IF EXISTS idx_company_style_overrides_company_id;
DROP INDEX IF EXISTS idx_company_style_overrides_active;
DROP INDEX IF EXISTS idx_company_ai_safety_flags_user_id;
DROP INDEX IF EXISTS idx_company_ai_safety_flags_company_id;
DROP INDEX IF EXISTS idx_company_ai_safety_flags_severity;
DROP INDEX IF EXISTS idx_company_ai_safety_flags_unresolved;
DROP INDEX IF EXISTS idx_company_brain_state_user;
DROP INDEX IF EXISTS idx_company_brain_state_company;
DROP INDEX IF EXISTS idx_company_brain_state_updated;
DROP INDEX IF EXISTS idx_company_ai_style_rules_user;
DROP INDEX IF EXISTS idx_company_ai_style_rules_company;
DROP INDEX IF EXISTS idx_company_ai_style_rules_category;
DROP INDEX IF EXISTS idx_company_ai_style_rules_active;
DROP INDEX IF EXISTS idx_company_conversion_predictions_user;
DROP INDEX IF EXISTS idx_company_conversion_predictions_company;
DROP INDEX IF EXISTS idx_company_conversion_predictions_content;
DROP INDEX IF EXISTS idx_company_conversion_predictions_score;
DROP INDEX IF EXISTS idx_company_playbooks_user;
DROP INDEX IF EXISTS idx_company_playbooks_company;
DROP INDEX IF EXISTS idx_company_playbooks_published;
DROP INDEX IF EXISTS idx_company_audience_clusters_user;
DROP INDEX IF EXISTS idx_company_audience_clusters_company;
DROP INDEX IF EXISTS idx_company_image_intelligence_user;
DROP INDEX IF EXISTS idx_company_image_intelligence_asset;
DROP INDEX IF EXISTS idx_company_onboarding_progress_user;
DROP INDEX IF EXISTS idx_user_mission_progress_user;
DROP INDEX IF EXISTS idx_user_mission_progress_completed;
DROP INDEX IF EXISTS idx_crawl_history_user;
DROP INDEX IF EXISTS idx_crawl_events_user_company;
DROP INDEX IF EXISTS idx_crawl_events_step;
DROP INDEX IF EXISTS idx_mission_definitions_category;
DROP INDEX IF EXISTS idx_mission_definitions_active;
DROP INDEX IF EXISTS idx_upgrade_prompt_views_user;
DROP INDEX IF EXISTS idx_ai_messages_library_user_id;
DROP INDEX IF EXISTS idx_ai_messages_library_prospect_id;
DROP INDEX IF EXISTS idx_ai_messages_library_status;
