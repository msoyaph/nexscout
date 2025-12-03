/*
  # AI Coach Mentor Onboarding v5.0 - Conversational Guided Onboarding

  1. New Tables
    - `mentor_conversations` - Chat message log between user and AI mentor
    - `mentor_tasks` - Onboarding tasks assigned and tracked
    - `mentor_task_events` - Timeline of task completion events
    - `mentor_journey_state` - Real-time state machine state per user
    - `mentor_ai_persona` - Detected persona with confidence and reasoning
    - `mentor_success_paths` - Predefined success paths per persona

  2. Features
    - Conversational onboarding via chat interface
    - State machine driven progression (10 states)
    - Emotion-aware coaching
    - Task automation and tracking
    - Aha moment detection within 10 minutes
    - Voice coach support (metadata)
    - Habit formation tracking

  3. AI Capabilities
    - Persona detection from conversation
    - Sentiment analysis
    - Dynamic task assignment
    - Proactive re-engagement
    - Success celebration triggers

  4. Security
    - Full RLS on all tables
    - User-scoped access
    - Admin analytics access
*/

-- Mentor Conversations Table (Chat Log)
CREATE TABLE IF NOT EXISTS mentor_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('mentor', 'user', 'system')),
  message text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'task', 'celebration', 'system')),
  metadata jsonb DEFAULT '{}',
  emotion_detected text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mentor_conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mentor_conversations_user ON mentor_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_conversations_created ON mentor_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_conversations_role ON mentor_conversations(role);

CREATE POLICY "Users can view own conversations"
  ON mentor_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON mentor_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations"
  ON mentor_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Mentor Tasks Table (Onboarding Tasks)
CREATE TABLE IF NOT EXISTS mentor_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  task_title text NOT NULL,
  task_description text,
  task_category text DEFAULT 'setup',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'blocked')),
  priority integer DEFAULT 5,
  estimated_minutes integer DEFAULT 5,
  automation_available boolean DEFAULT false,
  required_for_aha boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  UNIQUE(user_id, task_id)
);

ALTER TABLE mentor_tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mentor_tasks_user ON mentor_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_tasks_status ON mentor_tasks(status);
CREATE INDEX IF NOT EXISTS idx_mentor_tasks_priority ON mentor_tasks(priority DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_tasks_required ON mentor_tasks(required_for_aha) WHERE required_for_aha = true;

CREATE POLICY "Users can view own tasks"
  ON mentor_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON mentor_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON mentor_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mentor Task Events Table (Timeline)
CREATE TABLE IF NOT EXISTS mentor_task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES mentor_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mentor_task_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mentor_task_events_task ON mentor_task_events(task_id);
CREATE INDEX IF NOT EXISTS idx_mentor_task_events_user ON mentor_task_events(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_task_events_created ON mentor_task_events(created_at DESC);

CREATE POLICY "Users can view own task events"
  ON mentor_task_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task events"
  ON mentor_task_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Mentor Journey State Table (State Machine)
CREATE TABLE IF NOT EXISTS mentor_journey_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_state text NOT NULL DEFAULT 'UNSTARTED',
  persona text,
  persona_confidence float DEFAULT 0,
  aha_moment_detected boolean DEFAULT false,
  aha_detected_at timestamptz,
  first_win_achieved boolean DEFAULT false,
  first_win_at timestamptz,
  tasks_completed integer DEFAULT 0,
  tasks_total integer DEFAULT 0,
  session_count integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  last_emotion text,
  last_interaction_at timestamptz DEFAULT now(),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE mentor_journey_state ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mentor_journey_state_state ON mentor_journey_state(current_state);
CREATE INDEX IF NOT EXISTS idx_mentor_journey_state_persona ON mentor_journey_state(persona);
CREATE INDEX IF NOT EXISTS idx_mentor_journey_state_aha ON mentor_journey_state(aha_moment_detected);
CREATE INDEX IF NOT EXISTS idx_mentor_journey_state_last_interaction ON mentor_journey_state(last_interaction_at DESC);

CREATE POLICY "Users can view own journey state"
  ON mentor_journey_state FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey state"
  ON mentor_journey_state FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journey state"
  ON mentor_journey_state FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mentor AI Persona Table (Detected Persona)
CREATE TABLE IF NOT EXISTS mentor_ai_persona (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  persona text NOT NULL,
  confidence float DEFAULT 0.8,
  detection_method text DEFAULT 'conversation',
  reasons text[] DEFAULT '{}',
  industry text,
  business_type text,
  experience_level text,
  goals text[] DEFAULT '{}',
  pain_points text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mentor_ai_persona ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mentor_ai_persona_persona ON mentor_ai_persona(persona);
CREATE INDEX IF NOT EXISTS idx_mentor_ai_persona_confidence ON mentor_ai_persona(confidence DESC);

CREATE POLICY "Users can view own AI persona"
  ON mentor_ai_persona FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI persona"
  ON mentor_ai_persona FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI persona"
  ON mentor_ai_persona FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mentor Success Paths Table (Predefined Paths)
CREATE TABLE IF NOT EXISTS mentor_success_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona text NOT NULL,
  path_name text NOT NULL,
  path_steps jsonb NOT NULL,
  estimated_minutes integer DEFAULT 10,
  required_tasks text[] DEFAULT '{}',
  success_rate float DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(persona, path_name)
);

ALTER TABLE mentor_success_paths ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mentor_success_paths_persona ON mentor_success_paths(persona);
CREATE INDEX IF NOT EXISTS idx_mentor_success_paths_active ON mentor_success_paths(is_active) WHERE is_active = true;

CREATE POLICY "Users can view success paths"
  ON mentor_success_paths FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage success paths"
  ON mentor_success_paths FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Function to update journey state timestamp
CREATE OR REPLACE FUNCTION update_mentor_journey_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_interaction_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mentor_journey_timestamp
  BEFORE UPDATE ON mentor_journey_state
  FOR EACH ROW
  EXECUTE FUNCTION update_mentor_journey_timestamp();

-- Function to update AI persona timestamp
CREATE OR REPLACE FUNCTION update_mentor_persona_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mentor_persona_timestamp
  BEFORE UPDATE ON mentor_ai_persona
  FOR EACH ROW
  EXECUTE FUNCTION update_mentor_persona_timestamp();

-- Function to track task completion and update journey state
CREATE OR REPLACE FUNCTION track_mentor_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
    
    UPDATE mentor_journey_state
    SET
      tasks_completed = tasks_completed + 1,
      last_interaction_at = now()
    WHERE user_id = NEW.user_id;
    
    INSERT INTO mentor_task_events (task_id, user_id, event_type, event_data)
    VALUES (NEW.id, NEW.user_id, 'task_completed', jsonb_build_object(
      'task_id', NEW.task_id,
      'task_title', NEW.task_title,
      'completed_at', NEW.completed_at
    ));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_task_completion
  BEFORE UPDATE ON mentor_tasks
  FOR EACH ROW
  EXECUTE FUNCTION track_mentor_task_completion();

-- Seed default success paths
INSERT INTO mentor_success_paths (persona, path_name, path_steps, estimated_minutes, required_tasks)
VALUES
  ('mlm_newbie', 'Quick Win Path', 
   '[{"step": "greeting", "duration": 1}, {"step": "persona_detection", "duration": 2}, {"step": "company_upload", "duration": 3}, {"step": "chatbot_activation", "duration": 2}, {"step": "first_prospect", "duration": 2}]'::jsonb,
   10,
   ARRAY['upload_company_data', 'activate_chatbot', 'import_first_prospect']),
  
  ('mlm_leader', 'Team Setup Path',
   '[{"step": "greeting", "duration": 1}, {"step": "persona_detection", "duration": 2}, {"step": "team_structure", "duration": 4}, {"step": "pipeline_setup", "duration": 2}, {"step": "chatbot_activation", "duration": 1}]'::jsonb,
   10,
   ARRAY['setup_team_structure', 'configure_pipeline', 'activate_chatbot']),
  
  ('insurance_agent', 'Policy Assistant Path',
   '[{"step": "greeting", "duration": 1}, {"step": "persona_detection", "duration": 2}, {"step": "policy_upload", "duration": 3}, {"step": "chatbot_activation", "duration": 2}, {"step": "first_quote", "duration": 2}]'::jsonb,
   10,
   ARRAY['upload_policies', 'activate_chatbot', 'generate_first_quote']),
  
  ('real_estate_agent', 'Property Automation Path',
   '[{"step": "greeting", "duration": 1}, {"step": "persona_detection", "duration": 2}, {"step": "property_upload", "duration": 3}, {"step": "chatbot_activation", "duration": 2}, {"step": "first_inquiry", "duration": 2}]'::jsonb,
   10,
   ARRAY['upload_properties', 'activate_chatbot', 'handle_first_inquiry']),
  
  ('online_seller', 'Product Automation Path',
   '[{"step": "greeting", "duration": 1}, {"step": "persona_detection", "duration": 2}, {"step": "product_catalog", "duration": 3}, {"step": "chatbot_activation", "duration": 2}, {"step": "first_recommendation", "duration": 2}]'::jsonb,
   10,
   ARRAY['upload_product_catalog', 'activate_chatbot', 'first_product_recommendation']),
  
  ('power_user_unknown', 'Discovery Path',
   '[{"step": "greeting", "duration": 1}, {"step": "persona_detection", "duration": 3}, {"step": "quick_setup", "duration": 4}, {"step": "chatbot_activation", "duration": 2}]'::jsonb,
   10,
   ARRAY['detect_use_case', 'activate_chatbot', 'first_action'])
ON CONFLICT (persona, path_name) DO NOTHING;