/*
  # AI Productivity System v3.0 - Smart Reminders, To-Dos & Calendar

  1. New Tables
    - `reminders` - AI-generated and manual reminders
    - `todos` - Task management with AI automation
    - `calendar_events` - Unified calendar system
    - `prospect_events_map` - Links events to prospects
    - `ai_generated_tasks` - AI task creation log
    - `chatbot_events` - Events from chatbot interactions
    - `omnichannel_event_queue` - Cross-channel event queue
    - `team_events` - Team scheduling (Team plan)
    - `notification_queue` - Notification delivery queue
    - `productivity_blueprints` - Daily AI planning

  2. Features
    - Auto-generated reminders from AI engines
    - Smart task creation based on prospect behavior
    - Calendar sync with all AI systems
    - Notification routing (push/email/sms)
    - Priority and deadline management
    - Team collaboration support
    - Energy/coin tracking integration

  3. Security
    - Enable RLS on all tables
    - User-based access control
    - Team member access for team events
*/

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  reminder_type text NOT NULL CHECK (reminder_type IN ('follow_up', 'call', 'message', 'appointment', 'content', 'hot_lead_revival', 'task_assigned', 'objection_response', 'meeting_confirmation')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('scanner', 'prospect', 'chatbot', 'calendar', 'pipeline', 'qualification', 'manual', 'ai', 'omnichannel')),
  due_at timestamptz NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  auto_ai_generated boolean DEFAULT false,
  ai_reasoning text,
  linked_page text,
  navigation_data jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_prospect_id ON reminders(prospect_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_at ON reminders(due_at);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(completed);
CREATE INDEX IF NOT EXISTS idx_reminders_priority ON reminders(priority);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  task_type text NOT NULL CHECK (task_type IN ('send_content', 'create_deck', 'review_notes', 'fix_data', 'upload_material', 'respond_chat', 'move_pipeline', 'scan_data', 'call_prospect', 'send_message', 'schedule_meeting', 'follow_up')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('scanner', 'prospect', 'chatbot', 'calendar', 'pipeline', 'qualification', 'manual', 'ai', 'omnichannel')),
  due_date date,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  auto_ai_generated boolean DEFAULT false,
  auto_complete_trigger text,
  ai_reasoning text,
  linked_page text,
  navigation_data jsonb,
  progress_current integer DEFAULT 0,
  progress_total integer DEFAULT 1,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_prospect_id ON todos(prospect_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own todos"
  ON todos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own todos"
  ON todos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos"
  ON todos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos"
  ON todos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Calendar Events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text NOT NULL CHECK (event_type IN ('follow_up', 'meeting', 'task', 'alert', 'review', 'revive', 'close_attempt', 'presentation', 'demo', 'training', 'payment_due', 'referral')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('scanner', 'prospect', 'chatbot', 'calendar', 'pipeline', 'qualification', 'manual', 'ai', 'omnichannel', 'appointment_scheduler')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  location text,
  attendees jsonb,
  auto_ai_generated boolean DEFAULT false,
  ai_reasoning text,
  color text DEFAULT '#3B82F6',
  is_team_event boolean DEFAULT false,
  linked_page text,
  navigation_data jsonb,
  metadata jsonb,
  google_calendar_id text,
  ics_uid text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_prospect_id ON calendar_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own calendar events"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- AI Generated Tasks log
CREATE TABLE IF NOT EXISTS ai_generated_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_type text NOT NULL CHECK (task_type IN ('reminder', 'todo', 'calendar_event')),
  task_id uuid NOT NULL,
  trigger_source text NOT NULL,
  trigger_event text NOT NULL,
  ai_reasoning text NOT NULL,
  confidence_score numeric(3,2),
  accepted boolean,
  dismissed boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_generated_tasks_user_id ON ai_generated_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_tasks_task_id ON ai_generated_tasks(task_id);

ALTER TABLE ai_generated_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai tasks"
  ON ai_generated_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Chatbot Events
CREATE TABLE IF NOT EXISTS chatbot_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chat_session_id uuid,
  prospect_name text,
  prospect_email text,
  event_type text NOT NULL CHECK (event_type IN ('think_about_it', 'remind_me', 'message_later', 'schedule_meeting', 'needs_follow_up', 'objection_raised')),
  suggested_action text NOT NULL,
  suggested_time timestamptz,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_events_user_id ON chatbot_events(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_events_processed ON chatbot_events(processed);

ALTER TABLE chatbot_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chatbot events"
  ON chatbot_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Omnichannel Event Queue
CREATE TABLE IF NOT EXISTS omnichannel_event_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('facebook', 'instagram', 'whatsapp', 'viber', 'sms', 'email', 'website')),
  event_type text NOT NULL,
  event_data jsonb NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  processed boolean DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_omnichannel_queue_user_id ON omnichannel_event_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_omnichannel_queue_processed ON omnichannel_event_queue(processed);
CREATE INDEX IF NOT EXISTS idx_omnichannel_queue_priority ON omnichannel_event_queue(priority);

ALTER TABLE omnichannel_event_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own omnichannel events"
  ON omnichannel_event_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Team Events
CREATE TABLE IF NOT EXISTS team_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calendar_event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  team_member_ids uuid[] NOT NULL,
  event_visibility text NOT NULL DEFAULT 'team' CHECK (event_visibility IN ('team', 'private', 'public')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_events_team_id ON team_events(team_id);
CREATE INDEX IF NOT EXISTS idx_team_events_creator_id ON team_events(creator_id);

ALTER TABLE team_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view team events"
  ON team_events FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(team_member_ids) OR auth.uid() = creator_id);

-- Notification Queue
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('reminder_due', 'hot_lead', 'chatbot_action', 'scan_complete', 'event_starting', 'missed_follow_up', 'ai_task', 'energy_alert', 'coin_alert')),
  title text NOT NULL,
  message text NOT NULL,
  channels text[] NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  linked_item_type text,
  linked_item_id uuid,
  sent boolean DEFAULT false,
  sent_at timestamptz,
  read boolean DEFAULT false,
  read_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_sent ON notification_queue(sent);
CREATE INDEX IF NOT EXISTS idx_notification_queue_read ON notification_queue(read);

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notification_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notification_queue FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Productivity Blueprints (Daily AI Planning)
CREATE TABLE IF NOT EXISTS productivity_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blueprint_date date NOT NULL,
  task_summary jsonb NOT NULL,
  hot_leads jsonb,
  calendar_suggestions jsonb,
  energy_plan jsonb,
  coin_plan jsonb,
  ai_insights text,
  viewed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blueprints_user_id ON productivity_blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_date ON productivity_blueprints(blueprint_date);

ALTER TABLE productivity_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blueprints"
  ON productivity_blueprints FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
