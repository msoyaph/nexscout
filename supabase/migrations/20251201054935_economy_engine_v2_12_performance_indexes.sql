/*
  # Economy Engine 2.0 - Performance Indexes

  1. Changes
    - Adds performance indexes on frequently queried columns
    - Created_at DESC for time-based queries
    - Period indexes for revenue reports

  2. Performance
    - Optimizes transaction history queries
    - Speeds up revenue report generation
*/

CREATE INDEX IF NOT EXISTS coin_tx_created_idx ON coin_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS energy_tx_created_idx ON energy_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS upgrade_events_created_idx ON upgrade_events(created_at DESC);
CREATE INDEX IF NOT EXISTS agent_revenue_period_idx ON agent_revenue_reports(period_start, period_end);
