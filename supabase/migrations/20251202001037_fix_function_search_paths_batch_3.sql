/*
  # Fix Function Search Paths - Batch 3

  Continue setting explicit search_path for security definer functions.

  ## Functions Updated (30 functions)
  - generate_flash_offer
  - generate_knowledge_post_slug
  - generate_post_slug
  - generate_unique_user_id
  - get_best_channel_for_prospect
  - get_coin_balance
  - get_due_reminders
  - get_my_admin_status
  - get_nudge_performance
  - get_onboarding_completion_status
  - get_pending_onboarding_jobs_v2
  - get_persona_recommendation
  - get_recent_onboarding_journeys
  - get_social_proof_message
  - get_top_closer_profile
  - get_unread_count
  - get_user_from_chat_slug
  - get_user_from_chatbot_id
  - get_user_from_extension_token
  - get_user_from_unique_id
  - get_user_sequence_day
  - get_user_tier
  - get_weak_onboarding_steps
  - handle_new_user
  - handle_subscription_downgrade
  - handle_subscription_upgrade_referral
  - has_any_admins
  - increment_ai_usage
  - increment_product_chatbot_stat
  - initialize_company_onboarding

  ## Security
  Prevents privilege escalation through search_path manipulation.
*/

ALTER FUNCTION public.generate_flash_offer(uuid, numeric, text, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_knowledge_post_slug() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_post_slug() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_unique_user_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_best_channel_for_prospect(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_coin_balance(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_due_reminders() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_my_admin_status() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_nudge_performance(text, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_onboarding_completion_status(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_pending_onboarding_jobs_v2(integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_persona_recommendation(text, text, text[]) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_recent_onboarding_journeys() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_social_proof_message(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_top_closer_profile(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_unread_count(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_from_chat_slug(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_from_chatbot_id(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_from_extension_token(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_from_unique_id(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_sequence_day(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_tier(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_weak_onboarding_steps(integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_subscription_downgrade() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_subscription_upgrade_referral() SET search_path = public, pg_temp;
ALTER FUNCTION public.has_any_admins() SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_ai_usage(uuid, text, integer, numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_product_chatbot_stat(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.initialize_company_onboarding() SET search_path = public, pg_temp;