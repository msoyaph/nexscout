/*
  # Add Missing Foreign Key Indexes - Batch 15 (Final)

  1. Performance Enhancement
    - Add indexes for remaining unindexed foreign keys in social and subscription systems
    
  2. Indexes Added
    - Social connect: social_connect_logs
    - Social contacts: social_contact_features, social_contacts
    - Social edges: social_edges
    - Social graph: social_graph_edges, social_graph_insights, social_graph_nodes
    - Social intent: social_intent_predictions
    - Social interactions: social_interactions
    - Social media: social_media_replies
    - Social pages: social_page_insights
    - Story: story_messages
    - Style: style_matching_vectors
    - Subscription: subscription_events
    - System: system_logs
    - Team: team_subscriptions, team_training_programs
    - TikTok: tiktok_insights
*/

-- Social connect indexes
CREATE INDEX IF NOT EXISTS idx_social_connect_logs_user_id ON social_connect_logs(user_id);

-- Social contact indexes
CREATE INDEX IF NOT EXISTS idx_social_contact_features_user_id ON social_contact_features(user_id);
CREATE INDEX IF NOT EXISTS idx_social_contacts_user_id ON social_contacts(user_id);

-- Social edge indexes
CREATE INDEX IF NOT EXISTS idx_social_edges_from_contact_id ON social_edges(from_contact_id);
CREATE INDEX IF NOT EXISTS idx_social_edges_to_contact_id ON social_edges(to_contact_id);
CREATE INDEX IF NOT EXISTS idx_social_edges_user_id ON social_edges(user_id);

-- Social graph indexes
CREATE INDEX IF NOT EXISTS idx_social_graph_edges_user_id ON social_graph_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_social_graph_insights_user_id ON social_graph_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_social_graph_nodes_user_id ON social_graph_nodes(user_id);

-- Social intent indexes
CREATE INDEX IF NOT EXISTS idx_social_intent_predictions_prospect_id ON social_intent_predictions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_social_intent_predictions_user_id ON social_intent_predictions(user_id);

-- Social interaction indexes
CREATE INDEX IF NOT EXISTS idx_social_interactions_contact_id ON social_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_social_interactions_user_id ON social_interactions(user_id);

-- Social media indexes
CREATE INDEX IF NOT EXISTS idx_social_media_replies_prospect_id ON social_media_replies(prospect_id);
CREATE INDEX IF NOT EXISTS idx_social_media_replies_user_id ON social_media_replies(user_id);

-- Social page indexes
CREATE INDEX IF NOT EXISTS idx_social_page_insights_user_id ON social_page_insights(user_id);

-- Story indexes
CREATE INDEX IF NOT EXISTS idx_story_messages_prospect_id ON story_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_story_messages_user_id ON story_messages(user_id);

-- Style indexes
CREATE INDEX IF NOT EXISTS idx_style_matching_vectors_user_id ON style_matching_vectors(user_id);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);

-- System indexes
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- Team indexes
CREATE INDEX IF NOT EXISTS idx_team_subscriptions_subscription_id ON team_subscriptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_team_subscriptions_team_leader_id ON team_subscriptions(team_leader_id);
CREATE INDEX IF NOT EXISTS idx_team_training_programs_leader_id ON team_training_programs(leader_id);

-- TikTok indexes
CREATE INDEX IF NOT EXISTS idx_tiktok_insights_user_id ON tiktok_insights(user_id);
