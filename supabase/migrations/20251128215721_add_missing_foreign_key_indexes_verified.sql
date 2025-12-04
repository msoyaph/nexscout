/*
  # Add Missing Foreign Key Indexes (Verified)

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys identified through database analysis
    - Improves query performance for RLS policies and JOIN operations
    
  2. Indexes Added
    - analytics_events.user_id
    - coin_transactions.user_id
    - notifications.related_prospect_id
    - notifications.related_sequence_id
    - pitch_decks.prospect_id
    - scan_progress.scan_id
    - scan_sessions.user_id
    - uploaded_files.batch_id
    - user_subscriptions.plan_id
*/

-- Analytics system
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

-- Coin economy
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);

-- Notifications system
CREATE INDEX IF NOT EXISTS idx_notifications_related_prospect_id ON notifications(related_prospect_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_sequence_id ON notifications(related_sequence_id);

-- Pitch decks
CREATE INDEX IF NOT EXISTS idx_pitch_decks_prospect_id ON pitch_decks(prospect_id);

-- Scanning system
CREATE INDEX IF NOT EXISTS idx_scan_progress_scan_id ON scan_progress(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_id ON scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_batch_id ON uploaded_files(batch_id);

-- Subscription system
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
