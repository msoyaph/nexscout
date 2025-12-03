/*
  # Public AI Chatbot System v1.0

  Complete customer-facing AI chatbot with automatic prospect conversion
*/

-- Public Chat Sessions
CREATE TABLE IF NOT EXISTS public_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_slug text UNIQUE NOT NULL,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  channel text DEFAULT 'web' CHECK (channel IN ('web', 'facebook', 'whatsapp', 'viber', 'messenger')),
  ip_address text,
  user_agent text,
  conversation_context jsonb DEFAULT '{}'::jsonb,
  emotional_state text DEFAULT 'neutral',
  buying_intent_score numeric DEFAULT 0.0,
  qualification_score numeric DEFAULT 0.0,
  message_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'converted', 'abandoned'))
);

-- Public Chat Messages
CREATE TABLE IF NOT EXISTS public_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  sender text NOT NULL CHECK (sender IN ('visitor', 'ai')),
  message text NOT NULL,
  ai_emotion text,
  ai_intent text,
  ai_buying_signals text[] DEFAULT '{}',
  detected_objections text[] DEFAULT '{}',
  sentiment_score numeric DEFAULT 0.0,
  urgency_level text DEFAULT 'low',
  keywords text[] DEFAULT '{}',
  token_usage integer DEFAULT 0,
  model_used text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Chatbot Settings
CREATE TABLE IF NOT EXISTS chatbot_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'AI Assistant',
  avatar_url text,
  greeting_message text DEFAULT 'Hi! How can I help you today?',
  tone text DEFAULT 'professional' CHECK (tone IN ('friendly', 'professional', 'persuasive', 'casual', 'taglish')),
  reply_depth text DEFAULT 'medium' CHECK (reply_depth IN ('short', 'medium', 'long')),
  closing_style text DEFAULT 'warm',
  objection_style text DEFAULT 'empathetic',
  appointment_rules jsonb DEFAULT '{}'::jsonb,
  allowed_products jsonb DEFAULT '[]'::jsonb,
  allowed_services jsonb DEFAULT '[]'::jsonb,
  ai_personality jsonb DEFAULT '{}'::jsonb,
  company_id uuid,
  auto_qualify_threshold numeric DEFAULT 0.7,
  auto_convert_to_prospect boolean DEFAULT true,
  enabled_channels text[] DEFAULT ARRAY['web'],
  widget_color text DEFAULT '#3B82F6',
  widget_position text DEFAULT 'bottom-right',
  business_hours jsonb DEFAULT '{}'::jsonb,
  away_message text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chatbot Visitors
CREATE TABLE IF NOT EXISTS chatbot_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text,
  email text,
  phone text,
  company text,
  location text,
  capture_method text DEFAULT 'voluntary',
  verified boolean DEFAULT false,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  total_sessions integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Chatbot to Prospect Pipeline
CREATE TABLE IF NOT EXISTS chatbot_to_prospect_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  visitor_id uuid REFERENCES chatbot_visitors(id) ON DELETE SET NULL,
  qualification_score numeric DEFAULT 0.0,
  emotion_primary text,
  emotion_secondary text,
  buying_intent text,
  readiness_stage text DEFAULT 'awareness',
  detected_pain_points text[] DEFAULT '{}',
  detected_objections text[] DEFAULT '{}',
  budget_signals text[] DEFAULT '{}',
  urgency_signals text[] DEFAULT '{}',
  conversation_summary text,
  ai_recommendation text,
  pipeline_stage text DEFAULT 'New Chat Lead',
  converted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat Analytics
CREATE TABLE IF NOT EXISTS chatbot_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  total_sessions integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  total_visitors integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0.0,
  avg_qualification_score numeric DEFAULT 0.0,
  avg_session_length_seconds integer DEFAULT 0,
  top_intents jsonb DEFAULT '{}'::jsonb,
  top_objections jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_to_prospect_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public can create chat sessions" ON public_chat_sessions;
  DROP POLICY IF EXISTS "Public can view own session by slug" ON public_chat_sessions;
  DROP POLICY IF EXISTS "Users can view own chat sessions" ON public_chat_sessions;
  DROP POLICY IF EXISTS "Users can update own chat sessions" ON public_chat_sessions;
  DROP POLICY IF EXISTS "Public can insert messages to sessions" ON public_chat_messages;
  DROP POLICY IF EXISTS "Public can view messages in session" ON public_chat_messages;
  DROP POLICY IF EXISTS "Users can view messages in own sessions" ON public_chat_messages;
  DROP POLICY IF EXISTS "Users can view own chatbot settings" ON chatbot_settings;
  DROP POLICY IF EXISTS "Users can insert own chatbot settings" ON chatbot_settings;
  DROP POLICY IF EXISTS "Users can update own chatbot settings" ON chatbot_settings;
  DROP POLICY IF EXISTS "Public can view active chatbot settings by user" ON chatbot_settings;
  DROP POLICY IF EXISTS "Users can view own visitors" ON chatbot_visitors;
  DROP POLICY IF EXISTS "System can insert visitors" ON chatbot_visitors;
  DROP POLICY IF EXISTS "Users can view own pipeline entries" ON chatbot_to_prospect_pipeline;
  DROP POLICY IF EXISTS "Users can insert own pipeline entries" ON chatbot_to_prospect_pipeline;
  DROP POLICY IF EXISTS "Users can update own pipeline entries" ON chatbot_to_prospect_pipeline;
  DROP POLICY IF EXISTS "Users can view own analytics" ON chatbot_analytics;
END $$;

-- RLS Policies
CREATE POLICY "Public can create chat sessions"
  ON public_chat_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can view own session by slug"
  ON public_chat_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can view own chat sessions"
  ON public_chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON public_chat_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can insert messages to sessions"
  ON public_chat_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can view messages in session"
  ON public_chat_messages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can view own chatbot settings"
  ON chatbot_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chatbot settings"
  ON chatbot_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chatbot settings"
  ON chatbot_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view active chatbot settings by user"
  ON chatbot_settings FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Users can view own visitors"
  ON chatbot_visitors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert visitors"
  ON chatbot_visitors FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can view own pipeline entries"
  ON chatbot_to_prospect_pipeline FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pipeline entries"
  ON chatbot_to_prospect_pipeline FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pipeline entries"
  ON chatbot_to_prospect_pipeline FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics"
  ON chatbot_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public_chat_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_slug ON public_chat_sessions(session_slug);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public_chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chatbot_visitors_email ON chatbot_visitors(email);
CREATE INDEX IF NOT EXISTS idx_pipeline_user ON chatbot_to_prospect_pipeline(user_id, created_at DESC);