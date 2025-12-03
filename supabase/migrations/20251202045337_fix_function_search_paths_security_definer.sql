/*
  # Fix Function Search Path Security Issues

  1. Security Enhancement
    - Add explicit search_path to SECURITY DEFINER functions
    - Prevents search_path hijacking attacks
    - Sets search_path to 'public' for all affected functions
    
  2. Functions Fixed
    - ensure_minimum_resources
    - initialize_ai_pipeline_settings
    - initialize_user_resources
    
  3. Security Impact
    - CRITICAL: Without explicit search_path, malicious users could create objects in other schemas
    - This could lead to privilege escalation or data access violations
    - Setting search_path prevents these attack vectors
*/

-- Fix ensure_minimum_resources
CREATE OR REPLACE FUNCTION public.ensure_minimum_resources(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Ensure minimum energy
  UPDATE public.user_energy
  SET current_energy = GREATEST(current_energy, 100),
      max_energy = GREATEST(max_energy, 100)
  WHERE user_id = p_user_id;

  -- Ensure minimum coins
  UPDATE public.profiles
  SET coin_balance = GREATEST(coin_balance, 100),
      coins_balance = GREATEST(coins_balance, 100)
  WHERE id = p_user_id;
END;
$function$;

-- Fix initialize_ai_pipeline_settings
CREATE OR REPLACE FUNCTION public.initialize_ai_pipeline_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.ai_pipeline_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Fix initialize_user_resources
CREATE OR REPLACE FUNCTION public.initialize_user_resources()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Initialize energy if not exists
  INSERT INTO public.user_energy (user_id, current_energy, max_energy)
  VALUES (NEW.id, 100, 100)
  ON CONFLICT (user_id) DO UPDATE
  SET current_energy = GREATEST(user_energy.current_energy, 100),
      max_energy = GREATEST(user_energy.max_energy, 100);

  -- Ensure coins are set
  NEW.coin_balance := GREATEST(COALESCE(NEW.coin_balance, 0), 100);
  NEW.coins_balance := GREATEST(COALESCE(NEW.coins_balance, 0), 100);

  RETURN NEW;
END;
$function$;