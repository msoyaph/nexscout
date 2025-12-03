/*
  # Fix Function Search Path for User Functions

  1. Security Enhancement
    - Add explicit search_path to user-defined functions
    - Prevents search path hijacking attacks
  
  2. Implementation
    - Only updates functions we own (not extension functions)
    - Sets search_path = public, pg_catalog
  
  3. Security
    - Protects against malicious schema manipulation
*/

DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
    WHERE n.nspname = 'public'
      AND d.objid IS NULL  -- Not part of an extension
      AND p.proname IN (
        'handle_new_user',
        'update_updated_at',
        'generate_chat_slug',
        'generate_avatar_seed',
        'check_user_is_admin',
        'check_user_is_super_admin',
        'award_mission_coins',
        'process_referral_upgrade'
      )
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_catalog',
        func_record.schema_name,
        func_record.function_name,
        func_record.args
      );
    EXCEPTION WHEN OTHERS THEN
      -- Skip if we don't have permission
      CONTINUE;
    END;
  END LOOP;
END $$;
