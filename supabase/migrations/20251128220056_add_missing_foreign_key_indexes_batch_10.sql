/*
  # Add Missing Foreign Key Indexes - Batch 10

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in mission, neural, and objection systems
    
  2. Indexes Added
    - Mission: mission_completions
    - Neural: neural_behavior_scores
    - Objection: objection_responses
    - Omni-channel: omni_channel_followups, omni_messages, omnichannel_event_queue
    - Pain point: pain_point_analyses
    - Payment: payment_history
    - Pending transactions: pending_coin_transactions
*/

-- Mission indexes
CREATE INDEX IF NOT EXISTS idx_mission_completions_user_id ON mission_completions(user_id);

-- Neural indexes
CREATE INDEX IF NOT EXISTS idx_neural_behavior_scores_user_id ON neural_behavior_scores(user_id);

-- Objection indexes
CREATE INDEX IF NOT EXISTS idx_objection_responses_prospect_id ON objection_responses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_objection_responses_user_id ON objection_responses(user_id);

-- Omni-channel indexes
CREATE INDEX IF NOT EXISTS idx_omni_channel_followups_identity_id ON omni_channel_followups(identity_id);
CREATE INDEX IF NOT EXISTS idx_omni_channel_followups_user_id ON omni_channel_followups(user_id);
CREATE INDEX IF NOT EXISTS idx_omni_messages_identity_id ON omni_messages(identity_id);
CREATE INDEX IF NOT EXISTS idx_omnichannel_event_queue_prospect_id ON omnichannel_event_queue(prospect_id);

-- Pain point indexes
CREATE INDEX IF NOT EXISTS idx_pain_point_analyses_prospect_id ON pain_point_analyses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_pain_point_analyses_user_id ON pain_point_analyses(user_id);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);

-- Pending transaction indexes
CREATE INDEX IF NOT EXISTS idx_pending_coin_transactions_user_id ON pending_coin_transactions(user_id);
