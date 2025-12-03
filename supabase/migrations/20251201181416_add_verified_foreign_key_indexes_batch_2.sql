/*
  # Add Verified Foreign Key Indexes - Batch 2

  1. Purpose
    - Continue adding indexes to foreign key columns
    - Focus on analytics tables

  2. Security Impact
    - Ensures efficient analytics queries
    - Prevents performance degradation
*/

-- Analytics cohort and experiments
CREATE INDEX IF NOT EXISTS idx_analytics_cohort_membership_cohort_id 
  ON analytics_cohort_membership(cohort_id);

CREATE INDEX IF NOT EXISTS idx_analytics_experiment_assignments_experiment_id 
  ON analytics_experiment_assignments(experiment_id);

CREATE INDEX IF NOT EXISTS idx_analytics_experiment_assignments_variant_id 
  ON analytics_experiment_assignments(variant_id);

CREATE INDEX IF NOT EXISTS idx_analytics_experiment_results_experiment_id 
  ON analytics_experiment_results(experiment_id);

CREATE INDEX IF NOT EXISTS idx_analytics_experiment_results_variant_id 
  ON analytics_experiment_results(variant_id);

CREATE INDEX IF NOT EXISTS idx_analytics_experiment_variants_experiment_id 
  ON analytics_experiment_variants(experiment_id);

-- Analytics funnels
CREATE INDEX IF NOT EXISTS idx_analytics_funnel_performance_funnel_id 
  ON analytics_funnel_performance(funnel_id);

CREATE INDEX IF NOT EXISTS idx_analytics_funnel_steps_funnel_id 
  ON analytics_funnel_steps(funnel_id);

CREATE INDEX IF NOT EXISTS idx_analytics_recommendations_insight_id 
  ON analytics_recommendations(insight_id);

CREATE INDEX IF NOT EXISTS idx_analytics_retention_metrics_cohort_id 
  ON analytics_retention_metrics(cohort_id);

-- Audit and banned users
CREATE INDEX IF NOT EXISTS idx_audit_jobs_user_id 
  ON audit_jobs(user_id);

CREATE INDEX IF NOT EXISTS idx_banned_users_banned_by 
  ON banned_users(banned_by);

CREATE INDEX IF NOT EXISTS idx_banned_users_user_id 
  ON banned_users(user_id);

CREATE INDEX IF NOT EXISTS idx_blocked_outputs_audit_job_id 
  ON blocked_outputs(audit_job_id);

CREATE INDEX IF NOT EXISTS idx_blocked_outputs_user_id 
  ON blocked_outputs(user_id);

-- Calendar and call scripts
CREATE INDEX IF NOT EXISTS idx_calendar_events_company_id 
  ON calendar_events(company_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_prospect_id 
  ON calendar_events(prospect_id);

CREATE INDEX IF NOT EXISTS idx_call_scripts_prospect_id 
  ON call_scripts(prospect_id);

CREATE INDEX IF NOT EXISTS idx_call_scripts_user_id 
  ON call_scripts(user_id);

-- Channel effectiveness
CREATE INDEX IF NOT EXISTS idx_channel_effectiveness_scores_prospect_id 
  ON channel_effectiveness_scores(prospect_id);

CREATE INDEX IF NOT EXISTS idx_channel_orchestration_history_prospect_id 
  ON channel_orchestration_history(prospect_id);

CREATE INDEX IF NOT EXISTS idx_channel_queue_state_prospect_id 
  ON channel_queue_state(prospect_id);

-- Chatbot appointments and closing
CREATE INDEX IF NOT EXISTS idx_chatbot_appointment_slots_prospect_id 
  ON chatbot_appointment_slots(prospect_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_appointment_slots_session_id 
  ON chatbot_appointment_slots(session_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_closing_attempts_prospect_id 
  ON chatbot_closing_attempts(prospect_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_closing_attempts_session_id 
  ON chatbot_closing_attempts(session_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id 
  ON chatbot_messages(conversation_id);

-- Chatbot to prospect pipeline
CREATE INDEX IF NOT EXISTS idx_chatbot_to_prospect_pipeline_prospect_id 
  ON chatbot_to_prospect_pipeline(prospect_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_to_prospect_pipeline_session_id 
  ON chatbot_to_prospect_pipeline(session_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_to_prospect_pipeline_visitor_id 
  ON chatbot_to_prospect_pipeline(visitor_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_visitors_session_id 
  ON chatbot_visitors(session_id);

-- Citizen feedback
CREATE INDEX IF NOT EXISTS idx_citizen_feedback_votes_feedback_id 
  ON citizen_feedback_votes(feedback_id);

-- Closing scripts and progressions
CREATE INDEX IF NOT EXISTS idx_closing_scripts_prospect_id 
  ON closing_scripts(prospect_id);

CREATE INDEX IF NOT EXISTS idx_closing_scripts_user_id 
  ON closing_scripts(user_id);

CREATE INDEX IF NOT EXISTS idx_closing_stage_progressions_prospect_id 
  ON closing_stage_progressions(prospect_id);

-- Coaching sessions
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_downline_member_id 
  ON coaching_sessions(downline_member_id);

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_leader_user_id 
  ON coaching_sessions(leader_user_id);

CREATE INDEX IF NOT EXISTS idx_communication_throttle_log_user_id 
  ON communication_throttle_log(user_id);
