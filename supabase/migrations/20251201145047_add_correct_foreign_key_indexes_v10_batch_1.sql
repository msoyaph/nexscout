/*
  # Add Foreign Key Indexes - Correct Schema Batch 1
  
  1. Performance Optimization
    - Add indexes for actual foreign key columns that exist
  
  2. Tables Affected
    - admin_companies (created_by)
    - browser_captures (user_id)
    - chatbot_analytics (user_id)
    - chatbot_conversations (chatbot_id - if exists)
    - chatbot_integrations (company_id - if exists)
    - chatbot_training_data (user_id)
  
  3. Security & Performance
    - Improves JOIN performance
    - Essential for RLS policy performance
*/

-- Admin tables
CREATE INDEX IF NOT EXISTS idx_admin_companies_created_by 
  ON admin_companies(created_by);

-- Browser Capture tables
CREATE INDEX IF NOT EXISTS idx_browser_captures_user_id 
  ON browser_captures(user_id);

-- Chatbot tables (using actual columns)
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_user_id 
  ON chatbot_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_training_data_user_id 
  ON chatbot_training_data(user_id);

-- Check and add chatbot_conversations index if chatbot_id exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbot_conversations' 
    AND column_name = 'chatbot_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_chatbot_id 
      ON chatbot_conversations(chatbot_id);
  END IF;
END $$;

-- Check and add chatbot_integrations index if company_id exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbot_integrations' 
    AND column_name = 'company_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_chatbot_integrations_company_id 
      ON chatbot_integrations(company_id);
  END IF;
END $$;
