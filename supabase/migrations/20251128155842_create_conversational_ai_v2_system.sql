/*
  # NexScout Conversational AI Engine v2.0 - Advanced CRM Intelligence

  1. Purpose
    - Long-term prospect memory
    - Conversation intelligence & analysis
    - Auto follow-up sequences
    - CRM actions from chat
    - Meeting scheduling
    - Product recommendations
    - Sentiment history tracking
    - Multi-channel synchronization

  2. New Tables
    - `prospect_conversation_memory`: Long-term memory per prospect
    - `ai_follow_up_sequences`: Auto follow-up automation
    - `prospect_sentiment_history`: Track sentiment over time
    - `prospect_channel_connections`: Multi-channel identity linking
    - `voice_transcripts`: Voice note transcriptions
    - `ai_conversation_states`: State machine tracking
    - `scheduled_meetings`: AI-scheduled meetings
    - `product_recommendation_history`: Recommendation tracking
    - `conversation_intelligence_events`: Intelligence analysis results
    - `prospect_purchase_paths`: Personalized sales journeys
*/

-- Prospect conversation memory (long-term)
CREATE TABLE IF NOT EXISTS prospect_conversation_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  
  name text,
  goals text[],
  pain_points text[],
  budget_range text,
  products_liked text[],
  objections_repeated text[],
  personal_notes text[],
  
  relationship_closeness integer DEFAULT 0,
  timeline text,
  buying_temperature_trend jsonb DEFAULT '[]'::jsonb,
  
  conversation_count integer DEFAULT 0,
  last_interaction timestamptz,
  
  memory_metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI follow-up sequences
CREATE TABLE IF NOT EXISTS ai_follow_up_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  
  sequence_name text NOT NULL,
  trigger_type text NOT NULL,
  
  status text DEFAULT 'active',
  
  steps jsonb DEFAULT '[]'::jsonb,
  current_step integer DEFAULT 0,
  
  next_action_at timestamptz,
  
  rules jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prospect sentiment history
CREATE TABLE IF NOT EXISTS prospect_sentiment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  sentiment text NOT NULL,
  intent text,
  temperature integer,
  confidence numeric(3,2),
  
  emotions jsonb DEFAULT '{}'::jsonb,
  signals jsonb DEFAULT '{}'::jsonb,
  
  detected_at timestamptz DEFAULT now()
);

-- Prospect channel connections (multi-channel identity)
CREATE TABLE IF NOT EXISTS prospect_channel_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  
  channel text NOT NULL,
  channel_id text NOT NULL,
  
  is_primary boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(channel, channel_id)
);

-- Voice transcripts
CREATE TABLE IF NOT EXISTS voice_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  
  audio_url text,
  transcript text NOT NULL,
  
  detected_emotion text,
  detected_commands text[],
  
  transcription_service text,
  confidence numeric(3,2),
  
  duration_seconds integer,
  
  created_at timestamptz DEFAULT now()
);

-- AI conversation states
CREATE TABLE IF NOT EXISTS ai_conversation_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES ai_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  
  current_state text NOT NULL,
  previous_state text,
  
  next_action text,
  confidence numeric(3,2),
  
  state_context jsonb DEFAULT '{}'::jsonb,
  
  changed_at timestamptz DEFAULT now()
);

-- Scheduled meetings
CREATE TABLE IF NOT EXISTS scheduled_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  
  meeting_type text NOT NULL,
  
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30,
  
  meeting_url text,
  location text,
  
  status text DEFAULT 'scheduled',
  
  reminder_sent boolean DEFAULT false,
  
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product recommendation history
CREATE TABLE IF NOT EXISTS product_recommendation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  products_recommended jsonb NOT NULL,
  recommendation_reason text,
  
  prospect_response text,
  accepted boolean DEFAULT false,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  
  recommended_at timestamptz DEFAULT now()
);

-- Conversation intelligence events
CREATE TABLE IF NOT EXISTS conversation_intelligence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  event_type text NOT NULL,
  
  extracted_data jsonb DEFAULT '{}'::jsonb,
  
  confidence numeric(3,2),
  
  created_at timestamptz DEFAULT now()
);

-- Prospect purchase paths
CREATE TABLE IF NOT EXISTS prospect_purchase_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  
  path_name text NOT NULL,
  
  steps jsonb NOT NULL,
  current_step integer DEFAULT 0,
  
  completion_percentage integer DEFAULT 0,
  
  status text DEFAULT 'active',
  
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prospect_memory_prospect_id ON prospect_conversation_memory(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_memory_user_id ON prospect_conversation_memory(user_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_prospect_id ON ai_follow_up_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_status ON ai_follow_up_sequences(status);
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_next_action ON ai_follow_up_sequences(next_action_at);

CREATE INDEX IF NOT EXISTS idx_sentiment_history_prospect_id ON prospect_sentiment_history(prospect_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_history_detected_at ON prospect_sentiment_history(detected_at);

CREATE INDEX IF NOT EXISTS idx_channel_connections_prospect_id ON prospect_channel_connections(prospect_id);
CREATE INDEX IF NOT EXISTS idx_channel_connections_channel ON prospect_channel_connections(channel, channel_id);

CREATE INDEX IF NOT EXISTS idx_voice_transcripts_conversation_id ON voice_transcripts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_voice_transcripts_prospect_id ON voice_transcripts(prospect_id);

CREATE INDEX IF NOT EXISTS idx_conversation_states_session_id ON ai_conversation_states(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_states_current_state ON ai_conversation_states(current_state);

CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_prospect_id ON scheduled_meetings(prospect_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_scheduled_at ON scheduled_meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_status ON scheduled_meetings(status);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_prospect_id ON product_recommendation_history(prospect_id);

CREATE INDEX IF NOT EXISTS idx_intelligence_events_prospect_id ON conversation_intelligence_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_events_type ON conversation_intelligence_events(event_type);

CREATE INDEX IF NOT EXISTS idx_purchase_paths_prospect_id ON prospect_purchase_paths(prospect_id);
CREATE INDEX IF NOT EXISTS idx_purchase_paths_status ON prospect_purchase_paths(status);

-- Enable RLS
ALTER TABLE prospect_conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_follow_up_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_sentiment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_channel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recommendation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_intelligence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_purchase_paths ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Users can manage own data)
CREATE POLICY "Users manage own prospect memory"
  ON prospect_conversation_memory FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own follow-up sequences"
  ON ai_follow_up_sequences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own sentiment history"
  ON prospect_sentiment_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own channel connections"
  ON prospect_channel_connections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own voice transcripts"
  ON voice_transcripts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own conversation states"
  ON ai_conversation_states FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own scheduled meetings"
  ON scheduled_meetings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own product recommendations"
  ON product_recommendation_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own intelligence events"
  ON conversation_intelligence_events FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own purchase paths"
  ON prospect_purchase_paths FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
