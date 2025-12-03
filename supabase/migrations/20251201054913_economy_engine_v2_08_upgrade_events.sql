/*
  # Economy Engine 2.0 - Upsell Tracking

  1. New Tables
    - `upgrade_events` - Track upgrade nudge interactions

  2. Changes
    - Nudge types: low_energy, low_coins, pipeline_full, chatbot_limited, pitchdeck_limit
    - Tracks screen and metadata
    - Supports Upgrade Nudge System v2

  3. Security
    - Indexed on user_id for performance
*/

DROP TABLE IF EXISTS upgrade_events CASCADE;

CREATE TABLE upgrade_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nudge_type TEXT NOT NULL,
    screen TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX upgrade_events_user_idx ON upgrade_events(user_id);
