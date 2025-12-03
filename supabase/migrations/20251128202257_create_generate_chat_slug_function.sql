/*
  # Create generate_chat_slug Function
  
  1. New Function
    - `generate_chat_slug(p_user_id)` - Generates unique slug for public chat
    - Returns a unique 8-character alphanumeric string
    - Ensures no collisions with existing slugs
  
  2. Purpose
    - Used for creating unique public chat URLs
    - Format: /chat/{slug}
*/

CREATE OR REPLACE FUNCTION generate_chat_slug(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_exists boolean;
BEGIN
  LOOP
    -- Generate random 8-character alphanumeric string
    v_slug := lower(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if slug already exists
    SELECT EXISTS(
      SELECT 1 FROM public_chat_sessions WHERE session_slug = v_slug
    ) INTO v_exists;
    
    -- Exit loop if unique slug found
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_slug;
END;
$$;
