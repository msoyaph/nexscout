/*
  # Add Missing Foreign Key Indexes - Existing Tables Only

  1. Performance Improvements
    - Add index for analytics_cohort_membership.cohort_id
    - Add index for company_crawl_pages.company_id
    - Add index for company_embeddings.company_id
    - Add index for company_multi_site_data.company_id
    - Add index for pricing_history.plan_id
  
  2. Security
    - Improves RLS policy performance by supporting efficient foreign key lookups
    - Prevents sequential scans on large tables
*/

-- Analytics tables
CREATE INDEX IF NOT EXISTS idx_analytics_cohort_membership_cohort_id 
  ON analytics_cohort_membership(cohort_id);

-- Company intelligence tables
CREATE INDEX IF NOT EXISTS idx_company_crawl_pages_company_id 
  ON company_crawl_pages(company_id);

CREATE INDEX IF NOT EXISTS idx_company_embeddings_company_id 
  ON company_embeddings(company_id);

CREATE INDEX IF NOT EXISTS idx_company_multi_site_data_company_id 
  ON company_multi_site_data(company_id);

-- Pricing
CREATE INDEX IF NOT EXISTS idx_pricing_history_plan_id 
  ON pricing_history(plan_id);
