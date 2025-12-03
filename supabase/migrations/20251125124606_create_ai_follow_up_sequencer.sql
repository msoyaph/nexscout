/*
  # AI Follow-Up Sequencer Engine

  1. New Tables
    - `follow_up_sequences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `prospect_id` (uuid, references prospects)
      - `prospect_name` (text)
      - `sequence_type` (text: recruit, sell, follow_up, reconnect, book_call, nurture)
      - `goal` (text)
      - `tone` (text: friendly, professional, warm, direct)
      - `user_industry` (text: mlm, insurance, real_estate, product)
      - `steps` (jsonb array of sequence steps)
      - `step_count` (integer)
      - `total_duration_days` (integer)
      - `status` (text: draft, active, paused, completed)
      - `current_step` (integer, default 0)
      - `activated_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `prospect_context_snapshot` (jsonb)
      - `scoutscore_context` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `sequence_step_logs`
      - `id` (uuid, primary key)
      - `sequence_id` (uuid, references follow_up_sequences)
      - `step_number` (integer)
      - `sent_at` (timestamptz)
      - `delivered` (boolean)
      - `read` (boolean)
      - `responded` (boolean)
      - `response_text` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own sequences
    - Add policies for authenticated users

  3. Integration Points
    - Links to prospects table
    - Links to follow_up_reminders table
    - Links to coin_transactions table
    - Links to notifications table
*/

-- Create follow_up_sequences table
CREATE TABLE IF NOT EXISTS follow_up_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  sequence_type text NOT NULL CHECK (sequence_type IN ('recruit', 'sell', 'follow_up', 'reconnect', 'book_call', 'nurture')),
  goal text NOT NULL,
  tone text NOT NULL CHECK (tone IN ('friendly', 'professional', 'warm', 'direct')),
  user_industry text CHECK (user_industry IN ('mlm', 'insurance', 'real_estate', 'product')),
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  step_count integer NOT NULL DEFAULT 0,
  total_duration_days integer DEFAULT 7,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  current_step integer NOT NULL DEFAULT 0,
  locked boolean DEFAULT false,
  upgrade_prompt text,
  activated_at timestamptz,
  completed_at timestamptz,
  paused_at timestamptz,
  prospect_context_snapshot jsonb DEFAULT '{}'::jsonb,
  scoutscore_context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sequence_step_logs table
CREATE TABLE IF NOT EXISTS sequence_step_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES follow_up_sequences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  message_content text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  scheduled_for timestamptz,
  delivered boolean DEFAULT false,
  read boolean DEFAULT false,
  responded boolean DEFAULT false,
  response_text text,
  response_sentiment text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sequences_user_id ON follow_up_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_sequences_prospect_id ON follow_up_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_sequences_status ON follow_up_sequences(status);
CREATE INDEX IF NOT EXISTS idx_sequences_activated_at ON follow_up_sequences(activated_at);
CREATE INDEX IF NOT EXISTS idx_step_logs_sequence_id ON sequence_step_logs(sequence_id);
CREATE INDEX IF NOT EXISTS idx_step_logs_sent_at ON sequence_step_logs(sent_at);

-- Enable RLS
ALTER TABLE follow_up_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_step_logs ENABLE ROW LEVEL SECURITY;

-- Policies for follow_up_sequences
CREATE POLICY "Users can view own sequences"
  ON follow_up_sequences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sequences"
  ON follow_up_sequences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sequences"
  ON follow_up_sequences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sequences"
  ON follow_up_sequences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for sequence_step_logs
CREATE POLICY "Users can view own step logs"
  ON sequence_step_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own step logs"
  ON sequence_step_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own step logs"
  ON sequence_step_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sequences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_sequences_timestamp ON follow_up_sequences;
CREATE TRIGGER update_sequences_timestamp
  BEFORE UPDATE ON follow_up_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_sequences_updated_at();

-- Add weekly_sequences_used to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'weekly_sequences_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN weekly_sequences_used integer DEFAULT 0;
  END IF;
END $$;

-- Function to create follow-up reminders from sequence steps
CREATE OR REPLACE FUNCTION create_sequence_reminders(
  p_sequence_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
DECLARE
  v_sequence record;
  v_step jsonb;
  v_step_number integer;
  v_reminder_date timestamptz;
BEGIN
  -- Get sequence
  SELECT * INTO v_sequence
  FROM follow_up_sequences
  WHERE id = p_sequence_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Loop through steps and create reminders
  FOR v_step IN SELECT * FROM jsonb_array_elements(v_sequence.steps)
  LOOP
    v_step_number := (v_step->>'stepNumber')::integer;
    
    -- Calculate reminder date
    v_reminder_date := v_sequence.activated_at + 
      (COALESCE((v_step->>'dayOffset')::integer, 0) || ' days')::interval;

    -- Insert into follow_up_reminders
    INSERT INTO follow_up_reminders (
      user_id,
      prospect_id,
      prospect_name,
      reminder_type,
      due_date,
      priority,
      status,
      message_template,
      metadata
    ) VALUES (
      p_user_id,
      v_sequence.prospect_id,
      v_sequence.prospect_name,
      'sequence_step',
      v_reminder_date,
      CASE 
        WHEN v_step_number = 1 THEN 'high'
        ELSE 'medium'
      END,
      'pending',
      v_step->>'message',
      jsonb_build_object(
        'sequence_id', p_sequence_id,
        'step_number', v_step_number,
        'cta', v_step->>'cta',
        'coaching_tip', v_step->>'coachingTip'
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;