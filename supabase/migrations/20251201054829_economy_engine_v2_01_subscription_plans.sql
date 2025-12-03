/*
  # Economy Engine 2.0 - Subscription Plans

  1. New Tables
    - `subscription_plans` - New tier structure (Free, Pro, Team, Enterprise)

  2. Changes
    - Drops old subscription_plans if exists
    - New pricing: Free ₱0, Pro ₱1,299, Team ₱4,990, Enterprise ₱30,000
    - Team includes 5 seats, ₱899 per extra seat
    - Enterprise includes 1000 seats

  3. Security
    - Basic table creation, RLS will be added after
*/

-- Drop old plans
DROP TABLE IF EXISTS subscription_plans CASCADE;

CREATE TABLE subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly INTEGER NOT NULL,
    seats_included INTEGER DEFAULT 1,
    extra_seat_price INTEGER DEFAULT 0,
    is_team BOOLEAN DEFAULT FALSE,
    is_enterprise BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert new plan structure
INSERT INTO subscription_plans (id, name, description, price_monthly, seats_included, extra_seat_price, is_team, is_enterprise)
VALUES
('free', 'Free', 'Basic AI starter pack', 0, 1, 0, FALSE, FALSE),
('pro', 'Pro', 'Your AI sales partner', 1299, 1, 0, FALSE, FALSE),
('team', 'Team Leader Pack', 'Grow and automate your team', 4990, 5, 899, TRUE, FALSE),
('enterprise', 'Enterprise', 'Corporate AI sales system', 30000, 1000, 0, TRUE, TRUE);
