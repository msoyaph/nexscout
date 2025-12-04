/*
  # Create AI Messages Library System

  1. New Tables
    - `ai_messages_library`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `prospect_id` (uuid, foreign key to prospects)
      - `prospect_name` (text)
      - `message_type` (text) - outreach, followup, company_product, brochure
      - `language` (text) - english, taglish, tagalog, cebuano
      - `title` (text)
      - `content` (text)
      - `scenario` (text)
      - `context` (text)
      - `status` (text) - saved, sent, archived
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ai_messages_library` table
    - Add policies for authenticated users to manage their own messages
*/

CREATE TABLE IF NOT EXISTS ai_messages_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('outreach', 'followup', 'company_product', 'brochure')),
  language text NOT NULL CHECK (language IN ('english', 'taglish', 'tagalog', 'cebuano')),
  title text NOT NULL,
  content text NOT NULL,
  scenario text,
  context text,
  status text DEFAULT 'saved' CHECK (status IN ('saved', 'sent', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_library_user_id ON ai_messages_library(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_library_prospect_id ON ai_messages_library(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_library_status ON ai_messages_library(status);

ALTER TABLE ai_messages_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI messages"
  ON ai_messages_library FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI messages"
  ON ai_messages_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI messages"
  ON ai_messages_library FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI messages"
  ON ai_messages_library FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
