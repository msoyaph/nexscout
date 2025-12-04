/*
  # Enable Leaked Password Protection

  1. Security Enhancement
    - Enable Supabase Auth leaked password protection
    - Prevents users from using passwords found in data breaches
  
  2. Implementation
    - Create table to log password security checks
    - Document requirement to enable in Supabase Dashboard
  
  3. Note
    - Must be enabled in Supabase Dashboard
    - Navigate to: Project Settings > Authentication > Security
    - Enable "Leaked Password Protection"
*/

-- Create table to log password security checks
CREATE TABLE IF NOT EXISTS password_security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  check_type text NOT NULL, -- 'leaked_check', 'strength_check'
  passed boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on password security logs
ALTER TABLE password_security_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view password security logs
CREATE POLICY "Super admins can view password security logs"
  ON password_security_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = (select auth.uid()) AND is_super_admin = true
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_security_logs_user_id 
  ON password_security_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_password_security_logs_created_at 
  ON password_security_logs(created_at DESC);

-- Add comment with instructions
COMMENT ON TABLE password_security_logs IS 
  'Logs password security checks. IMPORTANT: Leaked password protection must be enabled in Supabase Dashboard > Project Settings > Authentication > Security > Enable "Leaked Password Protection"';
