/*
  # NexScout Smart Scanner v2.5 - Enhanced Scanning System

  1. New Tables
    - `scans`
      - Isolated scan instances with complete metadata
      - Tracks sources, smartness delta, and prospect counts
      
    - `social_connections`
      - Stores connected social media accounts
      - Tracks connection status and tokens

  2. Updates
    - Enhanced scan_sessions to work with new scans table
    - Added smartness calculation triggers

  3. Security
    - Enable RLS on all tables
    - Users can only access their own scans and connections
*/

-- Create scans table (simplified version compatible with existing scan_sessions)
CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  sources jsonb DEFAULT '{}'::jsonb,
  smartness_delta integer DEFAULT 0,
  total_items integer DEFAULT 0,
  hot_leads integer DEFAULT 0,
  warm_leads integer DEFAULT 0,
  cold_leads integer DEFAULT 0,
  prospect_ids uuid[] DEFAULT ARRAY[]::uuid[],
  screenshot_count integer DEFAULT 0,
  file_count integer DEFAULT 0,
  text_count integer DEFAULT 0,
  connected_account_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create social_connections table
CREATE TABLE IF NOT EXISTS social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok')),
  connected boolean DEFAULT false,
  access_token text,
  profile_data jsonb DEFAULT '{}'::jsonb,
  connected_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform);

-- Enable Row Level Security
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scans
CREATE POLICY "Users can view own scans"
  ON scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scans"
  ON scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans"
  ON scans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans"
  ON scans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for social_connections
CREATE POLICY "Users can view own social connections"
  ON social_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own social connections"
  ON social_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social connections"
  ON social_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own social connections"
  ON social_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to calculate smartness score
CREATE OR REPLACE FUNCTION calculate_smartness_score(
  p_user_id uuid
) RETURNS integer AS $$
DECLARE
  v_screenshot_count integer;
  v_file_count integer;
  v_text_count integer;
  v_connected_accounts integer;
  v_score integer;
BEGIN
  -- Get total counts from all scans
  SELECT 
    COALESCE(SUM(screenshot_count), 0),
    COALESCE(SUM(file_count), 0),
    COALESCE(SUM(text_count), 0)
  INTO 
    v_screenshot_count,
    v_file_count,
    v_text_count
  FROM scans
  WHERE user_id = p_user_id;
  
  -- Get connected accounts count
  SELECT COUNT(*)
  INTO v_connected_accounts
  FROM social_connections
  WHERE user_id = p_user_id AND connected = true;
  
  -- Calculate score: (screenshots*5) + (files*10) + (text*3) + (accounts*20)
  v_score := (v_screenshot_count * 5) + (v_file_count * 10) + (v_text_count * 3) + (v_connected_accounts * 20);
  
  -- Cap at 100
  IF v_score > 100 THEN
    v_score := 100;
  END IF;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update ai_smartness table
CREATE OR REPLACE FUNCTION update_user_smartness() RETURNS trigger AS $$
DECLARE
  v_new_score integer;
BEGIN
  -- Calculate new smartness score
  v_new_score := calculate_smartness_score(NEW.user_id);
  
  -- Update or insert into ai_smartness
  INSERT INTO ai_smartness (user_id, smartness_score, last_training_at)
  VALUES (NEW.user_id, v_new_score, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    smartness_score = v_new_score,
    last_training_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update smartness on scan completion
DROP TRIGGER IF EXISTS trigger_update_smartness_on_scan ON scans;
CREATE TRIGGER trigger_update_smartness_on_scan
  AFTER INSERT OR UPDATE ON scans
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_user_smartness();

-- Trigger to update smartness on social connection
DROP TRIGGER IF EXISTS trigger_update_smartness_on_connection ON social_connections;
CREATE TRIGGER trigger_update_smartness_on_connection
  AFTER INSERT OR UPDATE ON social_connections
  FOR EACH ROW
  WHEN (NEW.connected = true)
  EXECUTE FUNCTION update_user_smartness();
