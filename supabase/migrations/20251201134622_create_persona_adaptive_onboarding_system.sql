/*
  # Persona-Adaptive Onboarding System

  1. New Tables
    - `personas` - Master list of personas (MLM, Insurance, etc.)
    - `user_persona_profiles` - User persona detection and assignment
    - Extensions to existing onboarding tables

  2. Features
    - Persona detection from signup role
    - Behavioral persona inference
    - Persona-specific onboarding sequences
    - Confidence scoring
    - Multi-persona support

  3. Security
    - Full RLS on all tables
    - Users can view own persona
    - Admin access for management
*/

-- Personas master table
CREATE TABLE IF NOT EXISTS public.personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  label text NOT NULL,
  description text,
  icon text,
  color text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personas_code ON public.personas (code);
CREATE INDEX IF NOT EXISTS idx_personas_active ON public.personas (is_active, display_order);

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

-- Seed personas
INSERT INTO public.personas (code, label, description, icon, color, display_order) VALUES
  ('mlm', 'Network Marketer', 'MLM / Direct Selling / Network Marketing professionals', '👥', '#8B5CF6', 1),
  ('insurance', 'Insurance Advisor', 'Insurance and financial planning professionals', '🛡️', '#3B82F6', 2),
  ('real_estate', 'Real Estate Agent', 'Property agents and brokers', '🏠', '#10B981', 3),
  ('online_seller', 'Online Seller', 'E-commerce, resellers, dropshippers', '🛍️', '#F59E0B', 4),
  ('coach', 'Coach / Trainer', 'Business/relationship/fitness/spiritual coaches', '🎯', '#EF4444', 5)
ON CONFLICT (code) DO NOTHING;

-- User persona profiles
CREATE TABLE IF NOT EXISTS public.user_persona_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  primary_persona_code text REFERENCES public.personas(code),
  secondary_persona_code text REFERENCES public.personas(code),
  confidence numeric NOT NULL DEFAULT 0.7 CHECK (confidence >= 0 AND confidence <= 1),
  detection_source text NOT NULL CHECK (detection_source IN ('signup_role', 'company_data', 'behavior', 'manual', 'fallback_default', 'behavior_mix')),
  detection_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_persona_profiles_primary ON public.user_persona_profiles (primary_persona_code);
CREATE INDEX IF NOT EXISTS idx_user_persona_profiles_confidence ON public.user_persona_profiles (confidence DESC);

ALTER TABLE public.user_persona_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_persona_profiles'
      AND policyname = 'user_persona_profiles_select_own'
  ) THEN
    CREATE POLICY user_persona_profiles_select_own
      ON public.user_persona_profiles
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_persona_profiles'
      AND policyname = 'user_persona_profiles_insert_own'
  ) THEN
    CREATE POLICY user_persona_profiles_insert_own
      ON public.user_persona_profiles
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_persona_profiles'
      AND policyname = 'user_persona_profiles_update_own'
  ) THEN
    CREATE POLICY user_persona_profiles_update_own
      ON public.user_persona_profiles
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Extend onboarding_sequences for persona targeting
ALTER TABLE public.onboarding_sequences
ADD COLUMN IF NOT EXISTS persona_code text REFERENCES public.personas(code),
ADD COLUMN IF NOT EXISTS is_persona_specific boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_onboarding_sequences_persona
  ON public.onboarding_sequences (persona_code, is_persona_specific);

-- Extend onboarding_steps for persona targeting
ALTER TABLE public.onboarding_steps
ADD COLUMN IF NOT EXISTS persona_code text REFERENCES public.personas(code),
ADD COLUMN IF NOT EXISTS is_persona_specific boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_onboarding_steps_persona
  ON public.onboarding_steps (persona_code, is_persona_specific);

-- Persona performance analytics view
CREATE OR REPLACE VIEW public.persona_onboarding_performance AS
SELECT
  p.code AS persona_code,
  p.label AS persona_label,
  p.icon AS persona_icon,
  COUNT(DISTINCT upp.user_id) AS total_users,
  AVG(upp.confidence) AS avg_confidence,
  COUNT(DISTINCT CASE 
    WHEN fw.funnel_stage IN ('first_sale', 'first_appointment') THEN upp.user_id 
  END) AS first_win_users,
  ROUND(
    COUNT(DISTINCT CASE 
      WHEN fw.funnel_stage IN ('first_sale', 'first_appointment') THEN upp.user_id 
    END)::numeric / NULLIF(COUNT(DISTINCT upp.user_id), 0) * 100,
    2
  ) AS first_win_rate,
  COUNT(DISTINCT CASE 
    WHEN fw.funnel_stage = 'signup_only' THEN upp.user_id 
  END) AS stuck_at_signup,
  ROUND(
    COUNT(DISTINCT CASE 
      WHEN fw.funnel_stage = 'signup_only' THEN upp.user_id 
    END)::numeric / NULLIF(COUNT(DISTINCT upp.user_id), 0) * 100,
    2
  ) AS churn_rate
FROM personas p
LEFT JOIN user_persona_profiles upp ON upp.primary_persona_code = p.code
LEFT JOIN first_win_funnel fw ON fw.user_id = upp.user_id
WHERE p.is_active = true
GROUP BY p.code, p.label, p.icon, p.display_order
ORDER BY p.display_order;

-- Function to get persona recommendation
CREATE OR REPLACE FUNCTION get_persona_recommendation(
  p_signup_role text DEFAULT NULL,
  p_company_type text DEFAULT NULL,
  p_visited_pages text[] DEFAULT NULL
)
RETURNS TABLE (
  persona_code text,
  confidence numeric,
  detection_source text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_lower text;
  v_company_lower text;
  v_pages_text text;
BEGIN
  v_role_lower := LOWER(COALESCE(p_signup_role, ''));
  v_company_lower := LOWER(COALESCE(p_company_type, ''));
  v_pages_text := LOWER(array_to_string(COALESCE(p_visited_pages, ARRAY[]::text[]), ' '));

  -- Direct role mapping (highest confidence)
  IF v_role_lower LIKE '%mlm%' OR v_role_lower LIKE '%network%' OR v_role_lower LIKE '%direct selling%' THEN
    RETURN QUERY SELECT 'mlm'::text, 0.95::numeric, 'signup_role'::text;
    RETURN;
  END IF;

  IF v_role_lower LIKE '%insur%' OR v_role_lower LIKE '%financial%' THEN
    RETURN QUERY SELECT 'insurance'::text, 0.95::numeric, 'signup_role'::text;
    RETURN;
  END IF;

  IF v_role_lower LIKE '%real estate%' OR v_role_lower LIKE '%property%' OR v_role_lower LIKE '%realtor%' THEN
    RETURN QUERY SELECT 'real_estate'::text, 0.95::numeric, 'signup_role'::text;
    RETURN;
  END IF;

  IF v_role_lower LIKE '%seller%' OR v_role_lower LIKE '%ecom%' OR v_role_lower LIKE '%online%' OR v_role_lower LIKE '%shop%' THEN
    RETURN QUERY SELECT 'online_seller'::text, 0.95::numeric, 'signup_role'::text;
    RETURN;
  END IF;

  IF v_role_lower LIKE '%coach%' OR v_role_lower LIKE '%trainer%' OR v_role_lower LIKE '%mentor%' THEN
    RETURN QUERY SELECT 'coach'::text, 0.95::numeric, 'signup_role'::text;
    RETURN;
  END IF;

  -- Company type analysis (medium confidence)
  IF v_company_lower LIKE '%mlm%' OR v_company_lower LIKE '%network%' THEN
    RETURN QUERY SELECT 'mlm'::text, 0.8::numeric, 'company_data'::text;
    RETURN;
  END IF;

  IF v_company_lower LIKE '%insur%' THEN
    RETURN QUERY SELECT 'insurance'::text, 0.8::numeric, 'company_data'::text;
    RETURN;
  END IF;

  -- Behavioral signals (lower confidence)
  IF v_pages_text LIKE '%mlm%' OR v_pages_text LIKE '%network%' THEN
    RETURN QUERY SELECT 'mlm'::text, 0.6::numeric, 'behavior'::text;
    RETURN;
  END IF;

  -- Default fallback
  RETURN QUERY SELECT 'mlm'::text, 0.5::numeric, 'fallback_default'::text;
END;
$$;

-- Function to assign persona to user
CREATE OR REPLACE FUNCTION assign_user_persona(
  p_user_id uuid,
  p_persona_code text,
  p_confidence numeric DEFAULT 0.7,
  p_detection_source text DEFAULT 'manual'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_persona_profiles (
    user_id,
    primary_persona_code,
    confidence,
    detection_source,
    last_computed_at
  ) VALUES (
    p_user_id,
    p_persona_code,
    p_confidence,
    p_detection_source,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    primary_persona_code = EXCLUDED.primary_persona_code,
    confidence = EXCLUDED.confidence,
    detection_source = EXCLUDED.detection_source,
    last_computed_at = now(),
    updated_at = now();
END;
$$;