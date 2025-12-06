/*
  # Fix Function Search Path Security Issues (Correct Signatures)
  
  ## Purpose
  Set secure search_path for all database functions to prevent
  SQL injection through search_path manipulation attacks.
  
  ## Functions Updated
  All 31 functions with correct parameter signatures.
  
  ## Safety
  Only alters functions that exist.
  Safe to run on any database state.
*/

-- Helper function to safely set search_path only if function exists
CREATE OR REPLACE FUNCTION set_function_search_path_if_exists(
  p_function_signature TEXT
) RETURNS VOID AS $$
BEGIN
  -- Try to alter the function, ignore if it doesn't exist
  BEGIN
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', p_function_signature);
  EXCEPTION WHEN undefined_function THEN
    -- Function doesn't exist, skip silently
    NULL;
  END;
END;
$$ LANGUAGE plpgsql;

-- Functions with no parameters
SELECT set_function_search_path_if_exists('public.cleanup_expired_ai_generations()');
SELECT set_function_search_path_if_exists('public.auto_generate_starter_missions()');
SELECT set_function_search_path_if_exists('public.award_monthly_coin_bonus()');
SELECT set_function_search_path_if_exists('public.generate_invoice_number()');
SELECT set_function_search_path_if_exists('public.handle_new_user()');
SELECT set_function_search_path_if_exists('public.handle_updated_at()');
SELECT set_function_search_path_if_exists('public.initialize_user_scoring_profile()');
SELECT set_function_search_path_if_exists('public.sync_subscription_to_profile()');
SELECT set_function_search_path_if_exists('public.update_company_profiles_updated_at()');
SELECT set_function_search_path_if_exists('public.update_sequences_updated_at()');
SELECT set_function_search_path_if_exists('public.update_support_ticket_updated_at()');
SELECT set_function_search_path_if_exists('public.update_updated_at_column()');

-- Functions with reset daily/weekly_limits (both versions)
SELECT set_function_search_path_if_exists('public.reset_daily_limits()');
SELECT set_function_search_path_if_exists('public.reset_daily_limits(uuid)');
SELECT set_function_search_path_if_exists('public.reset_weekly_limits()');
SELECT set_function_search_path_if_exists('public.reset_weekly_limits(uuid)');

-- Functions with single UUID parameter
SELECT set_function_search_path_if_exists('public.get_latest_prospect_score(uuid)');
SELECT set_function_search_path_if_exists('public.get_prospect_counts_by_bucket(uuid)');
SELECT set_function_search_path_if_exists('public.get_unread_count(uuid)');
SELECT set_function_search_path_if_exists('public.mark_all_read(uuid)');
SELECT set_function_search_path_if_exists('public.get_coin_balance(uuid)');
SELECT set_function_search_path_if_exists('public.award_daily_bonus(uuid)');
SELECT set_function_search_path_if_exists('public.generate_daily_training_tasks(uuid)');

-- Functions with two UUID parameters
SELECT set_function_search_path_if_exists('public.create_sequence_reminders(uuid, uuid)');

-- Functions with UUID and integer
SELECT set_function_search_path_if_exists('public.can_afford_action(uuid, integer)');
SELECT set_function_search_path_if_exists('public.update_mission_progress(uuid, integer)');

-- Functions with UUID and date
SELECT set_function_search_path_if_exists('public.update_user_streak(uuid, date)');

-- Functions with UUID and text parameters
SELECT set_function_search_path_if_exists('public.check_ai_usage_limit(uuid, text, text)');
SELECT set_function_search_path_if_exists('public.record_coin_transaction(uuid, integer, text, text)');

-- Complex notification function
SELECT set_function_search_path_if_exists('public.create_notification(uuid, text, text, text, text, uuid, uuid, text, jsonb)');

-- Complex invoice function  
SELECT set_function_search_path_if_exists('public.create_invoice_for_payment(uuid, uuid, numeric, text, text, timestamptz, timestamptz)');

-- Clean up helper function
DROP FUNCTION IF EXISTS set_function_search_path_if_exists(TEXT);
