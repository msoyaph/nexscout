/*
  # Onboarding Analytics Materialized Views

  1. Views
    - `onboarding_step_completion` - Step-by-step performance metrics
    - `onboarding_ab_test_performance` - A/B test comparison
    - `first_win_funnel` - User progression through first win milestones
    - `onboarding_daily_metrics` - Daily KPIs for monitoring

  2. Features
    - Blazing fast analytics queries
    - Pre-aggregated data
    - A/B testing insights
    - Funnel analysis
*/

-- Step Completion Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS public.onboarding_step_completion AS
SELECT
  s.id AS step_id,
  s.sequence_id,
  seq.sequence_key,
  seq.ab_group,
  s.day_number,
  s.scenario_id,
  s.trigger_key,
  COUNT(DISTINCT j.user_id) AS users_targeted,
  COUNT(j.id) FILTER (WHERE j.status = 'sent') AS messages_sent,
  COUNT(j.id) FILTER (WHERE j.status = 'skipped') AS messages_skipped,
  COUNT(j.id) FILTER (WHERE j.status = 'failed') AS messages_failed,
  COUNT(DISTINCT CASE WHEN j.status = 'sent' THEN j.user_id END) AS users_reached,
  ROUND(
    COUNT(j.id) FILTER (WHERE j.status = 'sent')::numeric / 
    NULLIF(COUNT(j.id), 0) * 100, 
    2
  ) AS send_success_rate
FROM onboarding_steps s
JOIN onboarding_sequences seq ON seq.id = s.sequence_id
LEFT JOIN onboarding_messages m ON m.step_id = s.id
LEFT JOIN onboarding_reminder_jobs_v2 j ON j.message_id = m.id
GROUP BY s.id, s.sequence_id, seq.sequence_key, seq.ab_group, s.day_number, s.scenario_id, s.trigger_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_step_completion_unique
  ON public.onboarding_step_completion (step_id);

-- A/B Test Performance Comparison
CREATE MATERIALIZED VIEW IF NOT EXISTS public.onboarding_ab_test_performance AS
SELECT
  seq.id AS sequence_id,
  seq.sequence_key,
  seq.name,
  seq.ab_group,
  COUNT(DISTINCT a.user_id) AS total_users_assigned,
  COUNT(DISTINCT CASE WHEN j.status = 'sent' THEN j.user_id END) AS users_engaged,
  COUNT(j.id) FILTER (WHERE j.status = 'sent') AS total_messages_sent,
  COUNT(j.id) FILTER (WHERE j.status = 'skipped') AS total_messages_skipped,
  COUNT(j.id) FILTER (WHERE j.status = 'failed') AS total_messages_failed,
  ROUND(
    COUNT(DISTINCT CASE WHEN j.status = 'sent' THEN j.user_id END)::numeric / 
    NULLIF(COUNT(DISTINCT a.user_id), 0) * 100,
    2
  ) AS engagement_rate,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (j.updated_at - a.assigned_at)) / 3600) FILTER (WHERE j.status = 'sent'),
    2
  ) AS avg_hours_to_first_message
FROM onboarding_sequences seq
LEFT JOIN user_sequence_assignments a ON a.sequence_id = seq.id AND a.is_active = true
LEFT JOIN onboarding_steps s ON s.sequence_id = seq.id
LEFT JOIN onboarding_messages m ON m.step_id = s.id
LEFT JOIN onboarding_reminder_jobs_v2 j ON j.message_id = m.id AND j.user_id = a.user_id
WHERE seq.is_active = true
GROUP BY seq.id, seq.sequence_key, seq.name, seq.ab_group;

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_ab_test_performance_unique
  ON public.onboarding_ab_test_performance (sequence_id);

-- First Win Funnel
CREATE MATERIALIZED VIEW IF NOT EXISTS public.first_win_funnel AS
SELECT
  p.id AS user_id,
  p.created_at AS signup_time,
  MIN(e.created_at) FILTER (WHERE e.event_type = 'signup_completed') AS signup_event_time,
  MIN(e.created_at) FILTER (WHERE e.event_type = 'company_data_added') AS company_setup_time,
  MIN(e.created_at) FILTER (WHERE e.event_type = 'product_data_added') AS product_setup_time,
  MIN(e.created_at) FILTER (WHERE e.event_type = 'chatbot_activated') AS chatbot_activated_time,
  MIN(e.created_at) FILTER (WHERE e.event_type = 'first_scan_done') AS first_scan_time,
  MIN(e.created_at) FILTER (WHERE e.event_type = 'chatbot_first_message') AS first_chat_time,
  MIN(e.created_at) FILTER (WHERE e.event_type = 'appointment_booked') AS first_appointment_time,
  MIN(e.created_at) FILTER (WHERE e.event_type = 'first_sale') AS first_sale_time,
  CASE
    WHEN MIN(e.created_at) FILTER (WHERE e.event_type = 'first_sale') IS NOT NULL THEN 'first_sale'
    WHEN MIN(e.created_at) FILTER (WHERE e.event_type = 'appointment_booked') IS NOT NULL THEN 'first_appointment'
    WHEN MIN(e.created_at) FILTER (WHERE e.event_type = 'chatbot_first_message') IS NOT NULL THEN 'first_chat'
    WHEN MIN(e.created_at) FILTER (WHERE e.event_type = 'first_scan_done') IS NOT NULL THEN 'first_scan'
    WHEN MIN(e.created_at) FILTER (WHERE e.event_type = 'chatbot_activated') IS NOT NULL THEN 'chatbot_activated'
    WHEN MIN(e.created_at) FILTER (WHERE e.event_type = 'product_data_added') IS NOT NULL THEN 'product_setup'
    WHEN MIN(e.created_at) FILTER (WHERE e.event_type = 'company_data_added') IS NOT NULL THEN 'company_setup'
    ELSE 'signup_only'
  END AS funnel_stage
FROM profiles p
LEFT JOIN onboarding_events e ON e.user_id = p.id
GROUP BY p.id, p.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_first_win_funnel_unique
  ON public.first_win_funnel (user_id);

-- Daily Onboarding Metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.onboarding_daily_metrics AS
SELECT
  DATE(p.created_at) AS signup_date,
  COUNT(DISTINCT p.id) AS total_signups,
  COUNT(DISTINCT CASE 
    WHEN e.event_type = 'company_data_added' THEN e.user_id 
    END) AS completed_company_setup,
  COUNT(DISTINCT CASE 
    WHEN e.event_type = 'product_data_added' THEN e.user_id 
    END) AS completed_product_setup,
  COUNT(DISTINCT CASE 
    WHEN e.event_type = 'chatbot_activated' THEN e.user_id 
    END) AS activated_chatbot,
  COUNT(DISTINCT CASE 
    WHEN e.event_type = 'first_scan_done' THEN e.user_id 
    END) AS completed_first_scan,
  COUNT(DISTINCT CASE 
    WHEN e.event_type IN ('first_sale', 'appointment_booked') THEN e.user_id 
    END) AS achieved_first_win,
  ROUND(
    COUNT(DISTINCT CASE WHEN e.event_type = 'company_data_added' THEN e.user_id END)::numeric / 
    NULLIF(COUNT(DISTINCT p.id), 0) * 100,
    2
  ) AS company_setup_rate,
  ROUND(
    COUNT(DISTINCT CASE WHEN e.event_type IN ('first_sale', 'appointment_booked') THEN e.user_id END)::numeric / 
    NULLIF(COUNT(DISTINCT p.id), 0) * 100,
    2
  ) AS first_win_rate
FROM profiles p
LEFT JOIN onboarding_events e ON e.user_id = p.id 
  AND DATE(e.created_at) = DATE(p.created_at)
WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(p.created_at)
ORDER BY signup_date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_daily_metrics_unique
  ON public.onboarding_daily_metrics (signup_date);

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_onboarding_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY onboarding_step_completion;
  REFRESH MATERIALIZED VIEW CONCURRENTLY onboarding_ab_test_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY first_win_funnel;
  REFRESH MATERIALIZED VIEW CONCURRENTLY onboarding_daily_metrics;
END;
$$;