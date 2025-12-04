/*
  # Optimize RLS Policies - Correct Implementation Batch 1
  
  1. RLS Optimization
    - Wrap auth.uid() with (SELECT auth.uid()) for single evaluation
  
  2. Tables Optimized
    - browser_captures
    - chatbot_analytics
    - chatbot_training_data
    - company_profiles
  
  3. Performance Impact
    - Prevents repeated auth.uid() calls
*/

-- Browser capture policies
DROP POLICY IF EXISTS "Users manage own captures" ON browser_captures;
CREATE POLICY "Users manage own captures"
  ON browser_captures FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Chatbot analytics policies
DROP POLICY IF EXISTS "Users manage own analytics" ON chatbot_analytics;
CREATE POLICY "Users manage own analytics"
  ON chatbot_analytics FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Chatbot training data policies
DROP POLICY IF EXISTS "Users manage own training data" ON chatbot_training_data;
CREATE POLICY "Users manage own training data"
  ON chatbot_training_data FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Company profiles policies
DROP POLICY IF EXISTS "Users manage own company profiles" ON company_profiles;
CREATE POLICY "Users manage own company profiles"
  ON company_profiles FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
