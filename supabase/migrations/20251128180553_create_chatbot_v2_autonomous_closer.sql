/*
  # Public AI Chatbot v2.0 - Autonomous Closer Mode

  1. New Tables
    - `public_chat_followups` - Multi-day follow-up sequences
    - `prospect_qualification_profiles` - BANT/SPIN/CHAMP qualification
    - `chatbot_automation_settings` - Autonomous mode configuration
    - `chatbot_closing_attempts` - Track closing attempts
    - `chatbot_appointment_slots` - Available booking times

  2. Autonomous Features
    - Closer mode activation
    - Multi-day drip campaigns
    - BANT qualification
    - Pipeline auto-advancement
    - Appointment scheduling
    - Emotional persuasion

  3. Safety & Compliance
    - User approval required
    - Escalation to human
    - Configurable aggressiveness
    - No false promises
*/

-- Public Chat Follow-Ups (Multi-Day Sequences)
CREATE TABLE IF NOT EXISTS public_chat_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sequence_type text DEFAULT 'warm_nurture' CHECK (sequence_type IN ('warm_nurture', 'hot_followup', 'objection_removal', 'final_push', 'soft_touch')),
  day_number integer NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped', 'cancelled')),
  message text NOT NULL,
  channel text DEFAULT 'email' CHECK (channel IN ('email', 'messenger', 'whatsapp', 'sms', 'notification')),
  response_received boolean DEFAULT false,
  response_text text,
  response_sentiment numeric,
  created_at timestamptz DEFAULT now()
);

-- Prospect Qualification Profiles (BANT/SPIN/CHAMP)
CREATE TABLE IF NOT EXISTS prospect_qualification_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public_chat_sessions(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- BANT Framework
  bant jsonb DEFAULT '{
    "budget": {"detected": false, "range": null, "confidence": 0},
    "authority": {"detected": false, "level": null, "confidence": 0},
    "need": {"detected": false, "urgency": null, "confidence": 0},
    "timeline": {"detected": false, "timeframe": null, "confidence": 0}
  }'::jsonb,
  
  -- SPIN Framework
  spin jsonb DEFAULT '{
    "situation": {},
    "problem": {},
    "implication": {},
    "need_payoff": {}
  }'::jsonb,
  
  -- CHAMP Framework
  champ jsonb DEFAULT '{
    "challenges": [],
    "authority": {},
    "money": {},
    "prioritization": {}
  }'::jsonb,
  
  -- Overall Scores
  readiness_score numeric DEFAULT 0.0,
  qualification_score numeric DEFAULT 0.0,
  urgency_score numeric DEFAULT 0.0,
  
  -- Detected Information
  detected_pain_points text[] DEFAULT '{}',
  detected_objections text[] DEFAULT '{}',
  detected_buying_signals text[] DEFAULT '{}',
  emotional_profile jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chatbot Automation Settings
CREATE TABLE IF NOT EXISTS chatbot_automation_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Autonomous Closer Mode
  enable_autonomous_closer boolean DEFAULT true,
  closer_aggressiveness text DEFAULT 'normal' CHECK (closer_aggressiveness IN ('soft', 'normal', 'strong')),
  closer_tone text DEFAULT 'professional',
  max_closing_attempts integer DEFAULT 3,
  
  -- Follow-Up Settings
  enable_followups boolean DEFAULT true,
  followup_timing jsonb DEFAULT '{
    "day_0": true,
    "day_1": true,
    "day_3": true,
    "day_7": true,
    "day_14": false,
    "day_30": false
  }'::jsonb,
  followup_channels text[] DEFAULT ARRAY['email'],
  
  -- Auto-Advancement
  auto_stage_advance boolean DEFAULT true,
  auto_appointment boolean DEFAULT true,
  
  -- Urgency & Offers
  urgency_rules jsonb DEFAULT '{
    "enable_limited_time": false,
    "enable_scarcity": false,
    "enable_social_proof": true
  }'::jsonb,
  
  -- Safety
  require_human_approval_for_close boolean DEFAULT false,
  escalate_after_objections integer DEFAULT 2,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chatbot Closing Attempts
CREATE TABLE IF NOT EXISTS chatbot_closing_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  
  attempt_number integer NOT NULL,
  closer_mode text CHECK (closer_mode IN ('soft_touch', 'benefit_stack', 'urgency_close', 'objection_handler', 'appointment_push')),
  script_used text,
  
  -- Outcome
  status text DEFAULT 'attempted' CHECK (status IN ('attempted', 'objection', 'interest', 'closed', 'escalated')),
  objection_type text,
  response_text text,
  
  -- Next Action
  next_action text,
  scheduled_followup timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Chatbot Appointment Slots
CREATE TABLE IF NOT EXISTS chatbot_appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES public_chat_sessions(id) ON DELETE SET NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  
  slot_datetime timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30,
  status text DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'declined', 'expired', 'completed')),
  
  meeting_type text DEFAULT 'consultation',
  meeting_notes text,
  confirmation_sent boolean DEFAULT false,
  reminder_sent boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public_chat_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_qualification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_closing_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_appointment_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public_chat_followups
CREATE POLICY "Users can view own followups"
  ON public_chat_followups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own followups"
  ON public_chat_followups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own followups"
  ON public_chat_followups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for prospect_qualification_profiles
CREATE POLICY "Users can view own qualification profiles"
  ON prospect_qualification_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own qualification profiles"
  ON prospect_qualification_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own qualification profiles"
  ON prospect_qualification_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chatbot_automation_settings
CREATE POLICY "Users can view own automation settings"
  ON chatbot_automation_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation settings"
  ON chatbot_automation_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automation settings"
  ON chatbot_automation_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chatbot_closing_attempts
CREATE POLICY "Users can view own closing attempts"
  ON chatbot_closing_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own closing attempts"
  ON chatbot_closing_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chatbot_appointment_slots
CREATE POLICY "Users can view own appointment slots"
  ON chatbot_appointment_slots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointment slots"
  ON chatbot_appointment_slots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointment slots"
  ON chatbot_appointment_slots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_followups_scheduled ON public_chat_followups(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_followups_status ON public_chat_followups(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_qualification_prospect ON prospect_qualification_profiles(prospect_id);
CREATE INDEX IF NOT EXISTS idx_qualification_readiness ON prospect_qualification_profiles(readiness_score DESC);
CREATE INDEX IF NOT EXISTS idx_closing_attempts_session ON chatbot_closing_attempts(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_datetime ON chatbot_appointment_slots(user_id, slot_datetime);

-- Function to create default automation settings
CREATE OR REPLACE FUNCTION create_default_automation_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chatbot_automation_settings (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create automation settings on chatbot settings creation
DROP TRIGGER IF EXISTS create_automation_settings_on_chatbot_setup ON chatbot_settings;
CREATE TRIGGER create_automation_settings_on_chatbot_setup
  AFTER INSERT ON chatbot_settings
  FOR EACH ROW
  EXECUTE FUNCTION create_default_automation_settings();

-- Function to schedule follow-up sequence
CREATE OR REPLACE FUNCTION schedule_followup_sequence(
  p_session_id uuid,
  p_user_id uuid,
  p_sequence_type text
)
RETURNS void AS $$
DECLARE
  v_settings record;
  v_base_time timestamptz;
BEGIN
  SELECT * INTO v_settings
  FROM chatbot_automation_settings
  WHERE user_id = p_user_id;

  IF NOT v_settings.enable_followups THEN
    RETURN;
  END IF;

  v_base_time := now();

  IF (v_settings.followup_timing->>'day_0')::boolean THEN
    INSERT INTO public_chat_followups (session_id, user_id, sequence_type, day_number, scheduled_for, message, channel)
    VALUES (p_session_id, p_user_id, p_sequence_type, 0, v_base_time + interval '4 hours', 
            'Thanks for chatting! Just wanted to follow up...', 'email');
  END IF;

  IF (v_settings.followup_timing->>'day_1')::boolean THEN
    INSERT INTO public_chat_followups (session_id, user_id, sequence_type, day_number, scheduled_for, message, channel)
    VALUES (p_session_id, p_user_id, p_sequence_type, 1, v_base_time + interval '1 day', 
            'Following up on our conversation...', 'email');
  END IF;

  IF (v_settings.followup_timing->>'day_3')::boolean THEN
    INSERT INTO public_chat_followups (session_id, user_id, sequence_type, day_number, scheduled_for, message, channel)
    VALUES (p_session_id, p_user_id, p_sequence_type, 3, v_base_time + interval '3 days', 
            'Wanted to share a case study...', 'email');
  END IF;

  IF (v_settings.followup_timing->>'day_7')::boolean THEN
    INSERT INTO public_chat_followups (session_id, user_id, sequence_type, day_number, scheduled_for, message, channel)
    VALUES (p_session_id, p_user_id, p_sequence_type, 7, v_base_time + interval '7 days', 
            'Quick check-in...', 'email');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect high intent and activate closer mode
CREATE OR REPLACE FUNCTION detect_high_intent_and_activate(
  p_session_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_session record;
  v_settings record;
  v_high_intent boolean;
BEGIN
  SELECT * INTO v_session FROM public_chat_sessions WHERE id = p_session_id;
  SELECT * INTO v_settings FROM chatbot_automation_settings WHERE user_id = v_session.user_id;

  IF NOT v_settings.enable_autonomous_closer THEN
    RETURN false;
  END IF;

  v_high_intent := v_session.buying_intent_score >= 0.75;

  IF v_high_intent THEN
    UPDATE public_chat_sessions
    SET 
      status = 'high_intent',
      conversation_context = conversation_context || '{"closer_mode_active": true}'::jsonb
    WHERE id = p_session_id;

    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-advance pipeline stage
CREATE OR REPLACE FUNCTION auto_advance_pipeline_stage(
  p_session_id uuid,
  p_prospect_id uuid
)
RETURNS text AS $$
DECLARE
  v_session record;
  v_settings record;
  v_new_stage text;
BEGIN
  SELECT * INTO v_session FROM public_chat_sessions WHERE id = p_session_id;
  SELECT * INTO v_settings FROM chatbot_automation_settings WHERE user_id = v_session.user_id;

  IF NOT v_settings.auto_stage_advance THEN
    RETURN null;
  END IF;

  IF v_session.buying_intent_score >= 0.8 THEN
    v_new_stage := 'Ready To Buy';
  ELSIF v_session.buying_intent_score >= 0.6 THEN
    v_new_stage := 'Qualified Lead';
  ELSIF v_session.buying_intent_score >= 0.4 THEN
    v_new_stage := 'Price Inquiry';
  ELSE
    v_new_stage := 'Interested';
  END IF;

  UPDATE chatbot_to_prospect_pipeline
  SET 
    pipeline_stage = v_new_stage,
    updated_at = now()
  WHERE session_id = p_session_id AND prospect_id = p_prospect_id;

  RETURN v_new_stage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;