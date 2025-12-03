/*
  # Seed FB Lead Follow-Up Templates (7-Day Taglish Sequence)

  Professional, friendly, Taglish messaging that converts.
  Designed for Filipino entrepreneurs and their Filipino customers.
*/

-- Insert 7-day sequence templates
INSERT INTO fb_lead_message_templates (template_key, template_name, category, language, content, required_variables) VALUES

-- Day 0: Welcome (Immediate)
('fb_lead_day0_welcome', 'Day 0 - Welcome', 'welcome', 'taglish',
'Hi {{first_name}}! 🙌 Thanks for requesting info about {{product_name}}. Ako yung AI assistant ni {{agent_name}}. Quick question lang — ano yung goal mo right now? (✅ Extra income, ✅ Savings, ✅ Protection, ✅ Others?)',
ARRAY['first_name', 'product_name', 'agent_name']),

-- Day 0: Value Drop (20 minutes later)
('fb_lead_day0_value_drop', 'Day 0 - Value Drop', 'nurture', 'taglish',
'Salamat, {{first_name}}! 🙏 Super common yan sa ibang clients ni {{agent_name}}. Ito yung mabilis na summary kung paano ka matutulungan ng {{product_name}}: {{product_core_benefits}}. Gusto mo ba ng mabilis na sample computation or real-life example?',
ARRAY['first_name', 'agent_name', 'product_name', 'product_core_benefits']),

-- Day 1: Nudge
('fb_lead_day1_nudge', 'Day 1 - Gentle Nudge', 'nurture', 'taglish',
'Hi {{first_name}} 👋 Kahapon ka nag-request ng info about {{product_name}}. May nakita akong magandang option based sa sinabi mong goal na ''{{user_goal}}''. Gusto mo ba i-check yung simple plan na ginawa ko para sayo?',
ARRAY['first_name', 'product_name', 'user_goal']),

-- Day 2: Objection Check
('fb_lead_day2_objection_check', 'Day 2 - Objection Handler', 'objection', 'taglish',
'Quick check lang {{first_name}} 😊 Usually may 3 reasons bakit di nakaka-move forward ang mga tao: 💸 Budget, 🤔 Di pa sure, ⏰ Wala pang time. Alin pinaka-totoo para sayo ngayon? Promise, no pressure — tutulungan lang kita mag-decide ng tama.',
ARRAY['first_name']),

-- Day 3: Booking Push
('fb_lead_day3_booking_push', 'Day 3 - Meeting Booking', 'booking', 'taglish',
'Good news {{first_name}}! 🎉 May free 15-min Zoom/Call si {{agent_name}} this week para i-explain yung pinaka-simple at swak na option for you. Pili ka lang ng time: {{booking_link}}. Kahit hindi ka pa sure, okay lang, para malinawan ka lang muna.',
ARRAY['first_name', 'agent_name', 'booking_link']),

-- Day 5: Social Proof
('fb_lead_day5_social_proof', 'Day 5 - Social Proof', 'social_proof', 'taglish',
'Share ko lang real story: si {{client_example_name}} dati pareho sayo — {{client_pain_point}}. After {{product_name}}, naging {{client_result}} in {{timeframe}}. Gusto mo rin ba ng ganyang plan, kahit maliit lang muna ang start?',
ARRAY['client_example_name', 'client_pain_point', 'product_name', 'client_result', 'timeframe']),

-- Day 7: Last Call
('fb_lead_day7_last_call', 'Day 7 - Last Touch', 'last_call', 'taglish',
'Hi {{first_name}}, last follow-up ko na ito para di ka ma-spam. 😊 Anytime ready ka na magtanong, andito lang ako 24/7 sa chat. If gusto mo ng mabilis na plan, click mo lang ito: {{booking_link}}. Salamat sa time mo, ingat palagi! 🙏',
ARRAY['first_name', 'booking_link'])

ON CONFLICT (template_key) DO NOTHING;

-- Create default sequence for all users
-- This will be used as a fallback if user doesn't have a custom sequence
INSERT INTO fb_lead_followup_sequences (user_id, name, description, default_channel, is_active)
SELECT 
  id,
  'fb_default_7day_sequence',
  'Default 7-day FB lead nurture sequence (Taglish)',
  'messenger',
  true
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM fb_lead_followup_sequences
  WHERE fb_lead_followup_sequences.user_id = auth.users.id
  AND fb_lead_followup_sequences.name = 'fb_default_7day_sequence'
);

-- Insert steps for all default sequences
INSERT INTO fb_lead_followup_steps (sequence_id, step_order, step_name, delay_minutes, condition_type, template_key, send_only_business_hours)
SELECT 
  seq.id,
  1,
  'Welcome',
  0, -- Immediate
  'always',
  'fb_lead_day0_welcome',
  false
FROM fb_lead_followup_sequences seq
WHERE seq.name = 'fb_default_7day_sequence'
AND NOT EXISTS (
  SELECT 1 FROM fb_lead_followup_steps
  WHERE fb_lead_followup_steps.sequence_id = seq.id
  AND fb_lead_followup_steps.step_order = 1
);

INSERT INTO fb_lead_followup_steps (sequence_id, step_order, step_name, delay_minutes, condition_type, template_key, send_only_business_hours)
SELECT 
  seq.id,
  2,
  'Value Drop',
  20, -- 20 minutes
  'no_reply',
  'fb_lead_day0_value_drop',
  false
FROM fb_lead_followup_sequences seq
WHERE seq.name = 'fb_default_7day_sequence'
AND NOT EXISTS (
  SELECT 1 FROM fb_lead_followup_steps
  WHERE fb_lead_followup_steps.sequence_id = seq.id
  AND fb_lead_followup_steps.step_order = 2
);

INSERT INTO fb_lead_followup_steps (sequence_id, step_order, step_name, delay_minutes, condition_type, template_key, send_only_business_hours)
SELECT 
  seq.id,
  3,
  'Day 1 Nudge',
  1440, -- 24 hours
  'no_meeting',
  'fb_lead_day1_nudge',
  true
FROM fb_lead_followup_sequences seq
WHERE seq.name = 'fb_default_7day_sequence'
AND NOT EXISTS (
  SELECT 1 FROM fb_lead_followup_steps
  WHERE fb_lead_followup_steps.sequence_id = seq.id
  AND fb_lead_followup_steps.step_order = 3
);

INSERT INTO fb_lead_followup_steps (sequence_id, step_order, step_name, delay_minutes, condition_type, template_key, send_only_business_hours)
SELECT 
  seq.id,
  4,
  'Objection Check',
  2880, -- 48 hours
  'no_meeting',
  'fb_lead_day2_objection_check',
  true
FROM fb_lead_followup_sequences seq
WHERE seq.name = 'fb_default_7day_sequence'
AND NOT EXISTS (
  SELECT 1 FROM fb_lead_followup_steps
  WHERE fb_lead_followup_steps.sequence_id = seq.id
  AND fb_lead_followup_steps.step_order = 4
);

INSERT INTO fb_lead_followup_steps (sequence_id, step_order, step_name, delay_minutes, condition_type, template_key, send_only_business_hours)
SELECT 
  seq.id,
  5,
  'Booking Push',
  4320, -- 72 hours (3 days)
  'no_meeting',
  'fb_lead_day3_booking_push',
  true
FROM fb_lead_followup_sequences seq
WHERE seq.name = 'fb_default_7day_sequence'
AND NOT EXISTS (
  SELECT 1 FROM fb_lead_followup_steps
  WHERE fb_lead_followup_steps.sequence_id = seq.id
  AND fb_lead_followup_steps.step_order = 5
);

INSERT INTO fb_lead_followup_steps (sequence_id, step_order, step_name, delay_minutes, condition_type, template_key, send_only_business_hours)
SELECT 
  seq.id,
  6,
  'Social Proof',
  7200, -- 120 hours (5 days)
  'no_sale',
  'fb_lead_day5_social_proof',
  true
FROM fb_lead_followup_sequences seq
WHERE seq.name = 'fb_default_7day_sequence'
AND NOT EXISTS (
  SELECT 1 FROM fb_lead_followup_steps
  WHERE fb_lead_followup_steps.sequence_id = seq.id
  AND fb_lead_followup_steps.step_order = 6
);

INSERT INTO fb_lead_followup_steps (sequence_id, step_order, step_name, delay_minutes, condition_type, template_key, send_only_business_hours)
SELECT 
  seq.id,
  7,
  'Last Call',
  10080, -- 168 hours (7 days)
  'no_sale',
  'fb_lead_day7_last_call',
  true
FROM fb_lead_followup_sequences seq
WHERE seq.name = 'fb_default_7day_sequence'
AND NOT EXISTS (
  SELECT 1 FROM fb_lead_followup_steps
  WHERE fb_lead_followup_steps.sequence_id = seq.id
  AND fb_lead_followup_steps.step_order = 7
);