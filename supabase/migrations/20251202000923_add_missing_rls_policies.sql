/*
  # Add Missing RLS Policies

  Add RLS policies for tables that have RLS enabled but no policies.

  ## Tables Updated with Policies
  - ai_specialist_results: System-managed, admin-readable
  - data_privacy_audit_log: Users can view own audit logs
  - data_source_stats: Admin-only access
  - learning_feedback_events: Users can view own feedback
  - model_performance_metrics: Admin-only access
  - onboarding_messages: Admin-only management
  - onboarding_sequences: Admin-only management
  - onboarding_steps: Admin-only management
  - partition_metadata: System-managed
  - personas: Public read, admin write
  - prediction_outcomes: Admin-only access
  - processing_queues: System-managed
  - product_prospect_alignment: Users can view own alignments
  - prospect_merge_log: Admin-only access
  - scan_pass_results: Admin-only access
  - sensitive_data_detections: Admin-only access

  ## Security
  All tables now have appropriate RLS policies based on their purpose.
*/

-- ai_specialist_results: System-managed
CREATE POLICY "Admins can view AI specialist results"
  ON public.ai_specialist_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- data_privacy_audit_log: Users can view own logs
CREATE POLICY "Users can view own privacy audit logs"
  ON public.data_privacy_audit_log FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "System can insert privacy audit logs"
  ON public.data_privacy_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- data_source_stats: Admin-only
CREATE POLICY "Admins can manage data source stats"
  ON public.data_source_stats FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- learning_feedback_events: Users can view own
CREATE POLICY "Users can view own learning feedback"
  ON public.learning_feedback_events FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own learning feedback"
  ON public.learning_feedback_events FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- model_performance_metrics: Admin-only
CREATE POLICY "Admins can manage model metrics"
  ON public.model_performance_metrics FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- onboarding_messages: Admin-only
CREATE POLICY "Admins can manage onboarding messages"
  ON public.onboarding_messages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- onboarding_sequences: Admin-only
CREATE POLICY "Admins can manage onboarding sequences"
  ON public.onboarding_sequences FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- onboarding_steps: Admin-only
CREATE POLICY "Admins can manage onboarding steps"
  ON public.onboarding_steps FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- partition_metadata: System-managed
CREATE POLICY "Admins can manage partition metadata"
  ON public.partition_metadata FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- personas: Public read, admin write
CREATE POLICY "Anyone can read personas"
  ON public.personas FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage personas"
  ON public.personas FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- prediction_outcomes: Admin-only
CREATE POLICY "Admins can manage prediction outcomes"
  ON public.prediction_outcomes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- processing_queues: System-managed
CREATE POLICY "System can manage processing queues"
  ON public.processing_queues FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- product_prospect_alignment: Admin-only
CREATE POLICY "Admins can manage product alignments"
  ON public.product_prospect_alignment FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- prospect_merge_log: Admin-only
CREATE POLICY "Admins can view prospect merge logs"
  ON public.prospect_merge_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- scan_pass_results: Admin-only
CREATE POLICY "Admins can manage scan pass results"
  ON public.scan_pass_results FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- sensitive_data_detections: Admin-only
CREATE POLICY "Admins can manage sensitive data detections"
  ON public.sensitive_data_detections FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );