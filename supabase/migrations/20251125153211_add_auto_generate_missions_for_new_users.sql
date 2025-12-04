/*
  # Auto-generate missions for new users

  1. Changes
    - Create trigger function to automatically generate starter missions when new user profile is created
    - Inserts 5 onboarding missions for every new user
    - Missions include: Welcome, First Prospect, Learning, Scan Challenge, Message Challenge

  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only triggers on profile insertion
*/

-- Function to auto-generate starter missions for new users
CREATE OR REPLACE FUNCTION auto_generate_starter_missions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert starter missions for the new user
  INSERT INTO missions (user_id, title, description, mission_type, icon_name, color, reward_coins, total_required, current_progress)
  VALUES
    -- Onboarding missions
    (NEW.id, 'Welcome to NexScout!', 'Complete your profile and explore the app', 'onboarding', 'Sparkles', '#1877F2', 25, 1, 0),
    (NEW.id, 'Get Your First Prospect', 'Scan or add your first prospect to the system', 'onboarding', 'UserPlus', '#14C764', 50, 1, 0),
    (NEW.id, 'Learn App Tips & Hacks', 'Watch the tutorial video or visit Training Hub', 'onboarding', 'GraduationCap', '#A06BFF', 30, 1, 0),
    -- Daily challenges
    (NEW.id, 'Daily Scan Challenge', 'Scan 5 new prospects today using AI scanning', 'daily_challenge', 'Search', '#1877F2', 40, 5, 0),
    (NEW.id, 'Message Master', 'Send 3 AI-powered messages to prospects', 'daily_challenge', 'Mail', '#1EC8FF', 35, 3, 0);

  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate missions for new users
DROP TRIGGER IF EXISTS trigger_auto_generate_starter_missions ON profiles;

CREATE TRIGGER trigger_auto_generate_starter_missions
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_starter_missions();