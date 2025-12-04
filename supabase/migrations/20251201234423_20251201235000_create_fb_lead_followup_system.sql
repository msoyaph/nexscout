/*
  # FB Lead Auto-Follow-Up Sequence System

  1. Purpose
    - Automatically nurture FB leads with intelligent sequences
    - 7-day Taglish messaging that adapts to behavior
    - Track delivery, replies, and conversions
    - Integrate with messenger/sms/email channels

  2. Tables
    - `fb_lead_followup_sequences` - Sequence configurations
    - `fb_lead_followup_steps` - Individual sequence steps
    - `fb_lead_followup_logs` - Delivery tracking
    - `fb_lead_message_templates` - Taglish templates

  3. Intelligence
    - Condition-based sending (no_reply, no_meeting, no_sale)
    - Template variable substitution
    - Channel flexibility (messenger default)
    - Performance tracking per step
*/

-- =====================================================
-- FB LEAD FOLLOW-UP SEQUENCES
-- =====================================================

CREATE TABLE IF NOT EXISTS fb_lead_followup_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Sequence Details
  name text NOT NULL,
  description text,
  
  -- Settings
  default_channel text NOT NULL DEFAULT 'messenger', -- messenger/sms/email
  is_active boolean DEFAULT true,
  
  -- Stats
  total_started integer DEFAULT 0,
  total_completed integer DEFAULT 0,
  avg_completion_rate decimal(5,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_fb_sequences_user ON fb_lead_followup_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_fb_sequences_active ON fb_lead_followup_sequences(is_active) WHERE is_active = true;

-- =====================================================
-- FB LEAD FOLLOW-UP STEPS
-- =====================================================

CREATE TABLE IF NOT EXISTS fb_lead_followup_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES fb_lead_followup_sequences(id) ON DELETE CASCADE NOT NULL,
  
  -- Step Configuration
  step_order integer NOT NULL,
  step_name text,
  delay_minutes integer NOT NULL DEFAULT 0, -- Minutes after lead capture
  
  -- Conditions
  condition_type text NOT NULL DEFAULT 'always',
  -- Options: 'always', 'no_reply', 'no_meeting', 'no_sale', 'no_open'
  
  -- Message
  template_key text NOT NULL, -- References message template
  channel_override text, -- Override sequence default channel
  
  -- Timing Window (optional)
  send_only_business_hours boolean DEFAULT false,
  timezone text DEFAULT 'Asia/Manila',
  
  -- Stats
  total_sent integer DEFAULT 0,
  total_delivered integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_replied integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(sequence_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_fb_steps_sequence ON fb_lead_followup_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_fb_steps_order ON fb_lead_followup_steps(sequence_id, step_order);

-- =====================================================
-- FB LEAD FOLLOW-UP LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS fb_lead_followup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  step_id uuid REFERENCES fb_lead_followup_steps(id) ON DELETE CASCADE NOT NULL,
  sequence_id uuid REFERENCES fb_lead_followup_sequences(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Message Details
  channel text NOT NULL,
  message_content text,
  
  -- Status
  delivery_status text DEFAULT 'pending',
  -- Options: pending, sent, delivered, opened, replied, failed, skipped
  
  -- Tracking
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  replied_at timestamptz,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "fb_message_id": "...",
  --   "error_message": "...",
  --   "skip_reason": "..."
  -- }
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fb_logs_prospect ON fb_lead_followup_logs(prospect_id);
CREATE INDEX IF NOT EXISTS idx_fb_logs_step ON fb_lead_followup_logs(step_id);
CREATE INDEX IF NOT EXISTS idx_fb_logs_sequence ON fb_lead_followup_logs(sequence_id);
CREATE INDEX IF NOT EXISTS idx_fb_logs_user ON fb_lead_followup_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fb_logs_status ON fb_lead_followup_logs(delivery_status);
CREATE INDEX IF NOT EXISTS idx_fb_logs_sent ON fb_lead_followup_logs(sent_at DESC);

-- =====================================================
-- FB LEAD MESSAGE TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS fb_lead_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Details
  template_key text NOT NULL UNIQUE,
  template_name text NOT NULL,
  category text, -- welcome, nurture, objection, booking, social_proof, last_call
  
  -- Content
  language text DEFAULT 'taglish',
  content text NOT NULL,
  
  -- Variables
  required_variables text[], -- ['first_name', 'product_name', 'agent_name']
  
  -- Performance
  total_sent integer DEFAULT 0,
  avg_reply_rate decimal(5,2) DEFAULT 0,
  avg_conversion_rate decimal(5,2) DEFAULT 0,
  
  -- Status
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_key ON fb_lead_message_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_templates_category ON fb_lead_message_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON fb_lead_message_templates(is_active) WHERE is_active = true;

-- =====================================================
-- PROSPECT STATUS SNAPSHOT (For Conditions)
-- =====================================================

CREATE TABLE IF NOT EXISTS fb_lead_prospect_status (
  prospect_id uuid PRIMARY KEY REFERENCES prospects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Status Flags
  has_any_reply boolean DEFAULT false,
  has_meeting_scheduled boolean DEFAULT false,
  has_closed_won boolean DEFAULT false,
  has_opened_message boolean DEFAULT false,
  
  -- Metadata
  last_reply_at timestamptz,
  last_opened_at timestamptz,
  meeting_scheduled_at timestamptz,
  closed_won_at timestamptz,
  
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_prospect ON fb_lead_prospect_status(prospect_id);
CREATE INDEX IF NOT EXISTS idx_status_user ON fb_lead_prospect_status(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE fb_lead_followup_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_lead_followup_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_lead_followup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_lead_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_lead_prospect_status ENABLE ROW LEVEL SECURITY;

-- Sequences
CREATE POLICY "Users can view own sequences"
  ON fb_lead_followup_sequences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sequences"
  ON fb_lead_followup_sequences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Steps
CREATE POLICY "Users can view own steps"
  ON fb_lead_followup_steps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fb_lead_followup_sequences
      WHERE fb_lead_followup_sequences.id = fb_lead_followup_steps.sequence_id
      AND fb_lead_followup_sequences.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own steps"
  ON fb_lead_followup_steps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fb_lead_followup_sequences
      WHERE fb_lead_followup_sequences.id = fb_lead_followup_steps.sequence_id
      AND fb_lead_followup_sequences.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fb_lead_followup_sequences
      WHERE fb_lead_followup_sequences.id = fb_lead_followup_steps.sequence_id
      AND fb_lead_followup_sequences.user_id = auth.uid()
    )
  );

-- Logs
CREATE POLICY "Users can view own logs"
  ON fb_lead_followup_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage logs
CREATE POLICY "Service can manage logs"
  ON fb_lead_followup_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Templates (public read, admin write)
CREATE POLICY "Anyone can view templates"
  ON fb_lead_message_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Status
CREATE POLICY "Users can view own status"
  ON fb_lead_prospect_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage status"
  ON fb_lead_prospect_status FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Update step stats after log insert
CREATE OR REPLACE FUNCTION update_followup_step_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fb_lead_followup_steps
  SET
    total_sent = total_sent + 1,
    total_delivered = total_delivered + CASE WHEN NEW.delivery_status = 'delivered' THEN 1 ELSE 0 END,
    total_opened = total_opened + CASE WHEN NEW.delivery_status = 'opened' THEN 1 ELSE 0 END,
    total_replied = total_replied + CASE WHEN NEW.delivery_status = 'replied' THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = NEW.step_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_step_stats
  AFTER INSERT ON fb_lead_followup_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_followup_step_stats();

-- Update template stats
CREATE OR REPLACE FUNCTION update_template_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fb_lead_message_templates
  SET total_sent = total_sent + 1
  WHERE template_key = (
    SELECT template_key
    FROM fb_lead_followup_steps
    WHERE id = NEW.step_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_template_stats
  AFTER INSERT ON fb_lead_followup_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_template_stats();

-- Auto-update prospect status based on activity
CREATE OR REPLACE FUNCTION update_prospect_status_from_reply()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.delivery_status = 'replied' THEN
    INSERT INTO fb_lead_prospect_status (prospect_id, user_id, has_any_reply, last_reply_at)
    VALUES (NEW.prospect_id, NEW.user_id, true, now())
    ON CONFLICT (prospect_id)
    DO UPDATE SET
      has_any_reply = true,
      last_reply_at = now(),
      updated_at = now();
  END IF;
  
  IF NEW.delivery_status = 'opened' THEN
    INSERT INTO fb_lead_prospect_status (prospect_id, user_id, has_opened_message, last_opened_at)
    VALUES (NEW.prospect_id, NEW.user_id, true, now())
    ON CONFLICT (prospect_id)
    DO UPDATE SET
      has_opened_message = true,
      last_opened_at = now(),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_status_from_reply
  AFTER UPDATE ON fb_lead_followup_logs
  FOR EACH ROW
  WHEN (OLD.delivery_status IS DISTINCT FROM NEW.delivery_status)
  EXECUTE FUNCTION update_prospect_status_from_reply();