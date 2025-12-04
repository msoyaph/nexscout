/*
  # Enhance Notifications System

  1. Changes
    - Add missing columns to notifications table if they don't exist
    - Add category, action_text, action_url, icon, is_archived columns
    - Create indexes for better performance
*/

DO $$
BEGIN
  -- Add category column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'category'
  ) THEN
    ALTER TABLE notifications ADD COLUMN category text DEFAULT 'info' CHECK (category IN ('urgent', 'important', 'info', 'success'));
  END IF;

  -- Add action_text column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'action_text'
  ) THEN
    ALTER TABLE notifications ADD COLUMN action_text text;
  END IF;

  -- Add action_url column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'action_url'
  ) THEN
    ALTER TABLE notifications ADD COLUMN action_url text;
  END IF;

  -- Add icon column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'icon'
  ) THEN
    ALTER TABLE notifications ADD COLUMN icon text;
  END IF;

  -- Add is_archived column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_archived boolean DEFAULT false;
  END IF;

  -- Add read_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN read_at timestamptz;
  END IF;

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
  CREATE INDEX IF NOT EXISTS idx_notifications_is_archived ON notifications(is_archived);
END $$;