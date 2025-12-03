/*
  # Economy Engine 2.0 - Team System

  1. New Tables
    - `team_subscriptions` - Team billing and seat management
    - `team_members` - Team member tracking

  2. Changes
    - Team owner can manage seats
    - Extra seats billed at ₱899/seat
    - Member status: pending/active/removed
    - 30-day billing cycles

  3. Security
    - Indexed on team_id for performance
*/

DROP TABLE IF EXISTS team_subscriptions CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;

CREATE TABLE team_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seats_included INTEGER DEFAULT 5,
    extra_seats INTEGER DEFAULT 0,
    extra_seat_price INTEGER DEFAULT 899,
    billing_cycle_start DATE DEFAULT CURRENT_DATE,
    billing_cycle_end DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES team_subscriptions(id) ON DELETE CASCADE,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    email TEXT NOT NULL,
    role TEXT DEFAULT 'agent',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX team_members_team_id_idx ON team_members(team_id);
