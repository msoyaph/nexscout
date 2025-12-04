/*
  # Insert Updated Subscription Plans v2

  1. New Plans
    - Starter (Free): ₱0
    - Pro – Professional Closer: ₱249
    - Elite – AI Power Closer: ₱499
    - Team Leader Plan: ₱1990
    - Enterprise: ₱4990
    
  2. Features
    - Energy caps
    - Weekly coins
    - AI model access
    - Channel access
    - Feature gating
*/

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'tier') THEN
    ALTER TABLE subscription_plans ADD COLUMN tier text UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'included_energy') THEN
    ALTER TABLE subscription_plans ADD COLUMN included_energy integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'weekly_coins') THEN
    ALTER TABLE subscription_plans ADD COLUMN weekly_coins integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'ai_model_access') THEN
    ALTER TABLE subscription_plans ADD COLUMN ai_model_access jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'omni_channel_access') THEN
    ALTER TABLE subscription_plans ADD COLUMN omni_channel_access jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'chatbot_capabilities') THEN
    ALTER TABLE subscription_plans ADD COLUMN chatbot_capabilities jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'intelligence_level') THEN
    ALTER TABLE subscription_plans ADD COLUMN intelligence_level text DEFAULT 'basic';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'followup_level') THEN
    ALTER TABLE subscription_plans ADD COLUMN followup_level text DEFAULT 'none';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'pipeline_access') THEN
    ALTER TABLE subscription_plans ADD COLUMN pipeline_access jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'team_features') THEN
    ALTER TABLE subscription_plans ADD COLUMN team_features jsonb DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'max_seats') THEN
    ALTER TABLE subscription_plans ADD COLUMN max_seats integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'extra_seat_price') THEN
    ALTER TABLE subscription_plans ADD COLUMN extra_seat_price numeric(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'is_active') THEN
    ALTER TABLE subscription_plans ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'badge') THEN
    ALTER TABLE subscription_plans ADD COLUMN badge text DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'description') THEN
    ALTER TABLE subscription_plans ADD COLUMN description text DEFAULT NULL;
  END IF;
END $$;

-- Clear existing and insert new plans
DELETE FROM subscription_plans;

INSERT INTO subscription_plans (
  name,
  tier,
  display_name,
  description,
  badge,
  price_monthly,
  price_annual,
  included_energy,
  weekly_coins,
  ai_model_access,
  omni_channel_access,
  chatbot_capabilities,
  intelligence_level,
  followup_level,
  pipeline_access,
  max_prospects,
  max_seats,
  extra_seat_price,
  features,
  is_active,
  currency
) VALUES 
(
  'starter',
  'starter',
  'Starter',
  'Free forever - Perfect for getting started',
  NULL,
  0,
  0,
  15,
  35,
  '["gpt-4o-mini"]'::jsonb,
  '["web"]'::jsonb,
  '{"type": "basic", "channels": ["web"]}'::jsonb,
  'basic',
  'none',
  '["stage1", "stage2", "stage3"]'::jsonb,
  100,
  1,
  0,
  '["3 AI Scans per day", "3 AI Messages per day", "1 AI Pitch Deck per week", "Basic AI Chatbot (website only)", "Light prospect insights", "Basic company intelligence", "3-stage pipeline", "Basic reminders", "5 daily coins", "Watch ads for +2 coins"]'::jsonb,
  true,
  'PHP'
),
(
  'pro',
  'pro',
  'Pro – Professional Closer',
  'For serious closers who want unlimited power',
  'Most Popular',
  249,
  2490,
  300,
  150,
  '["gpt-4o", "gpt-4o-mini"]'::jsonb,
  '["web", "messenger", "instagram"]'::jsonb,
  '{"type": "v2", "channels": ["web", "messenger", "instagram"], "auto_responses": true}'::jsonb,
  'v3',
  '7-day',
  '["stage1", "stage2", "stage3", "stage4", "stage5", "stage6"]'::jsonb,
  10000,
  1,
  0,
  '["Unlimited Prospect Scans", "Unlimited AI Messages", "Unlimited AI Pitch Decks", "DeepScan v2", "Multi-Channel Chatbot", "Company Intelligence v3", "7-Day AI Follow-Up", "AI Qualification v2", "Full 6-stage pipeline", "Smart Appointments", "150 weekly coins", "300 energy/day"]'::jsonb,
  true,
  'PHP'
),
(
  'elite',
  'elite',
  'Elite – AI Power Closer',
  'Maximum AI power for top performers',
  'Best Value',
  499,
  4990,
  999999,
  500,
  '["gpt-4o", "gpt-4o-mini", "o1-preview"]'::jsonb,
  '["web", "messenger", "instagram", "whatsapp", "viber", "sms"]'::jsonb,
  '{"type": "v3", "autonomous_closer": true, "emotional_persuasion": true}'::jsonb,
  'v6',
  '30-day',
  '["stage1", "stage2", "stage3", "stage4", "stage5", "stage6", "stage7", "stage8"]'::jsonb,
  100000,
  1,
  0,
  '["Autonomous AI Closer v3", "Company Intelligence v6", "All Channels + WhatsApp + SMS", "Emotional Persuasion v3", "30-Day Follow-Up", "Lead Revival Engine", "Voice Closer Mode", "500 weekly coins", "Unlimited energy"]'::jsonb,
  true,
  'PHP'
),
(
  'team',
  'team',
  'Team Leader Plan',
  'Build and manage your sales team',
  NULL,
  1990,
  19900,
  1000,
  1000,
  '["gpt-4o", "gpt-4o-mini"]'::jsonb,
  '["web", "messenger", "instagram", "whatsapp"]'::jsonb,
  '{"type": "team", "team_branded": true}'::jsonb,
  'v3',
  '7-day',
  '["stage1", "stage2", "stage3", "stage4", "stage5", "stage6"]'::jsonb,
  50000,
  5,
  349,
  '["Team Dashboard", "Performance Reports", "Shared Pipelines", "Team AI Chatbot", "Training Assistant", "Team Analytics", "5 seats included", "Extra seat ₱349/mo", "Pooled 1000 coins/week"]'::jsonb,
  true,
  'PHP'
),
(
  'enterprise',
  'enterprise',
  'Enterprise',
  'Custom solutions for large organizations',
  NULL,
  4990,
  49900,
  999999,
  2000,
  '["gpt-4o", "gpt-4o-mini", "o1-preview", "o1-mini"]'::jsonb,
  '["web", "messenger", "instagram", "whatsapp", "viber", "sms", "email"]'::jsonb,
  '{"type": "enterprise", "custom_integrations": true, "white_label": true}'::jsonb,
  'enterprise',
  'custom',
  '["all"]'::jsonb,
  999999,
  999,
  0,
  '["Unlimited seats", "Company-wide Analytics", "Lead Routing", "Multi-branch Setup", "Custom Integrations", "Dedicated Support", "White-label Options", "API Access", "2000 weekly coins"]'::jsonb,
  true,
  'PHP'
);
