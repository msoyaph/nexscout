/*
  # Economy Engine 2.0 - User Subscriptions

  1. New Tables
    - `user_subscriptions` - Individual user subscription tracking

  2. Changes
    - Supports Team & Enterprise ownership
    - Tracks renewal and cancellation dates
    - Links to subscription_plans

  3. Security
    - Indexed on user_id for performance
*/

DROP TABLE IF EXISTS user_subscriptions CASCADE;

CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES subscription_plans(id),
    is_team_owner BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    renews_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX user_subscriptions_user_id_idx ON user_subscriptions(user_id);
