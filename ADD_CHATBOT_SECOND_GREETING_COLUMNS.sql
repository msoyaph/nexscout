-- Migration: Add second_greeting_message and second_greeting_delay columns to chatbot_settings
-- Date: 2025-12-03
-- Purpose: Support optional second greeting message with delay feature

-- Add second_greeting_message column (optional text field)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_settings' AND column_name = 'second_greeting_message'
  ) THEN
    ALTER TABLE chatbot_settings
    ADD COLUMN second_greeting_message TEXT DEFAULT NULL;
    
    COMMENT ON COLUMN chatbot_settings.second_greeting_message IS 
      'Optional second greeting message that appears after the first greeting with typing animation';
  END IF;
END $$;

-- Add second_greeting_delay column (delay in seconds, 1-10 range)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_settings' AND column_name = 'second_greeting_delay'
  ) THEN
    ALTER TABLE chatbot_settings
    ADD COLUMN second_greeting_delay INTEGER DEFAULT 3
    CHECK (second_greeting_delay >= 1 AND second_greeting_delay <= 10);
    
    COMMENT ON COLUMN chatbot_settings.second_greeting_delay IS 
      'Delay in seconds (1-10) before showing the second greeting message';
  END IF;
END $$;

-- Update existing records to have default delay of 3 seconds if delay is NULL
UPDATE chatbot_settings
SET second_greeting_delay = 3
WHERE second_greeting_delay IS NULL;

-- Verify columns were added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_settings' 
    AND column_name IN ('second_greeting_message', 'second_greeting_delay')
  ) THEN
    RAISE NOTICE '✅ Successfully added second_greeting_message and second_greeting_delay columns to chatbot_settings';
  ELSE
    RAISE EXCEPTION '❌ Failed to add columns to chatbot_settings';
  END IF;
END $$;

