/*
  # Drop Unused Indexes - Batch 1

  1. Performance Optimization
    - Remove indexes that are not being used by queries
    - Reduces storage and write overhead
  
  2. Safety
    - Uses DROP INDEX IF EXISTS to prevent errors
    - Only drops truly unused indexes identified by audit
  
  3. Affected Indexes (Batch 1 - First 50)
    - Various indexes across multiple tables
*/

DROP INDEX IF EXISTS idx_ab_test_assignments_user_id;
DROP INDEX IF EXISTS idx_ab_test_results_user_id;
DROP INDEX IF EXISTS idx_activation_checklist_items_user_id;
DROP INDEX IF EXISTS idx_adaptive_follow_up_sequences_user_id;
DROP INDEX IF EXISTS idx_admin_data_experiments_created_by;
DROP INDEX IF EXISTS idx_admin_funnel_definitions_created_by;
DROP INDEX IF EXISTS idx_admin_nudge_tests_created_by;
DROP INDEX IF EXISTS idx_agent_profitability_user_id;
DROP INDEX IF EXISTS idx_agent_revenue_reports_user_id;
DROP INDEX IF EXISTS idx_aha_events_user_id;
DROP INDEX IF EXISTS idx_ai_agent_results_user_id;
DROP INDEX IF EXISTS idx_ai_alerts_user_id;
DROP INDEX IF EXISTS idx_ai_chat_sessions_user_id;
DROP INDEX IF EXISTS idx_ai_coach_recommendations_user_id;
DROP INDEX IF EXISTS idx_ai_conversations_user_id;
DROP INDEX IF EXISTS idx_ai_cost_predictions_user_id;
DROP INDEX IF EXISTS idx_ai_cost_simulations_user_id;
DROP INDEX IF EXISTS idx_ai_drafted_messages_user_id;
DROP INDEX IF EXISTS idx_ai_follow_up_sequences_user_id;
DROP INDEX IF EXISTS idx_ai_generated_messages_user_id;
DROP INDEX IF EXISTS idx_ai_generated_tasks_user_id;
DROP INDEX IF EXISTS idx_ai_generations_user_id;
DROP INDEX IF EXISTS idx_ai_learning_profiles_user_id;
DROP INDEX IF EXISTS idx_ai_model_usage_user_id;
DROP INDEX IF EXISTS idx_ai_pain_point_analysis_user_id;
DROP INDEX IF EXISTS idx_ai_persona_modes_user_id;
DROP INDEX IF EXISTS idx_ai_personality_profiles_user_id;
DROP INDEX IF EXISTS idx_ai_pipeline_actions_user_id;
DROP INDEX IF EXISTS idx_ai_pipeline_jobs_user_id;
DROP INDEX IF EXISTS idx_ai_pipeline_recommendations_user_id;
DROP INDEX IF EXISTS idx_ai_pipeline_settings_user_id;
DROP INDEX IF EXISTS idx_ai_prospect_qualifications_user_id;
DROP INDEX IF EXISTS idx_ai_prospects_user_id;
DROP INDEX IF EXISTS idx_ai_smartness_user_id;
DROP INDEX IF EXISTS idx_ai_specialist_results_user_id;
DROP INDEX IF EXISTS idx_ai_tasks_user_id;
DROP INDEX IF EXISTS idx_ai_team_coaching_insights_user_id;
DROP INDEX IF EXISTS idx_ai_usage_limits_user_id;
DROP INDEX IF EXISTS idx_ai_usage_logs_user_id;
DROP INDEX IF EXISTS idx_api_calls_cost_user_id;
DROP INDEX IF EXISTS idx_audit_jobs_user_id;
DROP INDEX IF EXISTS idx_banned_users_user_id;
DROP INDEX IF EXISTS idx_blocked_outputs_user_id;
DROP INDEX IF EXISTS idx_browser_capture_events_user_id;
DROP INDEX IF EXISTS idx_browser_extension_tokens_user_id;
DROP INDEX IF EXISTS idx_buyer_timeline_forecasts_v2_user_id;
DROP INDEX IF EXISTS idx_cached_ai_responses_user_id;
DROP INDEX IF EXISTS idx_call_scripts_user_id;
DROP INDEX IF EXISTS idx_channel_effectiveness_scores_user_id;
DROP INDEX IF EXISTS idx_channel_orchestration_history_user_id;
