/*
  # Enterprise Messaging & Multi-Channel System

  1. New Tables
    - `conversations` - Lead conversation tracking
    - `message_ai_decisions` - AI decision logging per message
    - `lead_attributes` - Flexible lead attribute system
    - `lead_signals` - Lead engagement signals
    - `funnels` - Funnel definitions
    - `funnel_stages` - Funnel stage definitions
    - `funnel_sequences` - Message sequences per stage
    - `funnel_step_logs` - Execution tracking
    - `channel_messages_raw` - Multi-channel message ingestion
    - `kpi_aggregates_daily` - Daily analytics rollups
    - `ml_training_data` - ML model training data

  2. Security
    - Enable RLS on all tables
    - User-level data isolation
    - Team-based access where applicable

  3. Performance
    - Foreign key indexes
    - Composite indexes for queries
    - Time-series optimizations
*/

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  prospect_id uuid REFERENCES prospects,
  channel text NOT NULL CHECK (channel IN ('web', 'facebook', 'whatsapp', 'sms', 'email', 'internal')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- MESSAGE AI DECISIONS
CREATE TABLE IF NOT EXISTS message_ai_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  prospect_id uuid REFERENCES prospects,
  conversation_id uuid REFERENCES conversations,
  message_id text,
  detected_intent text NOT NULL,
  selected_persona text NOT NULL,
  language_detected text NOT NULL,
  tone_applied text,
  funnel_stage text,
  lead_temperature text,
  temperature_score integer,
  prompt_used text,
  tokens_used integer,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- LEAD ATTRIBUTES (flexible key-value storage)
CREATE TABLE IF NOT EXISTS lead_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  prospect_id uuid REFERENCES prospects NOT NULL,
  attribute_key text NOT NULL,
  attribute_value text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(prospect_id, attribute_key)
);

-- LEAD SIGNALS (engagement tracking)
CREATE TABLE IF NOT EXISTS lead_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  prospect_id uuid REFERENCES prospects NOT NULL,
  messages_sent integer DEFAULT 0,
  messages_replied integer DEFAULT 0,
  links_clicked integer DEFAULT 0,
  emails_opened integer DEFAULT 0,
  response_rate decimal(3,2),
  click_rate decimal(3,2),
  last_reply_at timestamptz,
  last_click_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(prospect_id)
);

-- FUNNELS
CREATE TABLE IF NOT EXISTS funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  industry text CHECK (industry IN ('mlm', 'insurance', 'real_estate', 'ecommerce', 'b2b', 'coaching', 'general')),
  description text,
  is_active boolean DEFAULT true,
  config jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FUNNEL STAGES
CREATE TABLE IF NOT EXISTS funnel_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid REFERENCES funnels NOT NULL,
  stage_name text NOT NULL,
  stage_order integer NOT NULL,
  rules jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(funnel_id, stage_order)
);

-- FUNNEL SEQUENCES
CREATE TABLE IF NOT EXISTS funnel_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid REFERENCES funnel_stages NOT NULL,
  step_key text NOT NULL,
  step_order integer NOT NULL,
  delay_minutes integer DEFAULT 0,
  template_en text,
  template_fil text,
  template_ceb text,
  template_es text,
  condition jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(stage_id, step_order)
);

-- FUNNEL STEP LOGS
CREATE TABLE IF NOT EXISTS funnel_step_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  prospect_id uuid REFERENCES prospects NOT NULL,
  funnel_id uuid REFERENCES funnels NOT NULL,
  stage_name text NOT NULL,
  step_key text NOT NULL,
  fired_at timestamptz DEFAULT now(),
  response_received boolean DEFAULT false,
  response_at timestamptz
);

-- CHANNEL MESSAGES RAW (multi-channel ingestion)
CREATE TABLE IF NOT EXISTS channel_messages_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  prospect_id uuid REFERENCES prospects,
  provider text NOT NULL,
  channel text NOT NULL,
  external_id text,
  direction text CHECK (direction IN ('inbound', 'outbound')),
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  received_at timestamptz DEFAULT now()
);

-- KPI AGGREGATES DAILY
CREATE TABLE IF NOT EXISTS kpi_aggregates_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  leads_created integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  messages_replied integer DEFAULT 0,
  conversations_started integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue_generated decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ML TRAINING DATA
CREATE TABLE IF NOT EXISTS ml_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  prospect_id uuid REFERENCES prospects,
  feature_vector jsonb NOT NULL,
  label text NOT NULL,
  model_version text,
  created_at timestamptz DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_conversations_user_status ON conversations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_prospect ON conversations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_user_date ON message_ai_decisions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_prospect ON message_ai_decisions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_intent ON message_ai_decisions(detected_intent);
CREATE INDEX IF NOT EXISTS idx_lead_attributes_prospect ON lead_attributes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_lead_signals_prospect ON lead_signals(prospect_id);
CREATE INDEX IF NOT EXISTS idx_lead_signals_user ON lead_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_funnels_user_active ON funnels(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_funnel_stages_funnel ON funnel_stages(funnel_id, stage_order);
CREATE INDEX IF NOT EXISTS idx_funnel_sequences_stage ON funnel_sequences(stage_id, step_order);
CREATE INDEX IF NOT EXISTS idx_funnel_logs_prospect ON funnel_step_logs(prospect_id, fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_raw_user ON channel_messages_raw(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_raw_unprocessed ON channel_messages_raw(user_id) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_kpi_daily_user_date ON kpi_aggregates_daily(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ml_training_user ON ml_training_data(user_id, created_at DESC);

-- ENABLE RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_aggregates_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_data ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- RLS POLICIES: message_ai_decisions
CREATE POLICY "Users can view own AI decisions"
  ON message_ai_decisions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI decisions"
  ON message_ai_decisions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: lead_attributes
CREATE POLICY "Users can view own lead attributes"
  ON lead_attributes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own lead attributes"
  ON lead_attributes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: lead_signals
CREATE POLICY "Users can view own lead signals"
  ON lead_signals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage lead signals"
  ON lead_signals FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: funnels
CREATE POLICY "Users can view own funnels"
  ON funnels FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own funnels"
  ON funnels FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: funnel_stages
CREATE POLICY "Users can view funnel stages"
  ON funnel_stages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM funnels
      WHERE funnels.id = funnel_stages.funnel_id
      AND funnels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage funnel stages"
  ON funnel_stages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM funnels
      WHERE funnels.id = funnel_stages.funnel_id
      AND funnels.user_id = auth.uid()
    )
  );

-- RLS POLICIES: funnel_sequences
CREATE POLICY "Users can view funnel sequences"
  ON funnel_sequences FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM funnel_stages
      JOIN funnels ON funnels.id = funnel_stages.funnel_id
      WHERE funnel_stages.id = funnel_sequences.stage_id
      AND funnels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage funnel sequences"
  ON funnel_sequences FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM funnel_stages
      JOIN funnels ON funnels.id = funnel_stages.funnel_id
      WHERE funnel_stages.id = funnel_sequences.stage_id
      AND funnels.user_id = auth.uid()
    )
  );

-- RLS POLICIES: funnel_step_logs
CREATE POLICY "Users can view own funnel logs"
  ON funnel_step_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert funnel logs"
  ON funnel_step_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: channel_messages_raw
CREATE POLICY "Users can view own channel messages"
  ON channel_messages_raw FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert channel messages"
  ON channel_messages_raw FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: kpi_aggregates_daily
CREATE POLICY "Users can view own KPIs"
  ON kpi_aggregates_daily FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage KPIs"
  ON kpi_aggregates_daily FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: ml_training_data
CREATE POLICY "Users can view own ML data"
  ON ml_training_data FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert ML data"
  ON ml_training_data FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- SEED DEFAULT FUNNELS
INSERT INTO funnels (user_id, name, industry, description, config) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'MLM Recruiting Funnel', 'mlm', 'Standard MLM prospect nurturing and closing', 
   '{"stages": ["awareness", "interest", "evaluation", "decision", "closing", "followUp", "revival"]}'::jsonb);

-- Update trigger for funnels
CREATE OR REPLACE FUNCTION update_funnel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_funnel_updated_at
  BEFORE UPDATE ON funnels
  FOR EACH ROW
  EXECUTE FUNCTION update_funnel_updated_at();