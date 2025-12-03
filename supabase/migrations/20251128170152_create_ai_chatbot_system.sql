/*
  # AI Chatbot Control System

  1. New Tables
    - `chatbot_configurations`
      - User chatbot settings and customization
      - Personality, tone, response style
      - Integration settings

    - `chatbot_conversations`
      - Chat conversation threads
      - Tracks all user-chatbot interactions

    - `chatbot_messages`
      - Individual messages in conversations
      - User and AI messages with metadata

    - `chatbot_training_data`
      - Custom training data per user
      - Company-specific knowledge base

    - `chatbot_integrations`
      - External integrations (Slack, FB Messenger, etc)
      - API keys and webhook URLs

    - `chatbot_analytics`
      - Usage metrics and performance data
      - Popular queries, response times

  2. Security
    - Enable RLS on all tables
    - Users can only access their own chatbot data
*/

-- Chatbot Configurations
CREATE TABLE IF NOT EXISTS chatbot_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chatbot_name text DEFAULT 'NexScout AI Assistant',
  personality text DEFAULT 'friendly' CHECK (personality IN ('friendly', 'professional', 'casual', 'expert', 'motivational')),
  tone text DEFAULT 'helpful' CHECK (tone IN ('helpful', 'direct', 'empathetic', 'energetic', 'calm')),
  response_length text DEFAULT 'medium' CHECK (response_length IN ('concise', 'medium', 'detailed')),
  language text DEFAULT 'en' CHECK (language IN ('en', 'taglish', 'fil')),
  avatar_url text,
  welcome_message text DEFAULT 'Hi! How can I help you today?',
  use_company_data boolean DEFAULT true,
  use_prospect_data boolean DEFAULT true,
  auto_suggest_actions boolean DEFAULT true,
  enable_voice boolean DEFAULT false,
  max_context_messages integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chatbot Conversations
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  context_type text CHECK (context_type IN ('general', 'prospect', 'sales', 'training', 'support')),
  context_id uuid,
  message_count integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Chatbot Messages
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chatbot_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  response_time_ms integer,
  confidence_score numeric(3,2),
  actions_suggested jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Chatbot Training Data
CREATE TABLE IF NOT EXISTS chatbot_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('company_info', 'product_info', 'faq', 'sales_script', 'objection_handler', 'custom')),
  question text NOT NULL,
  answer text NOT NULL,
  tags text[] DEFAULT '{}',
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chatbot Integrations
CREATE TABLE IF NOT EXISTS chatbot_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('web', 'facebook', 'slack', 'whatsapp', 'telegram', 'custom')),
  integration_name text NOT NULL,
  is_enabled boolean DEFAULT false,
  api_key text,
  webhook_url text,
  settings jsonb DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform, integration_name)
);

-- Chatbot Analytics
CREATE TABLE IF NOT EXISTS chatbot_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  total_conversations integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  avg_response_time_ms integer DEFAULT 0,
  total_tokens_used integer DEFAULT 0,
  unique_users integer DEFAULT 0,
  satisfaction_score numeric(3,2),
  top_queries jsonb DEFAULT '[]'::jsonb,
  top_actions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE chatbot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_configurations
CREATE POLICY "Users can view own chatbot config"
  ON chatbot_configurations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chatbot config"
  ON chatbot_configurations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chatbot config"
  ON chatbot_configurations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chatbot_conversations
CREATE POLICY "Users can view own conversations"
  ON chatbot_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON chatbot_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON chatbot_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON chatbot_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for chatbot_messages
CREATE POLICY "Users can view own messages"
  ON chatbot_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON chatbot_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chatbot_training_data
CREATE POLICY "Users can view own training data"
  ON chatbot_training_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training data"
  ON chatbot_training_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training data"
  ON chatbot_training_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own training data"
  ON chatbot_training_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for chatbot_integrations
CREATE POLICY "Users can view own integrations"
  ON chatbot_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON chatbot_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON chatbot_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON chatbot_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for chatbot_analytics
CREATE POLICY "Users can view own analytics"
  ON chatbot_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON chatbot_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON chatbot_analytics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_status ON chatbot_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_user ON chatbot_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created ON chatbot_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_training_category ON chatbot_training_data(user_id, category);
CREATE INDEX IF NOT EXISTS idx_chatbot_training_active ON chatbot_training_data(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chatbot_integrations_user ON chatbot_integrations(user_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_user_date ON chatbot_analytics(user_id, date DESC);

-- Function to auto-create chatbot config for new users
CREATE OR REPLACE FUNCTION create_default_chatbot_config()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chatbot_configurations (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create config on user creation
DROP TRIGGER IF EXISTS create_chatbot_config_on_signup ON auth.users;
CREATE TRIGGER create_chatbot_config_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_chatbot_config();