/*
  # AI Pipeline Automation System

  Creates tables and functions for autonomous AI-powered pipeline management.

  ## New Tables
  
  ### `ai_pipeline_jobs`
  Tracks AI automation jobs running on prospects
  - job_id: Unique identifier
  - user_id: Owner of the job
  - prospect_id: Target prospect (optional, null for batch jobs)
  - job_type: Type of AI task (follow_up, qualify, nurture, book_meeting, close_deal)
  - status: Current status (queued, running, paused, completed, failed)
  - config: Job configuration (JSON)
  - energy_cost: Energy units consumed
  - coin_cost: Coins consumed
  - results: Job results (JSON)
  - started_at, completed_at: Timestamps
  
  ### `ai_pipeline_actions`
  Log of all actions taken by AI
  - action_id: Unique identifier
  - job_id: Parent job
  - prospect_id: Target prospect
  - action_type: Type of action taken
  - action_data: Details of the action (JSON)
  - energy_used: Energy consumed for this action
  - success: Whether action succeeded
  
  ### `ai_pipeline_settings`
  User settings for AI automation
  - user_id: User identifier
  - auto_follow_up: Enable automatic follow-ups
  - auto_qualify: Enable automatic qualification
  - auto_nurture: Enable automatic nurturing
  - auto_book_meetings: Enable automatic meeting booking
  - energy_budget_daily: Daily energy budget for AI
  - coin_budget_daily: Daily coin budget for AI
  - aggressive_mode: More aggressive AI behavior
  
  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
*/

-- AI Pipeline Jobs Table
CREATE TABLE IF NOT EXISTS public.ai_pipeline_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES public.prospects(id) ON DELETE CASCADE,
  job_type text NOT NULL CHECK (job_type IN ('smart_scan', 'follow_up', 'qualify', 'nurture', 'book_meeting', 'close_deal', 'full_pipeline')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'paused', 'completed', 'failed', 'stopped')),
  config jsonb DEFAULT '{}',
  energy_cost integer DEFAULT 0,
  coin_cost integer DEFAULT 0,
  results jsonb DEFAULT '{}',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Pipeline Actions Log
CREATE TABLE IF NOT EXISTS public.ai_pipeline_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.ai_pipeline_jobs(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES public.prospects(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_data jsonb DEFAULT '{}',
  energy_used integer DEFAULT 0,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- AI Pipeline Settings
CREATE TABLE IF NOT EXISTS public.ai_pipeline_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_follow_up boolean DEFAULT false,
  auto_qualify boolean DEFAULT false,
  auto_nurture boolean DEFAULT false,
  auto_book_meetings boolean DEFAULT false,
  auto_close_deals boolean DEFAULT false,
  energy_budget_daily integer DEFAULT 100,
  coin_budget_daily integer DEFAULT 50,
  aggressive_mode boolean DEFAULT false,
  smart_scan_enabled boolean DEFAULT true,
  working_hours_start integer DEFAULT 9,
  working_hours_end integer DEFAULT 17,
  timezone text DEFAULT 'UTC',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_jobs_user_id ON public.ai_pipeline_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_jobs_prospect_id ON public.ai_pipeline_jobs(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_jobs_status ON public.ai_pipeline_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_jobs_created_at ON public.ai_pipeline_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_actions_job_id ON public.ai_pipeline_actions(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_actions_prospect_id ON public.ai_pipeline_actions(prospect_id);

-- Enable RLS
ALTER TABLE public.ai_pipeline_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_pipeline_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_pipeline_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_pipeline_jobs
CREATE POLICY "Users can view own pipeline jobs"
  ON public.ai_pipeline_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pipeline jobs"
  ON public.ai_pipeline_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pipeline jobs"
  ON public.ai_pipeline_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pipeline jobs"
  ON public.ai_pipeline_jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ai_pipeline_actions
CREATE POLICY "Users can view own pipeline actions"
  ON public.ai_pipeline_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_pipeline_jobs
      WHERE ai_pipeline_jobs.id = ai_pipeline_actions.job_id
      AND ai_pipeline_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create pipeline actions"
  ON public.ai_pipeline_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_pipeline_jobs
      WHERE ai_pipeline_jobs.id = ai_pipeline_actions.job_id
      AND ai_pipeline_jobs.user_id = auth.uid()
    )
  );

-- RLS Policies for ai_pipeline_settings
CREATE POLICY "Users can view own pipeline settings"
  ON public.ai_pipeline_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pipeline settings"
  ON public.ai_pipeline_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pipeline settings"
  ON public.ai_pipeline_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to initialize default settings for new users
CREATE OR REPLACE FUNCTION public.initialize_ai_pipeline_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ai_pipeline_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings on user creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'create_ai_pipeline_settings_on_signup'
  ) THEN
    CREATE TRIGGER create_ai_pipeline_settings_on_signup
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.initialize_ai_pipeline_settings();
  END IF;
END $$;