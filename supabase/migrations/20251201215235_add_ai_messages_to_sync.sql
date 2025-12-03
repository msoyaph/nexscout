/*
  # Add AI Message Template Generation to Sync

  1. Changes
    - Update sync function to create default AI message templates
    - Templates use AI instructions as context
    - Auto-generate for new users

  2. Integration
    - Creates starter message sequences for new users
    - Uses AI instructions to personalize messages
*/

-- Update the sync function to include AI message template creation
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
  v_message_count integer := 0;
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

    -- 4. CREATE AI MESSAGE TEMPLATES (new!)
    -- Create a welcome/introduction message template
    INSERT INTO ai_message_sequences (
      user_id,
      title,
      sequence_type,
      tone,
      status,
      messages
    ) VALUES (
      p_user_id,
      'Default Welcome Sequence',
      'welcome',
      'professional',
      'draft',
      jsonb_build_array(
        jsonb_build_object(
          'subject', 'Welcome to ' || v_first_company_name,
          'body', 'Hi {{prospect_name}},\n\nThank you for your interest in ' || v_first_company_name || '!\n\n[This message will be personalized using AI based on your system instructions]\n\nBest regards,\n{{user_name}}',
          'delay_days', 0,
          'ai_context', v_post.content
        )
      )
    )
    ON CONFLICT DO NOTHING;
    v_message_count := v_message_count + 1;

    -- Create a follow-up template if products exist
    IF v_post.products IS NOT NULL AND jsonb_array_length(v_post.products) > 0 THEN
      INSERT INTO ai_message_sequences (
        user_id,
        title,
        sequence_type,
        tone,
        status,
        messages
      ) VALUES (
        p_user_id,
        'Product Introduction Sequence',
        'follow_up',
        'friendly',
        'draft',
        jsonb_build_array(
          jsonb_build_object(
            'subject', 'Our Solutions for You',
            'body', 'Hi {{prospect_name}},\n\nI wanted to share how ' || v_first_company_name || ' can help you...\n\n[AI will personalize based on prospect needs and your products]\n\nBest regards,\n{{user_name}}',
            'delay_days', 2,
            'ai_context', v_post.content
          )
        )
      )
      ON CONFLICT DO NOTHING;
      v_message_count := v_message_count + 1;
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
    'message_templates_created', v_message_count,
    'onboarding_populated', v_post.auto_populate_onboarding,
    'chatbot_populated', v_post.auto_populate_chatbot,
    'pitch_deck_created', v_post.auto_populate_pitch_deck,
    'ai_messages_created', v_message_count > 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION sync_ai_instructions_to_systems IS 'Syncs AI system instructions from knowledge posts to chatbot, pitch decks, AI messages, and onboarding';
