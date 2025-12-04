/*
  # Public AI Chatbot v4.0 - AI-Human Collaboration System

  1. New Tables
    - `human_takeover_sessions` - Track AI→Human handoffs
    - `ai_drafted_messages` - AI suggests replies (Co-Pilot mode)
    - `coaching_feedback` - AI coaches human performance
    - `conversation_analytics` - Deep conversation analysis
    - `persona_learning_samples` - Learn from human messages
    - `channel_queue_state` - Multi-channel queue management
    - `escalation_rules` - Smart escalation logic
    - `handoff_triggers` - Detect when to handoff to human

  2. AI-Human Collaboration Features
    - Seamless AI↔Human handoff
    - Real-time AI suggestions (Co-Pilot)
    - Shared mode (both active)
    - Post-conversation coaching
    - Persona learning from humans
    - Unified omni-channel inbox

  3. Safety & Compliance
    - Auto-handoff for sensitive topics
    - Human approval for aggressive scripts
    - Data masking
    - Audit trail
*/

-- Human Takeover Sessions
CREATE TABLE IF NOT EXISTS human_takeover_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  
  -- Takeover Details
  status text NOT NULL DEFAULT 'ai' CHECK (status IN ('ai', 'human', 'handoff', 'shared', 'ai_supervised')),
  previous_status text,
  
  -- Handoff Reason
  handoff_reason text,
  trigger_type text CHECK (trigger_type IN (
    'customer_request', 'frustration_detected', 'high_intent', 
    'knowledge_gap', 'low_confidence', 'complex_pricing', 
    'legal_sensitive', 'manual_override', 'scheduled'
  )),
  
  -- AI Analysis
  ai_confidence_at_handoff numeric,
  buying_intent_at_handoff numeric,
  frustration_level numeric,
  urgency_level text CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Suggested Response
  ai_suggested_response text,
  ai_context_summary text,
  key_points jsonb DEFAULT '[]'::jsonb,
  
  -- Timing
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  total_duration_seconds integer,
  
  -- Performance
  messages_by_human integer DEFAULT 0,
  messages_by_ai integer DEFAULT 0,
  handoff_count integer DEFAULT 1,
  
  -- Outcome
  outcome text CHECK (outcome IN ('converted', 'qualified', 'nurture', 'lost', 'ongoing')),
  outcome_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Drafted Messages (Co-Pilot)
CREATE TABLE IF NOT EXISTS ai_drafted_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  
  -- Draft Variations
  draft_friendly text,
  draft_persuasive text,
  draft_closing text,
  
  -- Confidence & Recommendations
  confidence numeric DEFAULT 0.0,
  recommended_tone text DEFAULT 'friendly',
  recommended_action text,
  
  -- Context
  conversation_context jsonb DEFAULT '{}'::jsonb,
  detected_intent text,
  detected_emotion text,
  buying_signals text[] DEFAULT '{}',
  objections_detected text[] DEFAULT '{}',
  
  -- Selection Tracking
  selected_draft text,
  was_edited boolean DEFAULT false,
  final_message_sent text,
  
  -- Outcome
  response_received boolean DEFAULT false,
  response_sentiment numeric,
  effectiveness_score numeric,
  
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

-- Coaching Feedback
CREATE TABLE IF NOT EXISTS coaching_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid NOT NULL,
  message_id uuid,
  
  -- Overall Score
  overall_score numeric NOT NULL,
  
  -- Dimension Scores
  empathy_score numeric DEFAULT 0.0,
  persuasion_score numeric DEFAULT 0.0,
  objection_handling_score numeric DEFAULT 0.0,
  clarity_score numeric DEFAULT 0.0,
  professionalism_score numeric DEFAULT 0.0,
  company_alignment_score numeric DEFAULT 0.0,
  
  -- Feedback
  strengths text[] DEFAULT '{}',
  weaknesses text[] DEFAULT '{}',
  missed_opportunities text[] DEFAULT '{}',
  improvement_tips text[] DEFAULT '{}',
  
  -- Detailed Analysis
  feedback_text text,
  key_moments jsonb DEFAULT '[]'::jsonb,
  best_messages text[] DEFAULT '{}',
  worst_messages text[] DEFAULT '{}',
  
  -- Recommendations
  recommended_practice text,
  suggested_scripts text[] DEFAULT '{}',
  learning_resources text[] DEFAULT '{}',
  
  -- Conversation Metrics
  total_messages integer DEFAULT 0,
  response_time_avg_seconds numeric,
  conversion_result boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- Conversation Analytics
CREATE TABLE IF NOT EXISTS conversation_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  
  -- Timeline
  started_at timestamptz,
  ended_at timestamptz,
  total_duration_seconds integer,
  
  -- Message Stats
  total_messages integer DEFAULT 0,
  messages_by_visitor integer DEFAULT 0,
  messages_by_ai integer DEFAULT 0,
  messages_by_human integer DEFAULT 0,
  
  -- Engagement Metrics
  avg_response_time_seconds numeric,
  longest_gap_seconds integer,
  visitor_engagement_score numeric DEFAULT 0.0,
  
  -- AI Performance
  ai_accuracy_score numeric DEFAULT 0.0,
  ai_handoff_count integer DEFAULT 0,
  ai_confidence_avg numeric DEFAULT 0.0,
  
  -- Human Performance
  human_response_speed_score numeric DEFAULT 0.0,
  human_empathy_score numeric DEFAULT 0.0,
  human_closing_effectiveness numeric DEFAULT 0.0,
  
  -- Conversation Quality
  sentiment_journey jsonb DEFAULT '[]'::jsonb,
  emotional_peaks jsonb DEFAULT '[]'::jsonb,
  buying_signals_detected text[] DEFAULT '{}',
  objections_raised text[] DEFAULT '{}',
  objections_resolved text[] DEFAULT '{}',
  
  -- Outcome
  final_stage text,
  conversion_achieved boolean DEFAULT false,
  appointment_booked boolean DEFAULT false,
  follow_up_scheduled boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- Persona Learning Samples
CREATE TABLE IF NOT EXISTS persona_learning_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Source
  source_session_id uuid,
  source_message_id uuid,
  sample_type text CHECK (sample_type IN ('greeting', 'objection_response', 'closing', 'question', 'empathy', 'follow_up')),
  
  -- Content
  original_message text NOT NULL,
  cleaned_message text,
  
  -- Context
  context_before text,
  context_after text,
  visitor_emotion text,
  conversation_stage text,
  
  -- Quality
  effectiveness_score numeric DEFAULT 0.0,
  led_to_conversion boolean DEFAULT false,
  visitor_response_positive boolean,
  
  -- Learning Metadata
  tone_category text,
  language_style text,
  key_phrases text[] DEFAULT '{}',
  
  -- Usage
  times_referenced integer DEFAULT 0,
  last_used_at timestamptz,
  
  -- Status
  approved boolean DEFAULT true,
  is_template boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- Channel Queue State
CREATE TABLE IF NOT EXISTS channel_queue_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Channel Info
  channel text NOT NULL CHECK (channel IN ('web', 'messenger', 'whatsapp', 'sms', 'viber', 'instagram', 'email', 'telegram')),
  session_id uuid NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  
  -- Queue Position
  priority_score numeric DEFAULT 0.0,
  wait_time_seconds integer DEFAULT 0,
  
  -- Status
  queue_status text DEFAULT 'waiting' CHECK (queue_status IN ('waiting', 'active', 'snoozed', 'resolved', 'escalated')),
  assigned_to text DEFAULT 'ai',
  
  -- Urgency Factors
  buying_intent_score numeric DEFAULT 0.0,
  frustration_level numeric DEFAULT 0.0,
  wait_threshold_seconds integer,
  requires_human boolean DEFAULT false,
  
  -- Last Activity
  last_message_at timestamptz,
  last_response_by text,
  
  -- Metadata
  unread_count integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, session_id)
);

-- Escalation Rules
CREATE TABLE IF NOT EXISTS escalation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Rule Details
  rule_name text NOT NULL,
  rule_type text CHECK (rule_type IN (
    'frustration_threshold', 'buying_intent_threshold', 
    'time_based', 'knowledge_gap', 'keyword_trigger',
    'confidence_threshold', 'message_count', 'channel_switch'
  )),
  
  -- Conditions
  trigger_condition jsonb NOT NULL,
  priority integer DEFAULT 50,
  
  -- Actions
  action_type text CHECK (action_type IN (
    'handoff_to_human', 'send_notification', 'switch_channel',
    'send_followup', 'adjust_tone', 'offer_discount', 
    'book_appointment', 'escalate_supervisor'
  )),
  action_config jsonb DEFAULT '{}'::jsonb,
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Performance
  times_triggered integer DEFAULT 0,
  success_rate numeric DEFAULT 0.0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Handoff Triggers
CREATE TABLE IF NOT EXISTS handoff_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid NOT NULL,
  
  -- Trigger Details
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'customer_request', 'frustration_detected', 'high_intent',
    'knowledge_gap', 'low_confidence', 'complex_pricing',
    'legal_sensitive', 'profanity_detected', 'escalation_rule'
  )),
  
  -- Analysis
  confidence_score numeric NOT NULL,
  urgency_level text NOT NULL,
  
  -- Context
  triggering_message text,
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  recommended_approach text,
  
  -- Response
  handoff_executed boolean DEFAULT false,
  executed_at timestamptz,
  human_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE human_takeover_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_drafted_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_learning_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_queue_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for human_takeover_sessions
CREATE POLICY "Users can view own takeover sessions"
  ON human_takeover_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own takeover sessions"
  ON human_takeover_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own takeover sessions"
  ON human_takeover_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_drafted_messages
CREATE POLICY "Users can view own drafted messages"
  ON ai_drafted_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drafted messages"
  ON ai_drafted_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafted messages"
  ON ai_drafted_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for coaching_feedback
CREATE POLICY "Users can view own coaching"
  ON coaching_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coaching"
  ON coaching_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for conversation_analytics
CREATE POLICY "Users can view own analytics"
  ON conversation_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON conversation_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON conversation_analytics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for persona_learning_samples
CREATE POLICY "Users can view own learning samples"
  ON persona_learning_samples FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning samples"
  ON persona_learning_samples FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning samples"
  ON persona_learning_samples FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for channel_queue_state
CREATE POLICY "Users can view own queue"
  ON channel_queue_state FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue"
  ON channel_queue_state FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue"
  ON channel_queue_state FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for escalation_rules
CREATE POLICY "Users can view own rules"
  ON escalation_rules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rules"
  ON escalation_rules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rules"
  ON escalation_rules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rules"
  ON escalation_rules FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for handoff_triggers
CREATE POLICY "Users can view own triggers"
  ON handoff_triggers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own triggers"
  ON handoff_triggers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_takeover_session ON human_takeover_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_takeover_status ON human_takeover_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_takeover_time ON human_takeover_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_drafted_session ON ai_drafted_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_drafted_prospect ON ai_drafted_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_drafted_time ON ai_drafted_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coaching_user ON coaching_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coaching_session ON coaching_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_score ON coaching_feedback(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_session ON conversation_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON conversation_analytics(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_persona_type ON persona_learning_samples(user_id, sample_type);
CREATE INDEX IF NOT EXISTS idx_persona_quality ON persona_learning_samples(effectiveness_score DESC);

CREATE INDEX IF NOT EXISTS idx_queue_status ON channel_queue_state(user_id, queue_status);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON channel_queue_state(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_queue_channel ON channel_queue_state(channel, queue_status);

CREATE INDEX IF NOT EXISTS idx_rules_active ON escalation_rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rules_type ON escalation_rules(rule_type);

CREATE INDEX IF NOT EXISTS idx_triggers_session ON handoff_triggers(session_id);
CREATE INDEX IF NOT EXISTS idx_triggers_type ON handoff_triggers(trigger_type, created_at DESC);

-- Function: Detect handoff triggers
CREATE OR REPLACE FUNCTION detect_handoff_trigger(
  p_user_id uuid,
  p_session_id uuid,
  p_message text,
  p_ai_confidence numeric,
  p_frustration_level numeric,
  p_buying_intent numeric
)
RETURNS jsonb AS $$
DECLARE
  v_should_handoff boolean := false;
  v_trigger_type text;
  v_urgency text := 'low';
  v_reason text;
BEGIN
  -- Customer explicitly requests human
  IF p_message ~* '(talk to|speak with|connect me|real person|human|agent|representative)' THEN
    v_should_handoff := true;
    v_trigger_type := 'customer_request';
    v_urgency := 'high';
    v_reason := 'Customer requested human agent';
  
  -- High frustration
  ELSIF p_frustration_level >= 0.7 THEN
    v_should_handoff := true;
    v_trigger_type := 'frustration_detected';
    v_urgency := 'high';
    v_reason := 'High frustration level detected';
  
  -- Very high buying intent
  ELSIF p_buying_intent >= 0.85 THEN
    v_should_handoff := true;
    v_trigger_type := 'high_intent';
    v_urgency := 'critical';
    v_reason := 'Very high buying intent - close the deal';
  
  -- Low AI confidence
  ELSIF p_ai_confidence < 0.60 THEN
    v_should_handoff := true;
    v_trigger_type := 'low_confidence';
    v_urgency := 'medium';
    v_reason := 'AI confidence too low';
  
  -- Complex pricing questions
  ELSIF p_message ~* '(discount|negotiate|payment plan|custom pricing|enterprise|bulk)' THEN
    v_should_handoff := true;
    v_trigger_type := 'complex_pricing';
    v_urgency := 'medium';
    v_reason := 'Complex pricing negotiation detected';
  
  -- Legal or sensitive
  ELSIF p_message ~* '(legal|contract|lawyer|sue|complaint|refund|cancel|gdpr|privacy)' THEN
    v_should_handoff := true;
    v_trigger_type := 'legal_sensitive';
    v_urgency := 'high';
    v_reason := 'Legal or sensitive topic detected';
  END IF;

  -- Log the trigger if handoff should happen
  IF v_should_handoff THEN
    INSERT INTO handoff_triggers (
      user_id, session_id, trigger_type, confidence_score,
      urgency_level, triggering_message
    ) VALUES (
      p_user_id, p_session_id, v_trigger_type, p_ai_confidence,
      v_urgency, p_message
    );
  END IF;

  RETURN jsonb_build_object(
    'should_handoff', v_should_handoff,
    'trigger_type', v_trigger_type,
    'urgency', v_urgency,
    'reason', v_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Generate AI co-pilot suggestions
CREATE OR REPLACE FUNCTION generate_copilot_suggestions(
  p_user_id uuid,
  p_session_id uuid,
  p_conversation_context jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_draft_id uuid;
  v_friendly text := 'Hi! Thanks for your message. Let me help you with that.';
  v_persuasive text := 'Great question! Here''s why this is perfect for you...';
  v_closing text := 'Sounds good! Shall we move forward with this? I can get you started today.';
BEGIN
  -- Insert AI drafted suggestions
  INSERT INTO ai_drafted_messages (
    user_id, session_id,
    draft_friendly, draft_persuasive, draft_closing,
    confidence, recommended_tone, conversation_context
  ) VALUES (
    p_user_id, p_session_id,
    v_friendly, v_persuasive, v_closing,
    0.8, 'friendly', p_conversation_context
  )
  RETURNING id INTO v_draft_id;

  RETURN jsonb_build_object(
    'draft_id', v_draft_id,
    'friendly', v_friendly,
    'persuasive', v_persuasive,
    'closing', v_closing,
    'recommended', 'friendly'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate coaching scores
CREATE OR REPLACE FUNCTION calculate_coaching_score(
  p_user_id uuid,
  p_session_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_overall_score numeric;
  v_empathy numeric := 0.7;
  v_persuasion numeric := 0.6;
  v_objection numeric := 0.8;
  v_clarity numeric := 0.9;
  v_professionalism numeric := 0.85;
  v_alignment numeric := 0.75;
BEGIN
  -- Calculate weighted average
  v_overall_score := (
    v_empathy * 0.20 +
    v_persuasion * 0.20 +
    v_objection * 0.20 +
    v_clarity * 0.15 +
    v_professionalism * 0.15 +
    v_alignment * 0.10
  ) * 100;

  -- Insert coaching feedback
  INSERT INTO coaching_feedback (
    user_id, session_id,
    overall_score, empathy_score, persuasion_score,
    objection_handling_score, clarity_score, 
    professionalism_score, company_alignment_score,
    strengths, weaknesses, improvement_tips
  ) VALUES (
    p_user_id, p_session_id,
    v_overall_score, v_empathy * 100, v_persuasion * 100,
    v_objection * 100, v_clarity * 100,
    v_professionalism * 100, v_alignment * 100,
    ARRAY['Warm and empathetic tone', 'Clear communication'],
    ARRAY['Weak call-to-action', 'Missed buying signal'],
    ARRAY['Use more direct closing questions', 'Respond faster to buying signals']
  );

  RETURN jsonb_build_object(
    'overall_score', v_overall_score,
    'empathy', v_empathy * 100,
    'persuasion', v_persuasion * 100,
    'objection_handling', v_objection * 100,
    'clarity', v_clarity * 100,
    'professionalism', v_professionalism * 100
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update queue priority
CREATE OR REPLACE FUNCTION update_queue_priority(
  p_user_id uuid,
  p_session_id uuid,
  p_buying_intent numeric,
  p_frustration numeric,
  p_wait_seconds integer
)
RETURNS void AS $$
DECLARE
  v_priority numeric;
BEGIN
  -- Calculate priority score (0-1)
  v_priority := (
    (p_buying_intent * 0.4) +
    (p_frustration * 0.3) +
    (LEAST(p_wait_seconds / 300.0, 1.0) * 0.3)
  );

  INSERT INTO channel_queue_state (
    user_id, session_id, priority_score,
    buying_intent_score, frustration_level, wait_time_seconds
  ) VALUES (
    p_user_id, p_session_id, v_priority,
    p_buying_intent, p_frustration, p_wait_seconds
  )
  ON CONFLICT (user_id, session_id) DO UPDATE
  SET
    priority_score = v_priority,
    buying_intent_score = p_buying_intent,
    frustration_level = p_frustration,
    wait_time_seconds = p_wait_seconds,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Learn from human message
CREATE OR REPLACE FUNCTION learn_from_human_message(
  p_user_id uuid,
  p_session_id uuid,
  p_message text,
  p_sample_type text,
  p_effectiveness numeric DEFAULT 0.8
)
RETURNS uuid AS $$
DECLARE
  v_sample_id uuid;
BEGIN
  INSERT INTO persona_learning_samples (
    user_id, source_session_id, sample_type,
    original_message, effectiveness_score
  ) VALUES (
    p_user_id, p_session_id, p_sample_type,
    p_message, p_effectiveness
  )
  RETURNING id INTO v_sample_id;

  RETURN v_sample_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;