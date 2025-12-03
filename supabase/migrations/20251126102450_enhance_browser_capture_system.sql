/*
  # NexScout Browser Capture Enhancement

  1. Updates
    - Enhance browser_capture_events table
    - Add browser capture flag to social_contacts
    - Add source tracking to social_interactions

  2. Security
    - RLS policies for browser captures
    - User-scoped access only

  3. Indexes
    - Optimize for processing queries
*/

-- Ensure browser_capture_events exists and is complete
CREATE TABLE IF NOT EXISTS browser_capture_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  capture_type text CHECK (capture_type IN ('friends_list', 'post', 'comments', 'messages', 'profile', 'custom')),
  platform text CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'unknown')),
  source_url text,
  html_snapshot text,
  text_content text,
  metadata jsonb DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  platform_guess text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_browser_capture_user_id ON browser_capture_events(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_capture_processed ON browser_capture_events(processed);
CREATE INDEX IF NOT EXISTS idx_browser_capture_created_at ON browser_capture_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_browser_capture_type ON browser_capture_events(capture_type);

-- Add browser capture tracking to social_contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_contacts' AND column_name = 'seen_via_browser_capture'
  ) THEN
    ALTER TABLE social_contacts ADD COLUMN seen_via_browser_capture boolean DEFAULT false;
  END IF;
END $$;

-- Add source tracking to social_interactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_interactions' AND column_name = 'source'
  ) THEN
    ALTER TABLE social_interactions ADD COLUMN source text DEFAULT 'browser_capture';
  END IF;
END $$;

-- RLS for browser_capture_events
ALTER TABLE browser_capture_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own captures"
  ON browser_capture_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own captures"
  ON browser_capture_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own captures"
  ON browser_capture_events FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own captures"
  ON browser_capture_events FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());