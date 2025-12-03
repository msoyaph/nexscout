/*
  # Public Chatbot Slug Mapping System

  1. New Table
    - `public_chatbot_slugs`
      - Maps chat slugs to user IDs
      - Allows public access to find the right user
      - Each slug is unique

  2. Functions
    - `get_user_from_chat_slug` - Returns user_id for a given slug
    - `create_public_chat_slug` - Creates a new slug for a user

  3. Security
    - Public read access to find user
    - Only authenticated users can create slugs
*/

-- Public chatbot slug mapping
CREATE TABLE IF NOT EXISTS public_chatbot_slugs (
  slug text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  total_sessions integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_public_chatbot_slugs_user_id ON public_chatbot_slugs(user_id);
CREATE INDEX IF NOT EXISTS idx_public_chatbot_slugs_active ON public_chatbot_slugs(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE public_chatbot_slugs ENABLE ROW LEVEL SECURITY;

-- Public can read active slugs to find user
CREATE POLICY "Public can read active chatbot slugs"
  ON public_chatbot_slugs FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Users can manage their own slugs
CREATE POLICY "Users can manage own chatbot slugs"
  ON public_chatbot_slugs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to get user from chat slug
CREATE OR REPLACE FUNCTION get_user_from_chat_slug(p_slug text)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public_chatbot_slugs
  WHERE slug = p_slug
  AND is_active = true;
  
  -- Update last used timestamp
  IF v_user_id IS NOT NULL THEN
    UPDATE public_chatbot_slugs
    SET 
      last_used_at = now(),
      total_sessions = total_sessions + 1
    WHERE slug = p_slug;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or get public chat slug
CREATE OR REPLACE FUNCTION create_public_chat_slug(p_user_id uuid, p_custom_slug text DEFAULT NULL)
RETURNS text AS $$
DECLARE
  v_slug text;
BEGIN
  -- If custom slug provided, use it (if available)
  IF p_custom_slug IS NOT NULL THEN
    -- Check if slug exists
    IF EXISTS (SELECT 1 FROM public_chatbot_slugs WHERE slug = p_custom_slug) THEN
      RAISE EXCEPTION 'Slug already exists';
    END IF;
    v_slug := p_custom_slug;
  ELSE
    -- Generate random slug
    v_slug := substr(md5(random()::text || p_user_id::text), 1, 8);
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public_chatbot_slugs WHERE slug = v_slug) LOOP
      v_slug := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    END LOOP;
  END IF;
  
  -- Insert new slug
  INSERT INTO public_chatbot_slugs (slug, user_id, is_active)
  VALUES (v_slug, p_user_id, true)
  ON CONFLICT (slug) DO NOTHING;
  
  RETURN v_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert a default demo slug for testing (replace with actual user ID later)
-- This allows immediate testing of public chat
INSERT INTO public_chatbot_slugs (slug, user_id, is_active)
SELECT 
  'cddfbb98', 
  id, 
  true
FROM profiles
LIMIT 1
ON CONFLICT (slug) DO NOTHING;
