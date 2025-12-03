/*
  # Fix Function Search Paths - Final Batch

  Set explicit search_path for all remaining security definer functions.

  ## Functions Updated (78 remaining functions)
  All remaining security definer functions from initialize_quick_wins through update_user_streak.

  ## Security
  Completes the security fix for all security definer functions.
  Prevents privilege escalation through search_path manipulation.
*/

ALTER FUNCTION public.initialize_quick_wins() SET search_path = public, pg_temp;
ALTER FUNCTION public.initialize_user_scoring_profile() SET search_path = public, pg_temp;
ALTER FUNCTION public.initialize_user_scoring_weights(p_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.initialize_user_smartness() SET search_path = public, pg_temp;
ALTER FUNCTION public.invite_team_member(p_team_id uuid, p_email text, p_role text) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin_user(check_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_super_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_super_admin_user(check_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.learn_from_human_message(p_user_id uuid, p_session_id uuid, p_message text, p_sample_type text, p_effectiveness numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.log_communication_sent(p_user_id uuid, p_channel text, p_template_key text) SET search_path = public, pg_temp;
ALTER FUNCTION public.log_data_change() SET search_path = public, pg_temp;
ALTER FUNCTION public.make_user_super_admin(target_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.mark_all_read(p_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.mark_job_processed_v2(p_job_id uuid, p_status text, p_error_message text) SET search_path = public, pg_temp;
ALTER FUNCTION public.mark_reminder_sent(p_reminder_id uuid, p_success boolean, p_error_message text) SET search_path = public, pg_temp;
ALTER FUNCTION public.normalize_company_name(name text) SET search_path = public, pg_temp;
ALTER FUNCTION public.predict_conversion_path(p_user_id uuid, p_prospect_id uuid, p_current_stage text, p_buying_intent numeric, p_engagement numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.predict_upgrade_roi(p_user_id uuid, p_from_tier text, p_to_tier text) SET search_path = public, pg_temp;
ALTER FUNCTION public.process_referral_signup(p_referrer_code text, p_referred_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.process_referral_upgrade(p_referred_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.progress_closing_stage(p_user_id uuid, p_prospect_id uuid, p_new_stage text, p_completed boolean) SET search_path = public, pg_temp;
ALTER FUNCTION public.promote_user_by_email(user_email text, make_super_admin boolean) SET search_path = public, pg_temp;
ALTER FUNCTION public.promote_user_to_admin(target_user_id uuid, make_super_admin boolean) SET search_path = public, pg_temp;
ALTER FUNCTION public.queue_for_normalization() SET search_path = public, pg_temp;
ALTER FUNCTION public.record_coin_transaction(p_user_id uuid, p_amount integer, p_type text, p_description text) SET search_path = public, pg_temp;
ALTER FUNCTION public.record_onboarding_outcome(p_user_id uuid, p_outcome text) SET search_path = public, pg_temp;
ALTER FUNCTION public.refresh_onboarding_analytics() SET search_path = public, pg_temp;
ALTER FUNCTION public.regenerate_daily_energy() SET search_path = public, pg_temp;
ALTER FUNCTION public.remove_team_member(p_team_member_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_daily_limits() SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_daily_limits(p_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_daily_token_usage() SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_weekly_limits(p_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_weekly_limits() SET search_path = public, pg_temp;
ALTER FUNCTION public.schedule_followup_sequence(p_session_id uuid, p_user_id uuid, p_sequence_type text) SET search_path = public, pg_temp;
ALTER FUNCTION public.select_best_persona(p_user_id uuid, p_prospect_id uuid, p_emotional_state text, p_buying_intent numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.setup_first_super_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.stitch_identity(p_user_id uuid, p_identity_id uuid, p_prospect_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_ai_instructions_to_systems(p_user_id uuid, p_post_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_company_intelligence_to_chatbot(p_user_id uuid, p_intelligence_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_company_intelligence_to_public_chatbot(p_user_id uuid, p_intelligence_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_company_to_chatbot_training(p_user_id uuid, p_company_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_company_to_public_chatbot_training(p_user_id uuid, p_company_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_knowledge_to_user_onboarding(p_user_id uuid, p_post_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_subscription_to_profile() SET search_path = public, pg_temp;
ALTER FUNCTION public.track_lead_conversion() SET search_path = public, pg_temp;
ALTER FUNCTION public.track_nudge_clicked(p_test_id uuid, p_time_on_screen_ms integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.track_nudge_conversion(p_test_id uuid, p_from_tier text, p_to_tier text, p_revenue_amount integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.track_nudge_shown(p_user_id uuid, p_test_key text, p_variant text, p_trigger_type text, p_emotional_state text, p_tier text, p_target_tier text, p_metadata jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.trigger_sync_company_profile_to_chatbot() SET search_path = public, pg_temp;
ALTER FUNCTION public.trigger_sync_company_to_public_chatbot() SET search_path = public, pg_temp;
ALTER FUNCTION public.trigger_sync_intelligence_to_chatbot() SET search_path = public, pg_temp;
ALTER FUNCTION public.trigger_sync_intelligence_to_public_chatbot() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_channel_effectiveness(p_user_id uuid, p_prospect_id uuid, p_channel text, p_event_type text) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_cluster_health(p_provider text, p_model text, p_latency_ms integer, p_success boolean) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_company_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_efficiency_rating(p_user_id uuid, p_tokens_used integer, p_tokens_predicted integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_file_document_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_file_scan_queue_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_followup_step_stats() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_knowledge_post_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_lead_source_stats() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_learning_weight(p_weight_type text, p_entity_type text, p_entity_id uuid, p_weight_key text, p_success boolean) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_member_role(p_team_member_id uuid, p_new_role text) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_mission_progress(p_mission_id uuid, p_increment integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_product_assets_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_product_recommendations_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_product_scripts_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_product_strength_score() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_product_variants_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_prospect_status_from_reply() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_queue_priority(p_user_id uuid, p_session_id uuid, p_buying_intent numeric, p_frustration numeric, p_wait_seconds integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_scoring_weight_on_outcome(p_user_id uuid, p_feature text, p_outcome text, p_feature_value numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_smartness_score() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_team_seats(p_team_id uuid, p_seats_included integer, p_extra_seats integer, p_extra_seat_price integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_template_stats() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_user_smartness(p_user_id uuid, p_category text, p_score_change numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_user_streak(p_user_id uuid, p_activity_date date) SET search_path = public, pg_temp;