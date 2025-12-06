/*
  # Optimize Specialty RLS Policies
  
  ## Purpose
  Optimize all remaining RLS policies for specialty tables with
  shorthand policy names and complex access patterns.
  
  ## Tables Covered
  - All "_policy" named policies
  - Schedule, missions, about content
  - Company products
  - Coach recommendations
  - Analytics tables
*/

DO $$
BEGIN
  -- Specialty policy tables
  DROP POLICY IF EXISTS "qual_policy" ON public.prospect_qualifications;
  CREATE POLICY "qual_policy"
    ON public.prospect_qualifications FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = prospect_qualifications.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "pain_policy" ON public.pain_point_analyses;
  CREATE POLICY "pain_policy"
    ON public.pain_point_analyses FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = pain_point_analyses.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "pers_policy" ON public.personality_profiles;
  CREATE POLICY "pers_policy"
    ON public.personality_profiles FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = personality_profiles.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "pipe_policy" ON public.pipeline_stage_changes;
  CREATE POLICY "pipe_policy"
    ON public.pipeline_stage_changes FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = pipeline_stage_changes.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "downline_policy" ON public.downline_members;
  CREATE POLICY "downline_policy"
    ON public.downline_members FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = leader_user_id);

  DROP POLICY IF EXISTS "coach_policy" ON public.coaching_sessions;
  CREATE POLICY "coach_policy"
    ON public.coaching_sessions FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = leader_user_id);

  DROP POLICY IF EXISTS "closing_policy" ON public.closing_scripts;
  CREATE POLICY "closing_policy"
    ON public.closing_scripts FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = closing_scripts.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "financial_policy" ON public.financial_profiles;
  CREATE POLICY "financial_policy"
    ON public.financial_profiles FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = financial_profiles.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "pitch_policy" ON public.pitch_angle_recommendations;
  CREATE POLICY "pitch_policy"
    ON public.pitch_angle_recommendations FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = pitch_angle_recommendations.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "viral_policy" ON public.viral_share_messages;
  CREATE POLICY "viral_policy"
    ON public.viral_share_messages FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "user_badges_policy" ON public.user_badges;
  CREATE POLICY "user_badges_policy"
    ON public.user_badges FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "ranks_policy" ON public.user_ranks;
  CREATE POLICY "ranks_policy"
    ON public.user_ranks FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "activity_policy" ON public.user_activity_logs;
  CREATE POLICY "activity_policy"
    ON public.user_activity_logs FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "conv_policy" ON public.conversation_analyses;
  CREATE POLICY "conv_policy"
    ON public.conversation_analyses FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = conversation_analyses.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "platform_policy" ON public.prospect_platform_sources;
  CREATE POLICY "platform_policy"
    ON public.prospect_platform_sources FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = prospect_platform_sources.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "sync_log_policy" ON public.platform_sync_logs;
  CREATE POLICY "sync_log_policy"
    ON public.platform_sync_logs FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "meeting_policy" ON public.meeting_predictions;
  CREATE POLICY "meeting_policy"
    ON public.meeting_predictions FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = meeting_predictions.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "hot_lead_policy" ON public.hot_lead_accelerations;
  CREATE POLICY "hot_lead_policy"
    ON public.hot_lead_accelerations FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = hot_lead_accelerations.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "plan_policy" ON public.daily_action_plans;
  CREATE POLICY "plan_policy"
    ON public.daily_action_plans FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "mentor_policy" ON public.ai_mentor_sessions;
  CREATE POLICY "mentor_policy"
    ON public.ai_mentor_sessions FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "forecast_policy" ON public.deal_timeline_forecasts;
  CREATE POLICY "forecast_policy"
    ON public.deal_timeline_forecasts FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = deal_timeline_forecasts.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "emotion_policy" ON public.emotional_state_analyses;
  CREATE POLICY "emotion_policy"
    ON public.emotional_state_analyses FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = emotional_state_analyses.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "lesson_policy" ON public.masterclass_lessons;
  CREATE POLICY "lesson_policy"
    ON public.masterclass_lessons FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "report_policy" ON public.team_performance_reports;
  CREATE POLICY "report_policy"
    ON public.team_performance_reports FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = leader_id);

  DROP POLICY IF EXISTS "intent_policy" ON public.social_intent_predictions;
  CREATE POLICY "intent_policy"
    ON public.social_intent_predictions FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = social_intent_predictions.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "neuro_policy" ON public.neural_behavior_scores;
  CREATE POLICY "neuro_policy"
    ON public.neural_behavior_scores FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = neural_behavior_scores.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "voice_policy" ON public.voice_note_analyses;
  CREATE POLICY "voice_policy"
    ON public.voice_note_analyses FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = voice_note_analyses.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "closer_policy" ON public.ai_closer_sessions;
  CREATE POLICY "closer_policy"
    ON public.ai_closer_sessions FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "enterprise_policy" ON public.enterprise_analytics;
  CREATE POLICY "enterprise_policy"
    ON public.enterprise_analytics FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "persona_policy" ON public.user_personas;
  CREATE POLICY "persona_policy"
    ON public.user_personas FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "script_policy" ON public.generated_scripts;
  CREATE POLICY "script_policy"
    ON public.generated_scripts FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "viral_policy" ON public.viral_video_scripts;
  CREATE POLICY "viral_policy"
    ON public.viral_video_scripts FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "video_policy" ON public.video_pitch_scripts;
  CREATE POLICY "video_policy"
    ON public.video_pitch_scripts FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "learning_policy" ON public.persona_learning_logs;
  CREATE POLICY "learning_policy"
    ON public.persona_learning_logs FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "story_policy" ON public.story_messages;
  CREATE POLICY "story_policy"
    ON public.story_messages FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = story_messages.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "training_owner_policy" ON public.training_video_modules;
  CREATE POLICY "training_owner_policy"
    ON public.training_video_modules FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "industry_persona_policy" ON public.industry_persona_profiles;
  CREATE POLICY "industry_persona_policy"
    ON public.industry_persona_profiles FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "emotion_policy" ON public.emotion_enhanced_messages;
  CREATE POLICY "emotion_policy"
    ON public.emotion_enhanced_messages FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "playbook_policy" ON public.leadership_playbooks;
  CREATE POLICY "playbook_policy"
    ON public.leadership_playbooks FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "training_policy" ON public.team_training_programs;
  CREATE POLICY "training_policy"
    ON public.team_training_programs FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = leader_id);

  DROP POLICY IF EXISTS "call_sim_policy" ON public.sales_call_simulations;
  CREATE POLICY "call_sim_policy"
    ON public.sales_call_simulations FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "scoutscore_policy" ON public.scoutscore_calculations;
  CREATE POLICY "scoutscore_policy"
    ON public.scoutscore_calculations FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = scoutscore_calculations.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "nurture_policy" ON public.lead_nurture_pathways;
  CREATE POLICY "nurture_policy"
    ON public.lead_nurture_pathways FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.prospects
        WHERE prospects.id = lead_nurture_pathways.prospect_id
        AND prospects.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "skill_gap_policy" ON public.agent_skill_gaps;
  CREATE POLICY "skill_gap_policy"
    ON public.agent_skill_gaps FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  DROP POLICY IF EXISTS "productivity_policy" ON public.daily_productivity_plans;
  CREATE POLICY "productivity_policy"
    ON public.daily_productivity_plans FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  -- Schedule events
  DROP POLICY IF EXISTS "Users can view own schedule" ON public.schedule_events;
  DROP POLICY IF EXISTS "Users can insert own events" ON public.schedule_events;
  DROP POLICY IF EXISTS "Users can update own events" ON public.schedule_events;
  DROP POLICY IF EXISTS "Users can delete own events" ON public.schedule_events;
  
  CREATE POLICY "Users can view own schedule"
    ON public.schedule_events FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can insert own events"
    ON public.schedule_events FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can update own events"
    ON public.schedule_events FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can delete own events"
    ON public.schedule_events FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  -- Missions
  DROP POLICY IF EXISTS "Service role can insert missions" ON public.missions;
  CREATE POLICY "Service role can insert missions"
    ON public.missions FOR INSERT
    TO authenticated
    WITH CHECK (true);

  -- User about content
  DROP POLICY IF EXISTS "Users can view own about content" ON public.user_about_content;
  DROP POLICY IF EXISTS "Users can insert own about content" ON public.user_about_content;
  DROP POLICY IF EXISTS "Users can update own about content" ON public.user_about_content;
  
  CREATE POLICY "Users can view own about content"
    ON public.user_about_content FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can insert own about content"
    ON public.user_about_content FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can update own about content"
    ON public.user_about_content FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

  -- Company products
  DROP POLICY IF EXISTS "Users can view own company products" ON public.company_products;
  DROP POLICY IF EXISTS "Users can insert own company products" ON public.company_products;
  DROP POLICY IF EXISTS "Users can update own company products" ON public.company_products;
  DROP POLICY IF EXISTS "Users can delete own company products" ON public.company_products;
  
  CREATE POLICY "Users can view own company products"
    ON public.company_products FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can insert own company products"
    ON public.company_products FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can update own company products"
    ON public.company_products FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can delete own company products"
    ON public.company_products FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  -- AI coach recommendations
  DROP POLICY IF EXISTS "Users can view own coach recommendations" ON public.ai_coach_recommendations;
  DROP POLICY IF EXISTS "Users can insert own coach recommendations" ON public.ai_coach_recommendations;
  DROP POLICY IF EXISTS "Users can update own coach recommendations" ON public.ai_coach_recommendations;
  
  CREATE POLICY "Users can view own coach recommendations"
    ON public.ai_coach_recommendations FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can insert own coach recommendations"
    ON public.ai_coach_recommendations FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
    
  CREATE POLICY "Users can update own coach recommendations"
    ON public.ai_coach_recommendations FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

  -- Analytics tables (all super admin)
  DROP POLICY IF EXISTS "Super admins access events" ON public.analytics_events;
  CREATE POLICY "Super admins access events"
    ON public.analytics_events FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access sessions" ON public.analytics_sessions;
  CREATE POLICY "Super admins access sessions"
    ON public.analytics_sessions FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access summary" ON public.analytics_daily_summary;
  CREATE POLICY "Super admins access summary"
    ON public.analytics_daily_summary FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access features" ON public.analytics_feature_usage;
  CREATE POLICY "Super admins access features"
    ON public.analytics_feature_usage FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access pages" ON public.analytics_page_views;
  CREATE POLICY "Super admins access pages"
    ON public.analytics_page_views FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access journey" ON public.analytics_user_journey;
  CREATE POLICY "Super admins access journey"
    ON public.analytics_user_journey FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access cohorts" ON public.analytics_user_cohorts;
  CREATE POLICY "Super admins access cohorts"
    ON public.analytics_user_cohorts FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access membership" ON public.analytics_cohort_membership;
  CREATE POLICY "Super admins access membership"
    ON public.analytics_cohort_membership FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access retention" ON public.analytics_retention_metrics;
  CREATE POLICY "Super admins access retention"
    ON public.analytics_retention_metrics FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access funnels" ON public.analytics_funnels;
  CREATE POLICY "Super admins access funnels"
    ON public.analytics_funnels FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access funnel_steps" ON public.analytics_funnel_steps;
  CREATE POLICY "Super admins access funnel_steps"
    ON public.analytics_funnel_steps FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access funnel_perf" ON public.analytics_funnel_performance;
  CREATE POLICY "Super admins access funnel_perf"
    ON public.analytics_funnel_performance FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access signals" ON public.analytics_prediction_signals;
  CREATE POLICY "Super admins access signals"
    ON public.analytics_prediction_signals FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access scores" ON public.analytics_user_scores;
  CREATE POLICY "Super admins access scores"
    ON public.analytics_user_scores FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access insights" ON public.analytics_insights;
  CREATE POLICY "Super admins access insights"
    ON public.analytics_insights FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access recommendations" ON public.analytics_recommendations;
  CREATE POLICY "Super admins access recommendations"
    ON public.analytics_recommendations FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access experiments" ON public.analytics_experiments;
  CREATE POLICY "Super admins access experiments"
    ON public.analytics_experiments FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access variants" ON public.analytics_experiment_variants;
  CREATE POLICY "Super admins access variants"
    ON public.analytics_experiment_variants FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access assignments" ON public.analytics_experiment_assignments;
  CREATE POLICY "Super admins access assignments"
    ON public.analytics_experiment_assignments FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins access results" ON public.analytics_experiment_results;
  CREATE POLICY "Super admins access results"
    ON public.analytics_experiment_results FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

  DROP POLICY IF EXISTS "Super admins can access insight history" ON public.insight_assistant_history;
  CREATE POLICY "Super admins can access insight history"
    ON public.insight_assistant_history FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = (SELECT auth.uid())
      )
    );

END $$;
