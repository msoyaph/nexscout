/*
  # Optimize RLS Auth Functions - Batch 4 (Chatbot Tables)

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid())
  
  2. Affected Tables (Batch 4)
    - chatbot_analytics
    - chatbot_automation_settings
    - chatbot_configurations
    - chatbot_closing_attempts
  
  3. Security
    - Maintains identical security rules
*/

-- Get existing policies and optimize them
DO $$
DECLARE
  policy_record RECORD;
  new_qual TEXT;
  new_with_check TEXT;
BEGIN
  FOR policy_record IN 
    SELECT tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('chatbot_analytics', 'chatbot_automation_settings', 'chatbot_configurations', 'chatbot_closing_attempts')
      AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
  LOOP
    -- Replace auth.uid() with (select auth.uid()) in USING clause
    IF policy_record.qual IS NOT NULL THEN
      new_qual := REPLACE(policy_record.qual, 'auth.uid()', '(select auth.uid())');
    ELSE
      new_qual := NULL;
    END IF;
    
    -- Replace auth.uid() with (select auth.uid()) in WITH CHECK clause
    IF policy_record.with_check IS NOT NULL THEN
      new_with_check := REPLACE(policy_record.with_check, 'auth.uid()', '(select auth.uid())');
    ELSE
      new_with_check := NULL;
    END IF;
    
    -- Drop and recreate policy
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, policy_record.tablename);
    
    -- Recreate with optimized auth function
    IF policy_record.cmd = 'SELECT' THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (%s)',
        policy_record.policyname, policy_record.tablename, new_qual);
    ELSIF policy_record.cmd = 'INSERT' THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (%s)',
        policy_record.policyname, policy_record.tablename, new_with_check);
    ELSIF policy_record.cmd = 'UPDATE' THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
        policy_record.policyname, policy_record.tablename, new_qual, new_with_check);
    ELSIF policy_record.cmd = 'DELETE' THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (%s)',
        policy_record.policyname, policy_record.tablename, new_qual);
    END IF;
  END LOOP;
END $$;
