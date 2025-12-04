/*
  # Update Team Billing Schema
  
  Updates existing team_subscriptions and team_members tables to support
  Economy 2.0 billing requirements.
*/

-- Add missing columns to team_subscriptions
ALTER TABLE team_subscriptions 
ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS seats_included int DEFAULT 5,
ADD COLUMN IF NOT EXISTS seats_used int DEFAULT 1,
ADD COLUMN IF NOT EXISTS extra_seats int DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_price int DEFAULT 4990,
ADD COLUMN IF NOT EXISTS extra_seat_price int DEFAULT 899,
ADD COLUMN IF NOT EXISTS billing_cycle_start date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS billing_cycle_end date DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add check constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'team_subscriptions_status_check'
  ) THEN
    ALTER TABLE team_subscriptions 
    ADD CONSTRAINT team_subscriptions_status_check 
    CHECK (status IN ('active', 'past_due', 'canceled', 'suspended'));
  END IF;
END $$;

-- Update owner_user_id from team_leader_id if NULL
UPDATE team_subscriptions 
SET owner_user_id = team_leader_id 
WHERE owner_user_id IS NULL AND team_leader_id IS NOT NULL;

-- Update seats_used from used_seats if available
UPDATE team_subscriptions 
SET seats_used = used_seats 
WHERE seats_used IS NULL AND used_seats IS NOT NULL;

-- Add missing columns to team_members
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS invited_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add check constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'team_members_status_check'
  ) THEN
    ALTER TABLE team_members 
    ADD CONSTRAINT team_members_status_check 
    CHECK (status IN ('pending', 'active', 'inactive', 'removed'));
  END IF;
END $$;

-- Update owner_user_id by joining with team_subscriptions
UPDATE team_members tm
SET owner_user_id = ts.owner_user_id
FROM team_subscriptions ts
WHERE tm.team_id = ts.id AND tm.owner_user_id IS NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_team_subscriptions_owner_v2 ON team_subscriptions(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_owner_v2 ON team_members(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);