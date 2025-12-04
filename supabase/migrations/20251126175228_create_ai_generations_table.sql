/*
  # Create AI Generations Table

  1. New Tables
    - `ai_generations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `prospect_id` (uuid, foreign key to prospects, nullable)
      - `generation_type` (text) - message, sequence, deck, objection
      - `input_data` (jsonb) - stores input parameters
      - `prompt_hash` (text) - for deduplication
      - `output_text` (text) - generated content
      - `output_data` (jsonb) - structured output
      - `model_used` (text) - AI model identifier
      - `tokens_used` (integer) - token count
      - `cost_usd` (numeric) - generation cost
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
    - `ai_usage_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `feature_type` (text) - feature used
      - `model_used` (text) - AI model
      - `tokens_used` (integer)
      - `cost_usd` (numeric)
      - `success` (boolean)
      - `error_message` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read their own data
    - Add policies for insert operations
*/

-- Create ai_generations table
CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  generation_type text NOT NULL,
  input_data jsonb DEFAULT '{}'::jsonb,
  prompt_hash text,
  output_text text,
  output_data jsonb DEFAULT '{}'::jsonb,
  model_used text DEFAULT 'rule-based-v1',
  tokens_used integer DEFAULT 0,
  cost_usd numeric(10, 6) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_usage_logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type text NOT NULL,
  model_used text DEFAULT 'rule-based-v1',
  tokens_used integer DEFAULT 0,
  cost_usd numeric(10, 6) DEFAULT 0,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_prospect_id ON ai_generations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type ON ai_generations(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);

-- Enable RLS
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_generations
CREATE POLICY "Users can view own generations"
  ON ai_generations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
  ON ai_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations"
  ON ai_generations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_usage_logs
CREATE POLICY "Users can view own usage logs"
  ON ai_usage_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs"
  ON ai_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON ai_generations TO authenticated;
GRANT ALL ON ai_usage_logs TO authenticated;