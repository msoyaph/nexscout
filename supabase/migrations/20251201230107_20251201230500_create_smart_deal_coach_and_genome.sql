/*
  # Smart Deal Coach + Sales Genome Model v2

  1. Smart Deal Coach Tables
    - `deal_coach_strategies` - Per-prospect closing strategies
    - `deal_coach_recommendations` - Next best actions
    - `deal_coach_predictions` - Likelihood scores

  2. Sales Genome Model Tables
    - `genome_user_profile` - Complete user DNA
    - `genome_customer_profile` - Aggregate customer DNA
    - `genome_learning_moments` - Key learning moments

  3. Auto-Repurchase Engine
    - `repurchase_cycles` - Customer repurchase patterns
    - `loyalty_scores` - Customer loyalty tracking
    - `repurchase_triggers` - Automated repurchase reminders

  4. Synergy Events
    - `synergy_events` - Inter-system communication log
*/

-- =====================================================
-- SMART DEAL COACH STRATEGIES
-- =====================================================

CREATE TABLE IF NOT EXISTS deal_coach_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid NOT NULL,

  -- Likelihood & Scores
  likelihood_to_buy_percentage decimal(5,2) DEFAULT 0,
  scout_score decimal(5,2) DEFAULT 0,
  urgency_score decimal(5,2) DEFAULT 0,
  budget_score decimal(5,2) DEFAULT 0,

  -- Strategy
  recommended_approach text, -- 'soft_sell', 'hard_close', 'consultative', 'educational'
  message_tone text, -- 'professional', 'friendly', 'urgent', 'casual'
  recommended_offer_id uuid,

  -- Objections
  expected_objections jsonb, -- [{objection, probability, suggested_response}]
  objection_profile text,

  -- Next Best Actions
  next_best_action text NOT NULL,
  alternative_actions jsonb,

  -- Timing
  best_contact_time text, -- '9am-11am Tuesday'
  expected_close_date date,
  days_to_close_estimate integer,

  -- Confidence
  strategy_confidence decimal(5,2) DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_coach_strategies_user ON deal_coach_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_coach_strategies_prospect ON deal_coach_strategies(prospect_id);
CREATE INDEX IF NOT EXISTS idx_deal_coach_strategies_likelihood ON deal_coach_strategies(likelihood_to_buy_percentage DESC);

-- =====================================================
-- SALES GENOME - USER PROFILE
-- =====================================================

CREATE TABLE IF NOT EXISTS genome_user_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Communication DNA
  writing_style jsonb, -- {tone, formality, emoji_usage, avg_message_length}
  language_dna jsonb, -- {primary_language, taglish_ratio, slang_usage}
  conversation_patterns jsonb, -- {avg_response_time, messages_per_conversation}

  -- Selling DNA
  closing_techniques jsonb, -- {primary_technique, success_rate_by_technique}
  objection_handling_style jsonb,
  pricing_presentation_style jsonb,

  -- Success DNA
  winning_sequences jsonb, -- [{sequence_pattern, success_rate, sample_size}]
  winning_content jsonb, -- {best_opening, best_cta, best_close}
  winning_timing jsonb, -- {best_days, best_times, best_frequency}

  -- Product DNA
  product_match_success jsonb, -- [{product_id, success_rate, avg_deal_size}]

  -- Evolution tracking
  skill_level text DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced', 'expert'
  improvement_trajectory text, -- 'improving', 'stable', 'declining'

  last_analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_genome_user_profile_user ON genome_user_profile(user_id);

-- =====================================================
-- SALES GENOME - CUSTOMER PROFILE  
-- =====================================================

CREATE TABLE IF NOT EXISTS genome_customer_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Behavioral DNA
  response_patterns jsonb, -- {avg_response_time, response_rate_by_channel}
  engagement_patterns jsonb, -- {peak_hours, preferred_channels, message_frequency}
  decision_patterns jsonb, -- {avg_decision_time, influencing_factors}

  -- Communication DNA
  language_preferences jsonb,
  tone_preferences jsonb,
  content_preferences jsonb,

  -- Objection DNA
  common_objections jsonb, -- [{objection, frequency, winning_responses}]
  objection_timing jsonb, -- When objections typically appear

  -- Conversion DNA
  conversion_triggers jsonb, -- What makes them buy
  ghost_triggers jsonb, -- What makes them disappear
  loyalty_factors jsonb, -- What makes them stay

  -- Persona DNA
  persona_distribution jsonb, -- {persona_type: {count, close_rate, avg_value}}

  last_analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_genome_customer_profile_user ON genome_customer_profile(user_id);

-- =====================================================
-- GENOME LEARNING MOMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS genome_learning_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Moment details
  moment_type text NOT NULL, -- 'breakthrough', 'mistake', 'pattern_discovered', 'objection_handled'
  moment_description text NOT NULL,

  -- Context
  prospect_id uuid,
  trigger_event text,

  -- Learning
  what_worked text,
  what_didnt_work text,
  key_insight text,

  -- Impact
  impact_score decimal(5,2), -- How significant is this learning
  applied_count integer DEFAULT 0, -- How many times we've applied this learning

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_genome_learning_moments_user ON genome_learning_moments(user_id);
CREATE INDEX IF NOT EXISTS idx_genome_learning_moments_type ON genome_learning_moments(moment_type);
CREATE INDEX IF NOT EXISTS idx_genome_learning_moments_impact ON genome_learning_moments(impact_score DESC);

-- =====================================================
-- REPURCHASE CYCLES
-- =====================================================

CREATE TABLE IF NOT EXISTS repurchase_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid NOT NULL,
  product_id uuid,

  -- Cycle tracking
  first_purchase_date date NOT NULL,
  last_purchase_date date NOT NULL,
  purchase_count integer DEFAULT 1,

  -- Patterns
  avg_days_between_purchases integer,
  typical_purchase_amount decimal(10,2),

  -- Predictions
  next_expected_purchase_date date,
  likelihood_to_repurchase decimal(5,2) DEFAULT 0,
  expected_purchase_value decimal(10,2),

  -- Status
  status text DEFAULT 'active', -- 'active', 'at_risk', 'churned', 'reactivated'
  days_since_last_purchase integer,

  -- Reminders
  reminder_sent boolean DEFAULT false,
  reminder_sent_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_repurchase_cycles_user ON repurchase_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_repurchase_cycles_prospect ON repurchase_cycles(prospect_id);
CREATE INDEX IF NOT EXISTS idx_repurchase_cycles_next_date ON repurchase_cycles(next_expected_purchase_date);
CREATE INDEX IF NOT EXISTS idx_repurchase_cycles_status ON repurchase_cycles(status);

-- =====================================================
-- LOYALTY SCORES
-- =====================================================

CREATE TABLE IF NOT EXISTS loyalty_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid NOT NULL,

  -- Scores
  loyalty_score decimal(5,2) DEFAULT 0, -- 0-100
  engagement_score decimal(5,2) DEFAULT 0,
  satisfaction_score decimal(5,2) DEFAULT 0,
  advocacy_score decimal(5,2) DEFAULT 0,

  -- Lifetime value
  total_revenue decimal(12,2) DEFAULT 0,
  avg_order_value decimal(10,2) DEFAULT 0,
  purchase_frequency decimal(5,2) DEFAULT 0,
  predicted_ltv decimal(12,2) DEFAULT 0,

  -- Risk indicators
  churn_risk_score decimal(5,2) DEFAULT 0,
  churn_risk_level text, -- 'low', 'medium', 'high', 'critical'
  days_inactive integer DEFAULT 0,

  -- Engagement metrics
  last_interaction_date date,
  interaction_frequency_score decimal(5,2),
  response_rate decimal(5,2),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_scores_prospect ON loyalty_scores(user_id, prospect_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_scores_loyalty ON loyalty_scores(loyalty_score DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_scores_churn_risk ON loyalty_scores(churn_risk_score DESC);

-- =====================================================
-- REPURCHASE TRIGGERS
-- =====================================================

CREATE TABLE IF NOT EXISTS repurchase_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid NOT NULL,

  -- Trigger details
  trigger_type text NOT NULL, -- 'time_based', 'usage_based', 'event_based', 'behavior_based'
  trigger_reason text NOT NULL,

  -- Action
  suggested_message text NOT NULL,
  suggested_offer jsonb,
  urgency_level text, -- 'low', 'medium', 'high'

  -- Status
  status text DEFAULT 'pending', -- 'pending', 'sent', 'responded', 'ignored', 'converted'

  -- Results
  sent_at timestamptz,
  responded_at timestamptz,
  converted_at timestamptz,
  conversion_value decimal(10,2),

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_repurchase_triggers_user ON repurchase_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_repurchase_triggers_prospect ON repurchase_triggers(prospect_id);
CREATE INDEX IF NOT EXISTS idx_repurchase_triggers_status ON repurchase_triggers(status);
CREATE INDEX IF NOT EXISTS idx_repurchase_triggers_created ON repurchase_triggers(created_at DESC);

-- =====================================================
-- SYNERGY EVENTS (Inter-System Communication)
-- =====================================================

CREATE TABLE IF NOT EXISTS synergy_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Event
  event_name text NOT NULL,
  source_system text NOT NULL, -- 'chatbot', 'deep_scan', 'pipeline', 'calendar', etc.
  target_systems text[], -- Systems that should react

  -- Data
  event_data jsonb NOT NULL,

  -- Processing
  processed boolean DEFAULT false,
  processed_at timestamptz,
  processing_results jsonb,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_synergy_events_user ON synergy_events(user_id);
CREATE INDEX IF NOT EXISTS idx_synergy_events_processed ON synergy_events(processed);
CREATE INDEX IF NOT EXISTS idx_synergy_events_created ON synergy_events(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE deal_coach_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE genome_user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE genome_customer_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE genome_learning_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE repurchase_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE repurchase_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE synergy_events ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'deal_coach_strategies',
      'genome_user_profile',
      'genome_customer_profile',
      'genome_learning_moments',
      'repurchase_cycles',
      'loyalty_scores',
      'repurchase_triggers',
      'synergy_events'
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