/*
  # Add integrations column to chatbot_settings

  This migration adds the missing integrations column that the UI is trying to save.
  Allows storing Facebook, WhatsApp, Telegram, and webhook integration settings.
*/

-- Add integrations column
ALTER TABLE chatbot_settings
ADD COLUMN IF NOT EXISTS integrations jsonb DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN chatbot_settings.integrations IS 'Integration settings for Facebook Messenger, WhatsApp, Telegram, webhooks, etc.';

-- Create index for querying integrations
CREATE INDEX IF NOT EXISTS idx_chatbot_settings_integrations_gin
ON chatbot_settings USING gin (integrations);
