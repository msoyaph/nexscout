-- Setup Script: Save NexScout AI System Instructions to SuperAdmin Chatbot Settings
-- Run this in Supabase SQL Editor to configure the signup page chatbox

-- Step 1: Read the AI System Instructions from NEXSCOUT_AI_SYSTEM_INSTRUCTIONS.md
-- (You'll need to copy the content manually)

-- Step 2: Update or Insert chatbot_settings for SuperAdmin
-- Replace 'YOUR_AI_SYSTEM_INSTRUCTIONS_HERE' with the content from NEXSCOUT_AI_SYSTEM_INSTRUCTIONS.md

DO $$
DECLARE
  superadmin_user_id uuid;
  ai_instructions_text text;
BEGIN
  -- Get SuperAdmin user ID
  SELECT id INTO superadmin_user_id
  FROM profiles
  WHERE email = 'geoffmax22@gmail.com'
  LIMIT 1;

  IF superadmin_user_id IS NULL THEN
    RAISE EXCEPTION 'SuperAdmin user not found. Please check email: geoffmax22@gmail.com';
  END IF;

  -- AI System Instructions (copy from NEXSCOUT_AI_SYSTEM_INSTRUCTIONS.md)
  -- This is a placeholder - you need to copy the full content
  ai_instructions_text := 'You are NexScout AI Assistant

A warm, confident Filipino sales intelligence consultant

— not robotic, not pushy, not repetitive.

You:
- understand sales needs
- recommend smartly
- explain simply
- close softly but effectively
- escalate to agent only when truly needed

[... FULL CONTENT FROM NEXSCOUT_AI_SYSTEM_INSTRUCTIONS.md ...]';

  -- Upsert chatbot_settings
  INSERT INTO chatbot_settings (
    user_id,
    display_name,
    greeting_message,
    tone,
    reply_depth,
    closing_style,
    objection_style,
    auto_qualify_threshold,
    auto_convert_to_prospect,
    enabled_channels,
    widget_color,
    widget_position,
    is_active,
    custom_system_instructions,
    use_custom_instructions,
    instructions_override_intelligence,
    created_at,
    updated_at
  )
  VALUES (
    superadmin_user_id,
    'NexScout AI Assistant',
    'Hi! 👋 I''m your NexScout AI assistant. Ask me anything about our features, pricing, or how we can help grow your business!',
    'friendly',
    'medium',
    'warm',
    'empathetic',
    0.7,
    true,
    ARRAY['web'],
    '#3B82F6',
    'bottom-right',
    true,
    ai_instructions_text,  -- Full AI System Instructions
    true,                   -- Enable custom instructions
    true,                   -- Override intelligence (use ONLY custom instructions)
    now(),
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    custom_system_instructions = ai_instructions_text,
    use_custom_instructions = true,
    instructions_override_intelligence = true,
    updated_at = now();

  RAISE NOTICE '✅ Chatbot settings configured for SuperAdmin: %', superadmin_user_id;
END $$;




