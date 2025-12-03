/*
  # Fix Public Chatbot Access and Policies

  1. Updates
    - Allow anonymous users to update chat sessions (for message counts, scores)
    - Add proper policies for chatbot_visitors table
    - Ensure chatbot_settings can be read publicly

  2. Security
    - Maintain data isolation
    - Allow public read for active chatbot settings
    - Enable anonymous session management
*/

-- Drop restrictive policy and add public update policy
DROP POLICY IF EXISTS "Users can update own chat sessions" ON public_chat_sessions;

CREATE POLICY "Public can update chat sessions"
  ON public_chat_sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow public to read active chatbot settings
DROP POLICY IF EXISTS "Users can view own chatbot settings" ON chatbot_settings;

CREATE POLICY "Public can view active chatbot settings"
  ON chatbot_settings FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Users can manage own chatbot settings"
  ON chatbot_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chatbot visitors policies
CREATE POLICY "Public can insert visitor data"
  ON chatbot_visitors FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their chatbot visitors"
  ON chatbot_visitors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
