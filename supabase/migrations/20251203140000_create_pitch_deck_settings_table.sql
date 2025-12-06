-- =====================================================
-- PITCH DECK AI SYSTEM INSTRUCTIONS
-- =====================================================
-- Purpose: Store custom AI system instructions for pitch deck generation
-- Similar to chatbot_settings but for pitch deck AI
-- =====================================================

CREATE TABLE IF NOT EXISTS pitch_deck_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Custom AI instructions
  custom_system_instructions TEXT,
  use_custom_instructions BOOLEAN DEFAULT FALSE,
  instructions_override_intelligence BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_pitch_deck_settings UNIQUE(user_id)
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_pitch_deck_settings_user ON pitch_deck_settings(user_id);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE pitch_deck_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view own pitch deck settings"
  ON pitch_deck_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own pitch deck settings"
  ON pitch_deck_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own pitch deck settings"
  ON pitch_deck_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete own pitch deck settings"
  ON pitch_deck_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Super admins can view all settings
CREATE POLICY "Super admins can view all pitch deck settings"
  ON pitch_deck_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE pitch_deck_settings IS 
  'Custom AI system instructions for pitch deck generation. Power user mode.';

COMMENT ON COLUMN pitch_deck_settings.custom_system_instructions IS 
  'Custom AI system prompt for pitch deck generation';

COMMENT ON COLUMN pitch_deck_settings.use_custom_instructions IS 
  'Enable custom instructions instead of default AI behavior';

COMMENT ON COLUMN pitch_deck_settings.instructions_override_intelligence IS 
  'When true, completely replaces auto company data. When false, merges with it.';

-- =====================================================
-- Migration Complete
-- =====================================================

/*
This migration creates:
✅ pitch_deck_settings table
✅ Unique constraint per user
✅ RLS policies for security
✅ Indexes for performance
✅ Super admin access

Features enabled:
✅ Custom AI instructions for pitch decks
✅ Override mode (replace auto intelligence)
✅ Smart mode (merge with auto intelligence)
✅ Per-user configuration
*/




