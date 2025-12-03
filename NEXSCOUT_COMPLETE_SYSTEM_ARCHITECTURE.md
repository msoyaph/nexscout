# NexScout.ai - Complete System Architecture & Technical Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Database Architecture](#database-architecture)
4. [Backend Systems](#backend-systems)
5. [AI & Algorithm Systems](#ai--algorithm-systems)
6. [Frontend Architecture](#frontend-architecture)
7. [UI/UX Design System](#uiux-design-system)
8. [Authentication & Security](#authentication--security)
9. [Subscription & Monetization](#subscription--monetization)
10. [Integration Points](#integration-points)
11. [API Reference](#api-reference)
12. [Deployment & Infrastructure](#deployment--infrastructure)

---

## 1. System Overview

### Application Purpose
NexScout.ai is an AI-powered prospect intelligence platform for MLM, Insurance, Real Estate, and Direct Selling professionals in the Philippines. It helps users identify, score, and engage with high-quality prospects through intelligent scanning, AI-generated content, and automated follow-ups.

### Core Value Propositions
- **Intelligent Prospect Scoring**: ScoutScore algorithm (0-100) ranks prospects based on 6+ factors
- **AI Content Generation**: Personalized messages, sequences, and pitch decks
- **Automated Follow-Ups**: Smart reminders and multi-step sequences
- **Tinder-Style UX**: Swipeable prospect cards with gamified interactions
- **Philippine Market Focus**: NLP optimized for Filipino/Taglish content
- **Tiered Subscriptions**: Free, Pro, Elite with escalating features

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NexScout.ai Platform                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    FRONTEND LAYER                           │    │
│  │  React 18 + TypeScript + Vite + TailwindCSS               │    │
│  │  • Authentication (Supabase Auth)                          │    │
│  │  • 60+ Pages & Components                                  │    │
│  │  • Real-time Subscriptions                                 │    │
│  │  • Responsive Mobile-First Design                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↕                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    SUPABASE BACKEND                         │    │
│  │  PostgreSQL + Row Level Security + Realtime                │    │
│  │  • 35+ Database Tables                                     │    │
│  │  • Edge Functions (Deno Runtime)                           │    │
│  │  • Background Jobs                                          │    │
│  │  • Real-time Subscriptions                                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↕                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    AI & PROCESSING LAYER                    │    │
│  │  • NLP Enrichment Engine (Filipino/Taglish)               │    │
│  │  • ScoutScore Algorithm v1.0                               │    │
│  │  • AI Content Generation                                    │    │
│  │  • Scanning Pipeline                                        │    │
│  │  • Notification Engine                                      │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend Technologies
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **Styling**: TailwindCSS 3.4.1 + PostCSS + Autoprefixer
- **Icons**: Lucide React 0.344.0
- **State Management**: React Context API + Hooks
- **Routing**: Custom client-side routing (page-based)

### Backend Technologies
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (JWT-based)
- **Edge Functions**: Deno Runtime
- **Real-time**: Supabase Realtime (WebSocket)
- **Storage**: Supabase Storage (for file uploads)
- **ORM**: Supabase JavaScript Client 2.57.4

### Development Tools
- **Linting**: ESLint 9.9.1
- **Type Checking**: TypeScript compiler
- **Package Manager**: npm
- **Version Control**: Git

### Deployment
- **Platform**: Supabase (Backend + Database)
- **CDN**: Supabase Edge Network
- **Environment**: Production + Development

---

## 3. Database Architecture

### Database Overview
- **Total Tables**: 35+
- **Database Type**: PostgreSQL 15+
- **Security Model**: Row Level Security (RLS) enabled on all tables
- **Indexes**: 50+ performance indexes
- **Functions**: 15+ helper functions
- **Triggers**: Auto-timestamp updates

### Complete Database Schema

#### 3.1 User Management Tables

##### `profiles`
User profile and account information.

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  company text,
  profession text,
  avatar_url text,
  phone text,
  location text,
  bio text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'elite', 'team', 'enterprise')),
  coin_balance integer DEFAULT 0 CHECK (coin_balance >= 0),
  coins_balance integer DEFAULT 100,
  streak_days integer DEFAULT 0 CHECK (streak_days >= 0),
  last_active_date date,
  onboarding_completed boolean DEFAULT false,
  onboarding_step text,
  total_prospects_scanned integer DEFAULT 0,
  total_ai_generations integer DEFAULT 0,
  subscription_end_date timestamptz,
  monthly_coin_bonus integer DEFAULT 0,
  daily_scans_used integer DEFAULT 0,
  daily_messages_used integer DEFAULT 0,
  weekly_presentations_used integer DEFAULT 0,
  daily_ads_watched integer DEFAULT 0,
  last_reset_date date DEFAULT CURRENT_DATE,
  daily_coins_earned integer DEFAULT 0,
  last_daily_reset timestamptz DEFAULT now(),
  last_weekly_reset timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_completed);
```

**Key Fields**:
- `subscription_tier`: free, pro, elite, team, enterprise
- `coin_balance` / `coins_balance`: Virtual currency for AI operations
- `streak_days`: Consecutive days of activity
- Usage tracking fields for subscription enforcement

##### `company_profiles`
Company information for users.

```sql
CREATE TABLE company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  company_name text NOT NULL,
  company_domain text,
  company_description text,
  industry text,
  company_size text,
  founded_year integer,
  location text,
  products jsonb DEFAULT '[]'::jsonb,
  faqs jsonb DEFAULT '[]'::jsonb,
  value_propositions jsonb DEFAULT '[]'::jsonb,
  target_audience text,
  company_logo_url text,
  website_content text,
  social_media jsonb DEFAULT '{}'::jsonb,
  ai_enriched_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Purpose**: Stores company context for AI personalization.

#### 3.2 Subscription & Monetization Tables

##### `subscription_plans`
Available subscription tiers and pricing.

```sql
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  price_monthly numeric DEFAULT 0,
  price_annual numeric DEFAULT 0,
  coin_bonus_monthly integer DEFAULT 0,
  coin_bonus_annual integer DEFAULT 0,
  max_prospects integer DEFAULT 100,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Seeded Plans:
-- free: ₱0/mo, 100 prospects, basic features
-- pro: ₱999/mo or ₱9,999/yr, 1000 prospects, +150 coins/week
-- elite: ₱2,499/mo or ₱24,999/yr, unlimited, +500 coins/week
-- team: ₱9,999/mo, 5 seats, team features
-- enterprise: Custom pricing
```

##### `user_subscriptions`
Active subscriptions for users.

```sql
CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  plan_id uuid REFERENCES subscription_plans(id),
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  status text DEFAULT 'trial' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

##### `coin_transactions`
Audit log for all coin operations.

```sql
CREATE TABLE coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  amount integer NOT NULL,
  transaction_type text CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'purchase', 'ad_reward')),
  description text,
  balance_after integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Coin Costs:
-- Quick Scan: FREE
-- Standard Scan: 50 coins
-- Deep Scan: 150 coins
-- Unlock Prospect: 50 coins
-- Generate Message: 20 coins
-- Generate Sequence: 50 coins (Elite only)
-- Generate Pitch Deck: 75 coins
-- Objection Handler: 15 coins
```

##### `payment_history`
Transaction records.

```sql
CREATE TABLE payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  subscription_id uuid REFERENCES user_subscriptions(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'PHP',
  payment_method text NOT NULL,
  payment_status text DEFAULT 'pending',
  transaction_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
```

#### 3.3 Prospect Management Tables

##### `prospects`
Main prospect entities.

```sql
CREATE TABLE prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  full_name text NOT NULL,
  username text,
  platform text CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'linkedin', 'twitter', 'whatsapp', 'messenger', 'other')),
  profile_link text,
  bio_text text,
  profile_image_url text,
  location text,
  occupation text,
  last_seen_activity_at timestamptz,
  is_unlocked boolean DEFAULT false,
  unlocked_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_prospects_user_id ON prospects(user_id);
CREATE INDEX idx_prospects_is_unlocked ON prospects(is_unlocked);
CREATE INDEX idx_prospects_platform ON prospects(platform);
```

##### `prospect_events`
Social interactions and activities.

```sql
CREATE TABLE prospect_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id),
  user_id uuid REFERENCES auth.users(id),
  event_type text CHECK (event_type IN ('post', 'comment', 'like', 'reaction', 'story', 'share', 'message', 'mention', 'follow', 'profile_view', 'other')),
  event_text text,
  event_timestamp timestamptz,
  platform text NOT NULL,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  emotion text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_prospect_events_prospect_id ON prospect_events(prospect_id);
CREATE INDEX idx_prospect_events_timestamp ON prospect_events(event_timestamp);
```

##### `prospect_profiles`
Aggregated NLP-enriched prospect data.

```sql
CREATE TABLE prospect_profiles (
  prospect_id uuid PRIMARY KEY REFERENCES prospects(id),
  user_id uuid REFERENCES auth.users(id),
  sentiment_avg numeric DEFAULT 0,
  dominant_topics text[] DEFAULT '{}'::text[],
  interests text[] DEFAULT '{}'::text[],
  pain_points text[] DEFAULT '{}'::text[],
  life_events text[] DEFAULT '{}'::text[],
  personality_traits jsonb DEFAULT '{}'::jsonb,
  engagement_score numeric DEFAULT 0,
  business_interest_score numeric DEFAULT 0,
  income_proxy_score numeric DEFAULT 0,
  pain_point_score numeric DEFAULT 0,
  life_event_score numeric DEFAULT 0,
  responsiveness_likelihood numeric DEFAULT 0,
  mlm_leadership_potential numeric DEFAULT 0,
  total_events_count integer DEFAULT 0,
  last_event_at timestamptz,
  last_updated_at timestamptz DEFAULT now()
);
```

**Key Fields**:
- `dominant_topics`: Extracted topics (business, family, finance, health, etc.)
- `interests`: Categorized interests and hobbies
- `pain_points`: Detected pain points (financial stress, debt, bills, etc.)
- `life_events`: Detected life events (new baby, wedding, job change, etc.)
- `personality_traits`: Inferred traits (optimistic, business-minded, family-oriented)
- Score fields: Components of ScoutScore algorithm

##### `prospect_scores`
ScoutScore calculations and rankings.

```sql
CREATE TABLE prospect_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id),
  user_id uuid REFERENCES auth.users(id),
  scout_score numeric DEFAULT 0 CHECK (scout_score >= 0 AND scout_score <= 100),
  bucket text DEFAULT 'cold' CHECK (bucket IN ('hot', 'warm', 'cold')),
  explanation_tags text[] DEFAULT '{}'::text[],
  engagement_score numeric DEFAULT 0,
  business_interest_score numeric DEFAULT 0,
  pain_point_score numeric DEFAULT 0,
  life_event_score numeric DEFAULT 0,
  responsiveness_likelihood numeric DEFAULT 0,
  mlm_leadership_potential numeric DEFAULT 0,
  last_calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_prospect_scores_bucket ON prospect_scores(bucket);
CREATE INDEX idx_prospect_scores_scout_score ON prospect_scores(scout_score DESC);

-- ScoutScore Buckets:
-- HOT (80-100): Immediate outreach
-- WARM (50-79): Good timing
-- COLD (0-49): Nurture over time
```

#### 3.4 Scanning Engine Tables

##### `scanning_sessions`
Scan operation tracking.

```sql
CREATE TABLE scanning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  session_type text CHECK (session_type IN ('quick', 'standard', 'deep')),
  source_type text NOT NULL,
  status text DEFAULT 'initiated' CHECK (status IN ('initiated', 'processing', 'completed', 'failed', 'partial')),
  progress_percentage integer DEFAULT 0,
  current_stage text,
  prospects_found integer DEFAULT 0,
  hot_count integer DEFAULT 0,
  warm_count integer DEFAULT 0,
  cold_count integer DEFAULT 0,
  processing_time_ms bigint,
  error_message text,
  coin_cost integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Scan Types:
-- quick: FREE, basic scoring, 10 prospects max
-- standard: 50 coins, full NLP, 50 prospects
-- deep: 150 coins, advanced analysis, 200 prospects
```

##### `raw_prospect_candidates`
Unprocessed scan data.

```sql
CREATE TABLE raw_prospect_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  source_type text CHECK (source_type IN ('screenshot', 'fb_export', 'linkedin_csv', 'tiktok_export', 'ig_export', 'paste', 'api_facebook', 'api_instagram', 'manual')),
  raw_content jsonb,
  file_path text,
  file_size_bytes bigint,
  processing_status text DEFAULT 'pending',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
```

##### `processing_queue`
Async job queue.

```sql
CREATE TABLE processing_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  session_id uuid REFERENCES scanning_sessions(id),
  candidate_id uuid REFERENCES raw_prospect_candidates(id),
  job_type text CHECK (job_type IN ('ocr', 'parse', 'nlp', 'score', 'enrich')),
  priority integer DEFAULT 5,
  status text DEFAULT 'queued',
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  payload jsonb DEFAULT '{}'::jsonb,
  result jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);
```

#### 3.5 AI Generation Tables

##### `ai_generations`
All AI-generated content.

```sql
CREATE TABLE ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  prospect_id uuid REFERENCES prospects(id),
  generation_type text CHECK (generation_type IN ('message', 'sequence', 'deck', 'objection', 'coaching', 'followup')),
  prompt_hash text,
  input_data jsonb NOT NULL,
  result_content jsonb NOT NULL,
  model_used text DEFAULT 'gpt-3.5-turbo',
  tokens_used integer DEFAULT 0,
  cost_usd numeric DEFAULT 0,
  cache_ttl timestamptz DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_generations_prompt_hash ON ai_generations(prompt_hash);
CREATE INDEX idx_ai_generations_user_prospect ON ai_generations(user_id, prospect_id);
```

##### `generated_messages`
Individual AI messages.

```sql
CREATE TABLE generated_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  prospect_id uuid REFERENCES prospects(id),
  message_text text NOT NULL,
  intent text CHECK (intent IN ('recruit', 'sell', 'follow_up', 'reconnect', 'introduce', 'book_call')),
  tone text CHECK (tone IN ('professional', 'friendly', 'casual', 'direct')),
  model_used text DEFAULT 'gpt-4',
  tokens_used integer DEFAULT 0,
  is_saved boolean DEFAULT false,
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

##### `message_sequences`
Multi-step follow-up campaigns.

```sql
CREATE TABLE message_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  prospect_id uuid REFERENCES prospects(id),
  title text NOT NULL,
  prospect_name text,
  prospect_company text,
  sequence_type text DEFAULT 'follow_up',
  tone text DEFAULT 'Friendly',
  total_steps integer DEFAULT 5,
  current_step integer DEFAULT 0,
  messages jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

##### `sequence_steps`
Individual steps in sequences.

```sql
CREATE TABLE sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES message_sequences(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  message text NOT NULL,
  subject text,
  recommended_send_date timestamptz,
  actual_sent_date timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sequence_id, step_number)
);
```

##### `pitch_decks`
Generated presentation decks.

```sql
CREATE TABLE pitch_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  prospect_id uuid REFERENCES prospects(id),
  title text NOT NULL,
  company_name text,
  industry text,
  target_audience text,
  version text DEFAULT 'basic' CHECK (version IN ('basic', 'elite')),
  slides jsonb DEFAULT '[]'::jsonb,
  content jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

##### `user_library`
Saved content for reuse.

```sql
CREATE TABLE user_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  content_type text CHECK (content_type IN ('message', 'sequence', 'deck', 'template', 'snippet')),
  title text NOT NULL,
  content jsonb NOT NULL,
  tags text[],
  is_favorite boolean DEFAULT false,
  use_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 3.6 Notification System Tables

##### `notifications`
All user notifications.

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  type text CHECK (type IN (
    'hot_lead', 'followup_due', 'sequence_action', 'lead_cooling',
    'streak_reminder', 'mission_alert', 'weekly_report', 'ai_insight',
    'scan_complete', 'coin_earned', 'achievement'
  )),
  title text NOT NULL,
  message text NOT NULL,
  icon text,
  action_url text,
  related_prospect_id uuid REFERENCES prospects(id),
  related_sequence_id uuid REFERENCES message_sequences(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

##### `notification_settings`
User notification preferences.

```sql
CREATE TABLE notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  push_enabled boolean DEFAULT false,
  email_enabled boolean DEFAULT true,
  enable_hot_lead boolean DEFAULT true,
  enable_followup boolean DEFAULT true,
  enable_sequences boolean DEFAULT true,
  enable_missions boolean DEFAULT true,
  enable_weekly_reports boolean DEFAULT true,
  enable_streak_reminders boolean DEFAULT true,
  enable_ai_insights boolean DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  daily_digest boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

##### `follow_up_reminders`
Scheduled follow-up tracking.

```sql
CREATE TABLE follow_up_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  prospect_id uuid REFERENCES prospects(id),
  sequence_id uuid REFERENCES message_sequences(id),
  reminder_type text CHECK (reminder_type IN ('one_time', 'sequence_step', 'pipeline_check', 'manual')),
  reminder_date timestamptz NOT NULL,
  message text,
  status text DEFAULT 'pending',
  notification_id uuid REFERENCES notifications(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

##### `user_streaks`
Activity streak tracking.

```sql
CREATE TABLE user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  streak_start_date date,
  total_active_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

##### `daily_top_prospects`
Cached prospect rankings.

```sql
CREATE TABLE daily_top_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  date date NOT NULL,
  prospect_ids uuid[],
  hot_count integer DEFAULT 0,
  warm_count integer DEFAULT 0,
  total_prospects integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
```

##### `background_jobs`
Job tracking for scheduled tasks.

```sql
CREATE TABLE background_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  status text DEFAULT 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
```

#### 3.7 Admin & System Tables

##### `admin_users`
Administrative access control.

```sql
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  role_id uuid REFERENCES admin_roles(id),
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

##### `admin_roles`
Role-based permissions.

```sql
CREATE TABLE admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Seeded Roles:
-- super_admin: Full access
-- admin: User management, content moderation
-- support: View-only, ticket management
-- analyst: Analytics and reports
-- content_manager: Content approval
-- developer: Technical access
```

##### `system_logs`
Audit trail.

```sql
CREATE TABLE system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
```

##### `ai_usage_logs`
AI operation tracking.

```sql
CREATE TABLE ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  feature_type text NOT NULL,
  model_used text,
  tokens_used integer DEFAULT 0,
  cost_usd numeric DEFAULT 0,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);
```

##### `ai_usage_limits`
Usage limit tracking.

```sql
CREATE TABLE ai_usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  usage_type text CHECK (usage_type IN ('message', 'sequence', 'deck', 'deepscan')),
  usage_period text CHECK (usage_period IN ('daily', 'weekly', 'monthly')),
  usage_count integer DEFAULT 0,
  limit_amount integer NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, usage_type, usage_period, period_start)
);
```

##### `support_tickets`
Customer support system.

```sql
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 3.8 Additional Tables

##### `mission_completions`
Gamification tracking.

```sql
CREATE TABLE mission_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  mission_type text NOT NULL,
  mission_name text NOT NULL,
  coins_earned integer DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);
```

##### `invoices`
Billing records.

```sql
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  payment_id uuid REFERENCES payment_history(id),
  invoice_number text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'PHP',
  description text NOT NULL,
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  due_date timestamptz NOT NULL,
  paid_at timestamptz
);
```

##### `subscription_events`
Subscription lifecycle tracking.

```sql
CREATE TABLE subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  from_tier text,
  to_tier text,
  amount_php numeric,
  created_at timestamptz DEFAULT now()
);
```

##### `usage_tracking`
Feature usage analytics.

```sql
CREATE TABLE usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  action_count integer DEFAULT 1,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
```

##### `team_subscriptions`
Team plan management.

```sql
CREATE TABLE team_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES user_subscriptions(id),
  team_name text NOT NULL,
  team_leader_id uuid REFERENCES auth.users(id),
  max_seats integer DEFAULT 5,
  used_seats integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

##### `team_members`
Team membership.

```sql
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES team_subscriptions(id),
  user_id uuid REFERENCES auth.users(id),
  role text DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at timestamptz DEFAULT now()
);
```

##### `enterprise_organizations`
Enterprise accounts.

```sql
CREATE TABLE enterprise_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  admin_user_id uuid REFERENCES auth.users(id),
  seats_purchased integer DEFAULT 0,
  seats_used integer DEFAULT 0,
  contract_start date,
  contract_end date,
  monthly_price_php numeric,
  status text DEFAULT 'active',
  custom_features jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
```

##### `feature_flags`
Feature rollout control.

```sql
CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text UNIQUE NOT NULL,
  enabled boolean DEFAULT false,
  description text,
  rollout_percentage integer DEFAULT 100,
  updated_at timestamptz DEFAULT now()
);
```

##### `system_health_metrics`
System monitoring.

```sql
CREATE TABLE system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  value numeric,
  status text,
  details jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz DEFAULT now()
);
```

### Database Functions & Triggers

#### Key Helper Functions

1. **`create_notification()`** - Creates notification with user preference checks
2. **`update_user_streak()`** - Updates activity streaks (consecutive days)
3. **`get_unread_count()`** - Returns unread notification count
4. **`mark_all_read()`** - Marks all notifications as read
5. **`check_ai_usage_limit()`** - Checks if user can perform action
6. **`increment_ai_usage()`** - Increments usage counter
7. **`calculate_scout_score()`** - Server-side scoring calculation
8. **`get_score_bucket()`** - Determines HOT/WARM/COLD bucket
9. **`cleanup_expired_ai_generations()`** - Removes old cached generations

#### Auto-Update Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to tables:
-- profiles, company_profiles, prospects, message_sequences,
-- pitch_decks, user_library, notification_settings, user_streaks
```

---

## 4. Backend Systems

### 4.1 Supabase Edge Functions

Edge Functions run on Deno runtime and handle async processing, scheduled jobs, and heavy computations.

#### Function 1: `process-scan`

**Purpose**: Async prospect scanning and scoring
**URL**: `/functions/v1/process-scan`
**Auth**: Required (JWT)

**Request**:
```json
{
  "sessionId": "uuid",
  "candidateId": "uuid"
}
```

**Process**:
1. Fetch raw candidate data from `raw_prospect_candidates`
2. Parse based on source type (CSV, paste, screenshot)
3. Extract prospect entities (name, username, platform)
4. Create/update `prospects` records
5. Log social events to `prospect_events`
6. Run NLP enrichment
7. Calculate ScoutScore
8. Update session with results

**Response**:
```json
{
  "success": true,
  "prospectsCreated": 15,
  "hotCount": 3,
  "warmCount": 8,
  "coldCount": 4
}
```

#### Function 2: `generate-ai-content`

**Purpose**: AI content generation with caching
**URL**: `/functions/v1/generate-ai-content`
**Auth**: Required (JWT)

**Request**:
```json
{
  "prospectId": "uuid",
  "generationType": "message" | "sequence" | "deck" | "objection",
  "tone": "professional" | "friendly" | "casual" | "direct",
  "goal": "recruit" | "sell" | "book_call" | "introduce",
  "productName": "Product Name"
}
```

**Process**:
1. Validate authentication
2. Check subscription tier and limits
3. Verify and deduct coins
4. Check cache (24-hour TTL)
5. Fetch prospect context (profile, scores, pain points)
6. Generate content based on type:
   - **Message**: Single personalized outreach
   - **Sequence**: 5-step follow-up campaign
   - **Deck**: 6-slide pitch presentation
   - **Objection**: Objection handler responses
7. Save to `ai_generations` table
8. Log usage to `ai_usage_logs`
9. Return generated content

**Response**:
```json
{
  "success": true,
  "generationId": "uuid",
  "output": {
    "message": "Hi John! 👋\n\nI came across your profile..."
  }
}
```

#### Function 3: `enrich-company-data`

**Purpose**: AI-powered company profile enrichment
**URL**: `/functions/v1/enrich-company-data`
**Auth**: Required (JWT)

**Request**:
```json
{
  "companyId": "uuid",
  "websiteUrl": "https://example.com"
}
```

**Process**:
1. Fetch website content
2. Extract company information
3. Identify products/services
4. Generate value propositions
5. Create FAQs
6. Update `company_profiles` table

#### Function 4: `notification-processor`

**Purpose**: Scheduled background jobs for notifications
**URL**: `/functions/v1/notification-processor`
**Auth**: Service role (no JWT)

**Request**:
```json
{
  "jobType": "daily_rescan" | "followup_check" | "inactivity_check" | "streak_reminder" | "weekly_summary"
}
```

**Job Types**:

1. **daily_rescan** (6 AM daily):
   - Re-score all prospects
   - Identify new HOT leads
   - Create notifications
   - Cache in `daily_top_prospects`

2. **followup_check** (Hourly):
   - Query pending reminders
   - Create due follow-up notifications
   - Mark reminders as sent

3. **inactivity_check** (Daily):
   - Find prospects with no activity in 7+ days
   - Create cooling lead alerts

4. **streak_reminder** (9 PM daily):
   - Find users with streaks >= 3 who haven't been active today
   - Send streak maintenance reminders

5. **weekly_summary** (Sunday evening):
   - Aggregate weekly stats (prospects, messages, decks, streak)
   - Create weekly report notifications

**Process**:
1. Create job record in `background_jobs`
2. Execute job logic
3. Update job status (completed/failed)
4. Log errors if any

### 4.2 Services Layer (Client-Side)

#### Service 1: Scanning Engine (`scanningEngine.ts`)

**Purpose**: Client-side scanning orchestration

**Key Methods**:

```typescript
// Initiate scan
const sessionId = await scanningEngine.initiateScan({
  userId: user.id,
  sourceType: 'paste',
  sessionType: 'standard', // quick, standard, deep
  rawContent: { text: '...' }
});

// Get progress
const progress = await scanningEngine.getScanProgress(sessionId);

// Get top prospects
const prospects = await scanningEngine.getTopProspects(userId, 20);

// Unlock prospect
await scanningEngine.unlockProspect(userId, prospectId);
```

**Scan Types**:
- **Quick**: FREE, basic scoring, 10 prospects max
- **Standard**: 50 coins, full NLP, 50 prospects
- **Deep**: 150 coins, advanced analysis, 200 prospects

#### Service 2: Messaging Engine (`messagingEngine.ts`)

**Purpose**: AI content generation management

**Key Methods**:

```typescript
// Generate message
const result = await messagingEngine.generateMessage({
  userId: user.id,
  prospectId: 'uuid',
  prospectName: 'John Doe',
  intent: 'recruit',
  tone: 'friendly',
  productName: 'My Business'
});

// Generate sequence (Elite only)
const sequence = await messagingEngine.generateSequence({
  userId: user.id,
  prospectId: 'uuid',
  prospectName: 'Jane Smith',
  tone: 'professional',
  sequenceType: 'follow_up',
  totalSteps: 5
});

// Generate pitch deck
const deck = await messagingEngine.generateDeck({
  userId: user.id,
  prospectId: 'uuid',
  productName: 'My Product',
  version: 'basic' // or 'elite'
});

// Save to library
await messagingEngine.saveToLibrary({
  userId: user.id,
  contentType: 'message',
  title: 'Recruitment message',
  content: { message: '...' },
  tags: ['recruitment', 'friendly']
});

// Get library
const library = await messagingEngine.getLibrary(userId, 'message');

// Check usage limit
const limit = await messagingEngine.checkUsageLimit(userId, 'message');
```

**Subscription Enforcement**:
- **Free**: 2 messages/day, 1 deck/week, no sequences
- **Pro**: Unlimited messages, 5 decks/week, no sequences
- **Elite**: Unlimited everything + sequences + advanced features

#### Service 3: Notification Service (`notificationService.ts`)

**Purpose**: Notification management

**Key Methods**:

```typescript
// Get notifications
const result = await notificationService.getNotifications(userId, 50);

// Get unread count
const count = await notificationService.getUnreadCount(userId);

// Create notification
await notificationService.createNotification({
  userId: user.id,
  type: 'hot_lead',
  title: '🔥 New HOT Prospect!',
  message: 'Maria Garcia is ready',
  prospectId: 'uuid',
  priority: 'high'
});

// Mark as read
await notificationService.markAsRead(notificationId);

// Mark all as read
await notificationService.markAllAsRead(userId);

// Get/update settings
const settings = await notificationService.getSettings(userId);
await notificationService.updateSettings(userId, {
  enable_hot_lead: true,
  push_enabled: false
});

// Subscribe to real-time
const unsubscribe = notificationService.subscribeToNotifications(
  userId,
  (notification) => {
    // Handle new notification
  }
);
```

**Notification Types**:
- 🔥 `hot_lead` - New HOT prospects
- 🕒 `followup_due` - Due reminders
- 📨 `sequence_action` - Sequence steps
- ❄️ `lead_cooling` - Inactive prospects
- ⭐ `streak_reminder` - Activity streaks
- 🎯 `mission_alert` - Goals
- 📊 `weekly_report` - Summaries
- 🧠 `ai_insight` - Recommendations
- ✅ `scan_complete` - Scan finished
- 🪙 `coin_earned` - Rewards
- 🏆 `achievement` - Milestones

#### Service 4: NLP Enrichment (`nlpEnrichment.ts`)

**Purpose**: Text analysis and feature extraction

**Key Methods**:

```typescript
// Analyze single text
const analysis = nlpEnrichment.analyzeText(text);
// Returns: {
//   sentiment: 'positive' | 'neutral' | 'negative',
//   topics: string[],
//   interests: string[],
//   painPoints: string[],
//   lifeEvents: string[],
//   personalityTraits: string[]
// }

// Aggregate multiple events
const profile = nlpEnrichment.aggregateEventAnalysis(events);
```

**NLP Features**:

1. **Sentiment Analysis**: Positive/Neutral/Negative
2. **Topic Extraction**: Business, finance, family, health, travel, etc.
3. **Interest Detection**: Categorized interests
4. **Pain Point Identification**: Financial stress, debt, bills, etc.
5. **Life Event Detection**: New baby, wedding, job change, relocation
6. **Personality Inference**: Optimistic, business-minded, family-oriented

**Keywords (Filipino/Taglish)**:

```typescript
// Business keywords
['negosyo', 'business', 'sideline', 'extra income', 'passive income',
 'raket', 'online selling', 'kita', 'kumita', 'investment']

// Pain points
['walang pera', 'utang', 'debt', 'hirap', 'stress', 'worried',
 'bills', 'gastos', 'expenses', 'sahod', 'sweldo', 'kulang']

// Life events
['buntis', 'pregnant', 'baby', 'kasal', 'wedding', 'new job',
 'lipat', 'moved', 'relocated', 'birthday', 'graduate']
```

#### Service 5: Scout Scoring (`scoutScoring.ts`)

**Purpose**: Prospect ranking algorithm

**Key Methods**:

```typescript
// Calculate score
const scoreResult = scoutScoring.calculateScore(enrichmentData);

// Save score
await scoutScoring.saveScore(prospectId, userId, scoreResult);

// Recalculate all scores
const count = await scoutScoring.recalculateScoresForUser(userId);
```

**ScoutScore v1.0 Formula**:

```
ScoutScore (0-100) =
  0.25 × engagement_score +
  0.20 × business_interest_score +
  0.20 × pain_point_score +
  0.15 × life_event_score +
  0.10 × responsiveness_likelihood +
  0.10 × mlm_leadership_potential
```

**Bucketing**:
- **HOT (80-100)**: Immediate outreach, high conversion potential
- **WARM (50-79)**: Good timing, moderate interest
- **COLD (0-49)**: Nurture over time, low priority

**Explanation Tags** (Auto-generated):
- "💰 Experiencing financial pressure"
- "👶 New baby - financial planning opportunity"
- "🎯 Showing business interest"
- "💬 High engagement - responds often"
- "🏢 Discussing career changes"
- "📈 Leadership potential detected"
- "⭐ Life event detected - wedding soon"
- "🔥 Multiple pain points identified"

#### Service 6: Processing Pipeline (`processingPipeline.ts`)

**Purpose**: Orchestrate multi-stage scanning

**Pipeline Stages**:

1. **Loading (0-20%)**: Fetch raw data
2. **Parsing (20-40%)**: Extract entities
3. **Entity Creation (40-60%)**: Create prospect records
4. **Event Logging (60%)**: Store interactions
5. **NLP Enrichment (60-80%)**: Analyze text
6. **Scoring (80-95%)**: Calculate ScoutScore
7. **Finalization (95-100%)**: Update session

**Supported Parsers**:
- `parsePastedText()` - Line-by-line names
- `parseCSV()` - Structured data
- `parseFacebookExport()` - FB data format
- `parseLinkedInExport()` - LinkedIn connections

---

## 5. AI & Algorithm Systems

### 5.1 ScoutScore Algorithm v1.0

**Purpose**: Rank prospects from 0-100 based on conversion potential

**Algorithm Details**:

```typescript
interface EnrichmentData {
  engagement_score: number;       // 0-100
  business_interest_score: number; // 0-100
  pain_point_score: number;       // 0-100
  life_event_score: number;       // 0-100
  responsiveness_likelihood: number; // 0-100
  mlm_leadership_potential: number; // 0-100
}

function calculateScoutScore(data: EnrichmentData): number {
  const weights = {
    engagement: 0.25,
    business_interest: 0.20,
    pain_point: 0.20,
    life_event: 0.15,
    responsiveness: 0.10,
    leadership: 0.10
  };

  const score =
    (data.engagement_score * weights.engagement) +
    (data.business_interest_score * weights.business_interest) +
    (data.pain_point_score * weights.pain_point) +
    (data.life_event_score * weights.life_event) +
    (data.responsiveness_likelihood * weights.responsiveness) +
    (data.mlm_leadership_potential * weights.leadership);

  return Math.round(Math.max(0, Math.min(100, score)));
}

function determineBucket(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}
```

**Component Score Calculations**:

1. **Engagement Score**:
   ```typescript
   engagement_score = (
     (total_events / 10) * 30 +
     (unique_event_types / 5) * 20 +
     (recent_activity_bonus) * 50
   );
   ```

2. **Business Interest Score**:
   ```typescript
   business_interest_score = (
     (business_keywords_found / business_keyword_list.length) * 100
   );
   ```

3. **Pain Point Score**:
   ```typescript
   pain_point_score = (
     (pain_keywords_found / pain_keyword_list.length) * 100
   );
   ```

4. **Life Event Score**:
   ```typescript
   life_event_score = (
     (life_events_detected.length / 5) * 100
   );
   ```

5. **Responsiveness Likelihood**:
   ```typescript
   responsiveness_likelihood = (
     (comment_count / total_events) * 40 +
     (message_count / total_events) * 60
   );
   ```

6. **MLM Leadership Potential**:
   ```typescript
   mlm_leadership_potential = (
     (has_network_mentions) * 30 +
     (shows_entrepreneurial_spirit) * 40 +
     (has_follower_count > 500) * 30
   );
   ```

### 5.2 NLP Enrichment Engine

**Purpose**: Extract intelligence from prospect content (Filipino/Taglish optimized)

**Text Analysis Pipeline**:

```typescript
interface NLPAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  interests: string[];
  painPoints: string[];
  lifeEvents: string[];
  personalityTraits: string[];
}

function analyzeText(text: string): NLPAnalysis {
  const normalized = text.toLowerCase();

  // 1. Sentiment Analysis
  const sentiment = analyzeSentiment(normalized);

  // 2. Topic Extraction
  const topics = extractTopics(normalized);

  // 3. Interest Detection
  const interests = detectInterests(normalized);

  // 4. Pain Point Identification
  const painPoints = identifyPainPoints(normalized);

  // 5. Life Event Detection
  const lifeEvents = detectLifeEvents(normalized);

  // 6. Personality Inference
  const personalityTraits = inferPersonality(normalized, sentiment);

  return {
    sentiment,
    topics,
    interests,
    painPoints,
    lifeEvents,
    personalityTraits
  };
}
```

**Keyword Categories**:

```typescript
const BUSINESS_KEYWORDS = [
  'negosyo', 'business', 'sideline', 'extra income', 'passive income',
  'online business', 'entrepreneur', 'raket', 'kita', 'kumita',
  'online selling', 'home-based', 'work from home', 'investment',
  'franchise', 'reseller', 'distributor', 'networking'
];

const PAIN_POINT_KEYWORDS = [
  'walang pera', 'walang trabaho', 'utang', 'debt', 'hirap',
  'stress', 'worried', 'anxiety', 'bills', 'gastos', 'expenses',
  'kulang', 'sahod', 'sweldo', 'budget', 'financial problem',
  'kailangan ng pera', 'emergency fund'
];

const LIFE_EVENT_KEYWORDS = [
  'buntis', 'pregnant', 'baby', 'newborn', 'kasal', 'wedding',
  'married', 'new job', 'promoted', 'resigned', 'lipat', 'moved',
  'relocated', 'birthday', 'graduate', 'graduation', 'anniversary'
];

const INTEREST_KEYWORDS = {
  fitness: ['gym', 'workout', 'fitness', 'healthy', 'diet', 'exercise'],
  travel: ['travel', 'vacation', 'trip', 'tour', 'lakbay', 'byahe'],
  family: ['family', 'pamilya', 'kids', 'children', 'anak', 'asawa'],
  fashion: ['fashion', 'shopping', 'outfit', 'style', 'clothes'],
  food: ['food', 'restaurant', 'cooking', 'recipe', 'ulam', 'luto'],
  tech: ['tech', 'gadget', 'phone', 'computer', 'app', 'software']
};
```

**Sentiment Scoring**:

```typescript
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    'happy', 'masaya', 'blessed', 'grateful', 'salamat', 'thank you',
    'excited', 'amazing', 'great', 'good', 'love', 'mahal'
  ];

  const negativeWords = [
    'sad', 'malungkot', 'problema', 'problem', 'hirap', 'difficult',
    'stress', 'worried', 'takot', 'afraid', 'hate', 'bad'
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (text.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (text.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}
```

### 5.3 AI Content Generation

**Purpose**: Create personalized outreach content

**Generation Types**:

#### 1. Message Generation

```typescript
interface MessageParams {
  prospectName: string;
  tone: 'professional' | 'friendly' | 'casual' | 'direct';
  goal: 'recruit' | 'sell' | 'follow_up' | 'reconnect' | 'introduce' | 'book_call';
  context: {
    topics: string[];
    painPoints: string[];
    lifeEvents: string[];
    interests: string[];
  };
  productName?: string;
}

function generateMessage(params: MessageParams): string {
  const greeting = getGreeting(params.tone);
  let message = `${greeting} ${params.prospectName}! 👋\n\n`;

  // Add life event acknowledgment
  if (params.context.lifeEvents.includes('new_baby')) {
    message += 'Congrats on the new addition to your family! ';
  }

  // Add pain point empathy
  if (params.context.painPoints.includes('financial_stress')) {
    message += 'I understand managing finances can be challenging. ';
  }

  // Add main pitch based on goal
  if (params.goal === 'recruit') {
    message += `I wanted to reach out because I think you'd be a great fit for something I'm working on. `;
    message += `Given your interest in ${params.context.topics[0] || 'business opportunities'}, `;
    message += `I believe this could be perfect for you.\n\n`;
  }

  // Add call-to-action
  message += getCTA(params.goal);

  return message;
}
```

#### 2. Sequence Generation (Elite only)

```typescript
interface SequenceStep {
  step: number;
  day: number;
  subject: string;
  message: string;
}

function generateSequence(params: MessageParams): SequenceStep[] {
  return [
    {
      step: 1,
      day: 0,
      subject: `Quick question about ${params.context.topics[0]}`,
      message: generateMessage({ ...params, goal: 'introduce' })
    },
    {
      step: 2,
      day: 3,
      subject: 'Following up',
      message: `Hi ${params.prospectName},\n\nJust wanted to follow up...`
    },
    {
      step: 3,
      day: 7,
      subject: 'Value for you',
      message: `Hey ${params.prospectName}!\n\nI wanted to share something valuable...`
    },
    {
      step: 4,
      day: 10,
      subject: 'Last chance',
      message: `Hi ${params.prospectName},\n\nI don't want you to miss out...`
    },
    {
      step: 5,
      day: 14,
      subject: 'Closing the loop',
      message: `${params.prospectName},\n\nThis will be my last message...`
    }
  ];
}
```

#### 3. Pitch Deck Generation

```typescript
interface Slide {
  slide: number;
  title: string;
  content: string;
}

function generateDeck(productName: string, context: any): Slide[] {
  return [
    {
      slide: 1,
      title: 'The Problem',
      content: generateProblemSlide(context.painPoints)
    },
    {
      slide: 2,
      title: `Meet ${productName}`,
      content: `${productName} is designed to help you overcome these challenges...`
    },
    {
      slide: 3,
      title: 'Key Benefits',
      content: '• Flexible income opportunity\n• Work on your own schedule...'
    },
    {
      slide: 4,
      title: 'Perfect For You',
      content: generatePersonalizedSlide(context.interests)
    },
    {
      slide: 5,
      title: 'Success Stories',
      content: 'Thousands of people just like you have transformed their lives...'
    },
    {
      slide: 6,
      title: 'Next Steps',
      content: 'Ready to get started?\n1. Schedule a call\n2. Get training...'
    }
  ];
}
```

### 5.4 Caching Strategy

**Purpose**: Reduce AI costs and improve response time

**Cache Implementation**:

```typescript
interface CacheEntry {
  prompt_hash: string;
  result_content: any;
  cache_ttl: Date;
}

function getCachedGeneration(promptHash: string): CacheEntry | null {
  const cached = db.query(`
    SELECT * FROM ai_generations
    WHERE prompt_hash = $1
    AND cache_ttl > NOW()
    LIMIT 1
  `, [promptHash]);

  return cached || null;
}

function cacheGeneration(promptHash: string, result: any, ttl: number = 24) {
  db.query(`
    INSERT INTO ai_generations (prompt_hash, result_content, cache_ttl)
    VALUES ($1, $2, NOW() + INTERVAL '${ttl} hours')
  `, [promptHash, result]);
}
```

**Cache TTL**:
- Messages: 24 hours
- Sequences: 48 hours
- Pitch Decks: 72 hours
- Objection Handlers: 7 days

---

## 6. Frontend Architecture

### 6.1 Application Structure

```
src/
├── App.tsx                 # Main app router
├── main.tsx               # Entry point
├── index.css              # Global styles
├── vite-env.d.ts          # TypeScript definitions
├── components/            # Reusable components (13 files)
│   ├── ActionPopup.tsx
│   ├── AIMessageList.tsx
│   ├── GenerateDeckModal.tsx
│   ├── GenerateMessageModal.tsx
│   ├── GenerateSequenceModal.tsx
│   ├── LockedProspectCard.tsx
│   ├── NotificationCenter.tsx
│   ├── PaywallModal.tsx
│   ├── PitchDeckList.tsx
│   ├── SlideInMenu.tsx
│   ├── SplashScreen.tsx
│   └── TierBadge.tsx
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication state
├── hooks/                 # Custom hooks
│   ├── useScanning.ts
│   └── useSubscription.ts
├── lib/                   # Utilities & config
│   ├── companyData.ts
│   ├── subscriptionTiers.ts
│   └── supabase.ts        # Supabase client
├── pages/                 # 60+ page components
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── ProspectsPage.tsx
│   ├── ProspectDetailPage.tsx
│   ├── ScanEntryPage.tsx
│   ├── ScanUploadPage.tsx
│   ├── ScanProcessingPage.tsx
│   ├── ScanResultsPage.tsx
│   ├── DeepScanPage.tsx
│   ├── LibraryPage.tsx
│   ├── NotificationsPage.tsx
│   ├── NotificationSettingsPage.tsx
│   ├── PipelinePage.tsx
│   ├── MissionsPage.tsx
│   ├── WalletPage.tsx
│   ├── SubscriptionPage.tsx
│   ├── PricingPage.tsx
│   ├── SettingsPage.tsx
│   ├── SupportPage.tsx
│   ├── admin/             # Admin dashboard (8 files)
│   │   ├── SuperAdminDashboard.tsx
│   │   ├── DashboardHome.tsx
│   │   ├── UserManagement.tsx
│   │   ├── SubscriptionManagement.tsx
│   │   ├── FinancialDashboard.tsx
│   │   ├── AIAnalytics.tsx
│   │   ├── CoinMissionAnalytics.tsx
│   │   └── SystemHealth.tsx
│   └── onboarding/        # Onboarding flow (4 files)
│       ├── OnboardingFlow.tsx
│       ├── OnboardingStep1.tsx
│       ├── OnboardingStep2.tsx
│       └── OnboardingStep3.tsx
├── services/              # Business logic layer (7 files)
│   ├── index.ts
│   ├── aiGeneration.ts
│   ├── messagingEngine.ts
│   ├── nlpEnrichment.ts
│   ├── notificationService.ts
│   ├── processingPipeline.ts
│   ├── scanningEngine.ts
│   └── scoutScoring.ts
└── types/                 # TypeScript types
    └── database.ts        # Database type definitions
```

### 6.2 Routing System

**Custom Client-Side Router**:

```typescript
type Page =
  | 'home' | 'login' | 'signup' | 'onboarding'
  | 'prospects' | 'prospect-detail' | 'pipeline'
  | 'scan-entry' | 'scan-upload' | 'scan-processing' | 'scan-results'
  | 'deep-scan' | 'library' | 'notifications' | 'notification-settings'
  | 'wallet' | 'missions' | 'subscription' | 'pricing'
  | 'settings' | 'support'
  | 'pitchdeck' | 'messagesequencer' | 'realtimescan' | 'deepscan';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [pageOptions, setPageOptions] = useState<any>(null);

  const handleNavigate = (page: Page, options?: any) => {
    setCurrentPage(page);
    setPageOptions(options || null);
  };

  // Render based on currentPage
  if (currentPage === 'home') return <HomePage onNavigate={handleNavigate} />;
  if (currentPage === 'prospects') return <ProspectsPage onNavigate={handleNavigate} />;
  // ... etc
}
```

### 6.3 Authentication Flow

**Auth Context** (`AuthContext.tsx`):

```typescript
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Authentication Flow**:

1. **Splash Screen** (2 seconds)
2. **Check Session**:
   - If user exists → Load profile → Check onboarding
   - If no user → Show LoginPage
3. **Login/Signup**:
   - Email/password authentication via Supabase Auth
   - JWT token stored in localStorage
   - Auto-create profile record (trigger)
4. **Onboarding**:
   - 3-step flow (role, goals, platforms)
   - Mark `onboarding_completed = true`
5. **Main App**:
   - Protected routes require authentication
   - Profile data cached in context

### 6.4 State Management

**Primary Pattern**: React Context API + Hooks

**Contexts**:
1. **AuthContext**: User session, profile data
2. **Local Component State**: Page-specific data

**Data Fetching Pattern**:

```typescript
function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProspects();
  }, []);

  async function loadProspects() {
    setLoading(true);
    const { data, error } = await supabase
      .from('prospects')
      .select('*, prospect_scores(*)')
      .eq('user_id', userId)
      .order('scout_score', { ascending: false });

    if (data) setProspects(data);
    setLoading(false);
  }

  return (/* JSX */);
}
```

**Real-time Subscriptions**:

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
```

### 6.5 Custom Hooks

#### `useScanning.ts`

```typescript
interface ScanningState {
  isScanning: boolean;
  progress: number;
  stage: string;
  results: Prospect[];
  error: string | null;
}

export function useScanning() {
  const [state, setState] = useState<ScanningState>({
    isScanning: false,
    progress: 0,
    stage: '',
    results: [],
    error: null
  });

  const startScan = async (sourceType: string, rawData: any) => {
    setState(prev => ({ ...prev, isScanning: true, progress: 0 }));

    // Initiate scan
    const sessionId = await scanningEngine.initiateScan({
      userId,
      sourceType,
      sessionType: 'standard',
      rawContent: rawData
    });

    // Poll progress
    const interval = setInterval(async () => {
      const progress = await scanningEngine.getScanProgress(sessionId);
      setState(prev => ({
        ...prev,
        progress: progress.percentage,
        stage: progress.stage
      }));

      if (progress.status === 'completed') {
        clearInterval(interval);
        const results = await scanningEngine.getResults(sessionId);
        setState(prev => ({
          ...prev,
          isScanning: false,
          results: results.prospects
        }));
      }
    }, 1000);
  };

  return { ...state, startScan };
}
```

#### `useSubscription.ts`

```typescript
export function useSubscription() {
  const { profile } = useAuth();

  const canAccessFeature = (feature: 'sequences' | 'advanced_deck' | 'deepscan') => {
    if (feature === 'sequences' || feature === 'deepscan') {
      return profile?.subscription_tier === 'elite';
    }
    return profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'elite';
  };

  const getFeatureLimit = (feature: 'messages' | 'decks') => {
    if (profile?.subscription_tier === 'elite') return -1; // Unlimited
    if (profile?.subscription_tier === 'pro') {
      return feature === 'messages' ? -1 : 5; // Unlimited messages, 5 decks
    }
    return feature === 'messages' ? 2 : 1; // 2 messages, 1 deck per period
  };

  return { canAccessFeature, getFeatureLimit };
}
```

---

## 7. UI/UX Design System

### 7.1 Design Principles

1. **Clean Light Theme**: White backgrounds, minimal clutter
2. **Facebook-Inspired Colors**: #1877F2 (blue), #1EC8FF (aqua)
3. **Tinder-Style Interactions**: Swipeable cards, quick actions
4. **Rounded Components**: 24-30px border radius
5. **Smooth Animations**: iOS-style transitions (0.3s ease-out)
6. **Mobile-First**: Responsive design, touch-optimized
7. **Gamification**: Streaks, missions, coins, badges
8. **Premium Feel**: Gradients, shadows, micro-interactions

### 7.2 Color System

```css
/* Primary Colors */
--nexscout-blue: #1877F2;
--nexscout-aqua: #1EC8FF;

/* Subscription Tiers */
--free-gray: #6B7280;
--pro-blue: #1877F2;
--elite-gold: #F59E0B;

/* ScoutScore Buckets */
--hot-red: #EF4444;
--hot-orange: #F97316;
--warm-amber: #F59E0B;
--warm-yellow: #FCD34D;
--cold-blue: #3B82F6;
--cold-cyan: #06B6D4;

/* UI States */
--success-green: #10B981;
--error-red: #EF4444;
--warning-yellow: #F59E0B;
--info-blue: #3B82F6;

/* Neutrals */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-900: #111827;
```

### 7.3 Typography

```css
/* Font Family */
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### 7.4 Component Library

#### Buttons

```tsx
/* Primary Button */
<button className="w-full bg-gradient-to-r from-[#1877F2] to-[#1EC8FF] text-white font-bold py-4 rounded-2xl hover:shadow-lg transition-all">
  Continue
</button>

/* Secondary Button */
<button className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
  Cancel
</button>

/* Icon Button */
<button className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
  <Bell className="w-6 h-6 text-gray-700" />
</button>
```

#### Cards

```tsx
/* Standard Card */
<div className="bg-white rounded-3xl p-6 border border-gray-200 hover:shadow-lg transition-all">
  <h3 className="text-lg font-bold text-gray-900 mb-2">Title</h3>
  <p className="text-gray-600">Content</p>
</div>

/* Gradient Card */
<div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-100">
  <h3 className="text-lg font-bold text-gray-900">Title</h3>
</div>

/* Tinder-Style Prospect Card */
<div className="bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative">
  <div className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
    <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center text-6xl font-bold text-gray-400">
      {name.charAt(0)}
    </div>
  </div>
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
    <div className="flex items-center gap-2 mt-2">
      <span className={`px-4 py-2 rounded-full font-bold text-white ${scoreColor}`}>
        {bucket.toUpperCase()}
      </span>
      <span className="text-2xl font-bold text-gray-900">{score}</span>
    </div>
  </div>
</div>
```

#### Modals

```tsx
/* Bottom Sheet Modal */
<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
  <div
    className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto"
    style={{ animation: 'slideUp 0.3s ease-out' }}
  >
    {/* Header */}
    <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4">
      <h3 className="text-lg font-semibold text-gray-900">Modal Title</h3>
    </div>

    {/* Content */}
    <div className="p-6">
      {/* Modal content */}
    </div>
  </div>
</div>

/* Fullscreen Modal */
<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
  <div className="bg-white w-full max-w-4xl rounded-3xl max-h-[90vh] overflow-hidden flex flex-col">
    {/* Content */}
  </div>
</div>
```

#### Badges & Pills

```tsx
/* Tier Badge */
<span className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-sm font-bold flex items-center gap-2">
  <Crown className="w-4 h-4" />
  Elite
</span>

/* Score Badge */
<span className="px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold">
  HOT
</span>

/* Notification Badge */
<span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
  5
</span>
```

#### Progress Indicators

```tsx
/* Linear Progress */
<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>

/* Circular Progress (ScoutScore) */
<svg className="w-32 h-32" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
  <circle
    cx="50"
    cy="50"
    r="45"
    fill="none"
    stroke="url(#gradient)"
    strokeWidth="8"
    strokeDasharray={`${score * 2.83} 283`}
    strokeLinecap="round"
    transform="rotate(-90 50 50)"
  />
</svg>

/* Spinner */
<div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
```

#### Forms

```tsx
/* Text Input */
<input
  type="text"
  placeholder="Enter text"
  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>

/* Select Dropdown */
<select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
  <option>Option 1</option>
  <option>Option 2</option>
</select>

/* Toggle Switch */
<input
  type="checkbox"
  className="w-12 h-6 appearance-none bg-gray-300 rounded-full relative cursor-pointer transition-colors checked:bg-blue-500 before:content-[''] before:absolute before:w-5 before:h-5 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
/>
```

### 7.5 Animation System

```css
/* Slide Up Animation */
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Slide Down Animation */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In Animation */
@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Fade In Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Spin Animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Pulse Animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

**Usage**:

```tsx
<div style={{ animation: 'slideUp 0.3s ease-out' }}>
  {/* Content */}
</div>

<div className="animate-spin">
  {/* Spinner */}
</div>
```

### 7.6 Responsive Breakpoints

```css
/* Mobile First Approach */

/* Extra Small (< 640px) */
/* Default styles */

/* Small (≥ 640px) */
@media (min-width: 640px) {
  /* sm: breakpoint */
}

/* Medium (≥ 768px) */
@media (min-width: 768px) {
  /* md: breakpoint */
}

/* Large (≥ 1024px) */
@media (min-width: 1024px) {
  /* lg: breakpoint */
}

/* Extra Large (≥ 1280px) */
@media (min-width: 1280px) {
  /* xl: breakpoint */
}
```

**TailwindCSS Breakpoints**:

```tsx
<div className="
  w-full           /* Mobile: full width */
  sm:w-96          /* Small: 384px */
  md:w-auto        /* Medium: auto */
  lg:max-w-4xl     /* Large: max 896px */
">
  {/* Content */}
</div>
```

---

## 8. Authentication & Security

### 8.1 Supabase Authentication

**Provider**: Supabase Auth
**Method**: Email/Password (JWT-based)

**Auth Flow**:

```typescript
// Sign Up
async function signUp(email: string, password: string, userData: any) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData.full_name,
        profession: userData.profession
      }
    }
  });

  if (error) throw error;
  return data;
}

// Sign In
async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

// Sign Out
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get Session
async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Refresh Session
async function refreshSession() {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  return session;
}
```

**JWT Token**:
- Stored in localStorage automatically by Supabase client
- Expires after 1 hour (configurable)
- Auto-refreshed on API calls
- Contains user ID and metadata

### 8.2 Row Level Security (RLS)

**Principle**: Users can only access their own data

**Policy Pattern**:

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
CREATE POLICY "Users can view own records"
  ON table_name FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT Policy
CREATE POLICY "Users can create own records"
  ON table_name FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy
CREATE POLICY "Users can update own records"
  ON table_name FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy
CREATE POLICY "Users can delete own records"
  ON table_name FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**RLS on All Tables**: Enabled on all 35+ tables with appropriate policies.

### 8.3 Input Validation

**Client-Side Validation**:

```typescript
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
```

**Server-Side Validation** (Edge Functions):

```typescript
// Validate authentication
if (!user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401 }
  );
}

// Validate input
if (!prospectId || typeof prospectId !== 'string') {
  return new Response(
    JSON.stringify({ error: 'Invalid prospect ID' }),
    { status: 400 }
  );
}

// Check ownership
const { data: prospect } = await supabase
  .from('prospects')
  .select('user_id')
  .eq('id', prospectId)
  .single();

if (prospect.user_id !== user.id) {
  return new Response(
    JSON.stringify({ error: 'Forbidden' }),
    { status: 403 }
  );
}
```

### 8.4 Security Best Practices

1. **No API Keys in Client Code**: All keys in Edge Functions
2. **HTTPS Only**: Enforced by Supabase
3. **SQL Injection Prevention**: Parameterized queries
4. **XSS Prevention**: React escapes by default
5. **CSRF Protection**: JWT tokens, no cookies
6. **Rate Limiting**: Implemented at Edge Function level
7. **Audit Logging**: All actions logged to `system_logs`
8. **Secrets Management**: Environment variables in Supabase

---

## 9. Subscription & Monetization

### 9.1 Subscription Tiers

#### Free Tier (₱0/month)

**Limits**:
- 100 prospects max
- 10 prospects per scan
- 2 AI messages per day
- 1 pitch deck per week
- No sequences
- No DeepScan
- Basic support

**Features**:
- Quick Scan (FREE)
- Basic ScoutScore
- Manual follow-ups
- Streak tracking
- 100 starter coins

#### Pro Tier (₱999/month or ₱9,999/year)

**Limits**:
- 1,000 prospects
- 50 prospects per scan
- Unlimited AI messages
- 5 pitch decks per week
- No sequences
- No DeepScan

**Features**:
- Standard Scan (50 coins)
- Full NLP enrichment
- HOT lead alerts
- AI insights
- +150 coins per week
- Priority support

**Annual Savings**: ₱2,989 (25% discount)

#### Elite Tier (₱2,499/month or ₱24,999/year)

**Limits**:
- Unlimited prospects
- Unlimited scans
- Unlimited AI content
- Multi-step sequences
- DeepScan analysis

**Features**:
- Deep Scan (150 coins)
- Advanced NLP
- Sequence automation
- Lead cooling alerts
- Advanced analytics
- +500 coins per week
- White-glove support

**Annual Savings**: ₱4,989 (17% discount)

#### Team Tier (₱9,999/month)

**Features**:
- 5 team members
- All Elite features
- Team dashboard
- Shared library
- Admin controls
- Team analytics

#### Enterprise Tier (Custom Pricing)

**Features**:
- Custom seat count
- API access
- Custom integrations
- Dedicated account manager
- SLA guarantees
- Custom training

### 9.2 Coin Economy

**Earning Coins**:
- Sign up bonus: 100 coins
- Daily login: 10 coins
- Complete onboarding: 50 coins
- Watch ad: 5 coins (max 5/day)
- Complete mission: 10-50 coins
- Weekly bonus (Pro): 150 coins
- Weekly bonus (Elite): 500 coins
- Referral: 100 coins

**Spending Coins**:
- Quick Scan: FREE
- Standard Scan: 50 coins
- Deep Scan: 150 coins
- Unlock Prospect: 50 coins
- Generate Message: 20 coins
- Generate Sequence: 50 coins
- Generate Pitch Deck: 75 coins
- Objection Handler: 15 coins

**Purchasing Coins**:
- 100 coins: ₱99
- 500 coins: ₱449 (10% bonus)
- 1,000 coins: ₱849 (15% bonus)
- 2,500 coins: ₱1,999 (20% bonus)

**Coin Transaction Logging**:

```typescript
interface CoinTransaction {
  user_id: string;
  amount: number; // Positive for earn, negative for spend
  transaction_type: 'earn' | 'spend' | 'bonus' | 'purchase' | 'ad_reward';
  description: string;
  balance_after: number;
  created_at: Date;
}
```

### 9.3 Payment Processing

**Payment Methods**:
- GCash (Primary)
- Maya (PayMaya)
- Credit/Debit Card
- Bank Transfer

**Payment Flow**:

```typescript
interface PaymentIntent {
  user_id: string;
  amount: number;
  currency: 'PHP';
  payment_method: 'gcash' | 'maya' | 'card' | 'bank';
  item_type: 'subscription' | 'coins';
  item_id: string;
}

async function processPayment(intent: PaymentIntent) {
  // 1. Create payment record
  const payment = await createPaymentRecord(intent);

  // 2. Process with payment provider
  const result = await paymentProvider.charge(intent);

  // 3. Update payment status
  await updatePaymentStatus(payment.id, result.status);

  // 4. Grant access if successful
  if (result.status === 'success') {
    if (intent.item_type === 'subscription') {
      await activateSubscription(intent.user_id, intent.item_id);
    } else {
      await addCoins(intent.user_id, intent.amount);
    }
  }

  // 5. Send receipt
  await sendReceipt(intent.user_id, payment.id);

  return result;
}
```

### 9.4 Subscription Management

**Activation**:

```typescript
async function activateSubscription(userId: string, planId: string, cycle: 'monthly' | 'annual') {
  const plan = await getSubscriptionPlan(planId);

  const periodEnd = cycle === 'annual'
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await supabase.from('user_subscriptions').insert({
    user_id: userId,
    plan_id: planId,
    billing_cycle: cycle,
    status: 'active',
    current_period_start: new Date(),
    current_period_end: periodEnd
  });

  await supabase.from('profiles').update({
    subscription_tier: plan.name,
    subscription_end_date: periodEnd
  }).eq('id', userId);

  // Grant bonus coins
  const bonusCoins = cycle === 'annual' ? plan.coin_bonus_annual : plan.coin_bonus_monthly;
  await addCoins(userId, bonusCoins, 'subscription_bonus');
}
```

**Cancellation**:

```typescript
async function cancelSubscription(subscriptionId: string, immediately: boolean = false) {
  if (immediately) {
    await supabase.from('user_subscriptions').update({
      status: 'cancelled',
      current_period_end: new Date()
    }).eq('id', subscriptionId);
  } else {
    await supabase.from('user_subscriptions').update({
      cancel_at_period_end: true
    }).eq('id', subscriptionId);
  }
}
```

**Renewal**:

```typescript
async function renewSubscription(subscriptionId: string) {
  const subscription = await getSubscription(subscriptionId);

  // Charge renewal
  const payment = await processPayment({
    user_id: subscription.user_id,
    amount: subscription.plan.price_monthly,
    currency: 'PHP',
    payment_method: subscription.payment_method,
    item_type: 'subscription',
    item_id: subscription.plan_id
  });

  if (payment.status === 'success') {
    // Extend period
    const newPeriodEnd = new Date(subscription.current_period_end);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

    await supabase.from('user_subscriptions').update({
      current_period_start: subscription.current_period_end,
      current_period_end: newPeriodEnd
    }).eq('id', subscriptionId);
  }
}
```

---

## 10. Integration Points

### 10.1 External APIs (Future)

**Social Media APIs** (Planned):
- Facebook Graph API
- Instagram Basic Display API
- LinkedIn API
- TikTok API

**Payment Gateways**:
- GCash API
- Maya API
- Stripe (International)

**Communication**:
- Twilio (SMS)
- SendGrid (Email)
- Firebase Cloud Messaging (Push)

### 10.2 Webhooks (Future)

**Incoming Webhooks**:
- Payment confirmation
- Subscription updates
- Refund notifications

**Outgoing Webhooks**:
- New HOT lead detected
- Sequence step completed
- Scan finished

### 10.3 Export/Import

**Export Formats**:
- CSV (Prospects, Transactions)
- JSON (Full data export)
- PDF (Pitch decks, Reports)

**Import Formats**:
- CSV (Facebook, LinkedIn exports)
- JSON (Custom format)
- Text (Paste format)

---

## 11. API Reference

### 11.1 REST API Endpoints

All API calls go through Supabase client:

```typescript
import { supabase } from './lib/supabase';

// Example: Get prospects
const { data, error } = await supabase
  .from('prospects')
  .select('*, prospect_scores(*)')
  .eq('user_id', userId)
  .order('scout_score', { ascending: false });
```

### 11.2 Edge Function Endpoints

#### POST `/functions/v1/process-scan`

**Auth**: Required (JWT)

**Request**:
```json
{
  "sessionId": "uuid",
  "candidateId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "prospectsCreated": 15,
  "hotCount": 3,
  "warmCount": 8,
  "coldCount": 4
}
```

#### POST `/functions/v1/generate-ai-content`

**Auth**: Required (JWT)

**Request**:
```json
{
  "prospectId": "uuid",
  "generationType": "message",
  "tone": "friendly",
  "goal": "recruit",
  "productName": "My Business"
}
```

**Response**:
```json
{
  "success": true,
  "generationId": "uuid",
  "output": {
    "message": "Hi John! 👋..."
  }
}
```

#### POST `/functions/v1/notification-processor`

**Auth**: Service role

**Request**:
```json
{
  "jobType": "daily_rescan"
}
```

**Response**:
```json
{
  "success": true,
  "jobType": "daily_rescan"
}
```

### 11.3 Real-time Subscriptions

```typescript
// Subscribe to notifications
const channel = supabase
  .channel(`notifications:${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New notification:', payload.new);
    }
  )
  .subscribe();

// Unsubscribe
supabase.removeChannel(channel);
```

---

## 12. Deployment & Infrastructure

### 12.1 Hosting

**Frontend**:
- Platform: Supabase (Static hosting) or Vercel
- Build command: `npm run build`
- Output directory: `dist/`
- Environment: Production + Staging

**Backend**:
- Platform: Supabase
- Region: Singapore (AWS ap-southeast-1)
- Database: PostgreSQL 15+
- Edge Functions: Global CDN

### 12.2 Environment Variables

```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://...
```

### 12.3 CI/CD Pipeline

**Build Process**:

```bash
# Install dependencies
npm install

# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Test (if applicable)
npm test
```

**Deployment**:

1. Push to GitHub
2. Supabase detects changes
3. Build triggers automatically
4. Deploy to production

### 12.4 Monitoring & Logging

**Supabase Dashboard**:
- Database queries
- Edge Function logs
- Real-time connections
- Storage usage
- Error rates

**System Health**:
- Stored in `system_health_metrics` table
- Monitored metrics:
  - Response time
  - Error rate
  - Active users
  - Database connections
  - Edge Function execution time

**Alerts** (Future):
- High error rate
- Slow queries
- Failed payments
- System downtime

### 12.5 Backup & Recovery

**Database Backups**:
- Automatic daily backups (Supabase)
- 7-day retention
- Point-in-time recovery

**Disaster Recovery Plan**:
1. Database restore from backup
2. Redeploy Edge Functions
3. Verify data integrity
4. Notify users if needed

---

## Summary

NexScout.ai is a comprehensive, production-ready AI-powered prospect intelligence platform built with:

- **Frontend**: React + TypeScript + TailwindCSS (60+ pages, 13+ components)
- **Backend**: Supabase PostgreSQL (35+ tables, 15+ functions, 4 Edge Functions)
- **AI Systems**: ScoutScore algorithm, NLP enrichment, content generation
- **Security**: JWT auth, Row Level Security on all tables
- **Monetization**: 5 subscription tiers, coin economy, payment processing
- **Real-time**: WebSocket notifications, live updates
- **Mobile-First**: Responsive design, touch-optimized
- **Premium UX**: Tinder-style interactions, smooth animations

**Total Build Size**: 834KB JS (187KB gzipped), 97KB CSS (13KB gzipped)

**Status**: ✅ Production Ready

---

**Documentation Version**: 1.0.0
**Last Updated**: 2024-11-25
**Total Lines**: 3000+
