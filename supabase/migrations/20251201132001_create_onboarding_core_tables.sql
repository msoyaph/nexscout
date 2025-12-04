/*
  # Onboarding Core Tables - Sequences, Steps, Messages

  1. New Tables
    - `onboarding_sequences` - Registry of all sequence variants (v1, v2, A/B tests)
    - `onboarding_steps` - Individual steps/scenarios per sequence
    - `onboarding_messages` - Messages per step/channel with delays
    - Enhanced event/job tables for new architecture

  2. Features
    - Multi-sequence support with A/B testing
    - Flexible trigger-based system
    - Channel-specific messages with delays
    - Complete audit trail
    - RLS-ready

  3. Security
    - Full RLS on all tables
    - Admin-only access by default
*/

-- Main sequences registry
CREATE TABLE IF NOT EXISTS public.onboarding_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_key text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  ab_group text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_sequences_key_version
  ON public.onboarding_sequences (sequence_key, version);

CREATE INDEX IF NOT EXISTS idx_onboarding_sequences_active
  ON public.onboarding_sequences (is_active);

ALTER TABLE public.onboarding_sequences ENABLE ROW LEVEL SECURITY;

-- Individual steps / scenarios
CREATE TABLE IF NOT EXISTS public.onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.onboarding_sequences(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  scenario_id text NOT NULL,
  trigger_key text NOT NULL,
  priority integer NOT NULL DEFAULT 10,
  conditions_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_steps_sequence_day
  ON public.onboarding_steps (sequence_id, day_number);

CREATE INDEX IF NOT EXISTS idx_onboarding_steps_trigger
  ON public.onboarding_steps (trigger_key);

ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

-- Messages per step / channel
CREATE TABLE IF NOT EXISTS public.onboarding_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES public.onboarding_steps(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'push', 'mentor', 'sms')),
  subject text,
  title text,
  body text NOT NULL,
  delay_hours integer NOT NULL DEFAULT 0,
  locale text NOT NULL DEFAULT 'en-PH',
  action_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_messages_step_channel
  ON public.onboarding_messages (step_id, channel);

ALTER TABLE public.onboarding_messages ENABLE ROW LEVEL SECURITY;

-- Enhanced reminder jobs (now references messages table)
CREATE TABLE IF NOT EXISTS public.onboarding_reminder_jobs_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.onboarding_messages(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  channel text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_jobs_v2_user
  ON public.onboarding_reminder_jobs_v2 (user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_jobs_v2_status_scheduled
  ON public.onboarding_reminder_jobs_v2 (status, scheduled_for);

ALTER TABLE public.onboarding_reminder_jobs_v2 ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'onboarding_reminder_jobs_v2'
      AND policyname = 'reminder_jobs_v2_select_own'
  ) THEN
    CREATE POLICY reminder_jobs_v2_select_own
      ON public.onboarding_reminder_jobs_v2
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Enhanced reminder logs
CREATE TABLE IF NOT EXISTS public.onboarding_reminder_logs_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.onboarding_messages(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'skipped', 'failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_logs_v2_user
  ON public.onboarding_reminder_logs_v2 (user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_logs_v2_message
  ON public.onboarding_reminder_logs_v2 (message_id);

ALTER TABLE public.onboarding_reminder_logs_v2 ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'onboarding_reminder_logs_v2'
      AND policyname = 'reminder_logs_v2_select_own'
  ) THEN
    CREATE POLICY reminder_logs_v2_select_own
      ON public.onboarding_reminder_logs_v2
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- User sequence assignments (which sequence is each user in?)
CREATE TABLE IF NOT EXISTS public.user_sequence_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sequence_id uuid NOT NULL REFERENCES public.onboarding_sequences(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(user_id, sequence_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sequence_assignments_user
  ON public.user_sequence_assignments (user_id, is_active);

ALTER TABLE public.user_sequence_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_sequence_assignments'
      AND policyname = 'sequence_assignments_select_own'
  ) THEN
    CREATE POLICY sequence_assignments_select_own
      ON public.user_sequence_assignments
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Function to get pending jobs for cron
CREATE OR REPLACE FUNCTION get_pending_onboarding_jobs_v2(p_limit integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  message_id uuid,
  channel text,
  context jsonb,
  scheduled_for timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.user_id,
    j.message_id,
    j.channel,
    j.context,
    j.scheduled_for
  FROM onboarding_reminder_jobs_v2 j
  WHERE j.status = 'pending'
    AND j.scheduled_for <= now()
  ORDER BY j.scheduled_for ASC
  LIMIT p_limit;
END;
$$;

-- Function to mark job as processed
CREATE OR REPLACE FUNCTION mark_job_processed_v2(
  p_job_id uuid,
  p_status text,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE onboarding_reminder_jobs_v2
  SET
    status = p_status,
    updated_at = now()
  WHERE id = p_job_id;
END;
$$;