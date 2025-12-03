/*
  # Optimize RLS Auth Functions - Batch 1

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - Prevents function inlining and improves query performance
    - Allows PostgreSQL to cache auth results per transaction
    
  2. Tables Affected (Batch 1)
    - admin_data_audit_log
    - admin_products
    - admin_users
    - ai_agent_results
    - ai_generations
    - browser_captures
    - chatbot_integrations
    - coin_transactions
    - company_crawl_pages
    - company_embeddings
    
  3. Security
    - Maintains same security constraints
    - Improves query performance significantly
    - No security reduction, only performance improvement
*/

-- admin_data_audit_log
DROP POLICY IF EXISTS "Users can view own audit logs" ON admin_data_audit_log;
CREATE POLICY "Users can view own audit logs"
  ON admin_data_audit_log FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = changed_by);

-- admin_products
DROP POLICY IF EXISTS "Users can view own products" ON admin_products;
DROP POLICY IF EXISTS "Users can insert own products" ON admin_products;
DROP POLICY IF EXISTS "Users can update own products" ON admin_products;
DROP POLICY IF EXISTS "Users can delete own products" ON admin_products;

CREATE POLICY "Users can view own products"
  ON admin_products FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = owner_id);

CREATE POLICY "Users can insert own products"
  ON admin_products FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Users can update own products"
  ON admin_products FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Users can delete own products"
  ON admin_products FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_id);

-- ai_agent_results
DROP POLICY IF EXISTS "Users can view own ai results" ON ai_agent_results;
DROP POLICY IF EXISTS "Users can insert own ai results" ON ai_agent_results;

CREATE POLICY "Users can view own ai results"
  ON ai_agent_results FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own ai results"
  ON ai_agent_results FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- ai_generations
DROP POLICY IF EXISTS "Users can view own ai generations" ON ai_generations;
DROP POLICY IF EXISTS "Users can insert own ai generations" ON ai_generations;

CREATE POLICY "Users can view own ai generations"
  ON ai_generations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own ai generations"
  ON ai_generations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- browser_captures
DROP POLICY IF EXISTS "Users can view own captures" ON browser_captures;
DROP POLICY IF EXISTS "Users can insert own captures" ON browser_captures;
DROP POLICY IF EXISTS "Users can update own captures" ON browser_captures;

CREATE POLICY "Users can view own captures"
  ON browser_captures FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own captures"
  ON browser_captures FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own captures"
  ON browser_captures FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- chatbot_integrations
DROP POLICY IF EXISTS "Users can view own integrations" ON chatbot_integrations;
DROP POLICY IF EXISTS "Users can insert own integrations" ON chatbot_integrations;
DROP POLICY IF EXISTS "Users can update own integrations" ON chatbot_integrations;

CREATE POLICY "Users can view own integrations"
  ON chatbot_integrations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own integrations"
  ON chatbot_integrations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own integrations"
  ON chatbot_integrations FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- coin_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON coin_transactions;

CREATE POLICY "Users can view own transactions"
  ON coin_transactions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own transactions"
  ON coin_transactions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- company_crawl_pages
DROP POLICY IF EXISTS "Users can view own company pages" ON company_crawl_pages;
DROP POLICY IF EXISTS "Users can insert own company pages" ON company_crawl_pages;

CREATE POLICY "Users can view own company pages"
  ON company_crawl_pages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = company_crawl_pages.company_id
      AND company_profiles.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own company pages"
  ON company_crawl_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = company_crawl_pages.company_id
      AND company_profiles.user_id = (select auth.uid())
    )
  );

-- company_embeddings
DROP POLICY IF EXISTS "Users can view own embeddings" ON company_embeddings;
DROP POLICY IF EXISTS "Users can insert own embeddings" ON company_embeddings;

CREATE POLICY "Users can view own embeddings"
  ON company_embeddings FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own embeddings"
  ON company_embeddings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);