/*
  # Create Notifications + Follow-Up Engine System
  
  1. New Tables
    - `notifications` - All user notifications with types and metadata
    - `notification_settings` - User preferences for notification types
    - `follow_up_reminders` - Scheduled follow-up tracking
    - `daily_top_prospects` - Cached daily prospect rankings
    - `user_streaks` - Daily activity streak tracking
    
  2. Notification Types
    - hot_lead: New HOT prospect detected
    - followup_due: Scheduled follow-up needed
    - sequence_action: Multi-step sequence requires action
    - lead_cooling: Prospect becoming inactive
    - streak_reminder: Daily activity streak maintenance
    - mission_alert: Mission/goal reminder
    - weekly_report: Weekly performance summary
    - ai_insight: AI-powered recommendation
    
  3. Security
    - Enable RLS on all tables
    - Users can only access their own data
    
  4. Indexes
    - Performance indexes for user_id, created_at, read_at
    - Type-based filtering
*/

-- ============================================================================
-- 1. NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN (
    'hot_lead', 'followup_due', 'sequence_action', 'lead_cooling',
    'streak_reminder', 'mission_alert', 'weekly_report', 'ai_insight',
    'scan_complete', 'coin_earned', 'achievement'
  )),
  title text NOT NULL,
  message text NOT NULL,
  icon text,
  action_url text,
  related_prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  related_sequence_id uuid REFERENCES message_sequences(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- ============================================================================
-- 2. NOTIFICATION SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  push_enabled boolean DEFAULT false,
  email_enabled boolean DEFAULT true,
  enable_hot_lead boolean DEFAULT true,
  enable_followup boolean DEFAULT true,
  enable_sequences boolean DEFAULT true,
  enable_missions boolean DEFAULT true,
  enable_weekly_reports boolean DEFAULT true,
  enable_streak_reminders boolean DEFAULT true,
  enable_ai_insights boolean DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  daily_digest boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. FOLLOW-UP REMINDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  sequence_id uuid REFERENCES message_sequences(id) ON DELETE CASCADE,
  reminder_type text CHECK (reminder_type IN ('one_time', 'sequence_step', 'pipeline_check', 'manual')),
  reminder_date timestamptz NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed', 'completed')),
  notification_id uuid REFERENCES notifications(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ============================================================================
-- 4. DAILY TOP PROSPECTS CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_top_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  prospect_ids uuid[] DEFAULT ARRAY[]::uuid[],
  hot_count integer DEFAULT 0,
  warm_count integer DEFAULT 0,
  total_prospects integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ============================================================================
-- 5. USER STREAKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  streak_start_date date,
  total_active_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 6. BACKGROUND JOB TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS background_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings"
  ON notification_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notification settings"
  ON notification_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON notification_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- follow_up_reminders
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follow-up reminders"
  ON follow_up_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own follow-up reminders"
  ON follow_up_reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own follow-up reminders"
  ON follow_up_reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own follow-up reminders"
  ON follow_up_reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- daily_top_prospects
ALTER TABLE daily_top_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily top prospects"
  ON daily_top_prospects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily top prospects"
  ON daily_top_prospects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- user_streaks
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks"
  ON user_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own streaks"
  ON user_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON user_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- background_jobs (admin/service only)
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage background jobs"
  ON background_jobs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_prospect_id ON notifications(related_prospect_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_user_id ON follow_up_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_date ON follow_up_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_status ON follow_up_reminders(status);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_pending ON follow_up_reminders(user_id, status, reminder_date) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_daily_top_prospects_user_date ON daily_top_prospects(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_background_jobs_type_status ON background_jobs(job_type, status);

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_icon text DEFAULT NULL,
  p_prospect_id uuid DEFAULT NULL,
  p_sequence_id uuid DEFAULT NULL,
  p_priority text DEFAULT 'normal',
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
  v_settings record;
BEGIN
  -- Check if user has this type enabled
  SELECT * INTO v_settings FROM notification_settings WHERE user_id = p_user_id;
  
  -- If no settings, create default
  IF NOT FOUND THEN
    INSERT INTO notification_settings (user_id)
    VALUES (p_user_id);
    v_settings.enable_hot_lead := true;
    v_settings.enable_followup := true;
    v_settings.enable_sequences := true;
    v_settings.enable_missions := true;
    v_settings.enable_weekly_reports := true;
    v_settings.enable_streak_reminders := true;
    v_settings.enable_ai_insights := true;
  END IF;
  
  -- Check if notification type is enabled
  IF (p_type = 'hot_lead' AND NOT v_settings.enable_hot_lead) OR
     (p_type = 'followup_due' AND NOT v_settings.enable_followup) OR
     (p_type = 'sequence_action' AND NOT v_settings.enable_sequences) OR
     (p_type = 'mission_alert' AND NOT v_settings.enable_missions) OR
     (p_type = 'weekly_report' AND NOT v_settings.enable_weekly_reports) OR
     (p_type = 'streak_reminder' AND NOT v_settings.enable_streak_reminders) OR
     (p_type = 'ai_insight' AND NOT v_settings.enable_ai_insights) THEN
    RETURN NULL;
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    user_id, type, title, message, icon, 
    related_prospect_id, related_sequence_id, priority, metadata
  )
  VALUES (
    p_user_id, p_type, p_title, p_message, p_icon,
    p_prospect_id, p_sequence_id, p_priority, p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id uuid,
  p_activity_date date DEFAULT CURRENT_DATE
) RETURNS void AS $$
DECLARE
  v_streak record;
  v_days_diff integer;
BEGIN
  SELECT * INTO v_streak FROM user_streaks WHERE user_id = p_user_id;
  
  -- Create if not exists
  IF NOT FOUND THEN
    INSERT INTO user_streaks (
      user_id, current_streak, longest_streak, 
      last_activity_date, streak_start_date, total_active_days
    )
    VALUES (p_user_id, 1, 1, p_activity_date, p_activity_date, 1);
    RETURN;
  END IF;
  
  -- Calculate days difference
  v_days_diff := p_activity_date - v_streak.last_activity_date;
  
  -- Same day - no update needed
  IF v_days_diff = 0 THEN
    RETURN;
  END IF;
  
  -- Consecutive day
  IF v_days_diff = 1 THEN
    UPDATE user_streaks
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = p_activity_date,
        total_active_days = total_active_days + 1,
        updated_at = now()
    WHERE user_id = p_user_id;
  -- Streak broken
  ELSE
    UPDATE user_streaks
    SET current_streak = 1,
        last_activity_date = p_activity_date,
        streak_start_date = p_activity_date,
        total_active_days = total_active_days + 1,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM notifications
    WHERE user_id = p_user_id AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_read(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE user_id = p_user_id AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;