/*
  # Optimize RLS Auth Functions - Batch 2

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid())
    - Improves RLS policy execution performance
  
  2. Affected Tables (Batch 2)
    - ai_conversations
    - ai_follow_up_sequences
    - ai_generated_messages
    - ai_learning_profiles
    - ai_pain_point_analysis
    - ai_personality_profiles
  
  3. Security
    - Maintains identical security rules
*/

-- ai_conversations policies
DROP POLICY IF EXISTS "Users can view own conversations" ON ai_conversations;
CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own conversations" ON ai_conversations;
CREATE POLICY "Users can insert own conversations"
  ON ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own conversations" ON ai_conversations;
CREATE POLICY "Users can update own conversations"
  ON ai_conversations FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ai_follow_up_sequences policies
DROP POLICY IF EXISTS "Users can view own sequences" ON ai_follow_up_sequences;
CREATE POLICY "Users can view own sequences"
  ON ai_follow_up_sequences FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own sequences" ON ai_follow_up_sequences;
CREATE POLICY "Users can insert own sequences"
  ON ai_follow_up_sequences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own sequences" ON ai_follow_up_sequences;
CREATE POLICY "Users can update own sequences"
  ON ai_follow_up_sequences FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ai_generated_messages policies
DROP POLICY IF EXISTS "Users can view own messages" ON ai_generated_messages;
CREATE POLICY "Users can view own messages"
  ON ai_generated_messages FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own messages" ON ai_generated_messages;
CREATE POLICY "Users can insert own messages"
  ON ai_generated_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ai_learning_profiles policies
DROP POLICY IF EXISTS "Users can view own learning profile" ON ai_learning_profiles;
CREATE POLICY "Users can view own learning profile"
  ON ai_learning_profiles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own learning profile" ON ai_learning_profiles;
CREATE POLICY "Users can update own learning profile"
  ON ai_learning_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ai_pain_point_analysis policies
DROP POLICY IF EXISTS "Users can view own analysis" ON ai_pain_point_analysis;
CREATE POLICY "Users can view own analysis"
  ON ai_pain_point_analysis FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own analysis" ON ai_pain_point_analysis;
CREATE POLICY "Users can insert own analysis"
  ON ai_pain_point_analysis FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ai_personality_profiles policies
DROP POLICY IF EXISTS "Users can view own personality profile" ON ai_personality_profiles;
CREATE POLICY "Users can view own personality profile"
  ON ai_personality_profiles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own personality profile" ON ai_personality_profiles;
CREATE POLICY "Users can insert own personality profile"
  ON ai_personality_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own personality profile" ON ai_personality_profiles;
CREATE POLICY "Users can update own personality profile"
  ON ai_personality_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
