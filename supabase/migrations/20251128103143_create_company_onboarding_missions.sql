/*
  # Company Onboarding Missions System

  1. New Tables
    - `company_onboarding_progress` - Track user progress through setup
    - `user_mission_progress` - Track individual mission completion

  2. Features
    - Gamified onboarding with coin rewards
    - Progress tracking through setup funnel
    - Mission completion tracking
    - Automatic coin distribution

  3. Security
    - RLS enabled on all tables
    - Users can only access their own data
*/

-- Company onboarding progress table
CREATE TABLE IF NOT EXISTS public.company_onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  step_intro_completed boolean DEFAULT false,
  step_basic_completed boolean DEFAULT false,
  step_assets_completed boolean DEFAULT false,
  step_persona_completed boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  assets_uploaded_count integer DEFAULT 0,
  total_coins_earned integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User mission progress table (extends existing missions system)
CREATE TABLE IF NOT EXISTS public.user_mission_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id text NOT NULL,
  mission_type text NOT NULL,
  mission_title text NOT NULL,
  coin_reward integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, mission_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_onboarding_progress_user ON public.company_onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mission_progress_user ON public.user_mission_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mission_progress_completed ON public.user_mission_progress(user_id, is_completed);

-- Enable RLS
ALTER TABLE public.company_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mission_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_onboarding_progress
CREATE POLICY "Users can view own onboarding progress"
  ON public.company_onboarding_progress FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own onboarding progress"
  ON public.company_onboarding_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own onboarding progress"
  ON public.company_onboarding_progress FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- RLS Policies for user_mission_progress
CREATE POLICY "Users can view own mission progress"
  ON public.user_mission_progress FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own mission progress"
  ON public.user_mission_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own mission progress"
  ON public.user_mission_progress FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_company_onboarding_progress_updated_at
  BEFORE UPDATE ON public.company_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_updated_at();

-- Function to initialize onboarding progress for new users
CREATE OR REPLACE FUNCTION public.initialize_company_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.company_onboarding_progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize onboarding on user creation
CREATE TRIGGER on_auth_user_created_init_onboarding
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_company_onboarding();
