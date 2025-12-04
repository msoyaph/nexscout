/*
  # Fix Unindexed Foreign Keys - Batch 1

  1. Performance Optimization
    - Add indexes for foreign key columns to improve query performance
    - All columns verified to exist in database
    
  2. Tables and Columns Affected
    - admin_data_audit_log: changed_by, record_id
    - admin_products: company_id, owner_id
    - admin_users: user_id, role_id
    - ai_agent_results: prospect_id, scan_id, user_id
    - ai_generations: user_id, prospect_id
    - browser_captures: user_id
    - chatbot_integrations: user_id
    - coin_transactions: user_id
    - company_crawl_pages: company_id, session_id
    - company_embeddings: company_id, user_id, asset_id, extracted_data_id
    
  3. Security
    - All indexes created with IF NOT EXISTS to prevent errors
    - Improves JOIN performance and foreign key constraint checking
*/

-- admin_data_audit_log
CREATE INDEX IF NOT EXISTS idx_admin_data_audit_log_changed_by ON admin_data_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_admin_data_audit_log_record_id ON admin_data_audit_log(record_id);

-- admin_products
CREATE INDEX IF NOT EXISTS idx_admin_products_company_id ON admin_products(company_id);
CREATE INDEX IF NOT EXISTS idx_admin_products_owner_id ON admin_products(owner_id);

-- admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);

-- ai_agent_results
CREATE INDEX IF NOT EXISTS idx_ai_agent_results_prospect_id ON ai_agent_results(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_results_scan_id ON ai_agent_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_results_user_id ON ai_agent_results(user_id);

-- ai_generations
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_prospect_id ON ai_generations(prospect_id);

-- browser_captures
CREATE INDEX IF NOT EXISTS idx_browser_captures_user_id ON browser_captures(user_id);

-- chatbot_integrations
CREATE INDEX IF NOT EXISTS idx_chatbot_integrations_user_id ON chatbot_integrations(user_id);

-- coin_transactions
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);

-- company_crawl_pages
CREATE INDEX IF NOT EXISTS idx_company_crawl_pages_company_id ON company_crawl_pages(company_id);
CREATE INDEX IF NOT EXISTS idx_company_crawl_pages_session_id ON company_crawl_pages(session_id);

-- company_embeddings
CREATE INDEX IF NOT EXISTS idx_company_embeddings_company_id ON company_embeddings(company_id);
CREATE INDEX IF NOT EXISTS idx_company_embeddings_user_id ON company_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_company_embeddings_asset_id ON company_embeddings(asset_id);
CREATE INDEX IF NOT EXISTS idx_company_embeddings_extracted_data_id ON company_embeddings(extracted_data_id);