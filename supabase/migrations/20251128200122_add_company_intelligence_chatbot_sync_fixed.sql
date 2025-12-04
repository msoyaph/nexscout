/*
  # Company Intelligence to Chatbot Training Data Auto-Sync (Fixed)

  1. Purpose
    - Automatically pull company data from Company Intelligence Engine
    - Sync to chatbot_training_data as default training data
    - Enable AI Sales Chatbot to answer company questions automatically
    
  2. Changes
    - Add `source` and `source_id` to chatbot_training_data
    - Add `auto_synced` flag to track auto-populated data
    - Create function to sync company intelligence data
    - Create trigger to auto-update when company data changes
    - Initial population of existing company data

  3. Training Data Categories from Company Intelligence
    - company_info: Name, description, mission, vision, values
    - product_info: Products, features, benefits, pricing
    - faq: FAQs from company website
    - company_identity: Industry, location, size, target audience
    - value_proposition: Key selling points and differentiators

  4. Security
    - RLS policies ensure users only access their own data
    - Automatic sync only for data owned by the user
*/

-- Step 1: Add new columns to chatbot_training_data
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbot_training_data' AND column_name = 'source'
  ) THEN
    ALTER TABLE chatbot_training_data 
    ADD COLUMN source text DEFAULT 'manual' CHECK (source IN ('manual', 'company_intelligence', 'company_profile', 'auto_generated'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbot_training_data' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE chatbot_training_data 
    ADD COLUMN source_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbot_training_data' AND column_name = 'auto_synced'
  ) THEN
    ALTER TABLE chatbot_training_data 
    ADD COLUMN auto_synced boolean DEFAULT false;
  END IF;
END $$;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chatbot_training_source 
ON chatbot_training_data(user_id, source, source_id);

-- Step 3: Function to sync company profile data to chatbot training
CREATE OR REPLACE FUNCTION sync_company_to_chatbot_training(p_user_id uuid, p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company record;
  v_product_item jsonb;
  v_faq_item jsonb;
  v_product_name text;
  v_product_desc text;
  v_faq_question text;
  v_faq_answer text;
BEGIN
  -- Get company data
  SELECT * INTO v_company
  FROM company_profiles
  WHERE id = p_company_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Delete existing auto-synced data for this company
  DELETE FROM chatbot_training_data
  WHERE user_id = p_user_id 
    AND source = 'company_profile' 
    AND source_id = p_company_id
    AND auto_synced = true;

  -- 1. Company Name & Description
  IF v_company.company_name IS NOT NULL THEN
    INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'What is the company name?',
      v_company.company_name,
      'company_profile',
      p_company_id,
      true,
      10,
      ARRAY['company', 'name', 'basic']
    );

    INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'Tell me about the company',
      COALESCE(v_company.company_description, v_company.description, v_company.ai_generated_description, 'Information not available'),
      'company_profile',
      p_company_id,
      true,
      10,
      ARRAY['company', 'about', 'description']
    );
  END IF;

  -- 2. Mission & Vision
  IF v_company.mission IS NOT NULL THEN
    INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'What is the company mission?',
      v_company.mission,
      'company_profile',
      p_company_id,
      true,
      9,
      ARRAY['company', 'mission', 'values']
    );
  END IF;

  IF v_company.vision IS NOT NULL THEN
    INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'What is the company vision?',
      v_company.vision,
      'company_profile',
      p_company_id,
      true,
      9,
      ARRAY['company', 'vision', 'values']
    );
  END IF;

  -- 3. Value Proposition
  IF v_company.value_proposition IS NOT NULL THEN
    INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'What makes this company unique?',
      v_company.value_proposition,
      'company_profile',
      p_company_id,
      true,
      10,
      ARRAY['company', 'value', 'differentiation']
    );
  END IF;

  -- 4. Industry & Location
  IF v_company.industry IS NOT NULL THEN
    INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'What industry is the company in?',
      v_company.industry,
      'company_profile',
      p_company_id,
      true,
      8,
      ARRAY['company', 'industry', 'sector']
    );
  END IF;

  IF v_company.location IS NOT NULL THEN
    INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'Where is the company located?',
      v_company.location,
      'company_profile',
      p_company_id,
      true,
      7,
      ARRAY['company', 'location', 'address']
    );
  END IF;

  -- 5. Company Size
  IF v_company.company_size IS NOT NULL OR v_company.employee_count IS NOT NULL THEN
    INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'How big is the company?',
      COALESCE(v_company.company_size, v_company.employee_count, 'Information not available'),
      'company_profile',
      p_company_id,
      true,
      6,
      ARRAY['company', 'size', 'employees']
    );
  END IF;

  -- 6. Website
  IF v_company.website IS NOT NULL OR v_company.company_domain IS NOT NULL THEN
    INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'What is the company website?',
      COALESCE(v_company.website, v_company.company_domain, 'Information not available'),
      'company_profile',
      p_company_id,
      true,
      8,
      ARRAY['company', 'website', 'contact']
    );
  END IF;

  -- 7. Products (if stored as JSONB array)
  IF v_company.products IS NOT NULL AND jsonb_typeof(v_company.products) = 'array' AND jsonb_array_length(v_company.products) > 0 THEN
    FOR v_product_item IN SELECT * FROM jsonb_array_elements(v_company.products)
    LOOP
      v_product_name := v_product_item->>'name';
      v_product_desc := v_product_item->>'description';
      
      IF v_product_name IS NOT NULL THEN
        INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
        VALUES (
          p_user_id,
          'product_info',
          'Tell me about ' || v_product_name,
          COALESCE(v_product_desc, 'Product: ' || v_product_name),
          'company_profile',
          p_company_id,
          true,
          9,
          ARRAY['product', 'offering', 'service']
        );
      END IF;
    END LOOP;
  END IF;

  -- 8. FAQs (if stored as JSONB array)
  IF v_company.faqs IS NOT NULL AND jsonb_typeof(v_company.faqs) = 'array' AND jsonb_array_length(v_company.faqs) > 0 THEN
    FOR v_faq_item IN SELECT * FROM jsonb_array_elements(v_company.faqs)
    LOOP
      v_faq_question := v_faq_item->>'question';
      v_faq_answer := v_faq_item->>'answer';
      
      IF v_faq_question IS NOT NULL AND v_faq_answer IS NOT NULL THEN
        INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
        VALUES (
          p_user_id,
          'faq',
          v_faq_question,
          v_faq_answer,
          'company_profile',
          p_company_id,
          true,
          8,
          ARRAY['faq', 'common', 'question']
        );
      END IF;
    END LOOP;
  END IF;

  -- 9. Target Audience
  IF v_company.target_audience IS NOT NULL THEN
    INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'Who is the target audience?',
      v_company.target_audience,
      'company_profile',
      p_company_id,
      true,
      8,
      ARRAY['company', 'target', 'audience', 'customer']
    );
  END IF;

END;
$$;

-- Step 4: Function to sync company intelligence v2 data
CREATE OR REPLACE FUNCTION sync_company_intelligence_to_chatbot(p_user_id uuid, p_intelligence_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intel record;
  v_product record;
BEGIN
  -- Get intelligence data
  SELECT * INTO v_intel
  FROM company_intelligence_v2
  WHERE id = p_intelligence_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Delete existing auto-synced data for this intelligence
  DELETE FROM chatbot_training_data
  WHERE user_id = p_user_id 
    AND source = 'company_intelligence' 
    AND source_id = p_intelligence_id
    AND auto_synced = true;

  -- Sync company identity data
  IF v_intel.company_identity IS NOT NULL THEN
    IF v_intel.company_identity->>'mission' IS NOT NULL THEN
      INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
      VALUES (
        p_user_id,
        'company_info',
        'What is the company mission?',
        v_intel.company_identity->>'mission',
        'company_intelligence',
        p_intelligence_id,
        true,
        9,
        ARRAY['company', 'mission', 'intelligence']
      );
    END IF;

    IF v_intel.company_identity->>'vision' IS NOT NULL THEN
      INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
      VALUES (
        p_user_id,
        'company_info',
        'What is the company vision?',
        v_intel.company_identity->>'vision',
        'company_intelligence',
        p_intelligence_id,
        true,
        9,
        ARRAY['company', 'vision', 'intelligence']
      );
    END IF;

    IF v_intel.company_identity->>'tagline' IS NOT NULL THEN
      INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
      VALUES (
        p_user_id,
        'company_info',
        'What is the company tagline?',
        v_intel.company_identity->>'tagline',
        'company_intelligence',
        p_intelligence_id,
        true,
        8,
        ARRAY['company', 'tagline', 'intelligence']
      );
    END IF;
  END IF;

  -- Sync products from company_intelligence_products table
  FOR v_product IN 
    SELECT * FROM company_intelligence_products 
    WHERE intelligence_id = p_intelligence_id
  LOOP
    INSERT INTO chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'product_info',
      'Tell me about ' || v_product.name,
      COALESCE(v_product.description, '') || 
      CASE WHEN v_product.benefits IS NOT NULL AND array_length(v_product.benefits, 1) > 0
        THEN E'\n\nBenefits: ' || array_to_string(v_product.benefits, ', ')
        ELSE ''
      END ||
      CASE WHEN v_product.features IS NOT NULL AND array_length(v_product.features, 1) > 0
        THEN E'\n\nFeatures: ' || array_to_string(v_product.features, ', ')
        ELSE ''
      END ||
      CASE WHEN v_product.price IS NOT NULL
        THEN E'\n\nPrice: ' || v_product.price::text || ' ' || COALESCE(v_product.currency, 'USD')
        ELSE ''
      END,
      'company_intelligence',
      p_intelligence_id,
      true,
      9,
      ARRAY['product', 'intelligence', 'offering']
    );
  END LOOP;

END;
$$;

-- Step 5: Trigger function for company_profiles updates
CREATE OR REPLACE FUNCTION trigger_sync_company_profile_to_chatbot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM sync_company_to_chatbot_training(NEW.user_id, NEW.id);
  RETURN NEW;
END;
$$;

-- Step 6: Trigger for company_profiles
DROP TRIGGER IF EXISTS sync_company_profile_to_chatbot_trigger ON company_profiles;
CREATE TRIGGER sync_company_profile_to_chatbot_trigger
  AFTER INSERT OR UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_company_profile_to_chatbot();

-- Step 7: Trigger function for company_intelligence_v2 updates
CREATE OR REPLACE FUNCTION trigger_sync_intelligence_to_chatbot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM sync_company_intelligence_to_chatbot(NEW.user_id, NEW.id);
  RETURN NEW;
END;
$$;

-- Step 8: Trigger for company_intelligence_v2
DROP TRIGGER IF EXISTS sync_intelligence_to_chatbot_trigger ON company_intelligence_v2;
CREATE TRIGGER sync_intelligence_to_chatbot_trigger
  AFTER INSERT OR UPDATE ON company_intelligence_v2
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_intelligence_to_chatbot();

-- Step 9: Initial sync for existing company profiles
DO $$
DECLARE
  v_company record;
BEGIN
  FOR v_company IN SELECT id, user_id FROM company_profiles LIMIT 100
  LOOP
    BEGIN
      PERFORM sync_company_to_chatbot_training(v_company.user_id, v_company.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error syncing company %: %', v_company.id, SQLERRM;
    END;
  END LOOP;
END $$;

-- Step 10: Initial sync for existing intelligence data
DO $$
DECLARE
  v_intel record;
BEGIN
  FOR v_intel IN SELECT id, user_id FROM company_intelligence_v2 LIMIT 100
  LOOP
    BEGIN
      PERFORM sync_company_intelligence_to_chatbot(v_intel.user_id, v_intel.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error syncing intelligence %: %', v_intel.id, SQLERRM;
    END;
  END LOOP;
END $$;
