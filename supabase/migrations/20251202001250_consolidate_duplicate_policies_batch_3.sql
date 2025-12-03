/*
  # Consolidate Duplicate RLS Policies - Batch 3

  Continue removing duplicate permissive policies.

  ## Tables Updated
  - missions: 5 policies -> 2 policies
  - file_documents: 5 policies -> 2 policies
  - file_intelligence_scan_queue: 5 policies -> 2 policies
  - chatbot_training_data: 5 policies -> 2 policies
  - company_multi_site_data: 5 policies -> 2 policies
  - file_intelligence_uploaded_files: 5 policies -> 2 policies

  ## Security
  Maintains same access control with simplified policy structure.
*/

-- missions: Consolidate user policies, keep service role separate
DROP POLICY IF EXISTS "Users can delete own missions" ON public.missions;
DROP POLICY IF EXISTS "Users can insert own missions" ON public.missions;
DROP POLICY IF EXISTS "Users can update own missions" ON public.missions;
DROP POLICY IF EXISTS "Users can view own missions" ON public.missions;

CREATE POLICY "Users manage own missions"
  ON public.missions FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- file_documents: Consolidate user policies, keep service role separate
DROP POLICY IF EXISTS "Users can delete own file documents" ON public.file_documents;
DROP POLICY IF EXISTS "Users can insert own file documents" ON public.file_documents;
DROP POLICY IF EXISTS "Users can update own file documents" ON public.file_documents;
DROP POLICY IF EXISTS "Users can view own file documents" ON public.file_documents;

CREATE POLICY "Users manage own file documents"
  ON public.file_documents FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- file_intelligence_scan_queue: Consolidate user policies, remove duplicate service role
DROP POLICY IF EXISTS "Service role full access queue" ON public.file_intelligence_scan_queue;
DROP POLICY IF EXISTS "Users can insert own queue items" ON public.file_intelligence_scan_queue;
DROP POLICY IF EXISTS "Users can update own queue items" ON public.file_intelligence_scan_queue;
DROP POLICY IF EXISTS "Users can view own queue items" ON public.file_intelligence_scan_queue;

CREATE POLICY "Users manage own queue items"
  ON public.file_intelligence_scan_queue FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chatbot_training_data: Consolidate user policies, keep public separate
DROP POLICY IF EXISTS "Users can delete own training data" ON public.chatbot_training_data;
DROP POLICY IF EXISTS "Users can insert own training data" ON public.chatbot_training_data;
DROP POLICY IF EXISTS "Users can view own training data" ON public.chatbot_training_data;
-- "Users manage own training data" already exists from earlier migration

-- company_multi_site_data: Consolidate user policies, keep service role separate
DROP POLICY IF EXISTS "Users can delete their company multi-site data" ON public.company_multi_site_data;
DROP POLICY IF EXISTS "Users can insert their company multi-site data" ON public.company_multi_site_data;
DROP POLICY IF EXISTS "Users can update their company multi-site data" ON public.company_multi_site_data;
DROP POLICY IF EXISTS "Users can view their company multi-site data" ON public.company_multi_site_data;

CREATE POLICY "Users manage their company multi-site data"
  ON public.company_multi_site_data FOR ALL TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR company_id IN (
      SELECT id FROM company_profiles
      WHERE user_id = (SELECT auth.uid())
    )
    OR company_id IS NULL
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR company_id IN (
      SELECT id FROM company_profiles
      WHERE user_id = (SELECT auth.uid())
    )
    OR company_id IS NULL
  );

-- file_intelligence_uploaded_files: Consolidate user policies, remove duplicate service role
DROP POLICY IF EXISTS "Service role full access uploaded files" ON public.file_intelligence_uploaded_files;
DROP POLICY IF EXISTS "Users can insert own uploaded files" ON public.file_intelligence_uploaded_files;
DROP POLICY IF EXISTS "Users can update own uploaded files" ON public.file_intelligence_uploaded_files;
DROP POLICY IF EXISTS "Users can view own uploaded files" ON public.file_intelligence_uploaded_files;

CREATE POLICY "Users manage own uploaded files"
  ON public.file_intelligence_uploaded_files FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);