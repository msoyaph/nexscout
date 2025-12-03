/*
  # Optimize Scan Sessions RLS - Correct Column
  
  1. RLS Optimization
    - Find and optimize the correct user ownership column
*/

DO $$
DECLARE
  user_col text;
BEGIN
  -- Find the user ownership column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scan_sessions' AND column_name = 'user_id') THEN
    user_col := 'user_id';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scan_sessions' AND column_name = 'owner_id') THEN
    user_col := 'owner_id';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scan_sessions' AND column_name = 'created_by') THEN
    user_col := 'created_by';
  ELSE
    RETURN; -- No user column found
  END IF;

  -- Drop existing policies
  DROP POLICY IF EXISTS "Users manage own scan sessions" ON scan_sessions;
  DROP POLICY IF EXISTS "Users view own scan sessions" ON scan_sessions;
  DROP POLICY IF EXISTS "Users insert own scan sessions" ON scan_sessions;
  DROP POLICY IF EXISTS "Users update own scan sessions" ON scan_sessions;
  
  -- Create optimized policy using dynamic SQL
  EXECUTE format('
    CREATE POLICY "Users manage own scan sessions"
      ON scan_sessions FOR ALL
      TO authenticated
      USING (%I = (SELECT auth.uid()))
      WITH CHECK (%I = (SELECT auth.uid()))
  ', user_col, user_col);
END $$;
