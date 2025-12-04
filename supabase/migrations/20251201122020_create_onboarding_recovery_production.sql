/*
  # Onboarding Recovery System - Production Schema

  1. New Tables
    - `onboarding_events` - Clean event tracking (references profiles)
    - `onboarding_reminder_jobs` - Production reminder jobs
    - `onboarding_reminder_logs` - Execution logs

  2. Features
    - Proper FK to profiles table
    - Cleaner RLS policies with conditional creation
    - Optimized indexes
    - Production-ready constraints

  3. Security
    - Full RLS on all tables
    - User-scoped access
    - Service role operations
*/

-- ============================================
-- ONBOARDING EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.onboarding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id
  ON public.onboarding_events (user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_type_created_at
  ON public.onboarding_events (event_type, created_at DESC);

ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'onboarding_events'
      AND policyname = 'onboarding_events_select_own'
  ) THEN
    CREATE POLICY onboarding_events_select_own
      ON public.onboarding_events
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'onboarding_events'
      AND policyname = 'onboarding_events_insert_own'
  ) THEN
    CREATE POLICY onboarding_events_insert_own
      ON public.onboarding_events
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- ONBOARDING REMINDER JOBS
-- ============================================
CREATE TABLE IF NOT EXISTS public.onboarding_reminder_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('in_app','push','email')),
  template_key text NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
  planned_at timestamptz NOT NULL,
  sent_at timestamptz,
  resolved_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','resolved','canceled')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_jobs_user_id
  ON public.onboarding_reminder_jobs (user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_jobs_status_planned
  ON public.onboarding_reminder_jobs (status, planned_at);

ALTER TABLE public.onboarding_reminder_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'onboarding_reminder_jobs'
      AND policyname = 'onboarding_reminders_select_own'
  ) THEN
    CREATE POLICY onboarding_reminders_select_own
      ON public.onboarding_reminder_jobs
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- ONBOARDING REMINDER LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.onboarding_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid NOT NULL REFERENCES public.onboarding_reminder_jobs (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('in_app','push','email')),
  status text NOT NULL CHECK (status IN ('success','failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_logs_user_id
  ON public.onboarding_reminder_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_logs_reminder_id
  ON public.onboarding_reminder_logs (reminder_id);

ALTER TABLE public.onboarding_reminder_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'onboarding_reminder_logs'
      AND policyname = 'onboarding_reminder_logs_select_own'
  ) THEN
    CREATE POLICY onboarding_reminder_logs_select_own
      ON public.onboarding_reminder_logs
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;