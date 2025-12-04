/*
  # NexScout SIFE 1.0 - Self-Improving Funnel Engine

  1. Core Tables
    - `sife_experiments` - A/B/C tests for everything
    - `sife_variants` - Different versions being tested
    - `sife_outcomes` - What happened (conversion, ghost, close)
    - `sife_improvements` - AI-generated improvements
    - `sife_learning_events` - Everything the system learns from

  2. Intelligence Tables
    - `sife_user_intelligence` - How user talks, sells, succeeds
    - `sife_customer_intelligence` - Customer behavior patterns
    - `sife_outcome_intelligence` - What leads to conversions

  3. Performance Tables
    - `sife_performance_metrics` - Real-time performance tracking
    - `sife_winning_patterns` - Patterns that convert

  This powers the entire self-learning system.
*/

-- =====================================================
-- SIFE EXPERIMENTS (A/B/C Testing Engine)
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Experiment details
  experiment_type text NOT NULL,
  experiment_name text NOT NULL,
  hypothesis text,

  -- Status
  status text NOT NULL DEFAULT 'active',

  -- Metrics
  total_impressions integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  conversion_rate decimal(5,2) DEFAULT 0,

  -- Winner
  winning_variant_id uuid,
  confidence_score decimal(5,2),

  -- Timing
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_experiments_user_id ON sife_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_sife_experiments_type_status ON sife_experiments(experiment_type, status);

-- =====================================================
-- SIFE VARIANTS (Different Versions Being Tested)
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid REFERENCES sife_experiments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Variant details
  variant_name text NOT NULL,
  variant_content jsonb NOT NULL,

  -- Performance
  impressions integer DEFAULT 0,
  conversions integer DEFAULT 0,
  conversion_rate decimal(5,2) DEFAULT 0,

  -- Engagement metrics
  avg_response_time_seconds integer,
  avg_messages_exchanged decimal(5,2),
  booking_rate decimal(5,2),
  close_rate decimal(5,2),

  -- Quality scores
  sentiment_score decimal(5,2),
  engagement_score decimal(5,2),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_variants_experiment ON sife_variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_sife_variants_user ON sife_variants(user_id);

-- =====================================================
-- SIFE OUTCOMES (What Actually Happened)
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES sife_variants(id) ON DELETE SET NULL,
  experiment_id uuid REFERENCES sife_experiments(id) ON DELETE SET NULL,

  -- Context
  prospect_id uuid,
  session_id uuid,
  channel text,

  -- Outcome
  outcome_type text NOT NULL,
  outcome_value decimal(10,2),

  -- Behavior data
  time_to_outcome_seconds integer,
  messages_exchanged integer,
  sentiment text,

  -- Learning data
  trigger_content text,
  customer_response text,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_outcomes_user ON sife_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_sife_outcomes_variant ON sife_outcomes(variant_id);
CREATE INDEX IF NOT EXISTS idx_sife_outcomes_type ON sife_outcomes(outcome_type);
CREATE INDEX IF NOT EXISTS idx_sife_outcomes_prospect ON sife_outcomes(prospect_id);

-- =====================================================
-- SIFE USER INTELLIGENCE (How User Sells)
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_user_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Personality & Style
  selling_style text,
  tone_preference text,
  language_preference text,

  -- Best Performing Content
  best_opening_line text,
  best_closing_line text,
  best_objection_handler text,
  best_cta text,

  -- Patterns
  best_performing_days jsonb,
  best_performing_times jsonb,
  avg_messages_to_close integer,
  avg_days_to_close integer,

  -- Success metrics
  total_closes integer DEFAULT 0,
  total_revenue decimal(12,2) DEFAULT 0,
  avg_deal_size decimal(10,2) DEFAULT 0,
  close_rate decimal(5,2) DEFAULT 0,

  -- Products
  top_selling_products jsonb,

  last_analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sife_user_intelligence_user ON sife_user_intelligence(user_id);

-- =====================================================
-- SIFE CUSTOMER INTELLIGENCE (Customer Behavior)
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_customer_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Aggregate Customer Patterns
  common_objections jsonb,
  common_questions jsonb,
  common_pain_points jsonb,
  common_desires jsonb,

  -- Behavior Patterns
  avg_response_time_minutes integer,
  peak_engagement_hours jsonb,
  preferred_channels jsonb,

  -- Conversion Triggers
  words_that_trigger_replies jsonb,
  emojis_that_work jsonb,
  ctas_that_convert jsonb,

  -- Persona Distribution
  persona_breakdown jsonb,

  -- Timing Intelligence
  best_followup_timing jsonb,
  best_meeting_times jsonb,

  last_analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sife_customer_intelligence_user ON sife_customer_intelligence(user_id);

-- =====================================================
-- SIFE OUTCOME INTELLIGENCE (What Leads to Success)
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_outcome_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Conversion Patterns
  messages_that_led_to_bookings jsonb,
  messages_that_led_to_closes jsonb,
  messages_that_caused_ghosts jsonb,

  -- Sequence Patterns
  winning_follow_up_sequences jsonb,
  optimal_message_frequency jsonb,
  optimal_sequence_length integer,

  -- Content Patterns
  winning_pitch_deck_slides jsonb,
  winning_offer_structures jsonb,
  winning_pricing_presentations jsonb,

  -- Timing Patterns
  time_to_first_reply_seconds integer,
  time_to_booking_hours integer,
  time_to_close_days integer,

  -- Red Flags (What to Avoid)
  words_that_lose_deals jsonb,
  timing_mistakes jsonb,

  last_analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sife_outcome_intelligence_user ON sife_outcome_intelligence(user_id);

-- =====================================================
-- SIFE IMPROVEMENTS (AI-Generated Improvements)
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Improvement details
  improvement_type text NOT NULL,
  target_id uuid,

  -- Current vs Improved
  current_version jsonb,
  improved_version jsonb,

  -- Reasoning
  improvement_reason text,
  expected_lift_percentage decimal(5,2),

  -- Status
  status text DEFAULT 'pending',

  -- Results (if tested)
  actual_lift_percentage decimal(5,2),
  confidence_score decimal(5,2),

  -- User feedback
  user_approved boolean,
  user_feedback text,

  created_at timestamptz DEFAULT now(),
  deployed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sife_improvements_user ON sife_improvements(user_id);
CREATE INDEX IF NOT EXISTS idx_sife_improvements_type_status ON sife_improvements(improvement_type, status);

-- =====================================================
-- SIFE LEARNING EVENTS (Everything System Learns)
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Event details
  event_type text NOT NULL,
  event_source text NOT NULL,

  -- Context
  prospect_id uuid,
  session_id uuid,

  -- Learning data
  event_data jsonb NOT NULL,

  -- Outcome
  outcome text,
  outcome_value decimal(10,2),

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_learning_events_user ON sife_learning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sife_learning_events_type ON sife_learning_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sife_learning_events_created ON sife_learning_events(created_at DESC);

-- =====================================================
-- SIFE PERFORMANCE METRICS (Real-Time Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Time period
  period_type text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,

  -- Activity metrics
  prospects_added integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  responses_received integer DEFAULT 0,
  meetings_booked integer DEFAULT 0,
  deals_closed integer DEFAULT 0,

  -- Conversion metrics
  response_rate decimal(5,2) DEFAULT 0,
  booking_rate decimal(5,2) DEFAULT 0,
  close_rate decimal(5,2) DEFAULT 0,

  -- Revenue metrics
  revenue_generated decimal(12,2) DEFAULT 0,
  avg_deal_size decimal(10,2) DEFAULT 0,

  -- AI metrics
  ai_accuracy_score decimal(5,2) DEFAULT 0,
  ai_improvements_suggested integer DEFAULT 0,
  ai_improvements_deployed integer DEFAULT 0,

  -- Efficiency metrics
  time_saved_hours decimal(8,2) DEFAULT 0,
  automation_rate decimal(5,2) DEFAULT 0,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_performance_user_period ON sife_performance_metrics(user_id, period_type, period_start DESC);

-- =====================================================
-- SIFE WINNING PATTERNS (Proven Success Patterns)
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_winning_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Pattern details
  pattern_type text NOT NULL,
  pattern_name text NOT NULL,
  pattern_content jsonb NOT NULL,

  -- Performance
  usage_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  success_rate decimal(5,2) DEFAULT 0,

  -- Value
  total_revenue_generated decimal(12,2) DEFAULT 0,
  avg_value_per_use decimal(10,2) DEFAULT 0,

  -- Context
  works_best_for_persona text,
  works_best_at_time text,
  works_best_on_channel text,

  -- Confidence
  confidence_score decimal(5,2) DEFAULT 0,
  sample_size integer DEFAULT 0,

  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_winning_patterns_user ON sife_winning_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_sife_winning_patterns_type ON sife_winning_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_sife_winning_patterns_success_rate ON sife_winning_patterns(success_rate DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE sife_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_user_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_customer_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_outcome_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_winning_patterns ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'sife_experiments',
      'sife_variants',
      'sife_outcomes',
      'sife_user_intelligence',
      'sife_customer_intelligence',
      'sife_outcome_intelligence',
      'sife_improvements',
      'sife_learning_events',
      'sife_performance_metrics',
      'sife_winning_patterns'
    ])
  LOOP
    EXECUTE format('
      CREATE POLICY "Users can view own %I"
        ON %I FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert own %I"
        ON %I FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update own %I"
        ON %I FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    ', tbl, tbl, tbl, tbl, tbl, tbl);
  END LOOP;
END $$;