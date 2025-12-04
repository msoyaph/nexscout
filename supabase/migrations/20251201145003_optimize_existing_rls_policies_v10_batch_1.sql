/*
  # Optimize RLS Policies - Existing Tables Batch 1
  
  1. RLS Optimization
    - Wrap auth.uid() with (SELECT auth.uid()) to prevent re-evaluation
  
  2. Tables Optimized
    - admin_companies
    - browser_captures
    - chatbot_analytics
    - chatbot_conversations
  
  3. Performance Impact
    - Single auth.uid() evaluation per query
*/

-- Check if user_profiles table exists for admin check
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    -- Admin companies policies
    DROP POLICY IF EXISTS "Super admins full access admin_companies" ON admin_companies;
    CREATE POLICY "Super admins full access admin_companies"
      ON admin_companies FOR ALL
      TO authenticated
      USING ((SELECT auth.uid()) IN (SELECT user_id FROM user_profiles WHERE is_super_admin = true));
  END IF;
END $$;

-- Browser capture policies
DROP POLICY IF EXISTS "Users manage own captures" ON browser_captures;
CREATE POLICY "Users manage own captures"
  ON browser_captures FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Chatbot analytics policies (if policy exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chatbot_analytics' 
    AND policyname LIKE '%owner%'
  ) THEN
    DROP POLICY IF EXISTS "Company owners manage chatbot analytics" ON chatbot_analytics;
    CREATE POLICY "Company owners manage chatbot analytics"
      ON chatbot_analytics FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public_chatbots pc
          JOIN company_profiles cp ON cp.id = pc.company_id
          WHERE pc.id = chatbot_analytics.chatbot_id
          AND cp.user_id = (SELECT auth.uid())
        )
      );
  END IF;
END $$;

-- Chatbot conversations policies
DROP POLICY IF EXISTS "Chatbot conversations accessible" ON chatbot_conversations;
CREATE POLICY "Chatbot conversations accessible"
  ON chatbot_conversations FOR SELECT
  TO anon, authenticated
  USING (true);
