-- Quick Fix: Drop existing objects before recreating
-- Run this FIRST if you're getting "already exists" errors
-- Then run the main migration: FACEBOOK_DATA_DELETION_MIGRATION.sql

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_data_deletion_requests_updated_at ON data_deletion_requests;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Users can view own deletion requests" ON data_deletion_requests;
DROP POLICY IF EXISTS "Service role full access" ON data_deletion_requests;

-- Drop function if you want to recreate it (optional - function uses CREATE OR REPLACE)
-- DROP FUNCTION IF EXISTS update_data_deletion_requests_updated_at();

-- Now you can safely run FACEBOOK_DATA_DELETION_MIGRATION.sql

