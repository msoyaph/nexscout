/*
  # Create AI Message Sequences Table

  1. New Tables
    - `ai_message_sequences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `prospect_name` (text)
      - `prospect_company` (text)
      - `sequence_type` (text) - cold_outreach, follow_up, nurture, etc.
      - `messages` (jsonb) - array of message objects
      - `tone` (text) - professional, friendly, casual, etc.
      - `status` (text) - draft, active, completed, archived
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ai_message_sequences` table
    - Add policies for authenticated users to manage their own sequences
*/

-- Create ai_message_sequences table
CREATE TABLE IF NOT EXISTS ai_message_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  prospect_name text,
  prospect_company text,
  sequence_type text DEFAULT 'cold_outreach',
  messages jsonb DEFAULT '[]'::jsonb,
  tone text DEFAULT 'professional',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_message_sequences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own message sequences
CREATE POLICY "Users can view own message sequences"
  ON ai_message_sequences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own message sequences
CREATE POLICY "Users can create own message sequences"
  ON ai_message_sequences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own message sequences
CREATE POLICY "Users can update own message sequences"
  ON ai_message_sequences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own message sequences
CREATE POLICY "Users can delete own message sequences"
  ON ai_message_sequences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_message_sequences_user_id ON ai_message_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_sequences_created_at ON ai_message_sequences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_message_sequences_status ON ai_message_sequences(status);
