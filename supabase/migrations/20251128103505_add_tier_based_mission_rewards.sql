/*
  # Multi-Tier Mission Rewards System

  1. Changes
    - Add tier-based reward columns to user_mission_progress
    - Create mission definitions table
    - Add upgrade prompt tracking

  2. Features
    - Different rewards for Free, Pro, Elite
    - Psychological FOMO to drive upgrades
    - Progress tracking with tier comparison
    - Upgrade CTAs

  3. Security
    - RLS maintained on all tables
*/

-- Add tier-based reward columns to user_mission_progress
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_mission_progress' AND column_name = 'reward_coins_free'
  ) THEN
    ALTER TABLE public.user_mission_progress
      ADD COLUMN reward_coins_free integer DEFAULT 0,
      ADD COLUMN reward_coins_pro integer DEFAULT 0,
      ADD COLUMN reward_coins_elite integer DEFAULT 0,
      ADD COLUMN coins_earned integer DEFAULT 0,
      ADD COLUMN user_tier text;
  END IF;
END $$;

-- Create mission definitions table
CREATE TABLE IF NOT EXISTS public.mission_definitions (
  id text PRIMARY KEY,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  reward_free integer DEFAULT 0,
  reward_pro integer DEFAULT 0,
  reward_elite integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Insert company onboarding missions
INSERT INTO public.mission_definitions (id, category, title, description, reward_free, reward_pro, reward_elite, sort_order) VALUES
  ('upload_logo', 'company_onboarding', 'Upload Company Logo', 'Your AI needs your logo to start learning your brand identity.', 5, 15, 40, 1),
  ('upload_presentation', 'company_onboarding', 'Upload Company Presentation', 'This powers AI pitch decks and AI presentations tailored to your company.', 10, 35, 80, 2),
  ('upload_brochure', 'company_onboarding', 'Upload Product Brochure', 'Boosts accuracy for product-based messages and sales angles.', 10, 25, 70, 3),
  ('upload_comp_plan', 'company_onboarding', 'Upload Compensation Plan', 'AI learns your plan to generate closing scripts & opportunity pitches.', 10, 25, 75, 4),
  ('upload_website', 'company_onboarding', 'Add Company Website', 'AI extracts your company story, strengths, and target customer.', 5, 20, 60, 5),
  ('complete_persona', 'company_onboarding', 'Complete Company Persona', 'Set how your AI should speak—formal, friendly, Taglish, corporate, etc.', 10, 30, 100, 6),
  ('upload_3_assets', 'company_onboarding', 'Upload 3+ Company Assets', 'Unlock full power of personalization. Your AI becomes 3× smarter.', 20, 80, 200, 7),
  ('full_setup', 'company_onboarding', 'Complete Full Company Setup', 'Your AI Brain is created. Boost message relevance & closing accuracy.', 30, 100, 300, 8)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  reward_free = EXCLUDED.reward_free,
  reward_pro = EXCLUDED.reward_pro,
  reward_elite = EXCLUDED.reward_elite,
  sort_order = EXCLUDED.sort_order;

-- Create upgrade prompts tracking table
CREATE TABLE IF NOT EXISTS public.upgrade_prompt_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context text NOT NULL,
  prompt_type text NOT NULL,
  viewed_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mission_definitions_category ON public.mission_definitions(category);
CREATE INDEX IF NOT EXISTS idx_mission_definitions_active ON public.mission_definitions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_upgrade_prompt_views_user ON public.upgrade_prompt_views(user_id);

-- Enable RLS
ALTER TABLE public.mission_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upgrade_prompt_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mission_definitions (public read)
CREATE POLICY "Anyone can view active missions"
  ON public.mission_definitions FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for upgrade_prompt_views
CREATE POLICY "Users can view own upgrade prompts"
  ON public.upgrade_prompt_views FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own upgrade prompts"
  ON public.upgrade_prompt_views FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Function to get user's tier
CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_tier text;
BEGIN
  SELECT COALESCE(subscription_tier, 'free')
  INTO v_tier
  FROM public.user_profiles
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate tier reward
CREATE OR REPLACE FUNCTION public.calculate_mission_reward(
  p_mission_id text,
  p_user_id uuid
)
RETURNS integer AS $$
DECLARE
  v_tier text;
  v_reward integer;
BEGIN
  v_tier := public.get_user_tier(p_user_id);
  
  SELECT
    CASE v_tier
      WHEN 'elite' THEN reward_elite
      WHEN 'pro' THEN reward_pro
      ELSE reward_free
    END
  INTO v_reward
  FROM public.mission_definitions
  WHERE id = p_mission_id;
  
  RETURN COALESCE(v_reward, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
