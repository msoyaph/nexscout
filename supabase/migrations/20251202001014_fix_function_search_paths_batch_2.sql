/*
  # Fix Function Search Paths - Batch 2

  Continue setting explicit search_path for security definer functions.

  ## Functions Updated (30 functions)
  - clean_expired_cache
  - clean_expired_prompt_cache
  - cleanup_expired_ai_generations
  - cleanup_expired_cache
  - cleanup_old_health_checks
  - cleanup_stale_pending_transactions
  - create_chatbot_link_for_user
  - create_default_automation_settings
  - create_default_chatbot_config
  - create_default_efficiency_profile
  - create_default_energy_pattern
  - create_default_pricing_profile
  - create_invoice_for_payment
  - create_knowledge_post_revision
  - create_notification
  - create_public_chat_slug
  - create_user_energy
  - create_user_referral_code
  - current_enterprise_ids
  - current_team_ids
  - detect_handoff_trigger
  - detect_high_intent_and_activate
  - detect_surge_event
  - dev_make_me_admin
  - elect_champion_flows
  - find_identity_matches
  - generate_browser_extension_token
  - generate_chat_slug
  - generate_copilot_suggestions
  - generate_daily_training_tasks

  ## Security
  Prevents privilege escalation through search_path manipulation.
*/

ALTER FUNCTION public.clean_expired_cache() SET search_path = public, pg_temp;
ALTER FUNCTION public.clean_expired_prompt_cache() SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_expired_ai_generations() SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_expired_cache() SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_old_health_checks() SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_stale_pending_transactions() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_chatbot_link_for_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_default_automation_settings() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_default_chatbot_config() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_default_efficiency_profile() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_default_energy_pattern() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_default_pricing_profile() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_invoice_for_payment(uuid, uuid, numeric, text, text, timestamp with time zone, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_knowledge_post_revision() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_notification(uuid, text, text, text, text, uuid, uuid, text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_public_chat_slug(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_user_energy() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_user_referral_code() SET search_path = public, pg_temp;
ALTER FUNCTION public.current_enterprise_ids() SET search_path = public, pg_temp;
ALTER FUNCTION public.current_team_ids() SET search_path = public, pg_temp;
ALTER FUNCTION public.detect_handoff_trigger(uuid, uuid, text, numeric, numeric, numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.detect_high_intent_and_activate(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.detect_surge_event(uuid, text, numeric, numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.dev_make_me_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.elect_champion_flows() SET search_path = public, pg_temp;
ALTER FUNCTION public.find_identity_matches(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_browser_extension_token(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_chat_slug(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_copilot_suggestions(uuid, uuid, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_daily_training_tasks(uuid) SET search_path = public, pg_temp;