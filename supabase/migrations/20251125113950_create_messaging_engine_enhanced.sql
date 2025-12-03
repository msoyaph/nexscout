/*
  # Create Enhanced AI Messaging Engine Tables
  
  1. New Tables
    - `sequence_steps` - Individual steps in message sequences
    - `generated_messages` - Track all AI-generated messages
    - `user_library` - Save and reuse content
    - `ai_usage_limits` - Track daily/weekly limits
    
  2. Table Updates
    - Add columns to existing tables for prospect integration
    
  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
    
  4. Helper Functions
    - Usage limit checking
    - Usage increment tracking
*/

-- ============================================================================
-- 1. SEQUENCE STEPS (Individual messages in sequences)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES message_sequences(id) ON DELETE CASCADE NOT NULL,
  step_number integer NOT NULL,
  message text NOT NULL,
  subject text,
  recommended_send_date timestamptz,
  actual_sent_date timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sequence_id, step_number)
);

-- ============================================================================
-- 2. GENERATED MESSAGES (Individual AI messages with tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS generated_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  intent text CHECK (intent IN ('recruit', 'sell', 'follow_up', 'reconnect', 'introduce', 'book_call')),
  tone text CHECK (tone IN ('professional', 'friendly', 'casual', 'direct')),
  model_used text DEFAULT 'gpt-4',
  tokens_used integer DEFAULT 0,
  is_saved boolean DEFAULT false,
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. USER LIBRARY (Save and reuse generated content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('message', 'sequence', 'deck', 'template', 'snippet')),
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  is_favorite boolean DEFAULT false,
  use_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. AI USAGE LIMITS (Track daily/weekly limits for Free tier)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  usage_type text NOT NULL CHECK (usage_type IN ('message', 'sequence', 'deck', 'deepscan')),
  usage_period text NOT NULL CHECK (usage_period IN ('daily', 'weekly', 'monthly')),
  usage_count integer DEFAULT 0,
  limit_amount integer NOT NULL,
  period_start timestamptz NOT NULL DEFAULT now(),
  period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, usage_type, usage_period, period_start)
);

-- ============================================================================
-- 5. ENHANCE EXISTING TABLES
-- ============================================================================

-- Add prospect_id to message_sequences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'message_sequences' AND column_name = 'prospect_id'
  ) THEN
    ALTER TABLE message_sequences ADD COLUMN prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'message_sequences' AND column_name = 'sequence_type'
  ) THEN
    ALTER TABLE message_sequences ADD COLUMN sequence_type text DEFAULT 'follow_up' CHECK (sequence_type IN ('cold_outreach', 'follow_up', 'nurture', 'reconnect', 'close'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'message_sequences' AND column_name = 'total_steps'
  ) THEN
    ALTER TABLE message_sequences ADD COLUMN total_steps integer DEFAULT 5;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'message_sequences' AND column_name = 'current_step'
  ) THEN
    ALTER TABLE message_sequences ADD COLUMN current_step integer DEFAULT 0;
  END IF;
END $$;

-- Add prospect_id and version to pitch_decks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pitch_decks' AND column_name = 'prospect_id'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pitch_decks' AND column_name = 'version'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN version text DEFAULT 'basic' CHECK (version IN ('basic', 'elite'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pitch_decks' AND column_name = 'slides'
  ) THEN
    ALTER TABLE pitch_decks ADD COLUMN slides jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add prospect_id to ai_message_sequences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_message_sequences' AND column_name = 'prospect_id'
  ) THEN
    ALTER TABLE ai_message_sequences ADD COLUMN prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- sequence_steps
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sequence steps"
  ON sequence_steps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_sequences
      WHERE message_sequences.id = sequence_steps.sequence_id
      AND message_sequences.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own sequence steps"
  ON sequence_steps FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM message_sequences
      WHERE message_sequences.id = sequence_steps.sequence_id
      AND message_sequences.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sequence steps"
  ON sequence_steps FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_sequences
      WHERE message_sequences.id = sequence_steps.sequence_id
      AND message_sequences.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM message_sequences
      WHERE message_sequences.id = sequence_steps.sequence_id
      AND message_sequences.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own sequence steps"
  ON sequence_steps FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_sequences
      WHERE message_sequences.id = sequence_steps.sequence_id
      AND message_sequences.user_id = auth.uid()
    )
  );

-- generated_messages
ALTER TABLE generated_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generated messages"
  ON generated_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generated messages"
  ON generated_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generated messages"
  ON generated_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generated messages"
  ON generated_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- user_library
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own library"
  ON user_library FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own library items"
  ON user_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own library items"
  ON user_library FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own library items"
  ON user_library FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ai_usage_limits
ALTER TABLE ai_usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage limits"
  ON ai_usage_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own usage limits"
  ON ai_usage_limits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage limits"
  ON ai_usage_limits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence_id ON sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_status ON sequence_steps(status);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_send_date ON sequence_steps(recommended_send_date);

CREATE INDEX IF NOT EXISTS idx_generated_messages_user_id ON generated_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_messages_prospect_id ON generated_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_generated_messages_created_at ON generated_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_content_type ON user_library(content_type);
CREATE INDEX IF NOT EXISTS idx_user_library_is_favorite ON user_library(is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_library_created_at ON user_library(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_limits_user_id ON ai_usage_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_limits_period ON ai_usage_limits(usage_type, usage_period, period_start);

CREATE INDEX IF NOT EXISTS idx_message_sequences_prospect_id ON message_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_pitch_decks_prospect_id ON pitch_decks(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_sequences_prospect_id ON ai_message_sequences(prospect_id);

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has reached daily/weekly limit
CREATE OR REPLACE FUNCTION check_ai_usage_limit(
  p_user_id uuid,
  p_usage_type text,
  p_usage_period text
) RETURNS boolean AS $$
DECLARE
  v_current_usage integer;
  v_limit integer;
  v_period_start timestamptz;
  v_period_end timestamptz;
BEGIN
  -- Calculate period dates
  IF p_usage_period = 'daily' THEN
    v_period_start := date_trunc('day', now());
    v_period_end := v_period_start + interval '1 day';
  ELSIF p_usage_period = 'weekly' THEN
    v_period_start := date_trunc('week', now());
    v_period_end := v_period_start + interval '1 week';
  ELSIF p_usage_period = 'monthly' THEN
    v_period_start := date_trunc('month', now());
    v_period_end := v_period_start + interval '1 month';
  END IF;
  
  -- Get or create usage record
  SELECT usage_count, limit_amount INTO v_current_usage, v_limit
  FROM ai_usage_limits
  WHERE user_id = p_user_id
    AND usage_type = p_usage_type
    AND usage_period = p_usage_period
    AND period_start = v_period_start;
  
  -- If no record exists, user hasn't used any quota yet
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  -- Check if under limit
  RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id uuid,
  p_usage_type text,
  p_usage_period text,
  p_limit integer
) RETURNS void AS $$
DECLARE
  v_period_start timestamptz;
  v_period_end timestamptz;
BEGIN
  -- Calculate period dates
  IF p_usage_period = 'daily' THEN
    v_period_start := date_trunc('day', now());
    v_period_end := v_period_start + interval '1 day';
  ELSIF p_usage_period = 'weekly' THEN
    v_period_start := date_trunc('week', now());
    v_period_end := v_period_start + interval '1 week';
  ELSIF p_usage_period = 'monthly' THEN
    v_period_start := date_trunc('month', now());
    v_period_end := v_period_start + interval '1 month';
  END IF;
  
  -- Insert or update usage record
  INSERT INTO ai_usage_limits (
    user_id, usage_type, usage_period, usage_count, 
    limit_amount, period_start, period_end
  )
  VALUES (
    p_user_id, p_usage_type, p_usage_period, 1,
    p_limit, v_period_start, v_period_end
  )
  ON CONFLICT (user_id, usage_type, usage_period, period_start)
  DO UPDATE SET 
    usage_count = ai_usage_limits.usage_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;