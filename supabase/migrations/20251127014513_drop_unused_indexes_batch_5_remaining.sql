/*
  # Drop Unused Indexes - Batch 5 (Remaining)

  1. Performance Optimization
    - Final cleanup of unused indexes
*/

DROP INDEX IF EXISTS public.idx_social_graph_nodes_user_id;
DROP INDEX IF EXISTS public.idx_social_graph_nodes_cluster_id;
DROP INDEX IF EXISTS public.idx_social_graph_nodes_influence_score;
DROP INDEX IF EXISTS public.idx_social_graph_nodes_platform;
DROP INDEX IF EXISTS public.idx_social_graph_edges_user_id;
DROP INDEX IF EXISTS public.idx_social_graph_edges_from_node;
DROP INDEX IF EXISTS public.idx_social_graph_edges_to_node;
DROP INDEX IF EXISTS public.idx_social_graph_edges_type;
DROP INDEX IF EXISTS public.idx_social_graph_edges_recency;
DROP INDEX IF EXISTS public.idx_browser_captures_user_id;
DROP INDEX IF EXISTS public.idx_browser_captures_created_at;
DROP INDEX IF EXISTS public.idx_browser_captures_platform;
DROP INDEX IF EXISTS public.idx_browser_captures_capture_type;
DROP INDEX IF EXISTS public.idx_browser_extension_tokens_user_id;
DROP INDEX IF EXISTS public.idx_browser_extension_tokens_token;
DROP INDEX IF EXISTS public.idx_social_identities_user_id;
DROP INDEX IF EXISTS public.idx_social_identities_provider;
DROP INDEX IF EXISTS public.idx_social_page_insights_user_id;
DROP INDEX IF EXISTS public.idx_social_page_insights_platform;
DROP INDEX IF EXISTS public.idx_linkedin_page_insights_user_id;
DROP INDEX IF EXISTS public.idx_tiktok_insights_user_id;
DROP INDEX IF EXISTS public.idx_twitter_insights_user_id;
DROP INDEX IF EXISTS public.idx_analytics_experiment_assignments_experiment_id;
DROP INDEX IF EXISTS public.idx_analytics_experiment_assignments_variant_id;
DROP INDEX IF EXISTS public.idx_analytics_experiment_results_variant_id;
DROP INDEX IF EXISTS public.idx_analytics_experiments_created_by;
DROP INDEX IF EXISTS public.idx_analytics_insights_acknowledged_by;
DROP INDEX IF EXISTS public.idx_analytics_page_views_user_id;
DROP INDEX IF EXISTS public.idx_analytics_recommendations_insight_id;
DROP INDEX IF EXISTS public.idx_analytics_user_journey_user_id;
DROP INDEX IF EXISTS public.idx_enterprise_organizations_admin_user_id;
DROP INDEX IF EXISTS public.idx_team_members_user_id;
DROP INDEX IF EXISTS public.idx_team_subscriptions_subscription_id;
DROP INDEX IF EXISTS public.idx_team_subscriptions_team_leader_id;
DROP INDEX IF EXISTS public.idx_invoices_payment_id;
DROP INDEX IF EXISTS public.idx_payment_history_subscription_id;
DROP INDEX IF EXISTS public.idx_user_subscriptions_plan_id;
DROP INDEX IF EXISTS public.idx_user_badges_badge_id;
DROP INDEX IF EXISTS public.idx_scan_smartness_events_user_id;
DROP INDEX IF EXISTS public.idx_social_graph_insights_user_id;
DROP INDEX IF EXISTS public.idx_social_graph_insights_created_at;
DROP INDEX IF EXISTS public.idx_social_connect_logs_user_id;
DROP INDEX IF EXISTS public.idx_social_connect_logs_action;
DROP INDEX IF EXISTS public.idx_scan_progress_scan_id;
DROP INDEX IF EXISTS public.idx_scan_progress_updated_at;
DROP INDEX IF EXISTS public.idx_scan_extracted_data_scan_id;
DROP INDEX IF EXISTS public.idx_scan_results_scan_id;
DROP INDEX IF EXISTS public.idx_scraper_logs_user_id;
DROP INDEX IF EXISTS public.idx_scraper_logs_platform;
DROP INDEX IF EXISTS public.idx_scraper_logs_status;
DROP INDEX IF EXISTS public.idx_scraper_logs_created_at;
