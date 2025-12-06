-- =====================================================
-- ENSURE CHATBOT LINKS INITIALIZED
-- =====================================================
-- Purpose: Fix "Chat not found" errors by ensuring all users have chatbot links
-- Creates chatbot_links entries for all users with chatbot_settings
-- =====================================================

-- Ensure chatbot_links table exists
CREATE TABLE IF NOT EXISTS chatbot_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chatbot_id TEXT NOT NULL, -- Fixed ID (short alphanumeric)
  custom_slug TEXT, -- Custom vanity URL (Pro feature)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT unique_chatbot_id UNIQUE(chatbot_id),
  CONSTRAINT unique_custom_slug UNIQUE(custom_slug) WHERE custom_slug IS NOT NULL,
  CONSTRAINT unique_user_chatbot_link UNIQUE(user_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_chatbot_links_chatbot_id ON chatbot_links(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_links_custom_slug ON chatbot_links(custom_slug) WHERE custom_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chatbot_links_user ON chatbot_links(user_id);

-- Enable RLS
ALTER TABLE chatbot_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can read active chatbot links" ON chatbot_links;
CREATE POLICY "Public can read active chatbot links"
  ON chatbot_links
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can manage own chatbot links" ON chatbot_links;
CREATE POLICY "Users can manage own chatbot links"
  ON chatbot_links
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Auto-create chatbot links for existing users
-- =====================================================

-- Function to generate short alphanumeric ID (6 chars)
CREATE OR REPLACE FUNCTION generate_chatbot_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create chatbot links for all users who don't have one
INSERT INTO chatbot_links (user_id, chatbot_id, is_active)
SELECT 
  p.id as user_id,
  COALESCE(
    p.unique_user_id, -- Use existing unique_user_id if available
    generate_chatbot_id() -- Generate new one
  ) as chatbot_id,
  true as is_active
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM chatbot_links cl WHERE cl.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Fix get_user_from_chatbot_id function
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_from_chatbot_id(p_chatbot_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Strategy 1: Check custom_slug (Pro users with vanity URLs)
  SELECT user_id INTO v_user_id
  FROM chatbot_links
  WHERE LOWER(custom_slug) = LOWER(p_chatbot_id)
    AND custom_slug IS NOT NULL
    AND is_active = true
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Update last used
    UPDATE chatbot_links
    SET last_used_at = NOW()
    WHERE LOWER(custom_slug) = LOWER(p_chatbot_id);
    
    RETURN v_user_id;
  END IF;
  
  -- Strategy 2: Check chatbot_id (fixed short ID)
  SELECT user_id INTO v_user_id
  FROM chatbot_links
  WHERE LOWER(chatbot_id) = LOWER(p_chatbot_id)
    AND is_active = true
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Update last used
    UPDATE chatbot_links
    SET last_used_at = NOW()
    WHERE LOWER(chatbot_id) = LOWER(p_chatbot_id);
    
    RETURN v_user_id;
  END IF;
  
  -- Strategy 3: Fallback to profiles.unique_user_id
  SELECT id INTO v_user_id
  FROM profiles
  WHERE LOWER(unique_user_id) = LOWER(p_chatbot_id)
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Create chatbot link if missing
    INSERT INTO chatbot_links (user_id, chatbot_id, is_active)
    VALUES (v_user_id, p_chatbot_id, true)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN v_user_id;
  END IF;
  
  -- Not found
  RETURN NULL;
END;
$$;

-- =====================================================
-- Sync chatbot_settings with chatbot_links
-- =====================================================

-- Ensure all users with chatbot_settings have chatbot_links
INSERT INTO chatbot_links (user_id, chatbot_id, is_active)
SELECT 
  cs.user_id,
  COALESCE(
    cs.fixed_chatbot_id, -- Use fixed_chatbot_id from chatbot_settings if available
    p.unique_user_id, -- Or unique_user_id from profiles
    generate_chatbot_id() -- Or generate new
  ) as chatbot_id,
  cs.is_active
FROM chatbot_settings cs
JOIN profiles p ON p.id = cs.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM chatbot_links cl WHERE cl.user_id = cs.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE chatbot_links IS 
  'Maps chatbot IDs and custom slugs to user accounts for public chat access';

COMMENT ON COLUMN chatbot_links.chatbot_id IS 
  'Fixed short alphanumeric ID (6 chars) for chatbot access';

COMMENT ON COLUMN chatbot_links.custom_slug IS 
  'Custom vanity URL slug (Pro feature). E.g., /chat/mycompany';

COMMENT ON FUNCTION get_user_from_chatbot_id IS 
  'Resolve chatbot ID or custom slug to user ID. Tries: custom_slug → chatbot_id → unique_user_id';

-- =====================================================
-- Verification
-- =====================================================

-- Check chatbot links created
DO $$
DECLARE
  link_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO link_count FROM chatbot_links;
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  RAISE NOTICE 'Chatbot links created: % (Total users: %)', link_count, user_count;
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================

/*
This migration ensures:
✅ chatbot_links table exists
✅ All users have chatbot links
✅ Fixed chatbot IDs generated
✅ Lookup function works properly
✅ Multiple lookup strategies (custom_slug, chatbot_id, unique_user_id)
✅ Auto-creates missing links
✅ RLS policies secure

Fixes "Chat not found" errors by ensuring proper chatbot link infrastructure.
*/

