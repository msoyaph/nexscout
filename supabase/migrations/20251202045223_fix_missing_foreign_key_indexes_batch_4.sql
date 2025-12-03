/*
  # Fix Missing Foreign Key Indexes - Batch 4

  1. Performance Optimization
    - Add indexes for actual foreign key constraints that are missing indexes
    - Critical for JOIN performance and referential integrity checking
    
  2. Tables and Columns Affected (38 foreign keys)
    - admin_products: created_by
    - ai_usage_logs: user_id
    - chatbot_configurations: user_id
    - chatbot_conversations: user_id
    - company_ai_style_rules: user_id
    - company_crawl_events: user_id
    - company_crawl_history: user_id
    - company_knowledge_posts: updated_by
    - company_multi_site_data: company_id
    - company_update_history: reviewed_by
    - constitution_rules: updated_by
    - energy_purchases: user_id
    - enterprise_custom_instructions: created_by
    - enterprise_members: user_id
    - enterprise_orgs: owner_user_id
    - enterprise_sync_records: initiated_by
    - knowledge_graph_snapshots: created_by
    - knowledge_graph_v2: created_by
    - law_proposals: author_user_id
    - lead_source_analytics: user_id
    - learning_feedback_events: user_id
    - offer_matching_rules: created_by
    - org_playbooks: created_by
    - pending_coin_transactions: user_id
    - product_cleaning_records: reviewed_by
    - product_prospect_alignment: user_id
    - product_usage_analytics: user_id
    - prospect_merge_log: user_id
    - realtime_engine_events: user_id
    - referral_events: referred_user_id
    - sales_playbooks: created_by
    - scraper_logs: user_id
    - selling_scripts: created_by
    - sensitive_data_detections: reviewed_by
    - team_custom_instructions: created_by
    - team_members: owner_user_id, user_id
    - team_subscriptions: owner_user_id
    
  3. Security
    - All indexes created with IF NOT EXISTS
    - Prevents duplicate index errors
    - Significantly improves foreign key constraint validation performance
*/

CREATE INDEX IF NOT EXISTS idx_admin_products_created_by ON admin_products(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_configurations_user_id ON chatbot_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_style_rules_user_id ON company_ai_style_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_company_crawl_events_user_id ON company_crawl_events(user_id);
CREATE INDEX IF NOT EXISTS idx_company_crawl_history_user_id ON company_crawl_history(user_id);
CREATE INDEX IF NOT EXISTS idx_company_knowledge_posts_updated_by ON company_knowledge_posts(updated_by);
CREATE INDEX IF NOT EXISTS idx_company_multi_site_data_company_id ON company_multi_site_data(company_id);
CREATE INDEX IF NOT EXISTS idx_company_update_history_reviewed_by ON company_update_history(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_constitution_rules_updated_by ON constitution_rules(updated_by);
CREATE INDEX IF NOT EXISTS idx_energy_purchases_user_id ON energy_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_custom_instructions_created_by ON enterprise_custom_instructions(created_by);
CREATE INDEX IF NOT EXISTS idx_enterprise_members_user_id ON enterprise_members(user_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_orgs_owner_user_id ON enterprise_orgs(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_sync_records_initiated_by ON enterprise_sync_records(initiated_by);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_snapshots_created_by ON knowledge_graph_snapshots(created_by);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_v2_created_by ON knowledge_graph_v2(created_by);
CREATE INDEX IF NOT EXISTS idx_law_proposals_author_user_id ON law_proposals(author_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_source_analytics_user_id ON lead_source_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_feedback_events_user_id ON learning_feedback_events(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_matching_rules_created_by ON offer_matching_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_org_playbooks_created_by ON org_playbooks(created_by);
CREATE INDEX IF NOT EXISTS idx_pending_coin_transactions_user_id ON pending_coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_product_cleaning_records_reviewed_by ON product_cleaning_records(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_product_prospect_alignment_user_id ON product_prospect_alignment(user_id);
CREATE INDEX IF NOT EXISTS idx_product_usage_analytics_user_id ON product_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_merge_log_user_id ON prospect_merge_log(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_engine_events_user_id ON realtime_engine_events(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_referred_user_id ON referral_events(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_playbooks_created_by ON sales_playbooks(created_by);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_user_id ON scraper_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_selling_scripts_created_by ON selling_scripts(created_by);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_detections_reviewed_by ON sensitive_data_detections(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_team_custom_instructions_created_by ON team_custom_instructions(created_by);
CREATE INDEX IF NOT EXISTS idx_team_members_owner_user_id ON team_members(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_subscriptions_owner_user_id ON team_subscriptions(owner_user_id);