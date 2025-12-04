/*
  # Remove Unused Indexes - Batch 2

  Continue dropping unused indexes.

  ## Indexes Removed
  - idx_kg_graph_data (knowledge_graph_snapshots)
  - idx_omr_conditions (offer_matching_rules)
  - idx_clusters_members (product_clusters)
  - idx_scraper_logs_user_id (scraper_logs)
  - idx_company_multi_site_data_company_id (company_multi_site_data)
  - idx_constitution_rules_key (constitution_rules)
  - idx_crisis_policies_engine_id (crisis_policies)
  - idx_taxonomy_tags (taxonomy_entities)
  - idx_playbooks_scripts (sales_playbooks)

  ## Security
  These indexes are unused and safe to remove.
*/

-- knowledge_graph_snapshots
DROP INDEX IF EXISTS public.idx_kg_graph_data;

-- offer_matching_rules
DROP INDEX IF EXISTS public.idx_omr_conditions;

-- product_clusters
DROP INDEX IF EXISTS public.idx_clusters_members;

-- scraper_logs
DROP INDEX IF EXISTS public.idx_scraper_logs_user_id;

-- company_multi_site_data
DROP INDEX IF EXISTS public.idx_company_multi_site_data_company_id;

-- constitution_rules
DROP INDEX IF EXISTS public.idx_constitution_rules_key;

-- crisis_policies
DROP INDEX IF EXISTS public.idx_crisis_policies_engine_id;

-- taxonomy_entities
DROP INDEX IF EXISTS public.idx_taxonomy_tags;

-- sales_playbooks
DROP INDEX IF EXISTS public.idx_playbooks_scripts;