/*
  # Add AI System Instructions to Chatbot Settings

  1. Changes
    - Add `custom_system_instructions` column to chatbot_settings
    - Add `use_custom_instructions` boolean flag
    - Add `instructions_override_intelligence` boolean flag

  2. Purpose
    - Allow power users to write custom AI instructions
    - Option to override all automatic intelligence with custom instructions
    - Full control over chatbot behavior and sales flow
*/

-- Add custom AI instructions fields to chatbot_settings
ALTER TABLE chatbot_settings
ADD COLUMN IF NOT EXISTS custom_system_instructions text,
ADD COLUMN IF NOT EXISTS use_custom_instructions boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS instructions_override_intelligence boolean DEFAULT false;

-- Add comment explaining the fields
COMMENT ON COLUMN chatbot_settings.custom_system_instructions IS 'Custom AI system instructions for power users to control chatbot behavior, sales flow, and responses';
COMMENT ON COLUMN chatbot_settings.use_custom_instructions IS 'Whether to use custom instructions (can work alongside intelligence)';
COMMENT ON COLUMN chatbot_settings.instructions_override_intelligence IS 'When true, custom instructions completely override all automatic company/product intelligence';