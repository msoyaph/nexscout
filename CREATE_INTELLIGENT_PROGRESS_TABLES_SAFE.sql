-- ✅ INTELLIGENT PROGRESS ANALYTICS - Database Tables (IDEMPOTENT VERSION)
-- Safe to run multiple times - will update existing tables/policies

-- ============================================
-- 1. ENGAGEMENT EVENTS (Safe Create/Update)
-- ============================================

CREATE TABLE IF NOT EXISTS public.engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  channel text, -- 'messenger', 'chatbot', 'manual', 'email'
  event_data jsonb DEFAULT '{}'::jsonb,
  scout_score_impact integer DEFAULT 0,
  engagement_impact text, -- 'positive', 'neutral', 'negative'
  created_at timestamptz DEFAULT now()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'engagement_events' AND column_name = 'channel') THEN
    ALTER TABLE public.engagement_events ADD COLUMN channel text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'engagement_events' AND column_name = 'scout_score_impact') THEN
    ALTER TABLE public.engagement_events ADD COLUMN scout_score_impact integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'engagement_events' AND column_name = 'engagement_impact') THEN
    ALTER TABLE public.engagement_events ADD COLUMN engagement_impact text;
  END IF;
END $$;

-- Indexes (safe to create)
CREATE INDEX IF NOT EXISTS idx_engagement_events_prospect_id ON engagement_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_user_id ON engagement_events(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_type ON engagement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_engagement_events_created_at ON engagement_events(created_at DESC);

-- RLS
ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy (idempotent)
DROP POLICY IF EXISTS "Users manage own engagement events" ON public.engagement_events;
CREATE POLICY "Users manage own engagement events"
  ON public.engagement_events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. EMOTIONAL SNAPSHOTS (Safe Create/Update)
-- ============================================

CREATE TABLE IF NOT EXISTS public.emotional_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  session_id uuid,
  message_id uuid,
  
  emotion_primary text NOT NULL,
  emotion_secondary text,
  valence numeric DEFAULT 0,
  arousal numeric DEFAULT 0,
  
  recommended_strategy text,
  confidence numeric DEFAULT 0,
  
  trigger_text text,
  language_detected text,
  
  timestamp timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emotional_snapshots_prospect_id ON emotional_snapshots(prospect_id);
CREATE INDEX IF NOT EXISTS idx_emotional_snapshots_session_id ON emotional_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_emotional_snapshots_timestamp ON emotional_snapshots(timestamp DESC);

-- RLS
ALTER TABLE public.emotional_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own emotional snapshots" ON public.emotional_snapshots;
CREATE POLICY "Users view own emotional snapshots"
  ON public.emotional_snapshots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages emotional snapshots" ON public.emotional_snapshots;
CREATE POLICY "Service role manages emotional snapshots"
  ON public.emotional_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. PREDICTION ACCURACY TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS public.prediction_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  
  prediction_type text NOT NULL,
  predicted_value numeric,
  predicted_date timestamptz,
  actual_value numeric,
  actual_date timestamptz,
  
  accuracy_score numeric,
  prediction_error numeric,
  
  model_version text,
  confidence numeric,
  factors_used jsonb,
  
  created_at timestamptz DEFAULT now(),
  outcome_recorded_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_prospect_id ON prediction_outcomes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_type ON prediction_outcomes(prediction_type);
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_accuracy ON prediction_outcomes(accuracy_score DESC);

-- RLS
ALTER TABLE public.prediction_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own prediction outcomes" ON public.prediction_outcomes;
CREATE POLICY "Users view own prediction outcomes"
  ON public.prediction_outcomes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 4. RECOMMENDATION OUTCOMES TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS public.recommendation_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  
  recommendation_title text NOT NULL,
  recommendation_action text NOT NULL,
  priority text NOT NULL,
  impact_score integer,
  success_probability numeric,
  
  action_taken boolean DEFAULT false,
  action_taken_at timestamptz,
  outcome text,
  actual_impact_score numeric,
  
  ai_reasoning text,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recommendation_outcomes_prospect_id ON recommendation_outcomes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_outcomes_action_taken ON recommendation_outcomes(action_taken);

-- RLS
ALTER TABLE public.recommendation_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own recommendation outcomes" ON public.recommendation_outcomes;
CREATE POLICY "Users manage own recommendation outcomes"
  ON public.recommendation_outcomes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. REFRESH SCHEMA CACHE
-- ============================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- COMPLETION NOTICE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ INTELLIGENT PROGRESS ANALYTICS READY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created/Updated:';
  RAISE NOTICE '  ✅ engagement_events';
  RAISE NOTICE '  ✅ emotional_snapshots';
  RAISE NOTICE '  ✅ prediction_outcomes';
  RAISE NOTICE '  ✅ recommendation_outcomes';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Features Enabled:';
  RAISE NOTICE '  ✅ Real-time engagement tracking';
  RAISE NOTICE '  ✅ Emotional intelligence analysis';
  RAISE NOTICE '  ✅ ML prediction accuracy tracking';
  RAISE NOTICE '  ✅ Recommendation effectiveness';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next: Update ProspectProgressModal.tsx';
  RAISE NOTICE '   Import: intelligentProgressAnalytics service';
  RAISE NOTICE '   Replace: hardcoded progressData';
  RAISE NOTICE '   Guide: PHASE_1_MANUAL_STEPS.md';
  RAISE NOTICE '============================================';
END $$;

