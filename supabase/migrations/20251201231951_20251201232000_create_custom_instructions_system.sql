/*
  # Custom Instructions System - Unified Intelligence Architecture v3.0

  1. Intelligence Hierarchy
    User Custom Instructions (highest priority)
    ↓ Company/Product Data
    ↓ Team Data Feeds
    ↓ Enterprise Master Feeds
    ↓ Automatic Intelligence (Crawler + SIFE)
    ↓ Default Global Intelligence

  2. Tables
    - `custom_instructions` - User-specific AI behavior overrides
    - `team_custom_instructions` - Team-level defaults
    - `enterprise_custom_instructions` - Enterprise-level defaults
    - `custom_instruction_conflicts` - Track and warn about conflicts
    - `custom_instruction_performance` - ML tracking of what works

  Custom instructions affect:
  - Chatbot tone & persona
  - Product descriptions & scripts
  - Company messaging & values
  - Pitch deck style
  - Follow-up sequences
  - AI behavior patterns
*/

-- =====================================================
-- CUSTOM INSTRUCTIONS (User Level)
-- =====================================================

CREATE TABLE IF NOT EXISTS custom_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Tone & Persona
  tone text, -- 'professional', 'friendly', 'casual', 'christian', 'consultative'
  persona text, -- 'coach', 'advisor', 'friend', 'expert', 'salesman'
  selling_style text, -- 'soft_sell', 'hard_close', 'educational', 'relationship_based'
  
  -- Communication Rules
  forbidden_phrases text[], -- Words/phrases to never use
  required_phrases text[], -- Words/phrases to always include
  preferred_language text DEFAULT 'taglish', -- 'english', 'tagalog', 'taglish'
  formality_level text DEFAULT 'balanced', -- 'formal', 'casual', 'balanced'
  
  -- AI Behavior Overrides
  ai_behavior_overrides jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "aggressiveness": "low",
  --   "empathy_level": "high",
  --   "questioning_style": "exploratory",
  --   "pressure_tactics": "none"
  -- }
  
  -- Chatbot Specific
  chatbot_overrides jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "greeting_style": "warm",
  --   "closing_style": "soft",
  --   "objection_handling": "empathetic",
  --   "pace": "conversational"
  -- }
  
  -- Product Overrides
  custom_product_data jsonb DEFAULT '{}'::jsonb,
  -- Override auto-generated product descriptions
  
  -- Company Overrides
  custom_company_data jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "mission": "custom mission",
  --   "values": ["value1", "value2"],
  --   "brand_voice": "empowering"
  -- }
  
  -- Script Overrides
  pitch_script_overrides jsonb DEFAULT '{}'::jsonb,
  message_template_overrides jsonb DEFAULT '{}'::jsonb,
  
  -- Priority Rules
  priority_rules jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "prioritize_relationship_over_speed": true,
  --   "prioritize_education_over_selling": true,
  --   "allow_ml_optimization": true
  -- }
  
  -- Status
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_instructions_user ON custom_instructions(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_custom_instructions_tone ON custom_instructions(tone);

-- =====================================================
-- TEAM CUSTOM INSTRUCTIONS (Team Defaults)
-- =====================================================

CREATE TABLE IF NOT EXISTS team_custom_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL, -- References team
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Same fields as custom_instructions
  tone text,
  persona text,
  selling_style text,
  forbidden_phrases text[],
  required_phrases text[],
  preferred_language text DEFAULT 'taglish',
  
  ai_behavior_overrides jsonb DEFAULT '{}'::jsonb,
  chatbot_overrides jsonb DEFAULT '{}'::jsonb,
  custom_product_data jsonb DEFAULT '{}'::jsonb,
  custom_company_data jsonb DEFAULT '{}'::jsonb,
  
  -- Team-specific
  apply_to_all_members boolean DEFAULT true,
  allow_member_overrides boolean DEFAULT true,
  
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_instructions_team ON team_custom_instructions(team_id);

-- =====================================================
-- ENTERPRISE CUSTOM INSTRUCTIONS (Enterprise Defaults)
-- =====================================================

CREATE TABLE IF NOT EXISTS enterprise_custom_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id uuid NOT NULL, -- References enterprise account
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  tone text,
  persona text,
  selling_style text,
  forbidden_phrases text[],
  required_phrases text[],
  
  ai_behavior_overrides jsonb DEFAULT '{}'::jsonb,
  chatbot_overrides jsonb DEFAULT '{}'::jsonb,
  
  -- Enterprise master data
  master_company_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  master_product_catalog jsonb DEFAULT '{}'::jsonb,
  compliance_rules jsonb DEFAULT '{}'::jsonb,
  
  -- Authority
  enforce_globally boolean DEFAULT true,
  allow_team_overrides boolean DEFAULT true,
  allow_user_overrides boolean DEFAULT false, -- Enterprise is strict
  
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enterprise_instructions_enterprise ON enterprise_custom_instructions(enterprise_id);

-- =====================================================
-- CUSTOM INSTRUCTION CONFLICTS (Warning System)
-- =====================================================

CREATE TABLE IF NOT EXISTS custom_instruction_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  conflict_type text NOT NULL, -- 'factual_error', 'tone_mismatch', 'forbidden_word_used', 'ml_contradiction'
  severity text NOT NULL, -- 'low', 'medium', 'high', 'critical'
  
  description text NOT NULL,
  
  -- Conflicting sources
  custom_instruction_field text,
  conflicting_intelligence_source text, -- 'company_crawler', 'product_data', 'ml_learning'
  
  -- Suggestions
  suggested_resolution text,
  
  -- Status
  status text DEFAULT 'active', -- 'active', 'resolved', 'ignored'
  resolved_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conflicts_user ON custom_instruction_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON custom_instruction_conflicts(severity);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON custom_instruction_conflicts(status);

-- =====================================================
-- CUSTOM INSTRUCTION PERFORMANCE (ML Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS custom_instruction_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Instruction being tested
  instruction_field text NOT NULL, -- 'tone', 'persona', 'chatbot_greeting'
  instruction_value text NOT NULL,
  
  -- Performance metrics
  total_uses integer DEFAULT 0,
  reply_rate decimal(5,2) DEFAULT 0,
  meeting_rate decimal(5,2) DEFAULT 0,
  close_rate decimal(5,2) DEFAULT 0,
  
  -- Comparison to baseline
  improvement_vs_baseline decimal(5,2) DEFAULT 0,
  confidence_level decimal(5,2) DEFAULT 0,
  
  -- Context
  works_best_for_persona text,
  works_best_for_product_type text,
  
  -- ML recommendation
  ml_suggests_keep boolean,
  ml_suggests_modify boolean,
  ml_suggestion text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instruction_performance_user ON custom_instruction_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_instruction_performance_field ON custom_instruction_performance(instruction_field);
CREATE INDEX IF NOT EXISTS idx_instruction_performance_improvement ON custom_instruction_performance(improvement_vs_baseline DESC);

-- =====================================================
-- INTELLIGENCE MERGE LOG (Debugging & Transparency)
-- =====================================================

CREATE TABLE IF NOT EXISTS intelligence_merge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Context
  merge_context text NOT NULL, -- 'chatbot_response', 'pitch_generation', 'message_compose'
  
  -- Sources used
  used_custom_instructions boolean DEFAULT false,
  used_team_instructions boolean DEFAULT false,
  used_enterprise_instructions boolean DEFAULT false,
  used_company_intelligence boolean DEFAULT false,
  used_product_intelligence boolean DEFAULT false,
  used_ml_hints boolean DEFAULT false,
  
  -- Result
  merged_output jsonb NOT NULL,
  
  -- Priority decisions
  override_decisions jsonb DEFAULT '{}'::jsonb,
  -- {"tone": "custom", "product_desc": "auto", "style": "ml_optimized"}
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merge_log_user ON intelligence_merge_log(user_id);
CREATE INDEX IF NOT EXISTS idx_merge_log_context ON intelligence_merge_log(merge_context);
CREATE INDEX IF NOT EXISTS idx_merge_log_created ON intelligence_merge_log(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE custom_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_custom_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_custom_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_instruction_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_instruction_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_merge_log ENABLE ROW LEVEL SECURITY;

-- Custom Instructions
CREATE POLICY "Users can view own instructions"
  ON custom_instructions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own instructions"
  ON custom_instructions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Team Instructions (team members can view)
CREATE POLICY "Team members can view team instructions"
  ON team_custom_instructions FOR SELECT
  TO authenticated
  USING (true); -- TODO: Add team membership check

-- Enterprise Instructions (enterprise users can view)
CREATE POLICY "Enterprise users can view enterprise instructions"
  ON enterprise_custom_instructions FOR SELECT
  TO authenticated
  USING (true); -- TODO: Add enterprise membership check

-- Conflicts
CREATE POLICY "Users can view own conflicts"
  ON custom_instruction_conflicts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own conflicts"
  ON custom_instruction_conflicts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Performance
CREATE POLICY "Users can view own performance"
  ON custom_instruction_performance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Merge Log
CREATE POLICY "Users can view own merge log"
  ON intelligence_merge_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);