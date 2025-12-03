/*
  # Onboarding Optimization Analytics Views

  1. Views
    - `onboarding_dropoff_summary` - Step-by-step dropoff rates
    - `messaging_performance_view` - Channel performance metrics
    - `sequence_health_score` - Overall sequence health

  2. Features
    - Dropoff detection
    - Weak step identification
    - Message performance tracking
    - Real-time health monitoring
*/

-- Step Dropoff Summary
CREATE OR REPLACE VIEW public.onboarding_dropoff_summary AS
SELECT
  s.id AS step_id,
  s.sequence_id,
  seq.sequence_key,
  seq.ab_group,
  s.day_number,
  s.scenario_id,
  s.trigger_key,
  sc.users_targeted AS triggered_count,
  sc.users_reached AS completed_count,
  sc.messages_sent,
  sc.messages_skipped,
  sc.messages_failed,
  CASE
    WHEN sc.users_targeted = 0 THEN 0
    ELSE ROUND(1 - (sc.users_reached::decimal / sc.users_targeted), 4)
  END AS dropoff_rate,
  CASE
    WHEN sc.users_targeted = 0 THEN 'no_data'
    WHEN (1 - (sc.users_reached::decimal / NULLIF(sc.users_targeted, 0))) > 0.75 THEN 'critical'
    WHEN (1 - (sc.users_reached::decimal / NULLIF(sc.users_targeted, 0))) > 0.50 THEN 'high'
    WHEN (1 - (sc.users_reached::decimal / NULLIF(sc.users_targeted, 0))) > 0.30 THEN 'medium'
    ELSE 'low'
  END AS severity
FROM onboarding_steps s
JOIN onboarding_sequences seq ON seq.id = s.sequence_id
LEFT JOIN onboarding_step_completion sc ON sc.step_id = s.id
ORDER BY dropoff_rate DESC NULLS LAST;

-- Message Performance View
CREATE OR REPLACE VIEW public.messaging_performance_view AS
SELECT
  m.id AS message_id,
  m.step_id,
  m.channel,
  m.subject,
  m.title,
  s.scenario_id,
  s.day_number,
  seq.sequence_key,
  COUNT(DISTINCT l.user_id) AS unique_sends,
  COUNT(l.id) FILTER (WHERE l.status = 'sent') AS sent_count,
  COUNT(l.id) FILTER (WHERE l.status = 'skipped') AS skipped_count,
  COUNT(l.id) FILTER (WHERE l.status = 'failed') AS failed_count,
  ROUND(
    COUNT(l.id) FILTER (WHERE l.status = 'sent')::decimal / 
    NULLIF(COUNT(l.id), 0) * 100,
    2
  ) AS send_success_rate,
  AVG(EXTRACT(EPOCH FROM (l.sent_at - j.scheduled_for)) / 60) FILTER (WHERE l.status = 'sent') AS avg_delay_minutes
FROM onboarding_messages m
JOIN onboarding_steps s ON s.id = m.step_id
JOIN onboarding_sequences seq ON seq.id = s.sequence_id
LEFT JOIN onboarding_reminder_jobs_v2 j ON j.message_id = m.id
LEFT JOIN onboarding_reminder_logs_v2 l ON l.message_id = m.id
GROUP BY m.id, m.step_id, m.channel, m.subject, m.title, s.scenario_id, s.day_number, seq.sequence_key;

-- Sequence Health Score
CREATE OR REPLACE VIEW public.sequence_health_score AS
SELECT
  seq.id AS sequence_id,
  seq.sequence_key,
  seq.name,
  seq.ab_group,
  COUNT(DISTINCT s.id) AS total_steps,
  COUNT(DISTINCT s.id) FILTER (
    WHERE (1 - (sc.users_reached::decimal / NULLIF(sc.users_targeted, 0))) > 0.5
  ) AS weak_steps_count,
  AVG(sc.send_success_rate) AS avg_success_rate,
  ROUND(
    (1 - (COUNT(DISTINCT s.id) FILTER (
      WHERE (1 - (sc.users_reached::decimal / NULLIF(sc.users_targeted, 0))) > 0.5
    )::decimal / NULLIF(COUNT(DISTINCT s.id), 0))) * 100,
    2
  ) AS health_score,
  CASE
    WHEN (1 - (COUNT(DISTINCT s.id) FILTER (
      WHERE (1 - (sc.users_reached::decimal / NULLIF(sc.users_targeted, 0))) > 0.5
    )::decimal / NULLIF(COUNT(DISTINCT s.id), 0))) * 100 >= 80 THEN 'excellent'
    WHEN (1 - (COUNT(DISTINCT s.id) FILTER (
      WHERE (1 - (sc.users_reached::decimal / NULLIF(sc.users_targeted, 0))) > 0.5
    )::decimal / NULLIF(COUNT(DISTINCT s.id), 0))) * 100 >= 60 THEN 'good'
    WHEN (1 - (COUNT(DISTINCT s.id) FILTER (
      WHERE (1 - (sc.users_reached::decimal / NULLIF(sc.users_targeted, 0))) > 0.5
    )::decimal / NULLIF(COUNT(DISTINCT s.id), 0))) * 100 >= 40 THEN 'fair'
    ELSE 'poor'
  END AS health_status
FROM onboarding_sequences seq
LEFT JOIN onboarding_steps s ON s.sequence_id = seq.id
LEFT JOIN onboarding_step_completion sc ON sc.step_id = s.id
WHERE seq.is_active = true
GROUP BY seq.id, seq.sequence_key, seq.name, seq.ab_group;

-- Function to get weak steps with details
CREATE OR REPLACE FUNCTION get_weak_onboarding_steps(p_limit integer DEFAULT 10)
RETURNS TABLE (
  step_id uuid,
  sequence_key text,
  day_number integer,
  scenario_id text,
  dropoff_rate numeric,
  severity text,
  triggered_count bigint,
  completed_count bigint,
  recommended_actions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.step_id,
    d.sequence_key,
    d.day_number,
    d.scenario_id,
    d.dropoff_rate,
    d.severity,
    d.triggered_count,
    d.completed_count,
    jsonb_build_object(
      'priority', CASE 
        WHEN d.severity = 'critical' THEN 'urgent'
        WHEN d.severity = 'high' THEN 'high'
        ELSE 'medium'
      END,
      'actions', jsonb_build_array(
        'Review message copy',
        'Simplify user action',
        'Add emotional reassurance',
        'Reduce delay time'
      )
    ) AS recommended_actions
  FROM onboarding_dropoff_summary d
  WHERE d.severity IN ('critical', 'high')
  ORDER BY d.dropoff_rate DESC
  LIMIT p_limit;
END;
$$;