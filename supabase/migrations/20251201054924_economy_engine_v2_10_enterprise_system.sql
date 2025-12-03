/*
  # Economy Engine 2.0 - Enterprise System

  1. New Tables
    - `enterprise_orgs` - Enterprise organization management
    - `enterprise_members` - Enterprise member tracking

  2. Changes
    - 1000 seats allowed per org
    - Role-based member management
    - Company name tracking

  3. Security
    - Indexed on org_id for performance
*/

DROP TABLE IF EXISTS enterprise_orgs CASCADE;
DROP TABLE IF EXISTS enterprise_members CASCADE;

CREATE TABLE enterprise_orgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID REFERENCES auth.users(id),
    company_name TEXT NOT NULL,
    seats_allowed INTEGER DEFAULT 1000,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE enterprise_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES enterprise_orgs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    role TEXT DEFAULT 'agent',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX enterprise_members_org_idx ON enterprise_members(org_id);
