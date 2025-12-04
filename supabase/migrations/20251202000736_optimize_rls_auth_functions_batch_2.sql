/*
  # Optimize RLS Auth Functions - Batch 2

  Continue fixing RLS policies to use (select auth.uid()) pattern.

  ## Tables Updated
  - call_scripts
  - channel_effectiveness_scores
  - channel_queue_state
  - chatbot_analytics (consolidate duplicate)
  - chatbot_appointment_slots
  - chatbot_automation_settings
  - chatbot_configurations
  - chatbot_conversations
  - chatbot_integrations
  - chatbot_links
  - chatbot_settings (consolidate duplicate)
  - chatbot_to_prospect_pipeline
  - chatbot_training_data (consolidate duplicate)
  - closing_stage_progressions
  - coaching_events
  - collaborative_message_sessions
  - company_ai_safety_flags
  - company_ai_style_rules
  - company_assets
  - company_audience_clusters
  - company_brain_state
  - company_crawl_sessions
  - company_experiments
  - company_extracted_data
  - company_intelligence_v2
  - company_multi_site_data
  - company_onboarding_progress

  ## Security
  Maintains existing access control while improving query performance.
*/

-- call_scripts
DROP POLICY IF EXISTS "Users can update own call scripts" ON public.call_scripts;
CREATE POLICY "Users can update own call scripts"
  ON public.call_scripts FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- channel_effectiveness_scores
DROP POLICY IF EXISTS "Users can update own effectiveness scores" ON public.channel_effectiveness_scores;
CREATE POLICY "Users can update own effectiveness scores"
  ON public.channel_effectiveness_scores FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- channel_queue_state
DROP POLICY IF EXISTS "Users can update own queue" ON public.channel_queue_state;
CREATE POLICY "Users can update own queue"
  ON public.channel_queue_state FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chatbot_analytics - consolidate
DROP POLICY IF EXISTS "Users can update own analytics" ON public.chatbot_analytics;
DROP POLICY IF EXISTS "Users manage own analytics" ON public.chatbot_analytics;
CREATE POLICY "Users manage own analytics"
  ON public.chatbot_analytics FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chatbot_appointment_slots
DROP POLICY IF EXISTS "Users can update own appointment slots" ON public.chatbot_appointment_slots;
CREATE POLICY "Users can update own appointment slots"
  ON public.chatbot_appointment_slots FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chatbot_automation_settings
DROP POLICY IF EXISTS "Users can update own automation settings" ON public.chatbot_automation_settings;
CREATE POLICY "Users can update own automation settings"
  ON public.chatbot_automation_settings FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chatbot_configurations
DROP POLICY IF EXISTS "Users can update own chatbot config" ON public.chatbot_configurations;
CREATE POLICY "Users can update own chatbot config"
  ON public.chatbot_configurations FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chatbot_conversations
DROP POLICY IF EXISTS "Users can update own conversations" ON public.chatbot_conversations;
CREATE POLICY "Users can update own conversations"
  ON public.chatbot_conversations FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chatbot_integrations
DROP POLICY IF EXISTS "Users can update own integrations" ON public.chatbot_integrations;
CREATE POLICY "Users can update own integrations"
  ON public.chatbot_integrations FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chatbot_links
DROP POLICY IF EXISTS "Users can update own chatbot links" ON public.chatbot_links;
CREATE POLICY "Users can update own chatbot links"
  ON public.chatbot_links FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chatbot_settings - consolidate
DROP POLICY IF EXISTS "Users can manage own chatbot settings" ON public.chatbot_settings;
DROP POLICY IF EXISTS "Users can update own chatbot settings" ON public.chatbot_settings;
CREATE POLICY "Users can manage own chatbot settings"
  ON public.chatbot_settings FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chatbot_to_prospect_pipeline
DROP POLICY IF EXISTS "Users can update own pipeline entries" ON public.chatbot_to_prospect_pipeline;
CREATE POLICY "Users can update own pipeline entries"
  ON public.chatbot_to_prospect_pipeline FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chatbot_training_data - consolidate
DROP POLICY IF EXISTS "Users can update own training data" ON public.chatbot_training_data;
DROP POLICY IF EXISTS "Users manage own training data" ON public.chatbot_training_data;
CREATE POLICY "Users manage own training data"
  ON public.chatbot_training_data FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- closing_stage_progressions
DROP POLICY IF EXISTS "Users can update own progressions" ON public.closing_stage_progressions;
CREATE POLICY "Users can update own progressions"
  ON public.closing_stage_progressions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- coaching_events
DROP POLICY IF EXISTS "Users can update own coaching events" ON public.coaching_events;
CREATE POLICY "Users can update own coaching events"
  ON public.coaching_events FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- collaborative_message_sessions
DROP POLICY IF EXISTS "Users can update own collaborative sessions" ON public.collaborative_message_sessions;
CREATE POLICY "Users can update own collaborative sessions"
  ON public.collaborative_message_sessions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- company_ai_safety_flags
DROP POLICY IF EXISTS "Users can update own safety flags" ON public.company_ai_safety_flags;
CREATE POLICY "Users can update own safety flags"
  ON public.company_ai_safety_flags FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- company_ai_style_rules
DROP POLICY IF EXISTS "Users can update own style rules" ON public.company_ai_style_rules;
CREATE POLICY "Users can update own style rules"
  ON public.company_ai_style_rules FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- company_assets
DROP POLICY IF EXISTS "Users can update own company assets" ON public.company_assets;
CREATE POLICY "Users can update own company assets"
  ON public.company_assets FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- company_audience_clusters
DROP POLICY IF EXISTS "Users can update own audience clusters" ON public.company_audience_clusters;
CREATE POLICY "Users can update own audience clusters"
  ON public.company_audience_clusters FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- company_brain_state
DROP POLICY IF EXISTS "Users can update own brain state" ON public.company_brain_state;
CREATE POLICY "Users can update own brain state"
  ON public.company_brain_state FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- company_crawl_sessions
DROP POLICY IF EXISTS "Users can update own crawl sessions" ON public.company_crawl_sessions;
CREATE POLICY "Users can update own crawl sessions"
  ON public.company_crawl_sessions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- company_experiments
DROP POLICY IF EXISTS "Users can update own experiments" ON public.company_experiments;
CREATE POLICY "Users can update own experiments"
  ON public.company_experiments FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- company_extracted_data
DROP POLICY IF EXISTS "Users can update own extracted data" ON public.company_extracted_data;
CREATE POLICY "Users can update own extracted data"
  ON public.company_extracted_data FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- company_intelligence_v2
DROP POLICY IF EXISTS "Users can update own intelligence" ON public.company_intelligence_v2;
CREATE POLICY "Users can update own intelligence"
  ON public.company_intelligence_v2 FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- company_multi_site_data
DROP POLICY IF EXISTS "Users can update their company multi-site data" ON public.company_multi_site_data;
CREATE POLICY "Users can update their company multi-site data"
  ON public.company_multi_site_data FOR UPDATE TO authenticated
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

-- company_onboarding_progress
DROP POLICY IF EXISTS "Users can update own onboarding progress" ON public.company_onboarding_progress;
CREATE POLICY "Users can update own onboarding progress"
  ON public.company_onboarding_progress FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);