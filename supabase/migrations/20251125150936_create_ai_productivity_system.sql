/*
  # AI Productivity System - Tasks, Schedule, and Alerts

  1. New Tables
    - `ai_tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `prospect_id` (uuid, nullable, references prospects)
      - `title` (text)
      - `description` (text, nullable)
      - `task_type` (text: 'manual', 'ai_suggested', 'ai_generated')
      - `priority` (text: 'high', 'medium', 'low')
      - `status` (text: 'pending', 'completed', 'dismissed')
      - `due_time` (timestamptz, nullable)
      - `completed_at` (timestamptz, nullable)
      - `ai_reasoning` (text, nullable)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `schedule_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `prospect_id` (uuid, nullable, references prospects)
      - `title` (text)
      - `description` (text, nullable)
      - `event_type` (text: 'call', 'meeting', 'demo', 'follow_up', 'other')
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `location` (text, nullable)
      - `is_ai_suggested` (boolean, default false)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `ai_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `prospect_id` (uuid, nullable, references prospects)
      - `alert_type` (text: 'cold_prospect', 'hot_prospect', 'timing_suggestion', 'opportunity', 'follow_up_reminder')
      - `priority` (text: 'urgent', 'high', 'medium', 'low')
      - `title` (text)
      - `message` (text)
      - `action_required` (text, nullable)
      - `is_read` (boolean, default false)
      - `is_dismissed` (boolean, default false)
      - `ai_confidence` (numeric, nullable)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Index on user_id for fast lookups
    - Index on status/priority for filtering
    - Index on due_time/start_time for sorting
*/

-- Create ai_tasks table
CREATE TABLE IF NOT EXISTS ai_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  task_type text DEFAULT 'manual' CHECK (task_type IN ('manual', 'ai_suggested', 'ai_generated')),
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
  due_time timestamptz,
  completed_at timestamptz,
  ai_reasoning text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create schedule_events table
CREATE TABLE IF NOT EXISTS schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'other' CHECK (event_type IN ('call', 'meeting', 'demo', 'follow_up', 'other')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  is_ai_suggested boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_alerts table
CREATE TABLE IF NOT EXISTS ai_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('cold_prospect', 'hot_prospect', 'timing_suggestion', 'opportunity', 'follow_up_reminder')),
  priority text DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  title text NOT NULL,
  message text NOT NULL,
  action_required text,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  ai_confidence numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_id ON ai_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_due_time ON ai_tasks(due_time);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_prospect_id ON ai_tasks(prospect_id);

CREATE INDEX IF NOT EXISTS idx_schedule_events_user_id ON schedule_events(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_start_time ON schedule_events(start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_events_prospect_id ON schedule_events(prospect_id);

CREATE INDEX IF NOT EXISTS idx_ai_alerts_user_id ON ai_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_priority ON ai_alerts(priority);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_is_read ON ai_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_prospect_id ON ai_alerts(prospect_id);

-- Enable Row Level Security
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_tasks
CREATE POLICY "Users can view own tasks"
  ON ai_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON ai_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON ai_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON ai_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for schedule_events
CREATE POLICY "Users can view own schedule"
  ON schedule_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON schedule_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON schedule_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON schedule_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ai_alerts
CREATE POLICY "Users can view own alerts"
  ON ai_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON ai_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON ai_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON ai_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);