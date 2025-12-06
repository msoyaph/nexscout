-- =====================================================
-- UNIFIED AI SYSTEM INSTRUCTIONS
-- =====================================================
-- Purpose: Centralized AI instructions for ALL AI features
-- Supports: Chatbot, Pitch Decks, Messages, Sequences, Followups
-- Features: Rich editor with images, files, override mode
-- =====================================================

-- Create unified ai_system_instructions table
CREATE TABLE IF NOT EXISTS ai_system_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Feature scope
  feature_type TEXT NOT NULL CHECK (feature_type IN (
    'chatbot',
    'pitch_deck',
    'ai_messages',
    'ai_sequences',
    'ai_followups',
    'ai_objections',
    'ai_scanning',
    'global' -- Applies to all features
  )),
  
  -- Instructions content
  custom_instructions TEXT,
  use_custom_instructions BOOLEAN DEFAULT FALSE,
  override_intelligence BOOLEAN DEFAULT FALSE,
  
  -- Rich editor content (JSON)
  rich_content JSONB DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   "text": "custom instructions",
  --   "images": [
  --     { "type": "product", "url": "https://...", "caption": "Product A" },
  --     { "type": "logo", "url": "https://...", "caption": "Company Logo" },
  --     { "type": "catalog", "url": "https://...", "caption": "2024 Catalog" }
  --   ],
  --   "files": [
  --     { "type": "brochure", "url": "https://...", "name": "Company Brochure.pdf" },
  --     { "type": "doc", "url": "https://...", "name": "Product Specs.pdf" }
  --   ]
  -- }
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_feature_instructions UNIQUE(user_id, feature_type)
);

-- =====================================================
-- Create pitch_deck_settings table (for backward compatibility)
-- =====================================================

CREATE TABLE IF NOT EXISTS pitch_deck_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Custom AI instructions
  custom_system_instructions TEXT,
  use_custom_instructions BOOLEAN DEFAULT FALSE,
  instructions_override_intelligence BOOLEAN DEFAULT FALSE,
  
  -- Rich content
  rich_content JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_pitch_deck_settings UNIQUE(user_id)
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_ai_instructions_user_feature ON ai_system_instructions(user_id, feature_type);
CREATE INDEX idx_ai_instructions_feature ON ai_system_instructions(feature_type) WHERE is_active = TRUE;
CREATE INDEX idx_pitch_deck_settings_user ON pitch_deck_settings(user_id);

-- =====================================================
-- RLS Policies - ai_system_instructions
-- =====================================================

ALTER TABLE ai_system_instructions ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view own AI instructions"
  ON ai_system_instructions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own AI instructions"
  ON ai_system_instructions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own AI instructions"
  ON ai_system_instructions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete own AI instructions"
  ON ai_system_instructions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Super admins can view all
CREATE POLICY "Super admins can view all AI instructions"
  ON ai_system_instructions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- =====================================================
-- RLS Policies - pitch_deck_settings
-- =====================================================

ALTER TABLE pitch_deck_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pitch deck settings"
  ON pitch_deck_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pitch deck settings"
  ON pitch_deck_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pitch deck settings"
  ON pitch_deck_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pitch deck settings"
  ON pitch_deck_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all pitch deck settings"
  ON pitch_deck_settings FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Get user's instructions for a specific feature
CREATE OR REPLACE FUNCTION get_ai_instructions(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS TABLE (
  custom_instructions TEXT,
  use_custom BOOLEAN,
  override_mode BOOLEAN,
  rich_content JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try feature-specific first
  RETURN QUERY
  SELECT 
    ai_system_instructions.custom_instructions,
    ai_system_instructions.use_custom_instructions,
    ai_system_instructions.override_intelligence,
    ai_system_instructions.rich_content
  FROM ai_system_instructions
  WHERE ai_system_instructions.user_id = p_user_id
    AND ai_system_instructions.feature_type = p_feature_type
    AND ai_system_instructions.is_active = TRUE
  LIMIT 1;
  
  -- If not found, try global
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      ai_system_instructions.custom_instructions,
      ai_system_instructions.use_custom_instructions,
      ai_system_instructions.override_intelligence,
      ai_system_instructions.rich_content
    FROM ai_system_instructions
    WHERE ai_system_instructions.user_id = p_user_id
      AND ai_system_instructions.feature_type = 'global'
      AND ai_system_instructions.is_active = TRUE
    LIMIT 1;
  END IF;
END;
$$;

-- Migrate existing chatbot settings
INSERT INTO ai_system_instructions (user_id, feature_type, custom_instructions, use_custom_instructions, override_intelligence)
SELECT 
  user_id,
  'chatbot' as feature_type,
  custom_system_instructions,
  use_custom_instructions,
  instructions_override_intelligence
FROM chatbot_settings
WHERE custom_system_instructions IS NOT NULL
ON CONFLICT (user_id, feature_type) DO NOTHING;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE ai_system_instructions IS 
  'Unified AI system instructions for all AI features. Supports rich content with images and files.';

COMMENT ON TABLE pitch_deck_settings IS 
  'Pitch deck specific AI settings. Backward compatibility wrapper.';

COMMENT ON COLUMN ai_system_instructions.rich_content IS 
  'Rich editor content: images (product, logo, catalog) and files (brochures, docs)';

COMMENT ON COLUMN ai_system_instructions.override_intelligence IS 
  'When true, replaces auto intelligence. When false, merges with it.';

COMMENT ON FUNCTION get_ai_instructions IS 
  'Get AI instructions for feature, fallback to global if not found';

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_system_instructions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pitch_deck_settings TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================

/*
This migration creates:
✅ ai_system_instructions (unified table for all features)
✅ pitch_deck_settings (backward compatibility)
✅ Rich content support (images + files in JSONB)
✅ Feature-specific + global instructions
✅ Override mode + smart mode
✅ Helper function for retrieval
✅ Migration of existing chatbot settings
✅ RLS policies for security

Supported features:
- Chatbot
- Pitch Decks
- AI Messages
- AI Sequences
- AI Followups
- AI Objections
- AI Scanning
- Global (applies to all)
*/

