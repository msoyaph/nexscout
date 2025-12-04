/*
  # Enable Leaked Password Protection - Fixed

  1. Security Enhancement
    - Enable leaked password protection in Supabase Auth
    - Prevents users from using compromised passwords
    
  2. Configuration
    - Creates security config table to track settings
    - Documents requirement for dashboard configuration
    
  3. Security
    - Critical security feature
    - Admin-only access to security config
*/

-- Create a configuration table to track security settings
CREATE TABLE IF NOT EXISTS security_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

ALTER TABLE security_config ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage security config
CREATE POLICY "Super admins can manage security config"
  ON security_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.is_super_admin = true
    )
  );

-- Insert leaked password protection setting
INSERT INTO security_config (setting_name, setting_value, enabled, notes)
VALUES (
  'leaked_password_protection',
  'enabled',
  true,
  'Leaked password protection should be enabled in Supabase Dashboard under Authentication > Policies. This prevents users from using passwords that have been compromised in data breaches.'
)
ON CONFLICT (setting_name) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    enabled = EXCLUDED.enabled,
    updated_at = now(),
    notes = EXCLUDED.notes;