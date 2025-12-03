/*
  # Seed Default Onboarding Data

  1. Activation Checklist Items (5 Quick Wins)
  2. Aha Moments (6 key milestones)
  3. Lifecycle Milestones (Day 0-90)
  4. Feature Unlock Rules
*/

-- Insert Default Activation Checklist Items (5 Quick Wins)
INSERT INTO activation_checklist_items (name, description, action_type, estimated_time_seconds, xp_reward, sort_order) VALUES
  ('Deploy AI Chatbot', 'Get your AI chatbot live on your page', 'chatbot_deploy', 120, 100, 1),
  ('Capture First Lead', 'Add your first prospect to the system', 'lead_capture', 180, 200, 2),
  ('Send AI Follow-up', 'Let AI send an automated message', 'send_message', 90, 150, 3),
  ('Run DeepScan', 'Analyze a prospect''s buying intent', 'run_deepscan', 120, 200, 4),
  ('Book First Appointment', 'Schedule a meeting with AI assistance', 'book_appointment', 180, 300, 5)
ON CONFLICT DO NOTHING;

-- Insert Aha Moments
INSERT INTO aha_moments (name, description, trigger_event, celebration_type, xp_reward, energy_reward, target_time_minutes, sort_order) VALUES
  ('Chatbot Works!', 'User tests chatbot and sees intelligent response', 'chatbot_test', 'confetti', 50, 20, 5, 1),
  ('First Lead Captured!', 'System automatically captured a lead', 'lead_captured', 'confetti_major', 200, 50, 10, 2),
  ('AI Knows Buying Intent!', 'DeepScan reveals prospect buying score', 'deepscan_complete', 'highlight', 150, 30, 15, 3),
  ('Auto Follow-up Sent!', 'AI sent follow-up without user action', 'auto_followup', 'timeline', 150, 30, 20, 4),
  ('First Appointment Booked!', 'Meeting scheduled via AI', 'appointment_booked', 'confetti_major', 500, 100, 4320, 5),
  ('Works While You Sleep!', 'Lead captured while user was offline', 'offline_activity', 'morning_surprise', 300, 75, 10080, 6)
ON CONFLICT DO NOTHING;

-- Insert Lifecycle Milestones
INSERT INTO lifecycle_milestones (name, phase, day_target, success_criteria, recommended_actions, nudge_message, xp_reward) VALUES
  ('Quick Win', 'quick_win', 0, '{"chatbot_deployed": true, "setup_completed": true}', '{"Test chatbot", "Review auto-populated data"}', 'Complete setup in under 2 minutes!', 100),
  ('First Value', 'activation', 1, '{"leads_captured": 1, "messages_sent": 1}', '{"Capture first lead", "Send first message"}', 'Get your first lead today!', 200),
  ('Early Adoption', 'activation', 3, '{"leads_captured": 5, "deepscan_runs": 2}', '{"Import prospects", "Run DeepScan"}', 'You''re making progress! Keep going.', 300),
  ('Habit Formation', 'habit', 7, '{"daily_logins": 5, "messages_sent": 10}', '{"Check dashboard daily", "Set up calendar"}', 'You''re on a 7-day streak!', 500),
  ('Deep Value', 'deep_value', 14, '{"advanced_features_used": 2, "customizations_made": 3}', '{"Customize chatbot", "Set up automation"}', 'Unlock advanced features!', 750),
  ('Transformation', 'transformation', 30, '{"deals_closed": 1, "leads_captured": 50}', '{"Track ROI", "Invite team"}', 'You''ve transformed your sales process!', 1000),
  ('Power User', 'power_user', 90, '{"team_members": 1, "leads_captured": 500}', '{"Upgrade to team", "Share success"}', 'You''re a NexScout power user!', 2000)
ON CONFLICT DO NOTHING;

-- Insert Feature Unlock Rules
INSERT INTO feature_unlock_rules (feature_name, display_name, description, unlock_phase, unlock_day, unlock_conditions, sort_order) VALUES
  ('chatbot', 'AI Chatbot', 'Deploy intelligent chatbot', 'quick_win', 0, '{}', 1),
  ('products', 'My Products', 'Manage products and services', 'quick_win', 0, '{}', 2),
  ('lead_capture', 'Lead Capture', 'Capture prospects from multiple sources', 'quick_win', 0, '{}', 3),
  ('ai_followup', 'AI Follow-up', 'Automated follow-up messages', 'activation', 1, '{"leads_captured": 1}', 4),
  ('deepscan', 'DeepScan Analysis', 'Analyze prospect buying intent', 'activation', 1, '{"leads_captured": 1}', 5),
  ('calendar', 'Calendar Integration', 'Schedule appointments', 'activation', 3, '{"messages_sent": 3}', 6),
  ('crm_pipeline', 'CRM Pipeline', 'Customize sales stages', 'habit', 7, '{"daily_logins": 5}', 7),
  ('templates', 'Message Templates', 'Create reusable templates', 'habit', 7, '{"messages_sent": 10}', 8),
  ('missions', 'Sales Missions', 'Gamified daily tasks', 'habit', 7, '{}', 9),
  ('product_intelligence', 'Product Intelligence', 'AI-powered product insights', 'deep_value', 14, '{"products_added": 1}', 10),
  ('automation', 'Advanced Automation', 'Complex automation workflows', 'deep_value', 14, '{"messages_sent": 50}', 11),
  ('integrations', 'Integrations', 'Connect external tools', 'deep_value', 14, '{}', 12),
  ('team_features', 'Team Collaboration', 'Invite team members', 'transformation', 30, '{"deals_closed": 1}', 13),
  ('white_label', 'White Label', 'Brand customization', 'transformation', 30, '{}', 14),
  ('api_access', 'API Access', 'Developer API', 'power_user', 90, '{"team_members": 1}', 15)
ON CONFLICT (feature_name) DO NOTHING;