/*
  # NexScout Conversational AI Engine v1.0

  1. Purpose
    - Support omni-channel AI chatbot
    - Track conversations across web, Messenger, WhatsApp, Viber
    - Store AI-generated prospects
    - Manage custom AI scripts and behaviors
    - Enable 24/7 AI sales agent functionality

  2. New Tables
    - `ai_conversations`: Store all chat messages
    - `ai_prospects`: AI-generated prospect profiles
    - `ai_scripts_user_defined`: Custom AI behavior scripts
    - `ai_agent_settings`: Channel and agent configuration
    - `ai_chat_sessions`: Track chat sessions

  3. Features
    - Multi-channel support
    - Sentiment tracking
    - Lead scoring
    - Auto prospect creation
    - Custom script management
*/

-- AI chat sessions
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  
  channel text NOT NULL,
  visitor_id text,
  
  status text DEFAULT 'active',
  
  started_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  
  session_metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- AI conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES ai_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  
  channel text NOT NULL,
  
  message text NOT NULL,
  role text NOT NULL,
  
  ai_response_metadata jsonb DEFAULT '{}'::jsonb,
  
  sentiment text,
  intent text,
  confidence numeric(3,2),
  
  attachments jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- AI prospects (generated from conversations)
CREATE TABLE IF NOT EXISTS ai_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  session_id uuid REFERENCES ai_chat_sessions(id) ON DELETE SET NULL,
  
  name text,
  phone text,
  email text,
  
  detected_interests text[],
  detected_pain_points text[],
  
  sentiment_avg text DEFAULT 'neutral',
  buying_temperature integer DEFAULT 50,
  lead_score integer DEFAULT 0,
  
  conversation_count integer DEFAULT 0,
  last_interaction timestamptz,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User-defined AI scripts
CREATE TABLE IF NOT EXISTS ai_scripts_user_defined (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  script_type text NOT NULL,
  
  closing_steps jsonb DEFAULT '[]'::jsonb,
  objection_handlers jsonb DEFAULT '[]'::jsonb,
  product_recommendation_rules jsonb DEFAULT '[]'::jsonb,
  faq_answers jsonb DEFAULT '[]'::jsonb,
  forbidden_phrases text[],
  
  custom_greeting text,
  custom_closing text,
  
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI agent settings
CREATE TABLE IF NOT EXISTS ai_agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  agent_name text NOT NULL,
  agent_personality text,
  
  public_chat_enabled boolean DEFAULT true,
  public_username text UNIQUE,
  
  messenger_enabled boolean DEFAULT false,
  messenger_page_id text,
  messenger_access_token text,
  
  whatsapp_enabled boolean DEFAULT false,
  whatsapp_phone_number text,
  whatsapp_api_key text,
  
  viber_enabled boolean DEFAULT false,
  viber_bot_token text,
  
  auto_greeting text,
  working_hours jsonb DEFAULT '{}'::jsonb,
  
  max_daily_chats integer DEFAULT 100,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_prospect_id ON ai_chat_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_status ON ai_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_channel ON ai_chat_sessions(channel);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_prospect_id ON ai_conversations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_role ON ai_conversations(role);

CREATE INDEX IF NOT EXISTS idx_ai_prospects_user_id ON ai_prospects(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_prospects_prospect_id ON ai_prospects(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_prospects_session_id ON ai_prospects(session_id);

CREATE INDEX IF NOT EXISTS idx_ai_scripts_user_id ON ai_scripts_user_defined(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_scripts_type ON ai_scripts_user_defined(script_type);

CREATE INDEX IF NOT EXISTS idx_ai_agent_settings_user_id ON ai_agent_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_settings_username ON ai_agent_settings(public_username);

-- Enable RLS
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scripts_user_defined ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_chat_sessions
CREATE POLICY "Users can view own chat sessions"
  ON ai_chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON ai_chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON ai_chat_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view active sessions for chat"
  ON ai_chat_sessions FOR SELECT
  TO anon
  USING (status = 'active');

CREATE POLICY "Public can create chat sessions"
  ON ai_chat_sessions FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view conversations in active sessions"
  ON ai_conversations FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions
      WHERE id = session_id AND status = 'active'
    )
  );

CREATE POLICY "Public can create conversations"
  ON ai_conversations FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policies for ai_prospects
CREATE POLICY "Users can view own AI prospects"
  ON ai_prospects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI prospects"
  ON ai_prospects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI prospects"
  ON ai_prospects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_scripts_user_defined
CREATE POLICY "Users can manage own AI scripts"
  ON ai_scripts_user_defined FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_agent_settings
CREATE POLICY "Users can manage own agent settings"
  ON ai_agent_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view agent settings by username"
  ON ai_agent_settings FOR SELECT
  TO anon
  USING (public_chat_enabled = true);
