/*
  # Add Foreign Key Indexes - Batch 1

  1. Performance Optimization
    - Add indexes for all unindexed foreign keys
    - Dramatically improves JOIN performance
    - Essential for referential integrity checks
    - Prevents table scans on foreign key lookups

  2. Tables Indexed (50 foreign keys)
    - admin_users
    - agent_skill_gaps
    - ai_alerts
    - ai_closer_sessions
    - ai_generated_messages
    - ai_generations
    - ai_mentor_sessions
    - ai_message_sequences
    - ai_tasks
    - ai_usage_logs
    - analytics_cohort_membership
    - analytics_events
    - analytics_experiment_assignments
    - analytics_experiment_results
    - analytics_experiments
    - analytics_funnel_steps
    - analytics_insights
    - analytics_page_views
    - analytics_recommendations
    - analytics_sessions
    - analytics_user_journey
    - browser_capture_events
    - browser_captures
    - browser_extension_tokens
    - call_scripts
*/

-- admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id_fkey ON public.admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id_fkey ON public.admin_users(user_id);

-- agent_skill_gaps
CREATE INDEX IF NOT EXISTS idx_agent_skill_gaps_user_id_fkey ON public.agent_skill_gaps(user_id);

-- ai_alerts
CREATE INDEX IF NOT EXISTS idx_ai_alerts_prospect_id_fkey ON public.ai_alerts(prospect_id);

-- ai_closer_sessions
CREATE INDEX IF NOT EXISTS idx_ai_closer_sessions_prospect_id_fkey ON public.ai_closer_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_closer_sessions_user_id_fkey ON public.ai_closer_sessions(user_id);

-- ai_generated_messages
CREATE INDEX IF NOT EXISTS idx_ai_generated_messages_prospect_id_fkey ON public.ai_generated_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_messages_user_id_fkey ON public.ai_generated_messages(user_id);

-- ai_generations
CREATE INDEX IF NOT EXISTS idx_ai_generations_prospect_id_fkey ON public.ai_generations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id_fkey ON public.ai_generations(user_id);

-- ai_mentor_sessions
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_prospect_id_fkey ON public.ai_mentor_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_user_id_fkey ON public.ai_mentor_sessions(user_id);

-- ai_message_sequences
CREATE INDEX IF NOT EXISTS idx_ai_message_sequences_prospect_id_fkey ON public.ai_message_sequences(prospect_id);

-- ai_tasks
CREATE INDEX IF NOT EXISTS idx_ai_tasks_prospect_id_fkey ON public.ai_tasks(prospect_id);

-- ai_usage_logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id_fkey ON public.ai_usage_logs(user_id);

-- analytics_cohort_membership
CREATE INDEX IF NOT EXISTS idx_analytics_cohort_membership_cohort_id_fkey ON public.analytics_cohort_membership(cohort_id);

-- analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id_fkey ON public.analytics_events(user_id);

-- analytics_experiment_assignments
CREATE INDEX IF NOT EXISTS idx_analytics_experiment_assignments_experiment_id_fkey ON public.analytics_experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_analytics_experiment_assignments_variant_id_fkey ON public.analytics_experiment_assignments(variant_id);

-- analytics_experiment_results
CREATE INDEX IF NOT EXISTS idx_analytics_experiment_results_variant_id_fkey ON public.analytics_experiment_results(variant_id);

-- analytics_experiments
CREATE INDEX IF NOT EXISTS idx_analytics_experiments_created_by_fkey ON public.analytics_experiments(created_by);

-- analytics_funnel_steps
CREATE INDEX IF NOT EXISTS idx_analytics_funnel_steps_funnel_id_fkey ON public.analytics_funnel_steps(funnel_id);
CREATE INDEX IF NOT EXISTS idx_analytics_funnel_steps_user_id_fkey ON public.analytics_funnel_steps(user_id);

-- analytics_insights
CREATE INDEX IF NOT EXISTS idx_analytics_insights_acknowledged_by_fkey ON public.analytics_insights(acknowledged_by);

-- analytics_page_views
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_user_id_fkey ON public.analytics_page_views(user_id);

-- analytics_recommendations
CREATE INDEX IF NOT EXISTS idx_analytics_recommendations_insight_id_fkey ON public.analytics_recommendations(insight_id);

-- analytics_sessions
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id_fkey ON public.analytics_sessions(user_id);

-- analytics_user_journey
CREATE INDEX IF NOT EXISTS idx_analytics_user_journey_user_id_fkey ON public.analytics_user_journey(user_id);

-- browser_capture_events
CREATE INDEX IF NOT EXISTS idx_browser_capture_events_user_id_fkey ON public.browser_capture_events(user_id);

-- browser_captures
CREATE INDEX IF NOT EXISTS idx_browser_captures_user_id_fkey ON public.browser_captures(user_id);

-- browser_extension_tokens
CREATE INDEX IF NOT EXISTS idx_browser_extension_tokens_user_id_fkey ON public.browser_extension_tokens(user_id);

-- call_scripts
CREATE INDEX IF NOT EXISTS idx_call_scripts_prospect_id_fkey ON public.call_scripts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_call_scripts_user_id_fkey ON public.call_scripts(user_id);
