/*
  # Add Scan Sessions Index - Correct Column
  
  1. Performance Optimization
    - Add index for scan_sessions on actual foreign key column
  
  2. Dynamic Index Creation
    - Checks for user_id, owner_id, or created_by columns
*/

DO $$
BEGIN
  -- Try user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scan_sessions' AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_id ON scan_sessions(user_id);
  -- Try owner_id
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scan_sessions' AND column_name = 'owner_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_scan_sessions_owner_id ON scan_sessions(owner_id);
  -- Try created_by
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scan_sessions' AND column_name = 'created_by'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_scan_sessions_created_by ON scan_sessions(created_by);
  END IF;
END $$;
