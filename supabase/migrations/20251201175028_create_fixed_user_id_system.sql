/*
  # Fixed User ID System with Multi-Route Support

  1. Changes
    - Add unique_user_id to profiles (format: bs3022, xc7781)
    - Auto-generate unique_user_id on user creation
    - Auto-create chatbot_link with unique_user_id
    - Support custom_slug for Pro users
    - Auto-revert custom_slug to unique_user_id on downgrade
    
  2. Routes Supported
    - /chat/[unique_user_id] → Public AI Chatbot
    - /me/[unique_user_id] → About Me landing page
    - /ref/[unique_user_id] → Referral link
    
  3. Pro Feature
    - Can customize: /chat/bs3022 → /chat/JeffBezos
    - On downgrade: /chat/JeffBezos → /chat/bs3022 (automatic)
    
  4. Security
    - unique_user_id is permanent, never changes
    - Only custom_slug can be modified (Pro only)
    - RLS ensures data isolation per user
*/

-- Add unique_user_id to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'unique_user_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN unique_user_id text UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_profiles_unique_user_id ON profiles(unique_user_id);
  END IF;
END $$;

-- Function to generate unique user ID (format: aa1234)
CREATE OR REPLACE FUNCTION generate_unique_user_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
  v_exists boolean;
BEGIN
  LOOP
    -- Generate 2 random lowercase letters + 4 random digits
    v_user_id := chr(97 + floor(random() * 26)::int) ||
                 chr(97 + floor(random() * 26)::int) ||
                 floor(random() * 10)::text ||
                 floor(random() * 10)::text ||
                 floor(random() * 10)::text ||
                 floor(random() * 10)::text;
    
    -- Check if exists in profiles
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE unique_user_id = v_user_id
    ) INTO v_exists;
    
    -- Also check chatbot_links
    IF NOT v_exists THEN
      SELECT EXISTS(
        SELECT 1 FROM chatbot_links WHERE chatbot_id = v_user_id
      ) INTO v_exists;
    END IF;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_user_id;
END;
$$;

-- Function to auto-assign unique_user_id to existing users
CREATE OR REPLACE FUNCTION assign_unique_user_ids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_new_id text;
BEGIN
  FOR v_profile IN 
    SELECT id FROM profiles WHERE unique_user_id IS NULL
  LOOP
    v_new_id := generate_unique_user_id();
    UPDATE profiles 
    SET unique_user_id = v_new_id 
    WHERE id = v_profile.id;
  END LOOP;
END;
$$;

-- Assign unique_user_id to all existing users
SELECT assign_unique_user_ids();

-- Make unique_user_id NOT NULL after assigning
ALTER TABLE profiles ALTER COLUMN unique_user_id SET NOT NULL;

-- Update profile creation trigger to set unique_user_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unique_id text;
BEGIN
  -- Generate unique user ID
  v_unique_id := generate_unique_user_id();
  
  -- Insert profile with unique_user_id
  INSERT INTO public.profiles (id, unique_user_id)
  VALUES (new.id, v_unique_id);
  
  -- Create chatbot_link using unique_user_id as chatbot_id
  INSERT INTO public.chatbot_links (user_id, chatbot_id, is_active)
  VALUES (new.id, v_unique_id, true);
  
  -- Initialize user energy
  INSERT INTO public.user_energy (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Update get_user_from_chatbot_id to handle unique_user_id
CREATE OR REPLACE FUNCTION get_user_from_chatbot_id(p_chatbot_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- First check custom_slug (Pro users)
  SELECT user_id INTO v_user_id
  FROM chatbot_links
  WHERE LOWER(custom_slug) = LOWER(p_chatbot_id) 
    AND is_active = true
    AND custom_slug IS NOT NULL
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE chatbot_links
    SET last_used_at = now()
    WHERE LOWER(custom_slug) = LOWER(p_chatbot_id);
    RETURN v_user_id;
  END IF;

  -- Then check chatbot_id (unique_user_id or old IDs)
  SELECT user_id INTO v_user_id
  FROM chatbot_links
  WHERE chatbot_id = p_chatbot_id 
    AND is_active = true
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE chatbot_links
    SET last_used_at = now()
    WHERE chatbot_id = p_chatbot_id;
    RETURN v_user_id;
  END IF;

  RETURN NULL;
END;
$$;

-- Function to get user_id from unique_user_id (for /me/ and /ref/ routes)
CREATE OR REPLACE FUNCTION get_user_from_unique_id(p_unique_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM profiles
  WHERE unique_user_id = p_unique_id
  LIMIT 1;

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_from_unique_id(text) TO anon, authenticated;

-- Trigger to revert custom_slug to unique_user_id on downgrade from Pro
CREATE OR REPLACE FUNCTION handle_subscription_downgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If downgrading from pro/enterprise to free
  IF OLD.subscription_tier IN ('pro', 'enterprise') 
     AND NEW.subscription_tier = 'free' THEN
    
    -- Revert custom_slug to NULL (will use unique_user_id)
    UPDATE chatbot_links
    SET custom_slug = NULL
    WHERE user_id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_subscription_downgrade ON profiles;
CREATE TRIGGER on_subscription_downgrade
  AFTER UPDATE OF subscription_tier ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_downgrade();

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_unique_user_id() TO postgres;
GRANT EXECUTE ON FUNCTION assign_unique_user_ids() TO postgres;
