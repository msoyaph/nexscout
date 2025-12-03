/*
  # Fix Public Chatbot Training Data Access

  1. Changes
    - Add SELECT policy for anonymous users to read chatbot_training_data
    - This allows the public chatbot to access training data for responses
  
  2. Security
    - Anonymous users can only READ training data
    - Only authenticated users can INSERT/UPDATE/DELETE their own data
    - Training data remains protected from modification
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view training data for active chatbots" ON chatbot_training_data;

-- Allow anonymous users to read training data for active chatbots
CREATE POLICY "Public can view training data for active chatbots"
  ON chatbot_training_data
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chatbot_settings
      WHERE chatbot_settings.user_id = chatbot_training_data.user_id
      AND chatbot_settings.is_active = true
    )
  );
