/*
  # Fix Chatbot Settings SELECT Policy

  1. Problem
    - Users can only SELECT chatbot_settings where is_active = true
    - Users need to view their own settings to edit them, even if inactive
    - This prevents the settings page from loading user's own settings

  2. Solution
    - Add SELECT policy for authenticated users to view their own settings
    - Keep existing public SELECT policy for active chatbots

  3. Security
    - Authenticated users can SELECT their own settings (user_id = auth.uid())
    - Public can SELECT active chatbot settings (for public chat pages)
*/

-- Add SELECT policy for users to view their own settings
CREATE POLICY "Users can view own chatbot settings"
  ON chatbot_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
