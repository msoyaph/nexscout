/*
  # Add Notification Preferences to Profiles

  1. Changes
    - Add `notification_preferences` column to profiles table (JSONB)
    - Stores user's notification delivery and alert preferences
    - Includes: push, email, SMS, summaries, specific alert types

  2. Security
    - Column is nullable (optional)
    - Uses IF NOT EXISTS to prevent errors
*/

-- Add notification_preferences column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notification_preferences jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
