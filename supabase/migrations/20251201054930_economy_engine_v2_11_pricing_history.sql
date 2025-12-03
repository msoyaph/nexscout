/*
  # Economy Engine 2.0 - Pricing History Audit

  1. New Tables
    - `pricing_history` - Track all pricing changes

  2. Changes
    - Audit trail for SuperAdmin
    - Tracks old/new prices
    - Records who made changes

  3. Security
    - Links to admin_users for accountability
*/

DROP TABLE IF EXISTS pricing_history CASCADE;

CREATE TABLE pricing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id TEXT REFERENCES subscription_plans(id),
    old_price INTEGER,
    new_price INTEGER,
    changed_by UUID REFERENCES admin_users(id),
    changed_at TIMESTAMP DEFAULT NOW()
);
