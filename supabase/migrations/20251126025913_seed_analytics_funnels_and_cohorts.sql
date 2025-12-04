/*
  # Seed Analytics Funnels and Cohorts

  Initialize pre-defined funnels and cohorts for immediate use.
*/

-- Insert Pre-Defined Funnels
INSERT INTO analytics_funnels (funnel_name, funnel_category, description, steps) VALUES
(
  'activation_funnel',
  'onboarding',
  'New user activation from signup to first value',
  '["user_signed_up", "onboarding_completed", "prospect_scanned", "ai_message_generated", "prospect_added_pipeline", "dashboard_viewed"]'::jsonb
),
(
  'conversion_funnel',
  'monetization',
  'Free to paid conversion journey',
  '["ai_limit_reached", "paywall_viewed", "upgrade_clicked", "subscription_upgraded"]'::jsonb
),
(
  'churn_funnel',
  'retention',
  'Early warning signs of churn',
  '["no_scan_3_days", "no_messages_5_days", "no_tasks_7_days", "subscription_canceled"]'::jsonb
),
(
  'viral_loop_funnel',
  'growth',
  'Referral and sharing journey',
  '["ai_deck_generated", "app_shared", "referral_link_opened", "user_signed_up"]'::jsonb
),
(
  'power_user_funnel',
  'engagement',
  'Path to becoming a power user',
  '["prospect_scanned", "ai_message_generated", "ai_deck_generated", "training_completed", "mission_completed"]'::jsonb
)
ON CONFLICT (funnel_name) DO NOTHING;

-- Insert Pre-Defined Cohorts
INSERT INTO analytics_user_cohorts (cohort_name, cohort_type, description, definition_criteria) VALUES
(
  'day_1_users',
  'retention',
  'Users who returned on Day 1',
  '{"days_since_signup": 1, "returned": true}'::jsonb
),
(
  'day_7_users',
  'retention',
  'Users who returned on Day 7',
  '{"days_since_signup": 7, "returned": true}'::jsonb
),
(
  'day_30_users',
  'retention',
  'Users who returned on Day 30',
  '{"days_since_signup": 30, "returned": true}'::jsonb
),
(
  'free_tier_users',
  'subscription',
  'Users on free tier',
  '{"subscription_tier": "free"}'::jsonb
),
(
  'pro_tier_users',
  'subscription',
  'Users on pro tier',
  '{"subscription_tier": "pro"}'::jsonb
),
(
  'elite_tier_users',
  'subscription',
  'Users on elite tier',
  '{"subscription_tier": "elite"}'::jsonb
),
(
  'team_tier_users',
  'subscription',
  'Users on team tier',
  '{"subscription_tier": "team"}'::jsonb
),
(
  'deepscan_users',
  'feature',
  'Users who used DeepScan',
  '{"used_feature": "deepscan"}'::jsonb
),
(
  'sequence_users',
  'feature',
  'Users who generated AI sequences',
  '{"used_feature": "ai_sequence"}'::jsonb
),
(
  'swipe_users',
  'feature',
  'Users who used swipe cards',
  '{"used_feature": "swipe_cards"}'::jsonb
),
(
  'training_completers',
  'feature',
  'Users who completed training modules',
  '{"completed_feature": "training"}'::jsonb
),
(
  'referrers',
  'growth',
  'Users who invited others',
  '{"referrals_sent": ">0"}'::jsonb
),
(
  'power_users',
  'engagement',
  'High-engagement users',
  '{"scans_per_day": ">3", "messages_per_day": ">5"}'::jsonb
),
(
  'at_risk_users',
  'churn',
  'Users at risk of churning',
  '{"days_since_last_active": ">5", "engagement_score": "<30"}'::jsonb
)
ON CONFLICT (cohort_name) DO NOTHING;