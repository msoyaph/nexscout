/*
  # Missions and Tasks System

  1. New Tables
    - `missions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `description` (text)
      - `mission_type` (text) - e.g., 'daily_challenge', 'onboarding', 'learning', 'growth'
      - `icon_name` (text) - lucide icon name
      - `color` (text) - hex color code
      - `reward_coins` (integer)
      - `total_required` (integer) - total count needed to complete
      - `current_progress` (integer) - current progress
      - `is_completed` (boolean)
      - `completed_at` (timestamptz)
      - `expires_at` (timestamptz) - for time-limited missions
      - `created_at` (timestamptz)
      - `metadata` (jsonb) - flexible data storage

  2. Security
    - Enable RLS on all tables
    - Users can only access their own missions
    - Policies for select, insert, update

  3. Indexes
    - Index on user_id for faster queries
    - Index on mission_type for filtering
    - Index on is_completed for progress tracking
*/

-- Create missions table
CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  mission_type text NOT NULL DEFAULT 'daily_challenge',
  icon_name text NOT NULL DEFAULT 'Target',
  color text NOT NULL DEFAULT '#1877F2',
  reward_coins integer NOT NULL DEFAULT 0,
  total_required integer NOT NULL DEFAULT 1,
  current_progress integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_missions_user_id ON missions(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(mission_type);
CREATE INDEX IF NOT EXISTS idx_missions_completed ON missions(is_completed);
CREATE INDEX IF NOT EXISTS idx_missions_expires ON missions(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own missions"
  ON missions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own missions"
  ON missions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert missions"
  ON missions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own missions"
  ON missions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update mission progress
CREATE OR REPLACE FUNCTION update_mission_progress(
  p_mission_id uuid,
  p_increment integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mission missions;
  v_coins_awarded integer := 0;
  v_completed boolean := false;
BEGIN
  -- Get current mission
  SELECT * INTO v_mission
  FROM missions
  WHERE id = p_mission_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Mission not found'
    );
  END IF;

  -- Check if already completed
  IF v_mission.is_completed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Mission already completed'
    );
  END IF;

  -- Update progress
  UPDATE missions
  SET
    current_progress = LEAST(current_progress + p_increment, total_required),
    is_completed = (current_progress + p_increment) >= total_required,
    completed_at = CASE
      WHEN (current_progress + p_increment) >= total_required THEN now()
      ELSE completed_at
    END
  WHERE id = p_mission_id
  RETURNING * INTO v_mission;

  -- If mission completed, award coins
  IF v_mission.is_completed THEN
    v_coins_awarded := v_mission.reward_coins;
    v_completed := true;

    -- Update user coins
    UPDATE profiles
    SET coins_balance = COALESCE(coins_balance, 0) + v_coins_awarded
    WHERE id = auth.uid();

    -- Record coin transaction
    INSERT INTO coin_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      related_entity_type,
      related_entity_id
    ) VALUES (
      auth.uid(),
      v_coins_awarded,
      'mission_reward',
      'Completed: ' || v_mission.title,
      'mission',
      v_mission.id
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'mission', row_to_json(v_mission),
    'completed', v_completed,
    'coins_awarded', v_coins_awarded
  );
END;
$$;