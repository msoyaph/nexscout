/*
  # Add 3rd Party Integrations to Chatbot Settings

  This migration adds support for integrating the AI chatbot with multiple 3rd party platforms
  including Facebook Messenger, WhatsApp Business, Telegram, and custom webhooks.

  ## Changes

  1. Add integrations column to chatbot_settings
    - `integrations` (jsonb) - Stores all 3rd party integration credentials and settings

  ## Integration Structure

  The integrations JSONB field supports:
  - Facebook Page & Messenger (facebook_page_id, facebook_page_token, messenger_enabled)
  - WhatsApp Business (whatsapp_phone, whatsapp_token)
  - Telegram Bot (telegram_bot_token)
  - Custom Webhooks (webhook_url, webhook_secret)

  ## Security

  - Sensitive tokens are stored in JSONB for encryption at rest
  - RLS policies ensure users can only access their own integration settings
*/

-- Add integrations column to chatbot_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_settings' AND column_name = 'integrations'
  ) THEN
    ALTER TABLE chatbot_settings ADD COLUMN integrations jsonb DEFAULT '{}'::jsonb;

    COMMENT ON COLUMN chatbot_settings.integrations IS '3rd party platform integrations (Facebook, WhatsApp, Telegram, Webhooks)';
  END IF;
END $$;

-- Create index for faster integration lookups
CREATE INDEX IF NOT EXISTS idx_chatbot_settings_integrations
  ON chatbot_settings USING gin(integrations);

-- Update RLS policies to include integrations field (already covered by existing policies)
-- The existing RLS on chatbot_settings already protects the integrations field
