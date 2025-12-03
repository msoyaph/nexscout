/*
  # NexScout AI Messaging Engine v2.0

  1. New Tables
    - `ai_generated_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `prospect_id` (uuid, references prospects)
      - `prospect_name` (text)
      - `message_type` (text: first_outreach, follow_up, reconnect, nurture, book_call, objection, closing, slow_nurture)
      - `message_content` (text)
      - `cta` (text)
      - `alternatives` (jsonb array)
      - `tone` (text: friendly, professional, warm, direct)
      - `emotional_tone` (text: empathetic, soft, confident, excited)
      - `industry` (text: mlm, insurance, real_estate, product)
      - `scoutscore_context` (jsonb)
      - `prospect_context` (jsonb)
      - `coaching_tip` (text)
      - `sent` (boolean)
      - `sent_at` (timestamptz)
      - `response_received` (boolean)
      - `response_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `objection_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `prospect_id` (uuid, references prospects)
      - `prospect_name` (text)
      - `objection_type` (text)
      - `response` (text)
      - `reinforcement_points` (jsonb array)
      - `cta` (text)
      - `coaching_tip` (text)
      - `tone` (text)
      - `industry` (text)
      - `used` (boolean)
      - `effective` (boolean)
      - `created_at` (timestamptz)
    
    - `meeting_booking_scripts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `prospect_id` (uuid, references prospects)
      - `prospect_name` (text)
      - `script` (text)
      - `cta` (text)
      - `time_suggestions` (jsonb array)
      - `coaching_tip` (text)
      - `goal` (text: book_call)
      - `industry` (text)
      - `tone` (text)
      - `sent` (boolean)
      - `meeting_booked` (boolean)
      - `created_at` (timestamptz)
    
    - `elite_coaching_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `prospect_id` (uuid, references prospects)
      - `situation_analysis` (text)
      - `recommended_message` (text)
      - `do_next` (jsonb array)
      - `timing` (text)
      - `risk_warnings` (text)
      - `psychology_insights` (text)
      - `user_goal` (text)
      - `bucket` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Add policies for authenticated users

  3. Usage Tracking
    - Add daily_messages_used to profiles
    - Track message generation limits by tier
*/

-- Create ai_generated_messages table
CREATE TABLE IF NOT EXISTS ai_generated_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('first_outreach', 'follow_up', 'reconnect', 'nurture', 'book_call', 'objection', 'closing', 'slow_nurture')),
  message_content text NOT NULL,
  cta text,
  alternatives jsonb DEFAULT '[]'::jsonb,
  tone text CHECK (tone IN ('friendly', 'professional', 'warm', 'direct')),
  emotional_tone text CHECK (emotional_tone IN ('empathetic', 'soft', 'confident', 'excited')),
  industry text CHECK (industry IN ('mlm', 'insurance', 'real_estate', 'product')),
  scoutscore_context jsonb DEFAULT '{}'::jsonb,
  prospect_context jsonb DEFAULT '{}'::jsonb,
  coaching_tip text,
  sent boolean DEFAULT false,
  sent_at timestamptz,
  response_received boolean DEFAULT false,
  response_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create objection_responses table
CREATE TABLE IF NOT EXISTS objection_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  objection_type text NOT NULL CHECK (objection_type IN ('no_time', 'no_money', 'not_now', 'too_expensive', 'skeptic', 'already_tried', 'thinking_about_it', 'busy', 'needs_approval', 'not_interested')),
  response text NOT NULL,
  reinforcement_points jsonb DEFAULT '[]'::jsonb,
  cta text,
  coaching_tip text,
  tone text CHECK (tone IN ('friendly', 'professional', 'warm', 'direct')),
  industry text CHECK (industry IN ('mlm', 'insurance', 'real_estate', 'product')),
  used boolean DEFAULT false,
  effective boolean,
  created_at timestamptz DEFAULT now()
);

-- Create meeting_booking_scripts table
CREATE TABLE IF NOT EXISTS meeting_booking_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  script text NOT NULL,
  cta text NOT NULL,
  time_suggestions jsonb DEFAULT '[]'::jsonb,
  coaching_tip text,
  goal text DEFAULT 'book_call',
  industry text CHECK (industry IN ('mlm', 'insurance', 'real_estate', 'product')),
  tone text CHECK (tone IN ('friendly', 'professional', 'warm', 'direct')),
  sent boolean DEFAULT false,
  meeting_booked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create elite_coaching_sessions table
CREATE TABLE IF NOT EXISTS elite_coaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  situation_analysis text NOT NULL,
  recommended_message text NOT NULL,
  do_next jsonb DEFAULT '[]'::jsonb,
  timing text NOT NULL,
  risk_warnings text,
  psychology_insights text,
  user_goal text NOT NULL,
  bucket text NOT NULL,
  scoutscore_context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON ai_generated_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_prospect_id ON ai_generated_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_generated_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_objection_responses_user_id ON objection_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_objection_responses_prospect_id ON objection_responses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_booking_scripts_user_id ON meeting_booking_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_user_id ON elite_coaching_sessions(user_id);

-- Enable RLS
ALTER TABLE ai_generated_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE objection_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_booking_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE elite_coaching_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for ai_generated_messages
CREATE POLICY "Users can view own messages"
  ON ai_generated_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages"
  ON ai_generated_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON ai_generated_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON ai_generated_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for objection_responses
CREATE POLICY "Users can view own objection responses"
  ON objection_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own objection responses"
  ON objection_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own objection responses"
  ON objection_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for meeting_booking_scripts
CREATE POLICY "Users can view own booking scripts"
  ON meeting_booking_scripts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own booking scripts"
  ON meeting_booking_scripts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own booking scripts"
  ON meeting_booking_scripts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for elite_coaching_sessions
CREATE POLICY "Users can view own coaching sessions"
  ON elite_coaching_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own coaching sessions"
  ON elite_coaching_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add daily_messages_used to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_messages_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_messages_used integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_message_reset_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_message_reset_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;