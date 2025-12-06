/*
  # Optimize Remaining RLS Policies Part 2
  
  ## Purpose
  Complete the optimization of all remaining RLS policies by wrapping
  auth.uid() in subqueries.
  
  ## Tables Covered
  - Sequence and workflow tables
  - Generated content tables
  - User library and settings
  - Notification and reminder tables
  - Scoring and analytics tables
  - All specialty policy tables
*/

DO $$
BEGIN
  -- Sequence steps
  DROP POLICY IF EXISTS "Users can view own sequence steps" ON public.sequence_steps;
  DROP POLICY IF EXISTS "Users can create own sequence steps" ON public.sequence_steps;
  DROP POLICY IF EXISTS "Users can update own sequence steps" ON public.sequence_steps;
  DROP POLICY IF EXISTS "Users can delete own sequence steps" ON public.sequence_steps;
  
  CREATE POLICY "Users can view own sequence steps"
    ON public.sequence_steps FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.message_sequences
        WHERE message_sequences.id = sequence_steps.sequence_id
        AND message_sequences.user_id = (SELECT auth.uid())
      )
    );
    
  CREATE POLICY "Users can create own sequence steps"
    ON public.sequence_steps FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.message_sequences
        WHERE message_sequences.id = sequence_steps.sequence_id
        AND message_sequences.user_id = (SELECT auth.uid())
      )
    );
    
  CREATE POLICY "Users can update own sequence steps"
    ON public.sequence_steps FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.message_sequences
        WHERE message_sequences.id = sequence_steps.sequence_id
        AND message_sequences.user_id = (SELECT auth.uid())
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.message_sequences
        WHERE message_sequences.id = sequence_steps.sequence_id
        AND message_sequences.user_id = (SELECT auth.uid())
      )
    );
    
  CREATE POLICY "Users can delete own sequence steps"
    ON public.sequence_steps FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.message_sequences
        WHERE message_sequences.id = sequence_steps.sequence_id
        AND message_sequences.user_id = (SELECT auth.uid())
      )
    );

  -- Sequence step logs
  DROP POLICY IF EXISTS "Users can view own step logs" ON public.sequence_step_logs;
  DROP POLICY IF EXISTS "Users can create own step logs" ON public.sequence_step_logs;
  DROP POLICY IF EXISTS "Users can update own step logs" ON public.sequence_step_logs;
  
  CREATE POLICY "Users can view own step logs"
    ON public.sequence_step_logs FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can create own step logs"
    ON public.sequence_step_logs FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can update own step logs"
    ON public.sequence_step_logs FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

  -- Generated messages
  DROP POLICY IF EXISTS "Users can view own generated messages" ON public.generated_messages;
  DROP POLICY IF EXISTS "Users can create own generated messages" ON public.generated_messages;
  DROP POLICY IF EXISTS "Users can update own generated messages" ON public.generated_messages;
  DROP POLICY IF EXISTS "Users can delete own generated messages" ON public.generated_messages;
  
  CREATE POLICY "Users can view own generated messages"
    ON public.generated_messages FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can create own generated messages"
    ON public.generated_messages FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can update own generated messages"
    ON public.generated_messages FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can delete own generated messages"
    ON public.generated_messages FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  -- User library
  DROP POLICY IF EXISTS "Users can view own library" ON public.user_library;
  DROP POLICY IF EXISTS "Users can create own library items" ON public.user_library;
  DROP POLICY IF EXISTS "Users can update own library items" ON public.user_library;
  DROP POLICY IF EXISTS "Users can delete own library items" ON public.user_library;
  
  CREATE POLICY "Users can view own library"
    ON public.user_library FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can create own library items"
    ON public.user_library FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can update own library items"
    ON public.user_library FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can delete own library items"
    ON public.user_library FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  -- AI usage limits
  DROP POLICY IF EXISTS "Users can view own usage limits" ON public.ai_usage_limits;
  DROP POLICY IF EXISTS "Users can create own usage limits" ON public.ai_usage_limits;
  DROP POLICY IF EXISTS "Users can update own usage limits" ON public.ai_usage_limits;
  
  CREATE POLICY "Users can view own usage limits"
    ON public.ai_usage_limits FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can create own usage limits"
    ON public.ai_usage_limits FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can update own usage limits"
    ON public.ai_usage_limits FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

  -- Notification settings
  DROP POLICY IF EXISTS "Users can view own notification settings" ON public.notification_settings;
  DROP POLICY IF EXISTS "Users can create own notification settings" ON public.notification_settings;
  DROP POLICY IF EXISTS "Users can update own notification settings" ON public.notification_settings;
  
  CREATE POLICY "Users can view own notification settings"
    ON public.notification_settings FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can create own notification settings"
    ON public.notification_settings FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can update own notification settings"
    ON public.notification_settings FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

  -- Follow-up reminders
  DROP POLICY IF EXISTS "Users can view own follow-up reminders" ON public.follow_up_reminders;
  DROP POLICY IF EXISTS "Users can create own follow-up reminders" ON public.follow_up_reminders;
  DROP POLICY IF EXISTS "Users can update own follow-up reminders" ON public.follow_up_reminders;
  DROP POLICY IF EXISTS "Users can delete own follow-up reminders" ON public.follow_up_reminders;
  
  CREATE POLICY "Users can view own follow-up reminders"
    ON public.follow_up_reminders FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can create own follow-up reminders"
    ON public.follow_up_reminders FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can update own follow-up reminders"
    ON public.follow_up_reminders FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can delete own follow-up reminders"
    ON public.follow_up_reminders FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  -- Daily top prospects
  DROP POLICY IF EXISTS "Users can view own daily top prospects" ON public.daily_top_prospects;
  DROP POLICY IF EXISTS "Users can create own daily top prospects" ON public.daily_top_prospects;
  
  CREATE POLICY "Users can view own daily top prospects"
    ON public.daily_top_prospects FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can create own daily top prospects"
    ON public.daily_top_prospects FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

  -- User streaks
  DROP POLICY IF EXISTS "Users can view own streaks" ON public.user_streaks;
  DROP POLICY IF EXISTS "Users can create own streaks" ON public.user_streaks;
  DROP POLICY IF EXISTS "Users can update own streaks" ON public.user_streaks;
  
  CREATE POLICY "Users can view own streaks"
    ON public.user_streaks FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can create own streaks"
    ON public.user_streaks FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can update own streaks"
    ON public.user_streaks FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

  -- Scoring profiles
  DROP POLICY IF EXISTS "Users can view own scoring profile" ON public.user_scoring_profiles;
  DROP POLICY IF EXISTS "Users can update own scoring profile" ON public.user_scoring_profiles;
  DROP POLICY IF EXISTS "Users can insert own scoring profile" ON public.user_scoring_profiles;
  
  CREATE POLICY "Users can view own scoring profile"
    ON public.user_scoring_profiles FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can update own scoring profile"
    ON public.user_scoring_profiles FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can insert own scoring profile"
    ON public.user_scoring_profiles FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

  -- Prospect feature vectors
  DROP POLICY IF EXISTS "Users can view own prospect features" ON public.prospect_feature_vectors;
  DROP POLICY IF EXISTS "Users can insert own prospect features" ON public.prospect_feature_vectors;
  DROP POLICY IF EXISTS "Users can update own prospect features" ON public.prospect_feature_vectors;
  
  CREATE POLICY "Users can view own prospect features"
    ON public.prospect_feature_vectors FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = prospect_feature_vectors.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );
    
  CREATE POLICY "Users can insert own prospect features"
    ON public.prospect_feature_vectors FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = prospect_feature_vectors.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );
    
  CREATE POLICY "Users can update own prospect features"
    ON public.prospect_feature_vectors FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = prospect_feature_vectors.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = prospect_feature_vectors.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  -- Scoring history
  DROP POLICY IF EXISTS "Users can view own scoring history" ON public.scoring_history;
  DROP POLICY IF EXISTS "System can insert scoring history" ON public.scoring_history;
  
  CREATE POLICY "Users can view own scoring history"
    ON public.scoring_history FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = scoring_history.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );
    
  CREATE POLICY "System can insert scoring history"
    ON public.scoring_history FOR INSERT
    TO authenticated
    WITH CHECK (true);

END $$;
