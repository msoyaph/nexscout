/*
  # Add Missing Foreign Key Indexes - Company Tables Batch 1

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in company intelligence and AI systems
    
  2. Indexes Added
    - Company AI systems: company_ai_events, company_ai_safety_flags, company_ai_style_rules
    - Company metadata: company_aliases, company_assets, company_audience_clusters
    - Company conversions: company_conversion_predictions
    - Company crawling: company_crawl_events, company_crawl_history
*/

-- Company AI systems indexes
CREATE INDEX IF NOT EXISTS idx_company_ai_events_company_id ON company_ai_events(company_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_events_prospect_id ON company_ai_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_events_user_id ON company_ai_events(user_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_safety_flags_company_id ON company_ai_safety_flags(company_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_safety_flags_user_id ON company_ai_safety_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_style_rules_company_id ON company_ai_style_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_style_rules_user_id ON company_ai_style_rules(user_id);

-- Company metadata indexes
CREATE INDEX IF NOT EXISTS idx_company_aliases_company_id ON company_aliases(company_id);
CREATE INDEX IF NOT EXISTS idx_company_assets_user_id ON company_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_company_audience_clusters_company_id ON company_audience_clusters(company_id);
CREATE INDEX IF NOT EXISTS idx_company_audience_clusters_user_id ON company_audience_clusters(user_id);

-- Company conversion indexes
CREATE INDEX IF NOT EXISTS idx_company_conversion_predictions_company_id ON company_conversion_predictions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_conversion_predictions_user_id ON company_conversion_predictions(user_id);

-- Company crawl indexes
CREATE INDEX IF NOT EXISTS idx_company_crawl_events_user_id ON company_crawl_events(user_id);
CREATE INDEX IF NOT EXISTS idx_company_crawl_history_user_id ON company_crawl_history(user_id);
