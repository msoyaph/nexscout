/*
  # Drop Unused Indexes - Batch 1

  1. Purpose
    - Remove indexes that have not been used
    - Reduces database storage and maintenance overhead
    - Improves write performance
  
  2. Indexes Dropped
    - Admin and agent related unused indexes
    - AI feature unused indexes (first 30)
*/

-- Admin and agent indexes
DROP INDEX IF EXISTS idx_admin_users_role_id_fkey;
DROP INDEX IF EXISTS idx_admin_users_user_id_fkey;
DROP INDEX IF EXISTS idx_agent_skill_gaps_user_id_fkey;

-- AI feature indexes
DROP INDEX IF EXISTS idx_ai_alerts_prospect_id_fkey;
DROP INDEX IF EXISTS idx_ai_closer_sessions_prospect_id_fkey;
DROP INDEX IF EXISTS idx_ai_closer_sessions_user_id_fkey;
DROP INDEX IF EXISTS idx_ai_generated_messages_prospect_id_fkey;
DROP INDEX IF EXISTS idx_ai_generated_messages_user_id_fkey;
DROP INDEX IF EXISTS idx_ai_generations_prospect_id_fkey;
DROP INDEX IF EXISTS idx_ai_generations_user_id_fkey;
DROP INDEX IF EXISTS idx_ai_mentor_sessions_prospect_id_fkey;
DROP INDEX IF EXISTS idx_ai_mentor_sessions_user_id_fkey;
DROP INDEX IF EXISTS idx_ai_message_sequences_prospect_id_fkey;
DROP INDEX IF EXISTS idx_ai_tasks_prospect_id_fkey;
DROP INDEX IF EXISTS idx_ai_usage_logs_user_id_fkey;

-- Analytics indexes
DROP INDEX IF EXISTS idx_analytics_cohort_membership_cohort_id_fkey;
DROP INDEX IF EXISTS idx_analytics_events_user_id_fkey;
DROP INDEX IF EXISTS idx_analytics_experiment_assignments_experiment_id_fkey;
DROP INDEX IF EXISTS idx_analytics_experiment_assignments_variant_id_fkey;
DROP INDEX IF EXISTS idx_analytics_experiment_results_variant_id_fkey;
DROP INDEX IF EXISTS idx_analytics_experiments_created_by_fkey;
DROP INDEX IF EXISTS idx_analytics_funnel_steps_funnel_id_fkey;
DROP INDEX IF EXISTS idx_analytics_funnel_steps_user_id_fkey;
DROP INDEX IF EXISTS idx_analytics_insights_acknowledged_by_fkey;
DROP INDEX IF EXISTS idx_analytics_page_views_user_id_fkey;
DROP INDEX IF EXISTS idx_analytics_recommendations_insight_id_fkey;
DROP INDEX IF EXISTS idx_analytics_sessions_user_id_fkey;
DROP INDEX IF EXISTS idx_analytics_user_journey_user_id_fkey;
