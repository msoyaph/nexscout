/*
  # Fix Function Search Paths - Security Fix

  1. Purpose
    - Set immutable search_path for functions to prevent security vulnerabilities
    - Fixes role mutable search_path warnings
  
  2. Functions Fixed
    - normalize_company_name
    - update_company_updated_at
    - initialize_company_onboarding
    - get_user_tier
    - calculate_mission_reward
*/

-- Fix normalize_company_name
CREATE OR REPLACE FUNCTION normalize_company_name(name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN lower(trim(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g')));
END;
$$;

-- Fix update_company_updated_at
CREATE OR REPLACE FUNCTION update_company_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix initialize_company_onboarding
CREATE OR REPLACE FUNCTION initialize_company_onboarding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO company_onboarding_progress (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix get_user_tier
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tier text;
BEGIN
  SELECT tier INTO v_tier
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_tier, 'free');
END;
$$;

-- Fix calculate_mission_reward
CREATE OR REPLACE FUNCTION calculate_mission_reward(
  p_mission_type text,
  p_user_tier text
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN CASE
    WHEN p_user_tier = 'elite' THEN 50
    WHEN p_user_tier = 'pro' THEN 30
    ELSE 10
  END;
END;
$$;
