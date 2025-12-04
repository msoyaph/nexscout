/*
  # Add Fixed Chatbot ID to Chatbot Settings

  1. Purpose
    - Add fixed_chatbot_id column for public chatbot URLs
    - Generate unique IDs for each user's chatbot
    - Enable public chatbot access via custom URLs

  2. Changes
    - Add fixed_chatbot_id column to chatbot_settings
    - Populate existing records with generated IDs
    - Add unique constraint and index
    - Update RPC function to use the new column

  3. Security
    - RLS policies already in place
    - Public access controlled via is_active flag
*/

-- Add fixed_chatbot_id column to chatbot_settings
ALTER TABLE chatbot_settings 
ADD COLUMN IF NOT EXISTS fixed_chatbot_id TEXT UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_chatbot_settings_fixed_chatbot_id 
ON chatbot_settings(fixed_chatbot_id) 
WHERE fixed_chatbot_id IS NOT NULL;

-- Generate fixed_chatbot_id for existing records that don't have one
UPDATE chatbot_settings
SET fixed_chatbot_id = LOWER(SUBSTRING(MD5(user_id::text || created_at::text) FROM 1 FOR 12))
WHERE fixed_chatbot_id IS NULL;

-- Add comment explaining the column
COMMENT ON COLUMN chatbot_settings.fixed_chatbot_id IS 'Unique identifier for public chatbot URL access (e.g., /chat/abc123)';

-- Ensure get_user_from_chatbot_id function exists and works correctly
CREATE OR REPLACE FUNCTION get_user_from_chatbot_id(p_chatbot_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM chatbot_settings
  WHERE fixed_chatbot_id = p_chatbot_id
    AND is_active = true
  LIMIT 1;
  
  RETURN v_user_id;
END;
$$;

-- Add trigger to auto-generate fixed_chatbot_id for new records
CREATE OR REPLACE FUNCTION generate_fixed_chatbot_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.fixed_chatbot_id IS NULL THEN
    NEW.fixed_chatbot_id := LOWER(SUBSTRING(MD5(NEW.user_id::text || NOW()::text || random()::text) FROM 1 FOR 12));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_fixed_chatbot_id ON chatbot_settings;
CREATE TRIGGER set_fixed_chatbot_id
  BEFORE INSERT ON chatbot_settings
  FOR EACH ROW
  EXECUTE FUNCTION generate_fixed_chatbot_id();