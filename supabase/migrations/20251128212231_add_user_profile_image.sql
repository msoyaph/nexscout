/*
  # Add User Profile Image Field

  1. Changes
    - Add `uploaded_image_url` column to profiles table for user profile pictures
    - This allows users to upload custom profile photos

  2. Security
    - Column is nullable (optional)
    - Uses IF NOT EXISTS to prevent errors
*/

-- Add uploaded_image_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'uploaded_image_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN uploaded_image_url text;
  END IF;
END $$;
