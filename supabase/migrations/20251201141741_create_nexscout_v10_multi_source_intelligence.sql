/*
  # NexScout Prospect Intelligence v10.0 - Multi-Source Data Collection System

  ## Overview
  This migration creates the foundation for a 10-source prospect intelligence system with
  universal normalization, multi-pass scanning, crowd learning, and compliance features.

  ## 1. New Tables

  ### Data Source Management
  - `data_sources` - Tracks all 10 data source types and their configurations
  - `data_ingestion_queue` - Universal queue for all incoming data
  - `data_source_stats` - Analytics per source type

  ### Universal Prospect Standard
  - `prospects_v10` - Enhanced prospect table with 30+ standardized fields
  - `prospect_metadata` - Extended JSON metadata storage
  - `prospect_merge_log` - Track prospect deduplication and merging

  ### Multi-Pass Scanning Pipeline
  - `scan_pipeline_state` - Track 7-pass scanning progress
  - `scan_pass_results` - Store results from each scanning pass
  - `ai_specialist_results` - Results from 3 AI specialists (Analyst, Investigator, Profiler)

  ### Cross-User Intelligence (Anonymized)
  - `crowd_learning_patterns` - Anonymized patterns across all users
  - `industry_intelligence` - Industry-specific learned behaviors
  - `company_global_registry` - Shared company knowledge graph
  - `objection_global_patterns` - Common objections across industries

  ### Multi-Industry Support
  - `industry_models` - Industry-specific AI model configurations
  - `industry_tagging_rules` - Auto-tagging rules per industry
  - `product_prospect_alignment` - Product-to-prospect matching scores

  ### Continuous Learning
  - `learning_feedback_events` - Track all system learning events
  - `model_performance_metrics` - Track AI accuracy over time
  - `prediction_outcomes` - Store predictions vs actual results

  ### Compliance & Safety
  - `compliance_filters` - Safety and legal filtering rules
  - `data_privacy_audit_log` - GDPR-style audit trail
  - `sensitive_data_detections` - Flag and remove sensitive data

  ### Scalable Infrastructure
  - `processing_queues` - Separate queues for different workload types
  - `cache_normalized_data` - Cache frequently accessed normalized data
  - `partition_metadata` - Track database partitioning info

  ## 2. Security
  - Enable RLS on all tables
  - Add policies for authenticated users to access own data
  - Add policies for super admin to access aggregated/anonymized data
  - Add policies for cross-user learning (anonymized only)

  ## 3. Indexes
  - Add indexes on foreign keys
  - Add indexes on frequently queried fields
  - Add composite indexes for common query patterns
  - Add partial indexes for active records

  ## 4. Functions
  - Universal data normalization function
  - Prospect deduplication and merging function
  - ScoutScore v10 calculation function
  - Cross-user pattern detection function
*/

-- =====================================================
-- LAYER 1: Multi-Source Data Collection
-- =====================================================

-- Data source types and configurations
CREATE TABLE IF NOT EXISTS data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type text NOT NULL CHECK (source_type IN (
    'chatbot_conversation',
    'chatbot_preform',
    'screenshot_upload',
    'csv_upload',
    'pdf_upload',
    'browser_extension',
    'social_api',
    'website_crawler',
    'manual_input',
    'cross_user_consolidation'
  )),
  source_name text NOT NULL,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  total_ingested integer DEFAULT 0,
  last_ingested_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Universal ingestion queue for all data sources
CREATE TABLE IF NOT EXISTS data_ingestion_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_id uuid REFERENCES data_sources(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  raw_data jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  priority integer DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  retry_count integer DEFAULT 0,
  error_message text,
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Track stats per data source
CREATE TABLE IF NOT EXISTS data_source_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES data_sources(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  total_ingested integer DEFAULT 0,
  total_processed integer DEFAULT 0,
  total_failed integer DEFAULT 0,
  avg_processing_time_ms integer,
  quality_score numeric(5,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_id, date)
);

-- =====================================================
-- LAYER 2: Universal Prospect Normalization
-- =====================================================

-- Enhanced prospects table with 30+ standardized fields
CREATE TABLE IF NOT EXISTS prospects_v10 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  name text,
  email text,
  phone text,
  messenger_id text,
  location text,
  occupation text,
  
  -- Tags and Classification
  interest_tags text[] DEFAULT ARRAY[]::text[],
  product_interest text[] DEFAULT ARRAY[]::text[],
  objection_type text[] DEFAULT ARRAY[]::text[],
  
  -- Financial & Buying
  budget numeric(12,2),
  buying_capacity text CHECK (buying_capacity IN ('low', 'medium', 'high', 'very_high')),
  buying_timeline text CHECK (buying_timeline IN ('immediate', 'this_week', 'this_month', 'this_quarter', 'long_term', 'unknown')),
  
  -- Sentiment & Personality
  sentiment text CHECK (sentiment IN ('very_negative', 'negative', 'neutral', 'positive', 'very_positive')),
  personality_type text CHECK (personality_type IN ('amiable', 'driver', 'expressive', 'analytical', 'unknown')),
  emotion_score numeric(5,2) CHECK (emotion_score BETWEEN 0 AND 100),
  
  -- Relationship & Engagement
  relationship_strength numeric(5,2) CHECK (relationship_strength BETWEEN 0 AND 100),
  past_interactions jsonb DEFAULT '[]'::jsonb,
  last_interaction_at timestamptz,
  
  -- Source & Quality
  channel text,
  source text,
  source_id uuid REFERENCES data_sources(id) ON DELETE SET NULL,
  quality_score numeric(5,2) CHECK (quality_score BETWEEN 0 AND 100),
  
  -- Scoring
  scoutscore_v10 numeric(5,2) CHECK (scoutscore_v10 BETWEEN 0 AND 100),
  confidence_score numeric(5,2) CHECK (confidence_score BETWEEN 0 AND 100),
  hot_prospect_score numeric(5,2) CHECK (hot_prospect_score BETWEEN 0 AND 100),
  
  -- Pipeline
  lead_stage text DEFAULT 'new' CHECK (lead_stage IN ('new', 'contacted', 'qualified', 'nurturing', 'hot', 'closed_won', 'closed_lost')),
  pipeline_stage text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Full text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(occupation, '')), 'B')
  ) STORED
);

-- Extended metadata storage for flexible fields
CREATE TABLE IF NOT EXISTS prospect_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects_v10(id) ON DELETE CASCADE NOT NULL,
  metadata_type text NOT NULL,
  metadata_value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Track prospect deduplication and merging
CREATE TABLE IF NOT EXISTS prospect_merge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  master_prospect_id uuid REFERENCES prospects_v10(id) ON DELETE CASCADE NOT NULL,
  merged_prospect_id uuid NOT NULL,
  merge_reason text,
  merge_confidence numeric(5,2),
  merged_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- LAYER 3: Multi-Pass Scanning Pipeline
-- =====================================================

-- Track 7-pass scanning progress
CREATE TABLE IF NOT EXISTS scan_pipeline_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ingestion_id uuid REFERENCES data_ingestion_queue(id) ON DELETE CASCADE NOT NULL,
  
  -- Pass tracking
  pass_1_clean_extract text DEFAULT 'pending' CHECK (pass_1_clean_extract IN ('pending', 'processing', 'completed', 'failed')),
  pass_2_classification text DEFAULT 'pending' CHECK (pass_2_classification IN ('pending', 'processing', 'completed', 'failed')),
  pass_3_behavior_emotion text DEFAULT 'pending' CHECK (pass_3_behavior_emotion IN ('pending', 'processing', 'completed', 'failed')),
  pass_4_multi_agent text DEFAULT 'pending' CHECK (pass_4_multi_agent IN ('pending', 'processing', 'completed', 'failed')),
  pass_5_fusion text DEFAULT 'pending' CHECK (pass_5_fusion IN ('pending', 'processing', 'completed', 'failed')),
  pass_6_risk_safety text DEFAULT 'pending' CHECK (pass_6_risk_safety IN ('pending', 'processing', 'completed', 'failed')),
  pass_7_final_output text DEFAULT 'pending' CHECK (pass_7_final_output IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Overall status
  overall_status text DEFAULT 'pending' CHECK (overall_status IN ('pending', 'processing', 'completed', 'failed')),
  current_pass integer DEFAULT 1 CHECK (current_pass BETWEEN 1 AND 7),
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  
  -- Timing
  started_at timestamptz,
  completed_at timestamptz,
  total_processing_time_ms integer,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Store results from each scanning pass
CREATE TABLE IF NOT EXISTS scan_pass_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_state_id uuid REFERENCES scan_pipeline_state(id) ON DELETE CASCADE NOT NULL,
  pass_number integer NOT NULL CHECK (pass_number BETWEEN 1 AND 7),
  pass_name text NOT NULL,
  pass_results jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_time_ms integer,
  ai_model_used text,
  tokens_used integer,
  created_at timestamptz DEFAULT now()
);

-- Results from 3 AI specialists in Pass 4
CREATE TABLE IF NOT EXISTS ai_specialist_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_state_id uuid REFERENCES scan_pipeline_state(id) ON DELETE CASCADE NOT NULL,
  specialist_type text NOT NULL CHECK (specialist_type IN ('sales_analyst', 'investigator', 'personality_profiler')),
  specialist_findings jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence_score numeric(5,2) CHECK (confidence_score BETWEEN 0 AND 100),
  processing_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- LAYER 4: Cross-User Crowd Learning (Anonymized)
-- =====================================================

-- Anonymized patterns across all users
CREATE TABLE IF NOT EXISTS crowd_learning_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type text NOT NULL CHECK (pattern_type IN ('name_occupation', 'location_industry', 'objection_product', 'buying_signal', 'personality_trait', 'conversion_path')),
  pattern_key text NOT NULL,
  pattern_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurrence_count integer DEFAULT 1,
  success_rate numeric(5,2),
  industries text[] DEFAULT ARRAY[]::text[],
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(pattern_type, pattern_key)
);

-- Industry-specific learned behaviors
CREATE TABLE IF NOT EXISTS industry_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL,
  intelligence_type text NOT NULL CHECK (intelligence_type IN ('pain_points', 'objections', 'buying_signals', 'personality_distribution', 'pricing_sensitivity', 'timeline_patterns')),
  intelligence_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence_level numeric(5,2) CHECK (confidence_level BETWEEN 0 AND 100),
  sample_size integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(industry, intelligence_type)
);

-- Shared company knowledge graph
CREATE TABLE IF NOT EXISTS company_global_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  company_normalized_name text NOT NULL,
  industry text,
  company_type text,
  common_products text[] DEFAULT ARRAY[]::text[],
  common_objections text[] DEFAULT ARRAY[]::text[],
  typical_buyer_profile jsonb DEFAULT '{}'::jsonb,
  total_mentions integer DEFAULT 1,
  last_mentioned timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_normalized_name)
);

-- Common objections across industries
CREATE TABLE IF NOT EXISTS objection_global_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objection_text text NOT NULL,
  objection_category text NOT NULL,
  industries text[] DEFAULT ARRAY[]::text[],
  frequency integer DEFAULT 1,
  successful_responses jsonb DEFAULT '[]'::jsonb,
  conversion_rate numeric(5,2),
  last_encountered timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- LAYER 5: Multi-Industry Support
-- =====================================================

-- Industry-specific AI model configurations
CREATE TABLE IF NOT EXISTS industry_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL UNIQUE,
  model_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  pain_points text[] DEFAULT ARRAY[]::text[],
  common_objections text[] DEFAULT ARRAY[]::text[],
  buying_signals text[] DEFAULT ARRAY[]::text[],
  personality_weights jsonb DEFAULT '{}'::jsonb,
  scoring_weights jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-tagging rules per industry
CREATE TABLE IF NOT EXISTS industry_tagging_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL,
  rule_name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('keyword', 'pattern', 'ml_classifier', 'sentiment', 'behavior')),
  rule_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  tag_to_apply text NOT NULL,
  confidence_threshold numeric(5,2) DEFAULT 70.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product-to-prospect matching scores
CREATE TABLE IF NOT EXISTS product_prospect_alignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects_v10(id) ON DELETE CASCADE NOT NULL,
  product_id uuid,
  alignment_score numeric(5,2) CHECK (alignment_score BETWEEN 0 AND 100),
  alignment_reasons jsonb DEFAULT '[]'::jsonb,
  recommended_pitch_deck_id uuid,
  recommended_message_template_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- LAYER 7: Continuous Learning Engine
-- =====================================================

-- Track all system learning events
CREATE TABLE IF NOT EXISTS learning_feedback_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('scan_completed', 'prediction_made', 'message_sent', 'pitch_generated', 'conversion', 'objection_handled', 'pipeline_moved', 'outcome_recorded')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects_v10(id) ON DELETE CASCADE,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome text,
  learning_value numeric(5,2),
  created_at timestamptz DEFAULT now()
);

-- Track AI accuracy over time
CREATE TABLE IF NOT EXISTS model_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric(10,4),
  sample_size integer,
  time_period text,
  industry text,
  created_at timestamptz DEFAULT now()
);

-- Store predictions vs actual results
CREATE TABLE IF NOT EXISTS prediction_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects_v10(id) ON DELETE CASCADE NOT NULL,
  prediction_type text NOT NULL CHECK (prediction_type IN ('buying_capacity', 'conversion_probability', 'timeline', 'objection_type', 'personality', 'product_fit')),
  predicted_value jsonb NOT NULL,
  actual_value jsonb,
  prediction_confidence numeric(5,2),
  was_accurate boolean,
  error_margin numeric(10,4),
  created_at timestamptz DEFAULT now(),
  outcome_recorded_at timestamptz
);

-- =====================================================
-- LAYER 8: Compliance & Safety
-- =====================================================

-- Safety and legal filtering rules
CREATE TABLE IF NOT EXISTS compliance_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_type text NOT NULL CHECK (filter_type IN ('sensitive_data', 'prohibited_targeting', 'gdpr', 'pdpa', 'platform_tos')),
  filter_name text NOT NULL,
  filter_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity text DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- GDPR-style audit trail
CREATE TABLE IF NOT EXISTS data_privacy_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('data_collected', 'data_accessed', 'data_modified', 'data_deleted', 'data_exported', 'consent_given', 'consent_revoked')),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action_details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Flag and remove sensitive data
CREATE TABLE IF NOT EXISTS sensitive_data_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects_v10(id) ON DELETE CASCADE,
  detection_type text NOT NULL CHECK (detection_type IN ('religion', 'politics', 'race', 'health', 'financial_account', 'ssn', 'password', 'other_pii')),
  detected_field text NOT NULL,
  detected_value_hash text,
  action_taken text CHECK (action_taken IN ('flagged', 'redacted', 'removed', 'reviewed')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- =====================================================
-- LAYER 10: Scalable Infrastructure
-- =====================================================

-- Separate queues for different workload types
CREATE TABLE IF NOT EXISTS processing_queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_type text NOT NULL CHECK (queue_type IN ('ocr', 'nlp', 'scan', 'deep_scan', 'company_scan', 'product_scan', 'chatbot_conversation')),
  job_id uuid NOT NULL,
  job_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  priority integer DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Cache frequently accessed normalized data
CREATE TABLE IF NOT EXISTS cache_normalized_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  cache_type text NOT NULL CHECK (cache_type IN ('prospect_profile', 'company_info', 'industry_pattern', 'objection_response', 'personality_profile')),
  cached_data jsonb NOT NULL,
  hit_count integer DEFAULT 0,
  last_hit_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Track database partitioning info
CREATE TABLE IF NOT EXISTS partition_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  partition_key text NOT NULL,
  partition_value text NOT NULL,
  row_count integer DEFAULT 0,
  last_analyzed timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Data sources indexes
CREATE INDEX IF NOT EXISTS idx_data_sources_user_id ON data_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_source_type ON data_sources(source_type) WHERE is_active = true;

-- Data ingestion queue indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_queue_user_id ON data_ingestion_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_queue_status ON data_ingestion_queue(status) WHERE status IN ('pending', 'retrying');
CREATE INDEX IF NOT EXISTS idx_ingestion_queue_priority ON data_ingestion_queue(priority DESC, created_at ASC) WHERE status = 'pending';

-- Prospects v10 indexes
CREATE INDEX IF NOT EXISTS idx_prospects_v10_user_id ON prospects_v10(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_v10_lead_stage ON prospects_v10(lead_stage);
CREATE INDEX IF NOT EXISTS idx_prospects_v10_scoutscore ON prospects_v10(scoutscore_v10 DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_prospects_v10_hot_prospect ON prospects_v10(hot_prospect_score DESC NULLS LAST) WHERE hot_prospect_score > 70;
CREATE INDEX IF NOT EXISTS idx_prospects_v10_search ON prospects_v10 USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_prospects_v10_email ON prospects_v10(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospects_v10_phone ON prospects_v10(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospects_v10_created_at ON prospects_v10(created_at DESC);

-- Prospect metadata indexes
CREATE INDEX IF NOT EXISTS idx_prospect_metadata_prospect_id ON prospect_metadata(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_metadata_type ON prospect_metadata(metadata_type);

-- Scan pipeline indexes
CREATE INDEX IF NOT EXISTS idx_scan_pipeline_user_id ON scan_pipeline_state(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_pipeline_status ON scan_pipeline_state(overall_status) WHERE overall_status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_scan_pipeline_ingestion ON scan_pipeline_state(ingestion_id);

-- Crowd learning indexes
CREATE INDEX IF NOT EXISTS idx_crowd_patterns_type_key ON crowd_learning_patterns(pattern_type, pattern_key);
CREATE INDEX IF NOT EXISTS idx_crowd_patterns_occurrence ON crowd_learning_patterns(occurrence_count DESC);
CREATE INDEX IF NOT EXISTS idx_industry_intel_industry ON industry_intelligence(industry);
CREATE INDEX IF NOT EXISTS idx_company_registry_normalized ON company_global_registry(company_normalized_name);

-- Industry model indexes
CREATE INDEX IF NOT EXISTS idx_industry_models_industry ON industry_models(industry) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tagging_rules_industry ON industry_tagging_rules(industry) WHERE is_active = true;

-- Product alignment indexes
CREATE INDEX IF NOT EXISTS idx_product_alignment_prospect ON product_prospect_alignment(prospect_id);
CREATE INDEX IF NOT EXISTS idx_product_alignment_score ON product_prospect_alignment(alignment_score DESC);

-- Learning indexes
CREATE INDEX IF NOT EXISTS idx_feedback_events_type ON learning_feedback_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_events_prospect ON learning_feedback_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_prospect ON prediction_outcomes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_type ON prediction_outcomes(prediction_type);

-- Compliance indexes
CREATE INDEX IF NOT EXISTS idx_compliance_filters_type ON compliance_filters(filter_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_privacy_audit_user ON data_privacy_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensitive_detections_prospect ON sensitive_data_detections(prospect_id);

-- Queue indexes
CREATE INDEX IF NOT EXISTS idx_processing_queues_type_status ON processing_queues(queue_type, status) WHERE status IN ('pending', 'retrying');
CREATE INDEX IF NOT EXISTS idx_processing_queues_priority ON processing_queues(queue_type, priority DESC, created_at ASC) WHERE status = 'pending';

-- Cache indexes
CREATE INDEX IF NOT EXISTS idx_cache_key ON cache_normalized_data(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_normalized_data(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_ingestion_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects_v10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_merge_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_pipeline_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_pass_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_specialist_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowd_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_global_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE objection_global_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_tagging_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prospect_alignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_feedback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_privacy_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitive_data_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_normalized_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE partition_metadata ENABLE ROW LEVEL SECURITY;

-- User-owned data policies
CREATE POLICY "Users can view own data sources"
  ON data_sources FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data sources"
  ON data_sources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data sources"
  ON data_sources FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own data sources"
  ON data_sources FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Similar policies for other user-owned tables
CREATE POLICY "Users can view own ingestion queue"
  ON data_ingestion_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ingestion queue"
  ON data_ingestion_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own prospects v10"
  ON prospects_v10 FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prospects v10"
  ON prospects_v10 FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prospects v10"
  ON prospects_v10 FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prospects v10"
  ON prospects_v10 FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Prospect metadata policies
CREATE POLICY "Users can view own prospect metadata"
  ON prospect_metadata FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM prospects_v10
    WHERE prospects_v10.id = prospect_metadata.prospect_id
    AND prospects_v10.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own prospect metadata"
  ON prospect_metadata FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM prospects_v10
    WHERE prospects_v10.id = prospect_metadata.prospect_id
    AND prospects_v10.user_id = auth.uid()
  ));

-- Scan pipeline policies
CREATE POLICY "Users can view own scan pipeline"
  ON scan_pipeline_state FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan pipeline"
  ON scan_pipeline_state FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Cross-user learning data (READ-ONLY for all authenticated users)
CREATE POLICY "All users can view crowd learning patterns"
  ON crowd_learning_patterns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can view industry intelligence"
  ON industry_intelligence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can view company global registry"
  ON company_global_registry FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can view objection patterns"
  ON objection_global_patterns FOR SELECT
  TO authenticated
  USING (true);

-- Industry models (READ-ONLY for all authenticated users)
CREATE POLICY "All users can view industry models"
  ON industry_models FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "All users can view industry tagging rules"
  ON industry_tagging_rules FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Compliance filters (READ-ONLY for all authenticated users)
CREATE POLICY "All users can view compliance filters"
  ON compliance_filters FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Cache (system managed, read by all)
CREATE POLICY "All users can view cache"
  ON cache_normalized_data FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default industry models
INSERT INTO industry_models (industry, model_config, pain_points, common_objections, buying_signals, is_active)
VALUES 
  ('MLM', 
   '{"focus": "income_opportunity", "urgency_weight": 0.8}'::jsonb,
   ARRAY['income', 'financial_freedom', 'side_hustle', 'passive_income'],
   ARRAY['scam', 'pyramid_scheme', 'no_time', 'too_expensive', 'not_interested'],
   ARRAY['motivated', 'entrepreneurial', 'looking_for_opportunity', 'asked_how_to_join'],
   true),
  ('Insurance',
   '{"focus": "protection", "trust_weight": 0.9}'::jsonb,
   ARRAY['protection', 'security', 'family_safety', 'medical_expenses', 'retirement'],
   ARRAY['too_expensive', 'already_have_insurance', 'dont_need_it', 'will_think_about_it'],
   ARRAY['family_oriented', 'risk_aware', 'financially_stable', 'asked_about_coverage'],
   true),
  ('Real_Estate',
   '{"focus": "investment", "qualification_weight": 0.9}'::jsonb,
   ARRAY['housing', 'investment', 'rental_income', 'property_appreciation'],
   ARRAY['too_expensive', 'no_budget', 'wrong_timing', 'location_concerns'],
   ARRAY['has_income', 'investment_minded', 'asked_about_units', 'inquired_about_price'],
   true),
  ('Small_Business',
   '{"focus": "growth", "roi_weight": 0.85}'::jsonb,
   ARRAY['sales', 'marketing', 'customer_acquisition', 'revenue_growth', 'efficiency'],
   ARRAY['price', 'roi_unclear', 'too_busy', 'already_have_solution'],
   ARRAY['entrepreneurial', 'growth_focused', 'asked_about_features', 'requested_demo'],
   true)
ON CONFLICT (industry) DO NOTHING;

-- Insert default compliance filters
INSERT INTO compliance_filters (filter_type, filter_name, filter_rules, severity, is_active)
VALUES
  ('sensitive_data', 'Religion Detection', '{"patterns": ["religion", "church", "muslim", "christian", "catholic", "buddhist"]}'::jsonb, 'critical', true),
  ('sensitive_data', 'Politics Detection', '{"patterns": ["political", "government", "election", "party", "liberal", "conservative"]}'::jsonb, 'critical', true),
  ('sensitive_data', 'Race Detection', '{"patterns": ["race", "ethnicity", "color", "nationality"]}'::jsonb, 'critical', true),
  ('prohibited_targeting', 'Children Protection', '{"patterns": ["child", "minor", "kid", "under 18"]}'::jsonb, 'critical', true),
  ('gdpr', 'Personal Data Protection', '{"patterns": ["ssn", "passport", "driver_license", "tax_id"]}'::jsonb, 'high', true)
ON CONFLICT DO NOTHING;