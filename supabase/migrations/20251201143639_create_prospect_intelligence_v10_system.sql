/*
  # Prospect Intelligence v10.0 - Multi-Source Deep Scanning System

  ## Overview
  This migration creates a truly next-generation prospect intelligence system that:
  - Ingests data from 10+ sources (text, CSV, images, OCR, social media, chatbot conversations, browser captures, file exports)
  - Performs multi-agent deep scanning with 8 specialized AI agents
  - Implements state machine for reliable multi-pass processing
  - Creates a Learning Loop v1.0 for continuous improvement
  - Provides comprehensive prospect intelligence for better sales outcomes

  ## New Tables

  ### 1. prospect_sources
  Stores all raw input sources before parsing

  ### 2. prospect_entities
  Unified prospect candidates extracted from ANY source

  ### 3. prospect_intel
  AI agent analysis results for each prospect

  ### 4. prospect_history
  Learning loop events per prospect

  ### 5. deep_scan_state_machine
  Tracks multi-agent scanning progress with state transitions

  ### 6. ai_agent_results
  Stores individual AI agent outputs

  ### 7. ai_learning_profiles
  Personalized AI weights and predictions per user

  ### 8. scan_queue
  Priority queue for scanning workloads

  ## Security
  - Enable RLS on all tables
  - Add policies for user-owned data
  - Add policies for government oversight (aggregated only)

  ## Indexes
  - Add indexes on foreign keys
  - Add indexes on frequently queried fields
  - Add composite indexes for state machine queries
*/

-- =====================================================
-- TABLE 1: prospect_sources
-- =====================================================

CREATE TABLE IF NOT EXISTS prospect_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type text NOT NULL CHECK (source_type IN (
    'paste_text',
    'csv',
    'image',
    'ocr',
    'web_crawl',
    'browser_capture',
    'chatbot_conversation',
    'fb_data_file',
    'linkedin_export',
    'manual_input'
  )),
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospect_sources_user_id ON prospect_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_sources_type ON prospect_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_prospect_sources_created ON prospect_sources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prospect_sources_processed ON prospect_sources(processed) WHERE processed = false;

-- =====================================================
-- TABLE 2: prospect_entities
-- =====================================================

CREATE TABLE IF NOT EXISTS prospect_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text,
  first_name text,
  last_name text,
  contact_info jsonb DEFAULT '{}'::jsonb,
  social_handles jsonb DEFAULT '{}'::jsonb,
  source_ids uuid[] DEFAULT ARRAY[]::uuid[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'parsed', 'enriched', 'deep_scanned', 'failed')),
  enrichment_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospect_entities_user_id ON prospect_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_entities_status ON prospect_entities(status);
CREATE INDEX IF NOT EXISTS idx_prospect_entities_created ON prospect_entities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prospect_entities_display_name ON prospect_entities(display_name) WHERE display_name IS NOT NULL;

-- =====================================================
-- TABLE 3: prospect_intel
-- =====================================================

CREATE TABLE IF NOT EXISTS prospect_intel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospect_entities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Core Scores
  scout_score_v10 integer CHECK (scout_score_v10 BETWEEN 0 AND 100),
  confidence_score integer CHECK (confidence_score BETWEEN 0 AND 100),
  
  -- AI Agent Analysis Results
  personality_profile jsonb DEFAULT '{}'::jsonb,
  pain_points jsonb DEFAULT '[]'::jsonb,
  financial_signals jsonb DEFAULT '{}'::jsonb,
  business_interest jsonb DEFAULT '{}'::jsonb,
  life_events jsonb DEFAULT '[]'::jsonb,
  emotional_state jsonb DEFAULT '{}'::jsonb,
  engagement_prediction jsonb DEFAULT '{}'::jsonb,
  upsell_readiness jsonb DEFAULT '{}'::jsonb,
  closing_likelihood jsonb DEFAULT '{}'::jsonb,
  top_opportunities jsonb DEFAULT '[]'::jsonb,
  
  -- Raw AI Output for Debugging
  raw_ai_output jsonb DEFAULT '{}'::jsonb,
  
  -- Best Actions
  recommended_action text,
  recommended_channel text,
  recommended_timing jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospect_intel_prospect ON prospect_intel(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_intel_user ON prospect_intel(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_intel_scout_score ON prospect_intel(scout_score_v10 DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_prospect_intel_created ON prospect_intel(created_at DESC);

-- =====================================================
-- TABLE 4: prospect_history
-- =====================================================

CREATE TABLE IF NOT EXISTS prospect_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospect_entities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'scanned',
    'messaged',
    'replied',
    'booked_call',
    'closed',
    'ignored',
    'revived',
    'chatbot_interaction',
    'email_opened',
    'link_clicked',
    'document_viewed',
    'meeting_scheduled',
    'objection_raised',
    'price_inquiry',
    'competitor_mentioned'
  )),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospect_history_prospect ON prospect_history(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_history_user ON prospect_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_history_event_type ON prospect_history(event_type);
CREATE INDEX IF NOT EXISTS idx_prospect_history_created ON prospect_history(created_at DESC);

-- =====================================================
-- TABLE 5: deep_scan_state_machine
-- =====================================================

CREATE TABLE IF NOT EXISTS deep_scan_state_machine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_entity_id uuid REFERENCES prospect_entities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- State Machine States
  current_state text DEFAULT 'IDLE' CHECK (current_state IN (
    'IDLE',
    'PREPROCESSING',
    'PARSING',
    'ENTITY_MATCHING',
    'ENRICHING',
    'DEEP_SCANNING',
    'ASSEMBLING_INTEL',
    'SAVING',
    'LEARNING_UPDATE',
    'COMPLETE',
    'ERROR'
  )),
  
  -- Progress Tracking
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  current_agent text,
  agents_completed text[] DEFAULT ARRAY[]::text[],
  
  -- State Timestamps
  state_started_at timestamptz,
  state_transitions jsonb DEFAULT '[]'::jsonb,
  
  -- Energy & Costs
  energy_cost integer DEFAULT 0,
  scan_type text DEFAULT 'light' CHECK (scan_type IN ('light', 'deep', 'ultra')),
  
  -- Error Handling
  error_count integer DEFAULT 0,
  last_error text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deep_scan_state_prospect ON deep_scan_state_machine(prospect_entity_id);
CREATE INDEX IF NOT EXISTS idx_deep_scan_state_user ON deep_scan_state_machine(user_id);
CREATE INDEX IF NOT EXISTS idx_deep_scan_state_current ON deep_scan_state_machine(current_state);
CREATE INDEX IF NOT EXISTS idx_deep_scan_state_updated ON deep_scan_state_machine(updated_at DESC);

-- =====================================================
-- TABLE 6: ai_agent_results
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid REFERENCES deep_scan_state_machine(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospect_entities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  agent_name text NOT NULL CHECK (agent_name IN (
    'personality_agent',
    'pain_point_agent',
    'emotional_agent',
    'financial_signal_agent',
    'business_interest_agent',
    'life_event_agent',
    'lead_likelihood_agent',
    'closing_prediction_agent'
  )),
  
  agent_output jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence_score numeric(5,2) CHECK (confidence_score BETWEEN 0 AND 100),
  processing_time_ms integer,
  tokens_used integer,
  model_used text,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_scan ON ai_agent_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_prospect ON ai_agent_results(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_name ON ai_agent_results(agent_name);
CREATE INDEX IF NOT EXISTS idx_ai_agent_created ON ai_agent_results(created_at DESC);

-- =====================================================
-- TABLE 7: ai_learning_profiles
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_learning_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospect_entities(id) ON DELETE CASCADE,
  
  -- Personalized Weights
  scoring_weights jsonb DEFAULT '{}'::jsonb,
  channel_preferences jsonb DEFAULT '{}'::jsonb,
  timing_preferences jsonb DEFAULT '{}'::jsonb,
  message_style_preferences jsonb DEFAULT '{}'::jsonb,
  
  -- Learning Metrics
  total_interactions integer DEFAULT 0,
  successful_interactions integer DEFAULT 0,
  failed_interactions integer DEFAULT 0,
  avg_response_time_hours numeric(10,2),
  
  -- Predictions
  best_channel text,
  best_time_of_day text,
  best_day_of_week text,
  optimal_message_length text,
  
  -- Performance
  prediction_accuracy numeric(5,2),
  
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, prospect_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_profiles_user ON ai_learning_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_profiles_prospect ON ai_learning_profiles(prospect_id) WHERE prospect_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_learning_profiles_accuracy ON ai_learning_profiles(prediction_accuracy DESC NULLS LAST);

-- =====================================================
-- TABLE 8: scan_queue
-- =====================================================

CREATE TABLE IF NOT EXISTS scan_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_source_id uuid REFERENCES prospect_sources(id) ON DELETE CASCADE,
  
  queue_type text NOT NULL CHECK (queue_type IN (
    'preprocessing',
    'parsing',
    'enrichment',
    'deep_scan',
    'learning_update'
  )),
  
  priority integer DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  
  payload jsonb DEFAULT '{}'::jsonb,
  
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  error_message text,
  
  scheduled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_queue_user ON scan_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_queue_type ON scan_queue(queue_type);
CREATE INDEX IF NOT EXISTS idx_scan_queue_status ON scan_queue(status) WHERE status IN ('pending', 'retrying');
CREATE INDEX IF NOT EXISTS idx_scan_queue_priority ON scan_queue(priority DESC, scheduled_at ASC) WHERE status = 'pending';

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE prospect_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_scan_state_machine ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_queue ENABLE ROW LEVEL SECURITY;

-- prospect_sources policies
CREATE POLICY "Users can view own prospect sources"
  ON prospect_sources FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prospect sources"
  ON prospect_sources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prospect sources"
  ON prospect_sources FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- prospect_entities policies
CREATE POLICY "Users can view own prospect entities"
  ON prospect_entities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prospect entities"
  ON prospect_entities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prospect entities"
  ON prospect_entities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prospect entities"
  ON prospect_entities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- prospect_intel policies
CREATE POLICY "Users can view own prospect intel"
  ON prospect_intel FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prospect intel"
  ON prospect_intel FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prospect intel"
  ON prospect_intel FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- prospect_history policies
CREATE POLICY "Users can view own prospect history"
  ON prospect_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prospect history"
  ON prospect_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- deep_scan_state_machine policies
CREATE POLICY "Users can view own scan states"
  ON deep_scan_state_machine FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan states"
  ON deep_scan_state_machine FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scan states"
  ON deep_scan_state_machine FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ai_agent_results policies
CREATE POLICY "Users can view own AI agent results"
  ON ai_agent_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI agent results"
  ON ai_agent_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ai_learning_profiles policies
CREATE POLICY "Users can view own learning profiles"
  ON ai_learning_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning profiles"
  ON ai_learning_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning profiles"
  ON ai_learning_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- scan_queue policies
CREATE POLICY "Users can view own scan queue"
  ON scan_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan queue"
  ON scan_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scan queue"
  ON scan_queue FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);