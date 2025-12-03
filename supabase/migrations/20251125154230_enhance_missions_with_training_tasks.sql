/*
  # Enhance Missions System with Training Tasks

  1. Changes
    - Add new columns to missions table for navigation
    - Add training-specific mission types
    - Add linked_page column for direct navigation
    - Add task_category for better organization

  2. New Features
    - Training missions that link to Training Hub
    - Learning challenges that track progress
    - Auto-generated daily tasks
    - Category-based organization
*/

-- Add new columns to missions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'linked_page'
  ) THEN
    ALTER TABLE missions ADD COLUMN linked_page text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'task_category'
  ) THEN
    ALTER TABLE missions ADD COLUMN task_category text DEFAULT 'general';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'navigation_data'
  ) THEN
    ALTER TABLE missions ADD COLUMN navigation_data jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE missions ADD COLUMN order_index integer DEFAULT 0;
  END IF;
END $$;

-- Create index for task_category
CREATE INDEX IF NOT EXISTS idx_missions_category ON missions(task_category);
CREATE INDEX IF NOT EXISTS idx_missions_linked_page ON missions(linked_page);
CREATE INDEX IF NOT EXISTS idx_missions_order ON missions(order_index);

-- Function to auto-generate daily tasks for users with no prospect tasks
CREATE OR REPLACE FUNCTION generate_daily_training_tasks(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_level text;
  v_existing_tasks_count integer;
  v_tasks_to_insert jsonb[];
  v_result jsonb;
BEGIN
  -- Check if user already has active daily tasks
  SELECT COUNT(*) INTO v_existing_tasks_count
  FROM missions
  WHERE user_id = p_user_id
    AND mission_type = 'daily_challenge'
    AND is_completed = false
    AND (expires_at IS NULL OR expires_at > now());

  -- If user has existing tasks, return early
  IF v_existing_tasks_count >= 3 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'User already has active tasks',
      'tasks_created', 0
    );
  END IF;

  -- Get user's current level from profile
  SELECT COALESCE(
    (raw_user_meta_data->>'mlm_level')::text,
    'newbie'
  ) INTO v_user_level
  FROM auth.users
  WHERE id = p_user_id;

  -- Generate training tasks based on level
  IF v_user_level = 'newbie' THEN
    v_tasks_to_insert := ARRAY[
      jsonb_build_object(
        'title', 'Complete Getting Started Training',
        'description', 'Watch the beginner training videos in the Training Hub',
        'mission_type', 'daily_challenge',
        'task_category', 'training',
        'icon_name', 'GraduationCap',
        'color', '#8B5CF6',
        'reward_coins', 50,
        'total_required', 1,
        'linked_page', 'training-hub',
        'navigation_data', '{"section": "getting-started"}',
        'order_index', 1
      ),
      jsonb_build_object(
        'title', 'Learn Product Knowledge',
        'description', 'Study your company products and their benefits',
        'mission_type', 'daily_challenge',
        'task_category', 'learning',
        'icon_name', 'BookOpen',
        'color', '#3B82F6',
        'reward_coins', 40,
        'total_required', 1,
        'linked_page', 'training-hub',
        'navigation_data', '{"section": "product-knowledge"}',
        'order_index', 2
      ),
      jsonb_build_object(
        'title', 'Complete Your Personal About Page',
        'description', 'Generate your AI-powered profile to build credibility',
        'mission_type', 'daily_challenge',
        'task_category', 'profile',
        'icon_name', 'User',
        'color', '#10B981',
        'reward_coins', 30,
        'total_required', 1,
        'linked_page', 'personal-about',
        'navigation_data', '{}',
        'order_index', 3
      )
    ];
  ELSIF v_user_level = 'rising_star' THEN
    v_tasks_to_insert := ARRAY[
      jsonb_build_object(
        'title', 'Advanced Prospecting Training',
        'description', 'Learn advanced techniques for finding high-quality leads',
        'mission_type', 'daily_challenge',
        'task_category', 'training',
        'icon_name', 'Target',
        'color', '#F59E0B',
        'reward_coins', 60,
        'total_required', 1,
        'linked_page', 'training-hub',
        'navigation_data', '{"section": "advanced-prospecting"}',
        'order_index', 1
      ),
      jsonb_build_object(
        'title', 'Master Objection Handling',
        'description', 'Practice handling common objections with confidence',
        'mission_type', 'daily_challenge',
        'task_category', 'learning',
        'icon_name', 'MessageSquare',
        'color', '#EF4444',
        'reward_coins', 50,
        'total_required', 1,
        'linked_page', 'training-hub',
        'navigation_data', '{"section": "objection-handling"}',
        'order_index', 2
      ),
      jsonb_build_object(
        'title', 'Review Your Pipeline',
        'description', 'Analyze your current prospects and plan follow-ups',
        'mission_type', 'daily_challenge',
        'task_category', 'action',
        'icon_name', 'TrendingUp',
        'color', '#14C764',
        'reward_coins', 40,
        'total_required', 1,
        'linked_page', 'pipeline',
        'navigation_data', '{}',
        'order_index', 3
      )
    ];
  ELSIF v_user_level = 'professional' THEN
    v_tasks_to_insert := ARRAY[
      jsonb_build_object(
        'title', 'Leadership Development Training',
        'description', 'Learn how to build and lead a high-performing team',
        'mission_type', 'daily_challenge',
        'task_category', 'training',
        'icon_name', 'Users',
        'color', '#8B5CF6',
        'reward_coins', 75,
        'total_required', 1,
        'linked_page', 'training-hub',
        'navigation_data', '{"section": "leadership"}',
        'order_index', 1
      ),
      jsonb_build_object(
        'title', 'Team Building Strategies',
        'description', 'Study proven methods for recruiting top performers',
        'mission_type', 'daily_challenge',
        'task_category', 'learning',
        'icon_name', 'Award',
        'color', '#F59E0B',
        'reward_coins', 65,
        'total_required', 1,
        'linked_page', 'training-hub',
        'navigation_data', '{"section": "team-building"}',
        'order_index', 2
      ),
      jsonb_build_object(
        'title', 'Update Your AI Coach Plan',
        'description', 'Review AI recommendations and set new goals',
        'mission_type', 'daily_challenge',
        'task_category', 'planning',
        'icon_name', 'Lightbulb',
        'color', '#3B82F6',
        'reward_coins', 50,
        'total_required', 1,
        'linked_page', 'personal-about',
        'navigation_data', '{}',
        'order_index', 3
      )
    ];
  ELSE -- top_earner
    v_tasks_to_insert := ARRAY[
      jsonb_build_object(
        'title', 'Elite Leadership Masterclass',
        'description', 'Advanced strategies for scaling to multiple six figures',
        'mission_type', 'daily_challenge',
        'task_category', 'training',
        'icon_name', 'Crown',
        'color', '#8B5CF6',
        'reward_coins', 100,
        'total_required', 1,
        'linked_page', 'training-hub',
        'navigation_data', '{"section": "elite-training"}',
        'order_index', 1
      ),
      jsonb_build_object(
        'title', 'Legacy Building Session',
        'description', 'Plan your long-term impact and succession strategy',
        'mission_type', 'daily_challenge',
        'task_category', 'planning',
        'icon_name', 'Star',
        'color', '#F59E0B',
        'reward_coins', 85,
        'total_required', 1,
        'linked_page', 'personal-about',
        'navigation_data', '{}',
        'order_index', 2
      ),
      jsonb_build_object(
        'title', 'Mentor Rising Leaders',
        'description', 'Spend time coaching your top performers',
        'mission_type', 'daily_challenge',
        'task_category', 'action',
        'icon_name', 'Users',
        'color', '#10B981',
        'reward_coins', 75,
        'total_required', 1,
        'linked_page', 'pipeline',
        'navigation_data', '{}',
        'order_index', 3
      )
    ];
  END IF;

  -- Insert tasks
  INSERT INTO missions (
    user_id,
    title,
    description,
    mission_type,
    task_category,
    icon_name,
    color,
    reward_coins,
    total_required,
    current_progress,
    linked_page,
    navigation_data,
    order_index,
    expires_at
  )
  SELECT
    p_user_id,
    (task->>'title')::text,
    (task->>'description')::text,
    (task->>'mission_type')::text,
    (task->>'task_category')::text,
    (task->>'icon_name')::text,
    (task->>'color')::text,
    (task->>'reward_coins')::integer,
    (task->>'total_required')::integer,
    0,
    (task->>'linked_page')::text,
    (task->'navigation_data')::jsonb,
    (task->>'order_index')::integer,
    now() + interval '24 hours'
  FROM unnest(v_tasks_to_insert) AS task;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Daily training tasks generated successfully',
    'tasks_created', array_length(v_tasks_to_insert, 1),
    'user_level', v_user_level
  );
END;
$$;