/*
  # Add Verified Foreign Key Indexes - Batch 3

  1. Purpose
    - Continue adding indexes to foreign key columns
    - Focus on company intelligence tables

  2. Security Impact
    - Ensures efficient company data queries
    - Prevents performance bottlenecks
*/

-- Company AI events and safety
CREATE INDEX IF NOT EXISTS idx_company_ai_events_company_id 
  ON company_ai_events(company_id);

CREATE INDEX IF NOT EXISTS idx_company_ai_events_prospect_id 
  ON company_ai_events(prospect_id);

CREATE INDEX IF NOT EXISTS idx_company_ai_safety_flags_company_id 
  ON company_ai_safety_flags(company_id);

CREATE INDEX IF NOT EXISTS idx_company_ai_style_rules_company_id 
  ON company_ai_style_rules(company_id);

CREATE INDEX IF NOT EXISTS idx_company_aliases_company_id 
  ON company_aliases(company_id);

-- Company audience and brain
CREATE INDEX IF NOT EXISTS idx_company_audience_clusters_company_id 
  ON company_audience_clusters(company_id);

CREATE INDEX IF NOT EXISTS idx_company_brain_state_company_id 
  ON company_brain_state(company_id);

CREATE INDEX IF NOT EXISTS idx_company_conversion_predictions_company_id 
  ON company_conversion_predictions(company_id);

-- Company crawl pages and sessions
CREATE INDEX IF NOT EXISTS idx_company_crawl_pages_company_id 
  ON company_crawl_pages(company_id);

CREATE INDEX IF NOT EXISTS idx_company_crawl_pages_session_id 
  ON company_crawl_pages(session_id);

CREATE INDEX IF NOT EXISTS idx_company_crawl_sessions_company_id 
  ON company_crawl_sessions(company_id);

CREATE INDEX IF NOT EXISTS idx_company_crawl_sessions_intelligence_id 
  ON company_crawl_sessions(intelligence_id);

-- Company detected forms
CREATE INDEX IF NOT EXISTS idx_company_detected_forms_company_id 
  ON company_detected_forms(company_id);

CREATE INDEX IF NOT EXISTS idx_company_detected_forms_session_id 
  ON company_detected_forms(session_id);

-- Company embeddings
CREATE INDEX IF NOT EXISTS idx_company_embeddings_asset_id 
  ON company_embeddings(asset_id);

CREATE INDEX IF NOT EXISTS idx_company_embeddings_company_id 
  ON company_embeddings(company_id);

-- Company experiments
CREATE INDEX IF NOT EXISTS idx_company_experiment_variants_experiment_id 
  ON company_experiment_variants(experiment_id);

CREATE INDEX IF NOT EXISTS idx_company_experiments_company_id 
  ON company_experiments(company_id);

-- Company extracted data and images
CREATE INDEX IF NOT EXISTS idx_company_extracted_data_asset_id 
  ON company_extracted_data(asset_id);

CREATE INDEX IF NOT EXISTS idx_company_image_intelligence_asset_id 
  ON company_image_intelligence(asset_id);

CREATE INDEX IF NOT EXISTS idx_company_image_intelligence_company_id 
  ON company_image_intelligence(company_id);

-- Company intelligence MLM and pages
CREATE INDEX IF NOT EXISTS idx_company_intelligence_mlm_intelligence_id 
  ON company_intelligence_mlm(intelligence_id);

CREATE INDEX IF NOT EXISTS idx_company_intelligence_pages_intelligence_id 
  ON company_intelligence_pages(intelligence_id);

CREATE INDEX IF NOT EXISTS idx_company_intelligence_products_intelligence_id 
  ON company_intelligence_products(intelligence_id);

CREATE INDEX IF NOT EXISTS idx_company_intelligence_v2_company_id 
  ON company_intelligence_v2(company_id);

-- Company knowledge graphs and lead flows
CREATE INDEX IF NOT EXISTS idx_company_knowledge_graphs_company_id 
  ON company_knowledge_graphs(company_id);

CREATE INDEX IF NOT EXISTS idx_company_lead_flows_company_id 
  ON company_lead_flows(company_id);

CREATE INDEX IF NOT EXISTS idx_company_lead_flows_session_id 
  ON company_lead_flows(session_id);

-- Company multi-site and persona learning
CREATE INDEX IF NOT EXISTS idx_company_multi_site_data_company_id 
  ON company_multi_site_data(company_id);

CREATE INDEX IF NOT EXISTS idx_company_persona_learning_logs_company_id 
  ON company_persona_learning_logs(company_id);

CREATE INDEX IF NOT EXISTS idx_company_persona_learning_logs_persona_id 
  ON company_persona_learning_logs(persona_id);
