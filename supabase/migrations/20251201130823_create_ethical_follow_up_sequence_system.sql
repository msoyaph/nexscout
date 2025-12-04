/*
  # Ethical Follow-Up Sequence System v1.0

  1. New Tables
    - `onboarding_sequence_state` - Tracks user progress through 7-day sequence
    - `communication_throttle_log` - Anti-spam tracking per channel
    - `user_communication_preferences` - User preferences (quiet mode, etc.)
    - `sequence_action_history` - History of all sequence actions

  2. Features
    - Day-by-day sequence tracking
    - Multi-channel throttling (email 1/day, push 1/12h)
    - Quiet hours enforcement (9PM-8AM PH time)
    - Reaction-based suppression
    - User preference management

  3. Security
    - Full RLS on all tables
    - User-scoped access
*/

-- Onboarding Sequence State (tracks where user is in 7-day flow)
CREATE TABLE IF NOT EXISTS public.onboarding_sequence_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  sequence_day integer NOT NULL DEFAULT 0 CHECK (sequence_day >= 0 AND sequence_day <= 7),
  current_step text,
  last_step_completed text,
  sequence_started_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz,
  completed_steps text[] DEFAULT '{}',
  skipped_days integer[] DEFAULT '{}',
  is_complete boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_sequence_state_user_id
  ON public.onboarding_sequence_state (user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_sequence_state_day
  ON public.onboarding_sequence_state (sequence_day, is_complete);

ALTER TABLE public.onboarding_sequence_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'onboarding_sequence_state'
      AND policyname = 'sequence_state_select_own'
  ) THEN
    CREATE POLICY sequence_state_select_own
      ON public.onboarding_sequence_state
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Communication Throttle Log (anti-spam tracking)
CREATE TABLE IF NOT EXISTS public.communication_throttle_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'push', 'in_app', 'sms')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  template_key text,
  opened boolean DEFAULT false,
  clicked boolean DEFAULT false,
  marked_as_spam boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communication_throttle_log_user_channel
  ON public.communication_throttle_log (user_id, channel, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_communication_throttle_log_sent_at
  ON public.communication_throttle_log (sent_at DESC);

ALTER TABLE public.communication_throttle_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'communication_throttle_log'
      AND policyname = 'throttle_log_select_own'
  ) THEN
    CREATE POLICY throttle_log_select_own
      ON public.communication_throttle_log
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- User Communication Preferences
CREATE TABLE IF NOT EXISTS public.user_communication_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  guidance_level text NOT NULL DEFAULT 'normal' CHECK (guidance_level IN ('more_guidance', 'normal', 'quiet_mode')),
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  quiet_hours_start integer DEFAULT 21 CHECK (quiet_hours_start >= 0 AND quiet_hours_start <= 23),
  quiet_hours_end integer DEFAULT 8 CHECK (quiet_hours_end >= 0 AND quiet_hours_end <= 23),
  timezone text DEFAULT 'Asia/Manila',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_communication_preferences_user_id
  ON public.user_communication_preferences (user_id);

ALTER TABLE public.user_communication_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_communication_preferences'
      AND policyname = 'comm_prefs_select_own'
  ) THEN
    CREATE POLICY comm_prefs_select_own
      ON public.user_communication_preferences
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_communication_preferences'
      AND policyname = 'comm_prefs_update_own'
  ) THEN
    CREATE POLICY comm_prefs_update_own
      ON public.user_communication_preferences
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Sequence Action History (complete audit log)
CREATE TABLE IF NOT EXISTS public.sequence_action_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  sequence_day integer NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('email', 'push', 'in_app', 'skip', 'complete')),
  trigger_reason text,
  template_key text,
  channel_used text,
  was_throttled boolean DEFAULT false,
  throttle_reason text,
  sent_successfully boolean,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sequence_action_history_user_id
  ON public.sequence_action_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sequence_action_history_day
  ON public.sequence_action_history (sequence_day, action_type);

ALTER TABLE public.sequence_action_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sequence_action_history'
      AND policyname = 'action_history_select_own'
  ) THEN
    CREATE POLICY action_history_select_own
      ON public.sequence_action_history
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Function to check if communication is allowed (anti-spam)
CREATE OR REPLACE FUNCTION can_send_communication(
  p_user_id uuid,
  p_channel text,
  p_check_time timestamptz DEFAULT now()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_email timestamptz;
  v_last_push timestamptz;
  v_prefs record;
  v_hour_of_day integer;
BEGIN
  SELECT * INTO v_prefs
  FROM user_communication_preferences
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_communication_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;
  
  v_hour_of_day := EXTRACT(HOUR FROM p_check_time AT TIME ZONE v_prefs.timezone);
  
  IF v_hour_of_day >= v_prefs.quiet_hours_start OR v_hour_of_day < v_prefs.quiet_hours_end THEN
    IF p_channel IN ('push', 'sms') THEN
      RETURN false;
    END IF;
  END IF;
  
  IF p_channel = 'email' THEN
    IF NOT v_prefs.email_enabled THEN
      RETURN false;
    END IF;
    
    SELECT MAX(sent_at) INTO v_last_email
    FROM communication_throttle_log
    WHERE user_id = p_user_id
      AND channel = 'email'
      AND sent_at > p_check_time - INTERVAL '24 hours';
    
    IF v_last_email IS NOT NULL THEN
      RETURN false;
    END IF;
  END IF;
  
  IF p_channel = 'push' THEN
    IF NOT v_prefs.push_enabled THEN
      RETURN false;
    END IF;
    
    SELECT MAX(sent_at) INTO v_last_push
    FROM communication_throttle_log
    WHERE user_id = p_user_id
      AND channel = 'push'
      AND sent_at > p_check_time - INTERVAL '12 hours';
    
    IF v_last_push IS NOT NULL THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to log communication sent
CREATE OR REPLACE FUNCTION log_communication_sent(
  p_user_id uuid,
  p_channel text,
  p_template_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO communication_throttle_log (user_id, channel, template_key)
  VALUES (p_user_id, p_channel, p_template_key);
END;
$$;

-- Function to get user's sequence day
CREATE OR REPLACE FUNCTION get_user_sequence_day(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_state record;
  v_days_since_start integer;
BEGIN
  SELECT * INTO v_state
  FROM onboarding_sequence_state
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO onboarding_sequence_state (user_id, sequence_day)
    VALUES (p_user_id, 0)
    RETURNING * INTO v_state;
  END IF;
  
  v_days_since_start := EXTRACT(DAY FROM (now() - v_state.sequence_started_at));
  
  RETURN LEAST(v_days_since_start, 7);
END;
$$;