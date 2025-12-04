/*
  # Workspace Configuration System

  1. New Tables
    - `workspace_configs`
      - Core workspace configuration storage
      - All AI module configs in JSONB columns
      - One row per workspace (user)

  2. Security
    - Enable RLS on workspace_configs
    - Users can only access their own workspace config
    - Admins can view all configs

  3. Features
    - Auto-initialization for new users
    - Triggers for updated_at
    - Complete isolation between workspaces
    - All AI configs stored per workspace

  4. Notes
    - This is the SINGLE SOURCE OF TRUTH for all AI behavior per workspace
    - Prevents cross-brand contamination
    - Enables true multi-tenant AI system
*/

-- Create workspace_configs table
CREATE TABLE IF NOT EXISTS workspace_configs (
  workspace_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Company configuration
  company jsonb DEFAULT '{
    "name": "",
    "brandName": "",
    "industry": "general",
    "audience": "General audience",
    "mission": "",
    "description": ""
  }'::jsonb,

  -- Product catalog
  products jsonb DEFAULT '{"products": []}'::jsonb,

  -- Tone profile
  tone_profile jsonb DEFAULT '{
    "brandVoice": "warm",
    "languageMix": "english",
    "emojiUsage": "minimal",
    "formality": "neutral",
    "personality": ["helpful", "friendly", "professional"],
    "sentenceLength": "medium",
    "pacing": "medium"
  }'::jsonb,

  -- Funnel configurations
  funnels jsonb DEFAULT '{
    "funnels": {
      "recruiting": {
        "stages": ["awareness", "interest", "evaluation", "decision", "closing"],
        "labels": {
          "awareness": "Building Awareness",
          "interest": "Generating Interest",
          "evaluation": "Evaluating Fit",
          "decision": "Making Decision",
          "closing": "Closing the Deal"
        }
      }
    }
  }'::jsonb,

  -- AI behavior settings
  ai_behavior jsonb DEFAULT '{
    "agentName": "AI Assistant",
    "defaultPersona": "professionalAdvisor",
    "voicePresets": {
      "closing": "aggressiveCloser",
      "revival": "softNurturer",
      "training": "professionalAdvisor",
      "support": "empathicSupport"
    },
    "behaviorFlags": {
      "allowAutoFollowups": true,
      "useRankBasedCoaching": true,
      "enableSmartRouting": true
    }
  }'::jsonb,

  -- Custom instructions (highest priority)
  custom_instructions jsonb DEFAULT '{
    "globalInstructions": "",
    "priority": 10
  }'::jsonb,

  -- AI Pitch Deck
  ai_pitch_deck jsonb DEFAULT '{"slides": []}'::jsonb,

  -- AI Messages and templates
  ai_messages jsonb DEFAULT '{
    "welcomeMessages": ["Hello! How can I help you today?"],
    "followUpTemplates": {
      "warmLead": ["Just checking in! Are you still interested?"],
      "coldLead": ["Hi! Would you like to learn more?"],
      "hotLead": ["Ready to get started? I can help you right away!"]
    },
    "closingScripts": ["Would you like to proceed? I can guide you step-by-step."],
    "objectionHandlers": {},
    "faqResponses": {}
  }'::jsonb,

  -- Sales pipeline configuration
  pipeline jsonb DEFAULT '{
    "stages": ["New Lead", "Engaged", "Interested", "Decision", "Closing"],
    "automationRules": {
      "autoTagHotLead": true,
      "autoMoveToNextStage": false,
      "revivalAfterDays": 3
    }
  }'::jsonb,

  -- AI sequences
  ai_sequences jsonb DEFAULT '{
    "sequences": {
      "warmLeadFollowUp": ["Hello! How are you?", "Just wanted to follow up on our conversation."],
      "closingSequence": ["Ready to get started?", "I can guide you through the process."]
    }
  }'::jsonb,

  -- AI selling personas
  ai_selling_personas jsonb DEFAULT '{
    "personas": [{
      "id": "professionalAdvisor",
      "title": "Professional Advisor",
      "description": "Direct, structured, expert tone",
      "tone": "professional",
      "approach": "consultative"
    }],
    "defaultPersona": "professionalAdvisor"
  }'::jsonb,

  -- Business opportunity
  business_opportunity jsonb DEFAULT '{
    "earningModel": "direct_sales",
    "startAmount": 0,
    "currency": "PHP",
    "commissions": {"direct": "0%"},
    "simpleExplanation": "Earn by sharing and helping others.",
    "detailedSteps": []
  }'::jsonb,

  -- Compensation plan
  compensation jsonb DEFAULT '{
    "planType": "unilevel",
    "levels": []
  }'::jsonb,

  -- Recruiting flow
  recruiting_flow jsonb DEFAULT '{
    "steps": [],
    "materials": [],
    "automatedMessages": []
  }'::jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_workspace_configs_workspace_id ON workspace_configs(workspace_id);

-- Enable RLS
ALTER TABLE workspace_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own workspace config
CREATE POLICY "Users can view own workspace config"
  ON workspace_configs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = workspace_id);

CREATE POLICY "Users can insert own workspace config"
  ON workspace_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = workspace_id);

CREATE POLICY "Users can update own workspace config"
  ON workspace_configs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = workspace_id)
  WITH CHECK (auth.uid() = workspace_id);

-- Policy: Admins can view all workspace configs
CREATE POLICY "Admins can view all workspace configs"
  ON workspace_configs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_workspace_config_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS workspace_config_updated_at_trigger ON workspace_configs;
CREATE TRIGGER workspace_config_updated_at_trigger
  BEFORE UPDATE ON workspace_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_config_updated_at();

-- Function to initialize workspace config for new users
CREATE OR REPLACE FUNCTION initialize_workspace_config_for_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO workspace_configs (workspace_id, company)
  VALUES (
    NEW.id,
    jsonb_build_object(
      'name', COALESCE(NEW.full_name, 'My Company'),
      'brandName', COALESCE(NEW.full_name, 'My Company'),
      'industry', 'general',
      'audience', 'General audience',
      'mission', 'Serving our customers with excellence',
      'description', 'A trusted provider of quality products and services'
    )
  )
  ON CONFLICT (workspace_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger to auto-initialize workspace config when profile is created
DROP TRIGGER IF EXISTS auto_init_workspace_config_trigger ON profiles;
CREATE TRIGGER auto_init_workspace_config_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_workspace_config_for_user();
