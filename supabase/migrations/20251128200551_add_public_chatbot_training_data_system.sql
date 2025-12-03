/*
  # Public Chatbot Training Data System

  1. Purpose
    - Add training data management for customer-facing chatbots
    - Auto-sync company intelligence data to public chatbot
    - Enable admins to customize chatbot knowledge base
    
  2. New Tables
    - `public_chatbot_training_data`: Training data for public chatbots
    
  3. Changes
    - Training data categories for customer-facing scenarios
    - Auto-sync from company intelligence
    - Manual entry support
    - Priority and tagging system

  4. Security
    - RLS ensures users manage only their chatbot data
    - Auto-synced data tracked separately
*/

-- Public Chatbot Training Data Table
CREATE TABLE IF NOT EXISTS public_chatbot_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Training content
  category text NOT NULL CHECK (category IN (
    'company_info',
    'product_info',
    'service_info',
    'pricing',
    'faq',
    'objection_handler',
    'appointment_booking',
    'contact_info',
    'support',
    'custom'
  )),
  question text NOT NULL,
  answer text NOT NULL,
  
  -- Metadata
  tags text[] DEFAULT '{}',
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  
  -- Source tracking
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'company_profile', 'company_intelligence', 'auto_generated')),
  source_id uuid,
  auto_synced boolean DEFAULT false,
  
  -- Usage stats
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  
  -- Context matching
  context_keywords text[] DEFAULT '{}',
  match_confidence numeric DEFAULT 1.0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_public_chatbot_training_user 
ON public_chatbot_training_data(user_id);

CREATE INDEX IF NOT EXISTS idx_public_chatbot_training_category 
ON public_chatbot_training_data(user_id, category, is_active);

CREATE INDEX IF NOT EXISTS idx_public_chatbot_training_source 
ON public_chatbot_training_data(user_id, source, source_id);

CREATE INDEX IF NOT EXISTS idx_public_chatbot_training_tags 
ON public_chatbot_training_data USING gin(tags);

-- RLS Policies
ALTER TABLE public_chatbot_training_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own public chatbot training data"
  ON public_chatbot_training_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own public chatbot training data"
  ON public_chatbot_training_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own public chatbot training data"
  ON public_chatbot_training_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own manual public chatbot training data"
  ON public_chatbot_training_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND auto_synced = false);

-- Function to sync company data to public chatbot training
CREATE OR REPLACE FUNCTION sync_company_to_public_chatbot_training(p_user_id uuid, p_company_id uuid)
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
  DELETE FROM public_chatbot_training_data
  WHERE user_id = p_user_id 
    AND source = 'company_profile' 
    AND source_id = p_company_id
    AND auto_synced = true;

  -- 1. Company Name & Description
  IF v_company.company_name IS NOT NULL THEN
    INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'What is the name of this company?',
      v_company.company_name,
      'company_profile',
      p_company_id,
      true,
      10,
      ARRAY['company', 'name', 'about']
    );

    INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'Tell me about this company',
      COALESCE(v_company.company_description, v_company.description, v_company.ai_generated_description, 'We are a leading company providing excellent solutions.'),
      'company_profile',
      p_company_id,
      true,
      10,
      ARRAY['company', 'about', 'description']
    );
  END IF;

  -- 2. Mission & Vision (Customer-facing language)
  IF v_company.mission IS NOT NULL THEN
    INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'What is your mission?',
      v_company.mission,
      'company_profile',
      p_company_id,
      true,
      9,
      ARRAY['mission', 'purpose', 'values']
    );
  END IF;

  IF v_company.vision IS NOT NULL THEN
    INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'What is your vision?',
      v_company.vision,
      'company_profile',
      p_company_id,
      true,
      9,
      ARRAY['vision', 'future', 'goals']
    );
  END IF;

  -- 3. Value Proposition (Why choose us?)
  IF v_company.value_proposition IS NOT NULL THEN
    INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'Why should I choose you?',
      v_company.value_proposition,
      'company_profile',
      p_company_id,
      true,
      10,
      ARRAY['value', 'benefits', 'why-us']
    );
  END IF;

  -- 4. Location & Contact
  IF v_company.location IS NOT NULL THEN
    INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'contact_info',
      'Where are you located?',
      v_company.location,
      'company_profile',
      p_company_id,
      true,
      8,
      ARRAY['location', 'address', 'contact']
    );
  END IF;

  IF v_company.website IS NOT NULL OR v_company.company_domain IS NOT NULL THEN
    INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'contact_info',
      'How can I visit your website?',
      'You can visit our website at: ' || COALESCE(v_company.website, v_company.company_domain),
      'company_profile',
      p_company_id,
      true,
      8,
      ARRAY['website', 'online', 'contact']
    );
  END IF;

  -- 5. Products
  IF v_company.products IS NOT NULL AND jsonb_typeof(v_company.products) = 'array' AND jsonb_array_length(v_company.products) > 0 THEN
    FOR v_product_item IN SELECT * FROM jsonb_array_elements(v_company.products)
    LOOP
      v_product_name := v_product_item->>'name';
      v_product_desc := v_product_item->>'description';
      
      IF v_product_name IS NOT NULL THEN
        INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
        VALUES (
          p_user_id,
          'product_info',
          'What is ' || v_product_name || '?',
          COALESCE(v_product_desc, v_product_name || ' is one of our featured products.'),
          'company_profile',
          p_company_id,
          true,
          9,
          ARRAY['product', 'offering', v_product_name]
        );
        
        -- Add pricing if available
        IF v_product_item->>'price' IS NOT NULL THEN
          INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
          VALUES (
            p_user_id,
            'pricing',
            'How much does ' || v_product_name || ' cost?',
            v_product_name || ' is priced at ' || (v_product_item->>'price'),
            'company_profile',
            p_company_id,
            true,
            9,
            ARRAY['pricing', 'cost', 'price', v_product_name]
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- 6. FAQs
  IF v_company.faqs IS NOT NULL AND jsonb_typeof(v_company.faqs) = 'array' AND jsonb_array_length(v_company.faqs) > 0 THEN
    FOR v_faq_item IN SELECT * FROM jsonb_array_elements(v_company.faqs)
    LOOP
      v_faq_question := v_faq_item->>'question';
      v_faq_answer := v_faq_item->>'answer';
      
      IF v_faq_question IS NOT NULL AND v_faq_answer IS NOT NULL THEN
        INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
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

  -- 7. Target Audience (Industry-specific responses)
  IF v_company.target_audience IS NOT NULL THEN
    INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'company_info',
      'Who do you serve?',
      'We serve ' || v_company.target_audience,
      'company_profile',
      p_company_id,
      true,
      7,
      ARRAY['audience', 'customers', 'target']
    );
  END IF;

END;
$$;

-- Function to sync company intelligence to public chatbot
CREATE OR REPLACE FUNCTION sync_company_intelligence_to_public_chatbot(p_user_id uuid, p_intelligence_id uuid)
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
  DELETE FROM public_chatbot_training_data
  WHERE user_id = p_user_id 
    AND source = 'company_intelligence' 
    AND source_id = p_intelligence_id
    AND auto_synced = true;

  -- Sync company identity
  IF v_intel.company_identity IS NOT NULL THEN
    IF v_intel.company_identity->>'mission' IS NOT NULL THEN
      INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
      VALUES (
        p_user_id,
        'company_info',
        'What is your company mission?',
        v_intel.company_identity->>'mission',
        'company_intelligence',
        p_intelligence_id,
        true,
        9,
        ARRAY['mission', 'purpose']
      );
    END IF;

    IF v_intel.company_identity->>'tagline' IS NOT NULL THEN
      INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
      VALUES (
        p_user_id,
        'company_info',
        'What is your tagline?',
        v_intel.company_identity->>'tagline',
        'company_intelligence',
        p_intelligence_id,
        true,
        8,
        ARRAY['tagline', 'slogan']
      );
    END IF;
  END IF;

  -- Sync products from company_intelligence_products
  FOR v_product IN 
    SELECT * FROM company_intelligence_products 
    WHERE intelligence_id = p_intelligence_id
  LOOP
    INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
    VALUES (
      p_user_id,
      'product_info',
      'Tell me about ' || v_product.name,
      COALESCE(v_product.description, '') || 
      CASE WHEN v_product.benefits IS NOT NULL AND array_length(v_product.benefits, 1) > 0
        THEN E'\n\nKey benefits: ' || array_to_string(v_product.benefits, ', ')
        ELSE ''
      END ||
      CASE WHEN v_product.features IS NOT NULL AND array_length(v_product.features, 1) > 0
        THEN E'\n\nFeatures: ' || array_to_string(v_product.features, ', ')
        ELSE ''
      END,
      'company_intelligence',
      p_intelligence_id,
      true,
      9,
      ARRAY['product', v_product.name]
    );
    
    -- Add pricing info
    IF v_product.price IS NOT NULL THEN
      INSERT INTO public_chatbot_training_data (user_id, category, question, answer, source, source_id, auto_synced, priority, tags)
      VALUES (
        p_user_id,
        'pricing',
        'How much is ' || v_product.name || '?',
        v_product.name || ' costs ' || v_product.price::text || ' ' || COALESCE(v_product.currency, 'USD'),
        'company_intelligence',
        p_intelligence_id,
        true,
        9,
        ARRAY['pricing', v_product.name]
      );
    END IF;
  END LOOP;

END;
$$;

-- Triggers for automatic sync
CREATE OR REPLACE FUNCTION trigger_sync_company_to_public_chatbot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM sync_company_to_public_chatbot_training(NEW.user_id, NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_company_to_public_chatbot_trigger ON company_profiles;
CREATE TRIGGER sync_company_to_public_chatbot_trigger
  AFTER INSERT OR UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_company_to_public_chatbot();

CREATE OR REPLACE FUNCTION trigger_sync_intelligence_to_public_chatbot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM sync_company_intelligence_to_public_chatbot(NEW.user_id, NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_intelligence_to_public_chatbot_trigger ON company_intelligence_v2;
CREATE TRIGGER sync_intelligence_to_public_chatbot_trigger
  AFTER INSERT OR UPDATE ON company_intelligence_v2
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_intelligence_to_public_chatbot();

-- Initial sync for existing data
DO $$
DECLARE
  v_company record;
BEGIN
  FOR v_company IN SELECT id, user_id FROM company_profiles LIMIT 100
  LOOP
    BEGIN
      PERFORM sync_company_to_public_chatbot_training(v_company.user_id, v_company.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error syncing company % to public chatbot: %', v_company.id, SQLERRM;
    END;
  END LOOP;
END $$;

DO $$
DECLARE
  v_intel record;
BEGIN
  FOR v_intel IN SELECT id, user_id FROM company_intelligence_v2 LIMIT 100
  LOOP
    BEGIN
      PERFORM sync_company_intelligence_to_public_chatbot(v_intel.user_id, v_intel.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error syncing intelligence % to public chatbot: %', v_intel.id, SQLERRM;
    END;
  END LOOP;
END $$;
