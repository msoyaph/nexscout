/*
  # Optimize RLS Auth Functions - Batch 1

  Fix RLS policies to use (select auth.uid()) pattern for better performance.
  This prevents auth function calls from being inlined and improves query plan stability.

  ## Tables Updated
  - activation_checklist_items
  - adaptive_follow_up_sequences
  - ai_agent_settings
  - ai_chat_sessions
  - ai_cost_predictions
  - ai_drafted_messages
  - ai_follow_up_sequences (consolidate duplicate policies)
  - ai_learning_profiles
  - ai_persona_modes
  - ai_prospects
  - ai_scripts_user_defined
  - buyer_timeline_forecasts_v2
  - cached_ai_responses
  - calendar_events

  ## Security
  Maintains existing access control while improving query performance.
*/

-- activation_checklist_items
DROP POLICY IF EXISTS "Super admin can manage checklist items" ON public.activation_checklist_items;
CREATE POLICY "Super admin can manage checklist items"
  ON public.activation_checklist_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
        AND admin_users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
        AND admin_users.is_super_admin = true
    )
  );

-- adaptive_follow_up_sequences
DROP POLICY IF EXISTS "Users can update own sequences" ON public.adaptive_follow_up_sequences;
CREATE POLICY "Users can update own sequences"
  ON public.adaptive_follow_up_sequences
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ai_agent_settings
DROP POLICY IF EXISTS "Users can manage own agent settings" ON public.ai_agent_settings;
CREATE POLICY "Users can manage own agent settings"
  ON public.ai_agent_settings
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ai_chat_sessions
DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.ai_chat_sessions;
CREATE POLICY "Users can update own chat sessions"
  ON public.ai_chat_sessions
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ai_cost_predictions
DROP POLICY IF EXISTS "Users can update own cost predictions" ON public.ai_cost_predictions;
CREATE POLICY "Users can update own cost predictions"
  ON public.ai_cost_predictions
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ai_drafted_messages
DROP POLICY IF EXISTS "Users can update own drafted messages" ON public.ai_drafted_messages;
CREATE POLICY "Users can update own drafted messages"
  ON public.ai_drafted_messages
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ai_follow_up_sequences - consolidate duplicate policies
DROP POLICY IF EXISTS "Users can update own sequences" ON public.ai_follow_up_sequences;
DROP POLICY IF EXISTS "Users manage own follow-up sequences" ON public.ai_follow_up_sequences;
CREATE POLICY "Users manage own follow-up sequences"
  ON public.ai_follow_up_sequences
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ai_learning_profiles
DROP POLICY IF EXISTS "Users can update own learning profiles" ON public.ai_learning_profiles;
CREATE POLICY "Users can update own learning profiles"
  ON public.ai_learning_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ai_persona_modes
DROP POLICY IF EXISTS "Users can update own personas" ON public.ai_persona_modes;
CREATE POLICY "Users can update own personas"
  ON public.ai_persona_modes
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ai_prospects
DROP POLICY IF EXISTS "Users can update own AI prospects" ON public.ai_prospects;
CREATE POLICY "Users can update own AI prospects"
  ON public.ai_prospects
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ai_scripts_user_defined
DROP POLICY IF EXISTS "Users can manage own AI scripts" ON public.ai_scripts_user_defined;
CREATE POLICY "Users can manage own AI scripts"
  ON public.ai_scripts_user_defined
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- buyer_timeline_forecasts_v2
DROP POLICY IF EXISTS "Users can update own timeline forecasts" ON public.buyer_timeline_forecasts_v2;
CREATE POLICY "Users can update own timeline forecasts"
  ON public.buyer_timeline_forecasts_v2
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- cached_ai_responses
DROP POLICY IF EXISTS "Users can update own cached responses" ON public.cached_ai_responses;
CREATE POLICY "Users can update own cached responses"
  ON public.cached_ai_responses
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- calendar_events
DROP POLICY IF EXISTS "Users can update own calendar events" ON public.calendar_events;
CREATE POLICY "Users can update own calendar events"
  ON public.calendar_events
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);