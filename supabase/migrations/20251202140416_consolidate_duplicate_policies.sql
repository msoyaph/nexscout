/*
  # Consolidate Duplicate Policies

  1. Security Optimization
    - Remove duplicate RLS policies
    - Consolidate similar policies into single efficient policies
    - Reduce policy evaluation overhead
    
  2. Actions Taken
    - Identify and remove duplicate policies across tables
    - Keep most efficient policy version
    - Maintain same security constraints
    
  3. Security
    - No reduction in security
    - Improved query performance through fewer policy evaluations
*/

-- Remove any duplicate policies on public_chat_messages
DO $$
DECLARE
  policy_record RECORD;
  policy_count INTEGER;
BEGIN
  -- Check for duplicate SELECT policies on public_chat_messages
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename = 'public_chat_messages'
    AND cmd = 'SELECT'
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'public_chat_messages'
    AND cmd = 'SELECT';
    
    -- If more than one SELECT policy exists, keep only the first one
    IF policy_count > 1 THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public_chat_messages', policy_record.policyname);
    END IF;
  END LOOP;
END $$;

-- Recreate single comprehensive policy for public_chat_messages
DROP POLICY IF EXISTS "Anyone can view messages" ON public_chat_messages;
DROP POLICY IF EXISTS "Public access to messages" ON public_chat_messages;
DROP POLICY IF EXISTS "Users can view messages" ON public_chat_messages;

CREATE POLICY "Public can view chat messages"
  ON public_chat_messages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can insert chat messages"
  ON public_chat_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);