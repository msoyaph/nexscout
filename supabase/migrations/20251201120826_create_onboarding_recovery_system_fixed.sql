/*
  # Onboarding Recovery & Follow-Up System

  1. New Tables
    - `onboarding_events` - Comprehensive event tracking
    - `onboarding_reminder_jobs` - Scheduled reminders across channels
    - `onboarding_reminder_logs` - Execution log and outcomes
    - `onboarding_risk_assessments` - Periodic risk snapshots

  2. Features
    - Multi-channel reminder system (in-app, push, email, SMS)
    - Risk level detection (low, medium, high, critical)
    - Smart scheduling with de-duplication
    - Outcome tracking and analytics
    - Spam prevention rules
    - Recovery plan execution

  3. Integration Points
    - AI Mentor Chat
    - Email Intelligence Engine
    - Notification Engine
    - Behavioral Messaging Engine

  4. Security
    - Full RLS on all tables
    - Service role for system operations
    - Admin analytics access
*/

-- Onboarding Events Table (Comprehensive Event Log)
CREATE TABLE IF NOT EXISTS onboarding_events_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  source text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_events_v2 ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_events_v2_user ON onboarding_events_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_v2_type ON onboarding_events_v2(event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_v2_created ON onboarding_events_v2(created_at DESC);

CREATE POLICY "Users can view own events v2"
  ON onboarding_events_v2 FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events v2"
  ON onboarding_events_v2 FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all events v2"
  ON onboarding_events_v2 FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Onboarding Reminder Jobs Table (Scheduled Reminders)
CREATE TABLE IF NOT EXISTS onboarding_reminder_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('in_app', 'push', 'email', 'sms')),
  template_key text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled', 'resolved')),
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  priority integer DEFAULT 5,
  planned_at timestamptz NOT NULL,
  sent_at timestamptz,
  resolved_at timestamptz,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_reminder_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_jobs_user ON onboarding_reminder_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_jobs_status ON onboarding_reminder_jobs(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_jobs_planned ON onboarding_reminder_jobs(planned_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_jobs_channel ON onboarding_reminder_jobs(channel);
CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_jobs_due ON onboarding_reminder_jobs(planned_at, status) WHERE status = 'pending';

CREATE POLICY "Users can view own reminder jobs"
  ON onboarding_reminder_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage reminder jobs"
  ON onboarding_reminder_jobs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Onboarding Reminder Logs Table (Execution Log)
CREATE TABLE IF NOT EXISTS onboarding_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid NOT NULL REFERENCES onboarding_reminder_jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  error_message text,
  response_data jsonb DEFAULT '{}',
  execution_time_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_logs_reminder ON onboarding_reminder_logs(reminder_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_logs_user ON onboarding_reminder_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_logs_status ON onboarding_reminder_logs(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_logs_created ON onboarding_reminder_logs(created_at DESC);

CREATE POLICY "Admins can view reminder logs"
  ON onboarding_reminder_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Onboarding Risk Assessments Table (Periodic Snapshots)
CREATE TABLE IF NOT EXISTS onboarding_risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score float DEFAULT 0,
  risk_reasons text[] DEFAULT '{}',
  missing_steps text[] DEFAULT '{}',
  recommended_channel text,
  recommended_actions text[] DEFAULT '{}',
  last_active_at timestamptz,
  assessment_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_risk_assessments_user ON onboarding_risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_risk_assessments_level ON onboarding_risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_onboarding_risk_assessments_score ON onboarding_risk_assessments(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_risk_assessments_created ON onboarding_risk_assessments(created_at DESC);

CREATE POLICY "Users can view own risk assessments"
  ON onboarding_risk_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage risk assessments"
  ON onboarding_risk_assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Function to get user's onboarding completion status
CREATE OR REPLACE FUNCTION get_onboarding_completion_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'has_company_data', EXISTS(SELECT 1 FROM company_profiles WHERE user_id = p_user_id),
    'has_products', EXISTS(SELECT 1 FROM products WHERE user_id = p_user_id),
    'chatbot_active', EXISTS(SELECT 1 FROM public_ai_chatbots WHERE user_id = p_user_id AND is_active = true),
    'has_prospects', EXISTS(SELECT 1 FROM prospects WHERE user_id = p_user_id),
    'has_scans', EXISTS(SELECT 1 FROM scan_sessions WHERE user_id = p_user_id),
    'has_sent_messages', EXISTS(SELECT 1 FROM ai_message_sequences WHERE user_id = p_user_id),
    'mentor_state', COALESCE((SELECT current_state FROM mentor_journey_state WHERE user_id = p_user_id), 'UNSTARTED'),
    'aha_achieved', COALESCE((SELECT aha_moment_detected FROM mentor_journey_state WHERE user_id = p_user_id), false),
    'first_win', COALESCE((SELECT first_win_achieved FROM mentor_journey_state WHERE user_id = p_user_id), false),
    'tasks_completed', COALESCE((SELECT COUNT(*) FROM mentor_tasks WHERE user_id = p_user_id AND status = 'completed'), 0),
    'last_active', COALESCE((SELECT last_interaction_at FROM mentor_journey_state WHERE user_id = p_user_id), now())
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_onboarding_risk_score(p_user_id uuid)
RETURNS float
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completion jsonb;
  v_score float := 0;
  v_hours_since_last_active integer;
BEGIN
  v_completion := get_onboarding_completion_status(p_user_id);
  
  v_hours_since_last_active := EXTRACT(EPOCH FROM (now() - (v_completion->>'last_active')::timestamptz)) / 3600;
  
  IF NOT (v_completion->>'has_company_data')::boolean THEN v_score := v_score + 20; END IF;
  IF NOT (v_completion->>'has_products')::boolean THEN v_score := v_score + 20; END IF;
  IF NOT (v_completion->>'chatbot_active')::boolean THEN v_score := v_score + 25; END IF;
  IF NOT (v_completion->>'has_prospects')::boolean THEN v_score := v_score + 15; END IF;
  IF NOT (v_completion->>'has_scans')::boolean THEN v_score := v_score + 10; END IF;
  IF NOT (v_completion->>'has_sent_messages')::boolean THEN v_score := v_score + 10; END IF;
  
  IF v_hours_since_last_active > 48 THEN v_score := v_score + 30;
  ELSIF v_hours_since_last_active > 24 THEN v_score := v_score + 20;
  ELSIF v_hours_since_last_active > 12 THEN v_score := v_score + 10;
  END IF;
  
  IF NOT (v_completion->>'aha_achieved')::boolean AND v_hours_since_last_active > 24 THEN
    v_score := v_score + 20;
  END IF;
  
  RETURN LEAST(v_score, 100);
END;
$$;

-- Function to get due reminders
CREATE OR REPLACE FUNCTION get_due_reminders()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  channel text,
  template_key text,
  risk_level text,
  metadata jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    id,
    user_id,
    channel,
    template_key,
    risk_level,
    metadata
  FROM onboarding_reminder_jobs
  WHERE status = 'pending'
    AND planned_at <= now()
    AND retry_count < max_retries
  ORDER BY priority DESC, planned_at ASC
  LIMIT 100;
$$;

-- Function to mark reminder as sent
CREATE OR REPLACE FUNCTION mark_reminder_sent(
  p_reminder_id uuid,
  p_success boolean,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_success THEN
    UPDATE onboarding_reminder_jobs
    SET
      status = 'sent',
      sent_at = now()
    WHERE id = p_reminder_id;
  ELSE
    UPDATE onboarding_reminder_jobs
    SET
      status = CASE
        WHEN retry_count + 1 >= max_retries THEN 'failed'
        ELSE 'pending'
      END,
      retry_count = retry_count + 1
    WHERE id = p_reminder_id;
  END IF;
  
  INSERT INTO onboarding_reminder_logs (
    reminder_id,
    user_id,
    channel,
    status,
    error_message
  )
  SELECT
    id,
    user_id,
    channel,
    CASE WHEN p_success THEN 'success' ELSE 'failed' END,
    p_error_message
  FROM onboarding_reminder_jobs
  WHERE id = p_reminder_id;
END;
$$;