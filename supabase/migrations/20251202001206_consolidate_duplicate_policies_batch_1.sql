/*
  # Consolidate Duplicate RLS Policies - Batch 1

  Remove duplicate permissive policies and consolidate into single ALL policies.
  Multiple permissive policies are combined with OR, which can be simplified.

  ## Tables Updated
  - scan_sessions: 8 policies -> 1 policy
  - calendar_events: 8 policies -> 1 policy
  - uploaded_files: 8 policies -> 1 policy
  - ai_messages_library: 8 policies -> 1 policy
  - pitch_decks: 6 policies -> 2 policies (user + public)
  - company_profiles: 6 policies -> 2 policies (user + public)

  ## Security
  Maintains same access control with simplified policy structure.
*/

-- scan_sessions: Consolidate all 8 policies
DROP POLICY IF EXISTS "Users can create own sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can insert own scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can update own scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can view own scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users manage own scan sessions" ON public.scan_sessions;

CREATE POLICY "Users manage own scan sessions"
  ON public.scan_sessions FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- calendar_events: Consolidate all 8 policies
DROP POLICY IF EXISTS "Users can create own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can view own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can view own events" ON public.calendar_events;

CREATE POLICY "Users manage own calendar events"
  ON public.calendar_events FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- uploaded_files: Consolidate all 8 policies
DROP POLICY IF EXISTS "Users can delete own files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can delete own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can insert own files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can insert own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can update own files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can update own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can view own files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can view own uploaded files" ON public.uploaded_files;

CREATE POLICY "Users manage own uploaded files"
  ON public.uploaded_files FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ai_messages_library: Consolidate all 8 policies
DROP POLICY IF EXISTS "Users can delete own AI messages" ON public.ai_messages_library;
DROP POLICY IF EXISTS "Users can delete own library messages" ON public.ai_messages_library;
DROP POLICY IF EXISTS "Users can insert own AI messages" ON public.ai_messages_library;
DROP POLICY IF EXISTS "Users can insert own library messages" ON public.ai_messages_library;
DROP POLICY IF EXISTS "Users can update own AI messages" ON public.ai_messages_library;
DROP POLICY IF EXISTS "Users can update own library messages" ON public.ai_messages_library;
DROP POLICY IF EXISTS "Users can view own AI messages" ON public.ai_messages_library;
DROP POLICY IF EXISTS "Users can view own library messages" ON public.ai_messages_library;

CREATE POLICY "Users manage own library messages"
  ON public.ai_messages_library FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- pitch_decks: Consolidate 5 user policies, keep public policy separate
DROP POLICY IF EXISTS "Users can create own pitch decks" ON public.pitch_decks;
DROP POLICY IF EXISTS "Users can delete own pitch decks" ON public.pitch_decks;
DROP POLICY IF EXISTS "Users can insert own pitch decks" ON public.pitch_decks;
DROP POLICY IF EXISTS "Users can update own pitch decks" ON public.pitch_decks;
DROP POLICY IF EXISTS "Users can view own pitch decks" ON public.pitch_decks;

CREATE POLICY "Users manage own pitch decks"
  ON public.pitch_decks FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- company_profiles: Consolidate 5 user policies, keep public policy separate
DROP POLICY IF EXISTS "Users can delete own company profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can insert own company profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can update own company profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can view own company profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Users manage own company profiles" ON public.company_profiles;

CREATE POLICY "Users manage own company profiles"
  ON public.company_profiles FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);