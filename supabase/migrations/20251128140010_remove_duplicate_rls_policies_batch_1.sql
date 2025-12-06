/*
  # Remove Duplicate RLS Policies - Batch 1

  1. Purpose
    - Remove duplicate permissive policies that cause conflicts
    - Keep only one policy per action per table
  
  2. Tables Fixed
    - ai_generations
    - ai_message_sequences
    - ai_smartness
    - ai_usage_logs
    - browser_capture_events
    - browser_captures
*/

-- Fix ai_generations (keep newer policy)
DROP POLICY IF EXISTS "Users can insert own ai generations" ON ai_generations;
DROP POLICY IF EXISTS "Users can view own ai generations" ON ai_generations;

-- Fix ai_message_sequences (keep both but make one restrictive)
DROP POLICY IF EXISTS "Anyone can view public message sequences" ON ai_message_sequences;
CREATE POLICY "Anyone can view public message sequences"
  ON ai_message_sequences FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = (select auth.uid()));

-- Fix ai_smartness (keep newer policy)
DROP POLICY IF EXISTS "Users can create own smartness" ON ai_smartness;
DROP POLICY IF EXISTS "Users can view own smartness" ON ai_smartness;
DROP POLICY IF EXISTS "Users can update own smartness" ON ai_smartness;

-- Fix ai_usage_logs (keep user policy, admin needs restrictive)
DROP POLICY IF EXISTS "Admins can view AI usage logs" ON ai_usage_logs;

-- Fix browser_capture_events (keep newer policy)
DROP POLICY IF EXISTS "Users can insert own browser captures" ON browser_capture_events;
DROP POLICY IF EXISTS "Users can read own browser captures" ON browser_capture_events;

-- Fix browser_captures (keep user policy, make admin restrictive)
DROP POLICY IF EXISTS "Super admins can view all browser captures" ON browser_captures;
