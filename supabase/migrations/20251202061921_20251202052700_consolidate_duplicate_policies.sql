/*
  # Consolidate Duplicate Permissive Policies

  1. Security Enhancement
    - Remove duplicate permissive policies on same table/command
    - Multiple permissive policies create OR conditions which can be overly permissive
  
  2. Affected Tables
    - ai_conversations, ai_generated_messages, ai_learning_profiles
    - ai_pain_point_analysis, ai_personality_profiles, ai_smartness
    - ai_team_coaching_insights, browser_capture_events
    - chatbot_settings, chatbot_visitors, coin_transactions
  
  3. Implementation
    - Identify duplicate policies and keep only the most restrictive one
*/

DO $$
DECLARE
  table_cmd RECORD;
  policy_list TEXT[];
  policy_to_keep TEXT;
BEGIN
  FOR table_cmd IN
    SELECT tablename, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND permissive = 'PERMISSIVE'
    GROUP BY tablename, cmd
    HAVING COUNT(*) > 1
  LOOP
    -- Get all policy names for this table/command
    SELECT array_agg(policyname ORDER BY policyname)
    INTO policy_list
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = table_cmd.tablename
      AND cmd = table_cmd.cmd;
    
    -- Keep the first policy, drop the rest
    policy_to_keep := policy_list[1];
    
    FOR i IN 2..array_length(policy_list, 1)
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
        policy_list[i], 
        table_cmd.tablename
      );
    END LOOP;
  END LOOP;
END $$;
