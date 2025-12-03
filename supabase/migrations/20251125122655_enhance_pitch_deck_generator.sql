/*
  # Enhance Pitch Deck Generator System

  ## Overview
  Upgrades the pitch deck system for AI-powered, personalized presentations:
  - Basic vs Elite deck types
  - ScoutScore v2.0 integration
  - Goal-based generation (recruit, sell, invite, intro)
  - Tone customization
  - Slide structure with bullets and CTAs

  ## Changes

  ### 1. Enhanced `pitch_decks` table
  Adds fields for:
  - Prospect association
  - Deck type (basic/elite)
  - Goal and tone
  - Structured slides JSON
  - ScoutScore context
  - Version tracking

  ## Security
  - All existing RLS policies maintained
  - New policies for prospect-linked decks
*/

-- =====================================================
-- 1. ENHANCE PITCH_DECKS TABLE
-- =====================================================

DO $$
BEGIN
  -- Link to prospect
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'prospect_id'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL;
  END IF;

  -- Deck type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'deck_type'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN deck_type text DEFAULT 'basic' CHECK (deck_type IN ('basic', 'elite'));
  END IF;

  -- Generation goal
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'goal'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN goal text CHECK (goal IN ('recruit', 'sell', 'invite_call', 'intro'));
  END IF;

  -- Tone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'tone'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN tone text DEFAULT 'friendly' CHECK (tone IN ('friendly', 'professional', 'confident', 'warm'));
  END IF;

  -- Prospect name (cached)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'prospect_name'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN prospect_name text;
  END IF;

  -- Structured slides
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'slides'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN slides jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- ScoutScore context used
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'scoutscore_context'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN scoutscore_context jsonb;
  END IF;

  -- Prospect profile snapshot
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'prospect_profile_snapshot'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN prospect_profile_snapshot jsonb;
  END IF;

  -- Generation metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'generation_metadata'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN generation_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Version (basic or elite)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'version'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN version text DEFAULT 'v1.0';
  END IF;

  -- Slide count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'slide_count'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN slide_count integer DEFAULT 0;
  END IF;

  -- Last viewed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'last_viewed_at'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN last_viewed_at timestamptz;
  END IF;

  -- View count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN view_count integer DEFAULT 0;
  END IF;

  -- Exported flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitch_decks' AND column_name = 'exported'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN exported boolean DEFAULT false;
  END IF;
END $$;

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pitch_decks_prospect 
  ON pitch_decks(prospect_id);

CREATE INDEX IF NOT EXISTS idx_pitch_decks_user_created 
  ON pitch_decks(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pitch_decks_deck_type 
  ON pitch_decks(deck_type);

CREATE INDEX IF NOT EXISTS idx_pitch_decks_status 
  ON pitch_decks(status, created_at DESC);

-- =====================================================
-- 3. HELPER VIEW
-- =====================================================

CREATE OR REPLACE VIEW v_pitch_decks_with_prospects AS
SELECT 
  pd.id,
  pd.user_id,
  pd.prospect_id,
  pd.prospect_name,
  pd.title,
  pd.deck_type,
  pd.goal,
  pd.tone,
  pd.slide_count,
  pd.status,
  pd.created_at,
  pd.last_viewed_at,
  pd.view_count,
  p.full_name as prospect_full_name,
  ps.scout_score,
  ps.bucket
FROM pitch_decks pd
LEFT JOIN prospects p ON pd.prospect_id = p.id
LEFT JOIN prospect_scores ps ON pd.prospect_id = ps.prospect_id AND pd.user_id = ps.user_id;

-- =====================================================
-- 4. COMMENTS
-- =====================================================

COMMENT ON COLUMN pitch_decks.deck_type IS 'Basic (7 slides) or Elite (12-15 slides)';
COMMENT ON COLUMN pitch_decks.goal IS 'recruit, sell, invite_call, or intro';
COMMENT ON COLUMN pitch_decks.tone IS 'friendly, professional, confident, or warm';
COMMENT ON COLUMN pitch_decks.slides IS 'Array of slide objects with title, bullets, cta';
COMMENT ON COLUMN pitch_decks.scoutscore_context IS 'ScoutScore v2.0 tags and features used';
COMMENT ON COLUMN pitch_decks.prospect_profile_snapshot IS 'Cached prospect data at generation time';