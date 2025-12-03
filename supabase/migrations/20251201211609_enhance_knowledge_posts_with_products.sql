/*
  # Enhance Company Knowledge Posts with Products and Logo

  1. Changes to company_knowledge_posts
    - Add company_logo_url field
    - Add products jsonb array field for multiple products
    - Each product includes: name, description, price, image_url

  2. Products Structure
    - products: [
        { 
          name: "Product Name",
          description: "Product description",
          price: 9999,
          image_url: "https://...",
          is_featured: true
        }
      ]

  3. Integration
    - These posts will auto-populate to new users during onboarding
    - Logo and products flow to company_profiles and user_products
*/

DO $$
BEGIN
  -- Add company_logo_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_knowledge_posts' 
    AND column_name = 'company_logo_url'
  ) THEN
    ALTER TABLE company_knowledge_posts ADD COLUMN company_logo_url text;
  END IF;

  -- Add products jsonb array if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_knowledge_posts' 
    AND column_name = 'products'
  ) THEN
    ALTER TABLE company_knowledge_posts ADD COLUMN products jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add company_name (DBA/Brand) if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_knowledge_posts' 
    AND column_name = 'company_name'
  ) THEN
    ALTER TABLE company_knowledge_posts ADD COLUMN company_name text;
  END IF;

END $$;

-- Update the title generation to use company_name if provided
CREATE OR REPLACE FUNCTION generate_post_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Use company_name as title if title is empty
  IF (NEW.title IS NULL OR NEW.title = '') AND NEW.company_name IS NOT NULL THEN
    NEW.title := NEW.company_name;
  END IF;

  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(COALESCE(NEW.title, 'untitled'), '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := trim(both '-' from NEW.slug);

    IF EXISTS (SELECT 1 FROM company_knowledge_posts WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      NEW.slug := NEW.slug || '-' || extract(epoch from now())::text;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to sync knowledge post to new user onboarding
CREATE OR REPLACE FUNCTION sync_knowledge_to_user_onboarding(
  p_user_id uuid,
  p_post_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_post company_knowledge_posts;
  v_company_id uuid;
  v_product_record jsonb;
  v_result jsonb;
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

  -- Create or update company profile for user
  INSERT INTO company_profiles (
    user_id,
    company_name,
    industry,
    short_description,
    long_description,
    website_url,
    facebook_url,
    instagram_url,
    logo_url,
    admin_company_id
  ) VALUES (
    p_user_id,
    v_post.company_name,
    v_post.category,
    v_post.excerpt,
    v_post.content,
    NULL,
    NULL,
    NULL,
    v_post.company_logo_url,
    v_post.admin_company_id
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
        (v_product_record->>'price')::numeric,
        v_product_record->>'image_url',
        true
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Update usage stats
  UPDATE company_knowledge_posts
  SET 
    usage_count = usage_count + 1,
    last_used_at = now()
  WHERE id = p_post_id;

  RETURN jsonb_build_object(
    'success', true,
    'company_id', v_company_id,
    'products_synced', jsonb_array_length(COALESCE(v_post.products, '[]'::jsonb))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-sync to new users
CREATE OR REPLACE FUNCTION auto_sync_knowledge_to_new_users()
RETURNS TRIGGER AS $$
DECLARE
  v_post_record company_knowledge_posts;
BEGIN
  -- When a new user is created, sync all published auto-populate posts
  FOR v_post_record IN 
    SELECT * FROM company_knowledge_posts
    WHERE status = 'published'
    AND auto_populate_onboarding = true
    ORDER BY created_at DESC
    LIMIT 1
  LOOP
    PERFORM sync_knowledge_to_user_onboarding(NEW.id, v_post_record.id);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table for new users
DROP TRIGGER IF EXISTS auto_sync_knowledge_on_signup ON profiles;
CREATE TRIGGER auto_sync_knowledge_on_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_knowledge_to_new_users();

-- Comments
COMMENT ON COLUMN company_knowledge_posts.company_name IS 'Company DBA or Brand name - used as the post title';
COMMENT ON COLUMN company_knowledge_posts.company_logo_url IS 'Company logo image URL';
COMMENT ON COLUMN company_knowledge_posts.products IS 'Array of products with name, description, price, image_url';
COMMENT ON FUNCTION sync_knowledge_to_user_onboarding IS 'Syncs knowledge post data to user onboarding (company profile + products)';
COMMENT ON FUNCTION auto_sync_knowledge_to_new_users IS 'Automatically syncs latest published post to new user signups';
