-- =====================================================
-- DEBUG: Check if Ambassador Tables Exist
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose the issue
-- =====================================================

-- 1. Check if ambassador_profiles table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'ambassador_profiles'
    ) THEN '✅ ambassador_profiles EXISTS'
    ELSE '❌ ambassador_profiles DOES NOT EXIST'
  END AS table_status;

-- 2. List all tables with 'ambassador' in the name
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%ambassador%'
ORDER BY table_name;

-- 3. If table exists, check columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ambassador_profiles'
ORDER BY ordinal_position;

-- 4. If table exists, check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'ambassador_profiles';

-- 5. Check current database name
SELECT current_database();

-- 6. Try a simple query
SELECT COUNT(*) as total_rows FROM ambassador_profiles;




