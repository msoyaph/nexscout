/*
  # Optimize RLS Policies - Existing Tables Batch 1

  1. Performance Improvements
    - Cache auth.uid() using subquery to prevent multiple calls
    - Improve query planner efficiency
  
  2. Tables Optimized
    - ai_follow_up_sequences
    - ai_message_sequences
    - ai_messages_library
    - calendar_events
    - coin_transactions
*/

-- ai_follow_up_sequences
DROP POLICY IF EXISTS "Users can view own sequences" ON ai_follow_up_sequences;
CREATE POLICY "Users can view own sequences"
  ON ai_follow_up_sequences FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own sequences" ON ai_follow_up_sequences;
CREATE POLICY "Users can insert own sequences"
  ON ai_follow_up_sequences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own sequences" ON ai_follow_up_sequences;
CREATE POLICY "Users can update own sequences"
  ON ai_follow_up_sequences FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own sequences" ON ai_follow_up_sequences;
CREATE POLICY "Users can delete own sequences"
  ON ai_follow_up_sequences FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ai_message_sequences
DROP POLICY IF EXISTS "Users can view own message sequences" ON ai_message_sequences;
CREATE POLICY "Users can view own message sequences"
  ON ai_message_sequences FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own message sequences" ON ai_message_sequences;
CREATE POLICY "Users can insert own message sequences"
  ON ai_message_sequences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own message sequences" ON ai_message_sequences;
CREATE POLICY "Users can update own message sequences"
  ON ai_message_sequences FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own message sequences" ON ai_message_sequences;
CREATE POLICY "Users can delete own message sequences"
  ON ai_message_sequences FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ai_messages_library
DROP POLICY IF EXISTS "Users can view own library messages" ON ai_messages_library;
CREATE POLICY "Users can view own library messages"
  ON ai_messages_library FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own library messages" ON ai_messages_library;
CREATE POLICY "Users can insert own library messages"
  ON ai_messages_library FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own library messages" ON ai_messages_library;
CREATE POLICY "Users can update own library messages"
  ON ai_messages_library FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own library messages" ON ai_messages_library;
CREATE POLICY "Users can delete own library messages"
  ON ai_messages_library FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- calendar_events
DROP POLICY IF EXISTS "Users can view own events" ON calendar_events;
CREATE POLICY "Users can view own events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own events" ON calendar_events;
CREATE POLICY "Users can insert own events"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own events" ON calendar_events;
CREATE POLICY "Users can update own events"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own events" ON calendar_events;
CREATE POLICY "Users can delete own events"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- coin_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON coin_transactions;
CREATE POLICY "Users can view own transactions"
  ON coin_transactions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own transactions" ON coin_transactions;
CREATE POLICY "Users can insert own transactions"
  ON coin_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
