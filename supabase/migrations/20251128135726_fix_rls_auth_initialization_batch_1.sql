/*
  # Fix RLS Auth Initialization - Batch 1

  1. Purpose
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - Prevents re-evaluation of auth function for each row
    - Significantly improves query performance at scale
  
  2. Tables Fixed
    - user_company_links
    - company_crawl_events
    - company_crawl_history
*/

-- Fix user_company_links policies
DROP POLICY IF EXISTS "Users can manage own company links" ON user_company_links;
DROP POLICY IF EXISTS "Users can view own company links" ON user_company_links;

CREATE POLICY "Users can manage own company links"
  ON user_company_links FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view own company links"
  ON user_company_links FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix company_crawl_events policies
DROP POLICY IF EXISTS "Users can insert own crawl events" ON company_crawl_events;
DROP POLICY IF EXISTS "Users can view own crawl events" ON company_crawl_events;

CREATE POLICY "Users can insert own crawl events"
  ON company_crawl_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view own crawl events"
  ON company_crawl_events FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix company_crawl_history policies
DROP POLICY IF EXISTS "Users can insert own crawl history" ON company_crawl_history;
DROP POLICY IF EXISTS "Users can view own crawl history" ON company_crawl_history;

CREATE POLICY "Users can insert own crawl history"
  ON company_crawl_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view own crawl history"
  ON company_crawl_history FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));
