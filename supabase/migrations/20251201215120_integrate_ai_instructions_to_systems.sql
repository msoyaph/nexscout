/*
  # Integrate AI System Instructions to All Systems

  1. Changes
    - Sync AI instructions to chatbot_settings.custom_system_instructions
    - Populate chatbot_training_data with structured Q&A
    - Create integration with pitch deck generation
    - Auto-sync on new user signup

  2. Integration Points
    - Chatbot Settings (custom_system_instructions)
    - Chatbot Training Data (Q&A pairs)
    - Pitch Decks (ai_context)
    - User Onboarding (company_profiles)
*/

-- Enhanced sync function that populates AI instructions to all systems
CREATE OR REPLACE FUNCTION sync_ai_instructions_to_systems(
  p_user_id uuid,
  p_post_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_post company_knowledge_posts;
  v_company_id uuid;
  v_product_record jsonb;
  v_first_company_name text;
  v_training_count integer := 0;
BEGIN
  -- Get the post
  SELECT * INTO v_post
  FROM company_knowledge_posts
  WHERE id = p_post_id
  AND status = 'published';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post not found or not published');
  END IF;

  -- Get first company name if comma-separated
  IF v_post.company_name IS NOT NULL THEN
    v_first_company_name := split_part(v_post.company_name, ',', 1);
    v_first_company_name := trim(v_first_company_name);
  ELSE
    v_first_company_name := 'My Company';
  END IF;

  -- 1. CREATE/UPDATE COMPANY PROFILE (if onboarding enabled)
  IF v_post.auto_populate_onboarding THEN
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

    -- Sync products
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
  END IF;

  -- 2. POPULATE CHATBOT SYSTEM INSTRUCTIONS (if chatbot enabled)
  IF v_post.auto_populate_chatbot THEN
    -- Create or update chatbot settings with AI instructions
    INSERT INTO chatbot_settings (
      user_id,
      display_name,
      greeting_message,
      custom_system_instructions,
      use_custom_instructions,
      is_active,
      avatar_url
    ) VALUES (
      p_user_id,
      v_first_company_name || ' Assistant',
      'Hi! I''m here to help you learn about ' || v_first_company_name || '. How can I assist you today?',
      v_post.content,
      true,
      true,
      v_post.company_logo_url
    )
    ON CONFLICT (user_id) DO UPDATE SET
      custom_system_instructions = EXCLUDED.custom_system_instructions,
      use_custom_instructions = true,
      updated_at = now();

    -- Add general company info to training data
    INSERT INTO chatbot_training_data (
      user_id,
      category,
      question,
      answer,
      source,
      source_id,
      auto_synced,
      is_active
    ) VALUES (
      p_user_id,
      'Company Information',
      'Tell me about ' || v_first_company_name,
      COALESCE(v_post.excerpt, substring(v_post.content, 1, 500)),
      'power_mode_feeder',
      v_post.id,
      true,
      true
    )
    ON CONFLICT DO NOTHING;
    v_training_count := v_training_count + 1;

    -- Add product information if available
    IF v_post.products IS NOT NULL AND jsonb_array_length(v_post.products) > 0 THEN
      FOR v_product_record IN SELECT * FROM jsonb_array_elements(v_post.products)
      LOOP
        INSERT INTO chatbot_training_data (
          user_id,
          category,
          question,
          answer,
          source,
          source_id,
          auto_synced,
          is_active,
          tags
        ) VALUES (
          p_user_id,
          'Products',
          'Tell me about ' || (v_product_record->>'name'),
          v_product_record->>'description',
          'power_mode_feeder',
          v_post.id,
          true,
          true,
          ARRAY['product', 'offering']
        )
        ON CONFLICT DO NOTHING;
        v_training_count := v_training_count + 1;
      END LOOP;
    END IF;
  END IF;

  -- 3. CREATE DEFAULT PITCH DECK WITH AI CONTEXT (if pitch deck enabled)
  IF v_post.auto_populate_pitch_deck THEN
    INSERT INTO ai_pitch_decks (
      user_id,
      deck_name,
      company_name,
      target_prospect_id,
      ai_context,
      slides,
      status
    ) VALUES (
      p_user_id,
      'Default ' || v_first_company_name || ' Deck',
      v_first_company_name,
      NULL,
      v_post.content,
      jsonb_build_array(
        jsonb_build_object(
          'type', 'cover',
          'title', v_first_company_name,
          'subtitle', COALESCE(v_post.excerpt, 'Company Presentation')
        ),
        jsonb_build_object(
          'type', 'overview',
          'title', 'About Us',
          'content', COALESCE(v_post.excerpt, 'Generated from AI instructions')
        )
      ),
      'draft'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Update usage stats
  UPDATE company_knowledge_posts
  SET 
    usage_count = COALESCE(usage_count, 0) + 1,
    last_used_at = now(),
    is_synced_to_intelligence = true,
    last_synced_at = now(),
    sync_status = 'completed'
  WHERE id = p_post_id;

  RETURN jsonb_build_object(
    'success', true,
    'company_id', v_company_id,
    'company_name', v_first_company_name,
    'products_synced', jsonb_array_length(COALESCE(v_post.products, '[]'::jsonb)),
    'training_items_added', v_training_count,
    'onboarding_populated', v_post.auto_populate_onboarding,
    'chatbot_populated', v_post.auto_populate_chatbot,
    'pitch_deck_created', v_post.auto_populate_pitch_deck
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to extract Q&A pairs from AI instructions
CREATE OR REPLACE FUNCTION extract_qa_from_instructions(
  p_instructions text
)
RETURNS TABLE (
  question text,
  answer text,
  category text
) AS $$
BEGIN
  -- This is a simple implementation that looks for Q: and A: patterns
  -- In production, this could call an AI service to intelligently parse
  
  RETURN QUERY
  WITH sections AS (
    SELECT 
      unnest(string_to_array(p_instructions, E'\n')) as line,
      generate_series(1, array_length(string_to_array(p_instructions, E'\n'), 1)) as line_num
  )
  SELECT 
    trim(substring(q.line from 3)) as question,
    trim(substring(a.line from 3)) as answer,
    'FAQ'::text as category
  FROM sections q
  JOIN sections a ON a.line_num = q.line_num + 1
  WHERE q.line ILIKE 'Q:%' 
  AND a.line ILIKE 'A:%'
  LIMIT 50;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Trigger to auto-sync AI instructions to new users
CREATE OR REPLACE FUNCTION auto_sync_ai_to_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_knowledge_post company_knowledge_posts;
BEGIN
  -- Find the most recent published knowledge post
  SELECT * INTO v_knowledge_post
  FROM company_knowledge_posts
  WHERE status = 'published'
  AND (auto_populate_onboarding = true OR auto_populate_chatbot = true OR auto_populate_pitch_deck = true)
  ORDER BY created_at DESC
  LIMIT 1;

  -- If found, sync it to the new user (run async to not block signup)
  IF FOUND THEN
    PERFORM sync_ai_instructions_to_systems(NEW.user_id, v_knowledge_post.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_auto_sync_ai_instructions ON profiles;

CREATE TRIGGER trigger_auto_sync_ai_instructions
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_ai_to_new_user();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_posts_sync_status 
  ON company_knowledge_posts(status, sync_status, last_synced_at) 
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_chatbot_training_source 
  ON chatbot_training_data(user_id, source, auto_synced, is_active);

CREATE INDEX IF NOT EXISTS idx_chatbot_settings_custom_instructions
  ON chatbot_settings(user_id, use_custom_instructions)
  WHERE use_custom_instructions = true;

-- Comments
COMMENT ON FUNCTION sync_ai_instructions_to_systems IS 'Syncs AI system instructions from knowledge posts to chatbot, pitch decks, and onboarding';
COMMENT ON FUNCTION extract_qa_from_instructions IS 'Extracts Q&A pairs from AI instruction text for training data';
COMMENT ON FUNCTION auto_sync_ai_to_new_user IS 'Automatically syncs AI instructions when a new user signs up';
