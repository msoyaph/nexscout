/*
  # Fix Knowledge Posts Save and Admin Access

  1. Changes
    - Fix RLS policies for easier super admin access
    - Add helper function to grant super admin status
    - Fix slug generation for knowledge posts
    - Update sync function for multiple company names

  2. Security
    - Maintains RLS but allows super admins full access
    - Regular users can only read published posts
*/

-- Helper function to make a user super admin (for setup)
CREATE OR REPLACE FUNCTION make_user_super_admin(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if admin_users entry exists
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = target_user_id) THEN
    -- Create admin_users entry with a dummy role_id
    INSERT INTO admin_users (user_id, is_super_admin, role_id)
    VALUES (target_user_id, true, gen_random_uuid())
    ON CONFLICT (user_id) DO UPDATE SET is_super_admin = true;
  ELSE
    -- Update existing entry
    UPDATE admin_users 
    SET is_super_admin = true 
    WHERE user_id = target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing policies and recreate with clearer names
DO $$
BEGIN
  DROP POLICY IF EXISTS "Super admins full access to knowledge posts" ON company_knowledge_posts;
  DROP POLICY IF EXISTS "Anyone can view published knowledge posts" ON company_knowledge_posts;
  DROP POLICY IF EXISTS "Super admins can do anything with knowledge posts" ON company_knowledge_posts;
  DROP POLICY IF EXISTS "Authenticated users can read published posts" ON company_knowledge_posts;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create new RLS policies with proper super admin check
CREATE POLICY "knowledge_posts_super_admin_all"
  ON company_knowledge_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_super_admin = true
    )
  );

CREATE POLICY "knowledge_posts_read_published"
  ON company_knowledge_posts
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Ensure the slug generation trigger works properly
CREATE OR REPLACE FUNCTION generate_knowledge_post_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Use company_name as title if title is empty
  IF (NEW.title IS NULL OR NEW.title = '') AND NEW.company_name IS NOT NULL THEN
    NEW.title := split_part(NEW.company_name, ',', 1);
    NEW.title := trim(NEW.title);
  END IF;

  -- Generate slug if empty
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(COALESCE(NEW.title, 'untitled'), '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := trim(both '-' from NEW.slug);

    -- Make slug unique by appending timestamp if needed
    IF EXISTS (
      SELECT 1 FROM company_knowledge_posts 
      WHERE slug = NEW.slug 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      NEW.slug := NEW.slug || '-' || extract(epoch from now())::bigint;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS ensure_knowledge_post_slug ON company_knowledge_posts;
CREATE TRIGGER ensure_knowledge_post_slug
  BEFORE INSERT OR UPDATE ON company_knowledge_posts
  FOR EACH ROW
  EXECUTE FUNCTION generate_knowledge_post_slug();

-- Update sync function to handle comma-separated company names
CREATE OR REPLACE FUNCTION sync_knowledge_to_user_onboarding(
  p_user_id uuid,
  p_post_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_post company_knowledge_posts;
  v_company_id uuid;
  v_product_record jsonb;
  v_first_company_name text;
BEGIN
  -- Get the post
  SELECT * INTO v_post
  FROM company_knowledge_posts
  WHERE id = p_post_id
  AND status = 'published'
  AND auto_populate_onboarding = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post not found or not eligible');
  END IF;

  -- Get first company name if comma-separated
  IF v_post.company_name IS NOT NULL THEN
    v_first_company_name := split_part(v_post.company_name, ',', 1);
    v_first_company_name := trim(v_first_company_name);
  ELSE
    v_first_company_name := 'My Company';
  END IF;

  -- Create or update company profile for user
  INSERT INTO company_profiles (
    user_id,
    company_name,
    industry,
    short_description,
    long_description,
    logo_url
  ) VALUES (
    p_user_id,
    v_first_company_name,
    v_post.category,
    v_post.excerpt,
    v_post.content,
    v_post.company_logo_url
  )
  ON CONFLICT (user_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    short_description = EXCLUDED.short_description,
    long_description = EXCLUDED.long_description,
    logo_url = EXCLUDED.logo_url,
    updated_at = now()
  RETURNING id INTO v_company_id;

  -- Sync products if any
  IF v_post.products IS NOT NULL AND jsonb_array_length(v_post.products) > 0 THEN
    FOR v_product_record IN SELECT * FROM jsonb_array_elements(v_post.products)
    LOOP
      INSERT INTO user_products (
        user_id,
        product_name,
        description,
        price,
        image_url,
        is_active
      ) VALUES (
        p_user_id,
        v_product_record->>'name',
        v_product_record->>'description',
        COALESCE((v_product_record->>'price')::numeric, 0),
        v_product_record->>'image_url',
        true
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Update usage stats
  UPDATE company_knowledge_posts
  SET 
    usage_count = COALESCE(usage_count, 0) + 1,
    last_used_at = now()
  WHERE id = p_post_id;

  RETURN jsonb_build_object(
    'success', true,
    'company_id', v_company_id,
    'company_name', v_first_company_name,
    'products_synced', jsonb_array_length(COALESCE(v_post.products, '[]'::jsonb))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION make_user_super_admin IS 'Helper function to grant super admin privileges to a user - use: SELECT make_user_super_admin(''your-user-id'');';
COMMENT ON FUNCTION generate_knowledge_post_slug IS 'Auto-generates slug from title/company_name, handles comma-separated names';
