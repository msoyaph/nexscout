/*
  # Create Fixed Chatbot ID System

  1. New Tables
    - `chatbot_links` - Fixed chatbot IDs (one per user)
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `chatbot_id` (text, unique) - Fixed ID like 'ce3fcbab'
      - `custom_slug` (text, unique, nullable) - Pro users: 'Msoya'
      - `is_active` (boolean)
      - `total_conversations` (integer)
      - `total_messages` (integer)
      - `created_at` (timestamptz)
      - `last_used_at` (timestamptz)

  2. Changes
    - Update `public_chat_sessions` to link to chatbot_id
    - Add `visitor_session_id` to track individual visitors
    
  3. Security
    - Enable RLS on chatbot_links
    - Allow public read of active chatbot links
    - Allow users to manage their own links
*/

-- Create chatbot_links table
CREATE TABLE IF NOT EXISTS chatbot_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chatbot_id text UNIQUE NOT NULL,
  custom_slug text UNIQUE,
  is_active boolean DEFAULT true NOT NULL,
  total_conversations integer DEFAULT 0 NOT NULL,
  total_messages integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_used_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_links_user_id ON chatbot_links(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_links_chatbot_id ON chatbot_links(chatbot_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_chatbot_links_custom_slug ON chatbot_links(custom_slug) WHERE custom_slug IS NOT NULL AND is_active = true;

-- Enable RLS
ALTER TABLE chatbot_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active chatbot links"
  ON chatbot_links
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Users can view own chatbot links"
  ON chatbot_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chatbot links"
  ON chatbot_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chatbot links"
  ON chatbot_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chatbot links"
  ON chatbot_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add chatbot_id to public_chat_sessions
ALTER TABLE public_chat_sessions 
  ADD COLUMN IF NOT EXISTS chatbot_id text,
  ADD COLUMN IF NOT EXISTS visitor_session_id text;

-- Create index for chatbot_id
CREATE INDEX IF NOT EXISTS idx_chat_sessions_chatbot_id ON public_chat_sessions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor_session ON public_chat_sessions(visitor_session_id);

-- Function to get user from chatbot ID
CREATE OR REPLACE FUNCTION get_user_from_chatbot_id(p_chatbot_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if it's a custom slug first
  SELECT user_id INTO v_user_id
  FROM chatbot_links
  WHERE LOWER(custom_slug) = LOWER(p_chatbot_id) 
    AND is_active = true
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Update last_used_at
    UPDATE chatbot_links
    SET last_used_at = now()
    WHERE LOWER(custom_slug) = LOWER(p_chatbot_id);
    
    RETURN v_user_id;
  END IF;
  
  -- If not found, check regular chatbot_id
  SELECT user_id INTO v_user_id
  FROM chatbot_links
  WHERE chatbot_id = p_chatbot_id 
    AND is_active = true
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Update last_used_at
    UPDATE chatbot_links
    SET last_used_at = now()
    WHERE chatbot_id = p_chatbot_id;
    
    RETURN v_user_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Function to generate unique chatbot ID
CREATE OR REPLACE FUNCTION generate_chatbot_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_id text;
  v_exists boolean;
BEGIN
  LOOP
    -- Generate 8-character random hex
    v_id := encode(gen_random_bytes(4), 'hex');
    
    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM chatbot_links WHERE chatbot_id = v_id) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_id;
END;
$$;

-- Migrate existing public_chatbot_slugs to chatbot_links
INSERT INTO chatbot_links (user_id, chatbot_id, custom_slug, is_active, total_conversations, total_messages, created_at, last_used_at)
SELECT 
  user_id,
  slug as chatbot_id,
  CASE WHEN slug ~ '^[0-9a-f]{8}$' THEN NULL ELSE slug END as custom_slug,
  is_active,
  total_sessions as total_conversations,
  0 as total_messages,
  created_at,
  COALESCE(last_used_at, created_at) as last_used_at
FROM public_chatbot_slugs
WHERE NOT EXISTS (
  SELECT 1 FROM chatbot_links WHERE chatbot_links.user_id = public_chatbot_slugs.user_id
)
ON CONFLICT (chatbot_id) DO NOTHING;

-- Create trigger to auto-create chatbot link for new users
CREATE OR REPLACE FUNCTION create_chatbot_link_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create chatbot link if user doesn't have one
  IF NOT EXISTS (SELECT 1 FROM chatbot_links WHERE user_id = NEW.id) THEN
    INSERT INTO chatbot_links (user_id, chatbot_id, is_active)
    VALUES (NEW.id, generate_chatbot_id(), true);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (created after signup)
DROP TRIGGER IF EXISTS create_chatbot_link_on_profile ON profiles;
CREATE TRIGGER create_chatbot_link_on_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_chatbot_link_for_user();
