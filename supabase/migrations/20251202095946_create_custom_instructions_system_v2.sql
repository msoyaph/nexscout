/*
  # Custom Instructions System v2

  1. New Tables
    - `custom_instructions` - User custom AI behavior instructions
    - `persona_templates` - Pre-built persona prompt templates  
    - `objection_handling_library` - Sales objection response templates
    - `intent_detection_logs` - Intent detection analytics
    - `consistency_warnings` - System conflict warnings
    - `lead_temperature_scores` - ML-based lead scoring

  2. Security
    - Enable RLS on all tables
    - Users manage own instructions
    - Public read for templates
*/

-- Custom Instructions
CREATE TABLE IF NOT EXISTS custom_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  instruction_type text NOT NULL,
  content text NOT NULL,
  priority integer DEFAULT 100,
  is_active boolean DEFAULT true,
  applies_to text[] DEFAULT ARRAY['all'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Persona Templates
CREATE TABLE IF NOT EXISTS persona_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_type text NOT NULL,
  template_category text NOT NULL,
  template_name text NOT NULL,
  template_content text NOT NULL,
  language text DEFAULT 'en',
  industry text,
  success_rate decimal(3,2),
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Objection Handling Library
CREATE TABLE IF NOT EXISTS objection_handling_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objection_type text NOT NULL,
  response_template text NOT NULL,
  follow_up_template text,
  persona_type text,
  industry text,
  language text DEFAULT 'en',
  success_rate decimal(3,2),
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Intent Detection Logs
CREATE TABLE IF NOT EXISTS intent_detection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  message_content text NOT NULL,
  detected_intent text NOT NULL,
  confidence_score decimal(3,2),
  selected_persona text NOT NULL,
  signals jsonb,
  created_at timestamptz DEFAULT now()
);

-- Consistency Warnings
CREATE TABLE IF NOT EXISTS consistency_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  warning_type text NOT NULL,
  severity text NOT NULL,
  warning_message text NOT NULL,
  custom_instruction_id uuid REFERENCES custom_instructions,
  resolution_status text DEFAULT 'unresolved',
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Lead Temperature Scores
CREATE TABLE IF NOT EXISTS lead_temperature_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  prospect_id uuid REFERENCES prospects NOT NULL,
  temperature text NOT NULL,
  score integer CHECK (score >= 0 AND score <= 100),
  signals jsonb NOT NULL,
  recommended_next_step text,
  reasons text[],
  calculated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ci_user ON custom_instructions(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pt_type ON persona_templates(persona_type, template_category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_oh_type ON objection_handling_library(objection_type, persona_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_il_user ON intent_detection_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cw_user ON consistency_warnings(user_id, resolution_status);
CREATE INDEX IF NOT EXISTS idx_lt_prospect ON lead_temperature_scores(prospect_id, calculated_at DESC);

-- Enable RLS
ALTER TABLE custom_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE objection_handling_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consistency_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_temperature_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "ci_select" ON custom_instructions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ci_insert" ON custom_instructions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ci_update" ON custom_instructions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ci_delete" ON custom_instructions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "pt_select" ON persona_templates FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "oh_select" ON objection_handling_library FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "il_select" ON intent_detection_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "il_insert" ON intent_detection_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cw_select" ON consistency_warnings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "cw_insert" ON consistency_warnings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lt_select" ON lead_temperature_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "lt_insert" ON lead_temperature_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Seed persona templates
INSERT INTO persona_templates (persona_type, template_category, template_name, template_content, language, industry) VALUES
  ('sales', 'base_prompt', 'Sales Agent AI', 'You are SALES AGENT AI. Your job is to qualify the user and move them toward a clear next step. Tone: Friendly, helpful, persuasive. Style: Short sentences. Easy to read. Filipino + English mix. Goal: Increase likelihood of reply and booking a meeting.', 'en', 'general'),
  ('mlmLeader', 'base_prompt', 'Upline Coach AI', 'You are UPLINE COACH AI. Your goal is to motivate, guide, and teach the user how to succeed. Tone: energetic, inspiring, practical. Rules: Give simple steps, Encourage action, Tie advice back to user goals.', 'en', 'mlm'),
  ('support', 'base_prompt', 'Customer Support AI', 'You are SUPPORT AI for our brand. Goal: Solve the user issue quickly with empathy. Tone: Warm, respectful, patient. Provide step-by-step instructions and confirm if solution worked.', 'en', 'general'),
  ('pastor', 'base_prompt', 'Pastor AI', 'You are PASTOR AI. Tone: compassionate, encouraging, Bible-guided. Goal: provide spiritual comfort, clarity, and hope. Always start with empathy and share 1 relevant Bible verse.', 'en', 'general'),
  ('productExpert', 'base_prompt', 'Product Expert AI', 'You are PRODUCT EXPERT AI. Your goal is to educate and demonstrate value. Tone: Knowledgeable, helpful, clear. Always answer questions thoroughly and suggest best-fit solutions.', 'en', 'general');

-- Seed objection handling
INSERT INTO objection_handling_library (objection_type, response_template, follow_up_template, persona_type, language) VALUES
  ('no_money', 'I understand your concern. Many people felt the same at first, but after seeing the value and results, they realized it was worth it.', 'Quick question—what is the main outcome you want to achieve?', 'sales', 'en'),
  ('no_time', 'Totally fair.', 'Just so I can guide you properly—what part do you want more clarity on?', 'sales', 'en'),
  ('not_now', 'No problem! When would be a better time for you?', 'Want me to follow up with you then?', 'sales', 'en'),
  ('already_tried', 'Got you. What exactly happened previously?', 'Let me show you how this one is simpler and more effective.', 'sales', 'en'),
  ('is_this_legit', 'Yes, absolutely legit.', 'Lets clarify what you are looking for — extra income, full-time income, or product benefits?', 'mlmLeader', 'en'),
  ('price_too_high', 'I get it. Many felt the same initially.', 'What if I showed you payment options that fit your budget?', 'sales', 'en'),
  ('skeptic', 'I understand the hesitation. That is smart.', 'What would help you feel more confident about moving forward?', 'sales', 'en'),
  ('thinking_about_it', 'That makes sense. Take your time.', 'What factors are you considering most?', 'sales', 'en'),
  ('busy', 'I completely understand.', 'Would a quick 5-minute call work better for you?', 'sales', 'en'),
  ('needs_approval', 'Makes sense.', 'What information would help the decision-maker feel comfortable?', 'sales', 'en');