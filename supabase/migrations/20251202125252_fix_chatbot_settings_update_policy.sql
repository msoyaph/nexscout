/*
  # Fix Chatbot Settings RLS - Add UPDATE Policy

  1. Problem
    - Users can INSERT chatbot settings but cannot UPDATE them
    - The upsert operation in ChatbotSettingsPage is failing
    - Error: "Failed to save settings"

  2. Solution
    - Add UPDATE policy for authenticated users to update their own settings
    - Add DELETE policy for users to manage their own settings

  3. Security
    - Users can only UPDATE their own settings (user_id = auth.uid())
    - Users can only DELETE their own settings (user_id = auth.uid())
*/

-- Add UPDATE policy for chatbot_settings
CREATE POLICY "Users can update own chatbot settings"
  ON chatbot_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add DELETE policy for chatbot_settings (for completeness)
CREATE POLICY "Users can delete own chatbot settings"
  ON chatbot_settings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index on user_id for faster policy checks
CREATE INDEX IF NOT EXISTS idx_chatbot_settings_user_id ON chatbot_settings(user_id);
