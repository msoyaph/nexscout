/*
  # Browser Capture System for Chrome Extension

  1. New Tables
    - `browser_captures`
      - Stores captured social media data from Chrome extension
      - Contains HTML snapshots, text content, and metadata
      - Links to user via user_id
      - Supports tagging and categorization

    - `browser_extension_tokens`
      - API tokens for Chrome extension authentication
      - Users can generate multiple tokens
      - Tracks last usage for security monitoring

  2. Security
    - Enable RLS on both tables
    - Users can only view their own captures
    - Users can only view their own tokens
    - Admin policies can be added separately

  3. Indexes
    - Performance indexes on user_id, created_at, platform, capture_type
    - Token lookup index for authentication
*/

-- Create browser_captures table
CREATE TABLE IF NOT EXISTS browser_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  capture_type text NOT NULL,
  platform text NOT NULL,
  source_url text NOT NULL,
  html_snapshot text,
  text_content text,
  tags text[] DEFAULT '{}'::text[],
  notes text,
  extension_version text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create browser_extension_tokens table
CREATE TABLE IF NOT EXISTS browser_extension_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  label text,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for browser_captures
CREATE INDEX IF NOT EXISTS idx_browser_captures_user_id ON browser_captures(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_captures_created_at ON browser_captures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_browser_captures_platform ON browser_captures(platform);
CREATE INDEX IF NOT EXISTS idx_browser_captures_capture_type ON browser_captures(capture_type);

-- Create indexes for browser_extension_tokens
CREATE INDEX IF NOT EXISTS idx_browser_extension_tokens_user_id ON browser_extension_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_extension_tokens_token ON browser_extension_tokens(token);

-- Enable RLS
ALTER TABLE browser_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_extension_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for browser_captures
CREATE POLICY "Users can view own browser captures"
  ON browser_captures FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own browser captures"
  ON browser_captures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own browser captures"
  ON browser_captures FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own browser captures"
  ON browser_captures FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for browser_extension_tokens
CREATE POLICY "Users can view own extension tokens"
  ON browser_extension_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own extension tokens"
  ON browser_extension_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own extension tokens"
  ON browser_extension_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own extension tokens"
  ON browser_extension_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Super admin policies for browser_captures
CREATE POLICY "Super admins can view all browser captures"
  ON browser_captures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  );

-- Super admin policies for browser_extension_tokens
CREATE POLICY "Super admins can view all extension tokens"
  ON browser_extension_tokens FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  );

-- Function to generate secure API tokens
CREATE OR REPLACE FUNCTION generate_browser_extension_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token text;
BEGIN
  -- Generate a secure random token (32 bytes = 64 hex chars)
  new_token := 'nex_' || encode(gen_random_bytes(32), 'hex');
  RETURN new_token;
END;
$$;

-- Helper function to validate and get user from token
CREATE OR REPLACE FUNCTION get_user_from_extension_token(token_value text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_user_id uuid;
BEGIN
  SELECT user_id INTO token_user_id
  FROM browser_extension_tokens
  WHERE token = token_value
    AND is_active = true;

  IF token_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Update last_used_at
  UPDATE browser_extension_tokens
  SET last_used_at = now()
  WHERE token = token_value;

  RETURN token_user_id;
END;
$$;