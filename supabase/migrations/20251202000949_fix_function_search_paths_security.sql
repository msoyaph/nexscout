/*
  # Fix Function Search Paths - Security Enhancement

  Set explicit search_path for all security definer functions.
  This prevents search_path manipulation attacks.

  ## Functions Updated
  - assign_unique_user_ids
  - assign_user_persona
  - auto_advance_pipeline_stage
  - auto_generate_starter_missions
  - auto_sync_ai_to_new_user
  - auto_sync_knowledge_to_new_users
  - award_daily_bonus
  - award_monthly_coin_bonus
  - calculate_coaching_score
  - calculate_dynamic_energy_cost
  - calculate_dynamic_price
  - calculate_intent_score
  - calculate_mission_reward (both overloads)
  - calculate_onboarding_risk_score
  - calculate_smartness_score
  - calculate_token_energy_cost
  - can_afford_action
  - can_send_communication
  - check_ai_usage_limit

  ## Security
  All security definer functions now have explicit search_path set to 'public, pg_temp'.
  This prevents privilege escalation through search_path manipulation.
*/

-- Set search_path for all security definer functions
ALTER FUNCTION public.assign_unique_user_ids() SET search_path = public, pg_temp;
ALTER FUNCTION public.assign_user_persona(uuid, text, numeric, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_advance_pipeline_stage(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_generate_starter_missions() SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_sync_ai_to_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_sync_knowledge_to_new_users() SET search_path = public, pg_temp;
ALTER FUNCTION public.award_daily_bonus(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.award_monthly_coin_bonus() SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_coaching_score(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_dynamic_energy_cost(uuid, integer, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_dynamic_price(uuid, integer, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_intent_score(uuid, integer, jsonb, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_mission_reward(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_mission_reward(text, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_onboarding_risk_score(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_smartness_score(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_token_energy_cost(uuid, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.can_afford_action(uuid, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.can_send_communication(uuid, text, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_ai_usage_limit(uuid, text, text) SET search_path = public, pg_temp;