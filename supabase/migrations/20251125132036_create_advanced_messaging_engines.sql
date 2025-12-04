/*
  # Advanced NexScout Messaging Engines

  1. New Tables
    - `lead_revival_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `prospect_id` (uuid, references prospects)
      - `prospect_name` (text)
      - `revival_message` (text)
      - `micro_cta` (text)
      - `value_drop` (text)
      - `timing_suggestion` (text)
      - `risk_warnings` (text)
      - `alternatives` (jsonb array)
      - `elite_coaching_tip` (text)
      - `last_interaction_days` (integer)
      - `bucket` (text)
      - `user_goal` (text)
      - `sent` (boolean)
      - `response_received` (boolean)
      - `created_at` (timestamptz)
    
    - `referral_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `prospect_id` (uuid, references prospects)
      - `referral_message` (text)
      - `referral_ask` (text)
      - `benefit_framing` (text)
      - `examples_to_send` (jsonb array)
      - `soft_cta` (text)
      - `elite_coaching_tip` (text)
      - `context` (text)
      - `reward_type` (text)
      - `sent` (boolean)
      - `referrals_received` (integer)
      - `created_at` (timestamptz)
    
    - `social_media_replies`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `prospect_id` (uuid, references prospects)
      - `comment_text` (text)
      - `post_type` (text)
      - `public_reply` (text)
      - `private_followup_suggestion` (text)
      - `risk_warnings` (text)
      - `alternative_replies` (jsonb array)
      - `goal` (text)
      - `posted` (boolean)
      - `created_at` (timestamptz)
    
    - `call_scripts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `prospect_id` (uuid, references prospects)
      - `opening` (text)
      - `rapport` (text)
      - `discovery_questions` (jsonb array)
      - `mini_pitch` (text)
      - `transition` (text)
      - `cta` (text)
      - `fallback_cta` (text)
      - `objection_responses` (jsonb)
      - `elite_coaching_tip` (text)
      - `goal` (text)
      - `used` (boolean)
      - `successful` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Add policies for authenticated users
*/

-- Create lead_revival_messages table
CREATE TABLE IF NOT EXISTS lead_revival_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text NOT NULL,
  revival_message text NOT NULL,
  micro_cta text,
  value_drop text,
  timing_suggestion text NOT NULL,
  risk_warnings text,
  alternatives jsonb DEFAULT '[]'::jsonb,
  elite_coaching_tip text,
  last_interaction_days integer DEFAULT 0,
  bucket text CHECK (bucket IN ('cold', 'warm', 'lost')),
  user_goal text CHECK (user_goal IN ('reconnect', 'revive', 'bring_back', 'value_drop')),
  industry text CHECK (industry IN ('mlm', 'insurance', 'real_estate', 'product')),
  sent boolean DEFAULT false,
  response_received boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create referral_messages table
CREATE TABLE IF NOT EXISTS referral_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text,
  referral_message text NOT NULL,
  referral_ask text NOT NULL,
  benefit_framing text,
  examples_to_send jsonb DEFAULT '[]'::jsonb,
  soft_cta text NOT NULL,
  elite_coaching_tip text,
  context text CHECK (context IN ('post_meeting', 'post_sale', 'inactive_prospect', 'warm_friend')),
  reward_type text CHECK (reward_type IN ('none', 'discount', 'freebie', 'referral_bonus')),
  industry text CHECK (industry IN ('mlm', 'insurance', 'real_estate', 'product')),
  sent boolean DEFAULT false,
  referrals_received integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create social_media_replies table
CREATE TABLE IF NOT EXISTS social_media_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text,
  comment_text text NOT NULL,
  post_type text CHECK (post_type IN ('personal', 'business', 'life_event', 'pain_point', 'neutral', 'achievement')),
  public_reply text NOT NULL,
  private_followup_suggestion text,
  risk_warnings text,
  alternative_replies jsonb DEFAULT '[]'::jsonb,
  goal text CHECK (goal IN ('relationship_building', 'nurture', 'soft_positioning')),
  posted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create call_scripts table
CREATE TABLE IF NOT EXISTS call_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  prospect_name text,
  opening text NOT NULL,
  rapport text NOT NULL,
  discovery_questions jsonb DEFAULT '[]'::jsonb,
  mini_pitch text NOT NULL,
  transition text NOT NULL,
  cta text NOT NULL,
  fallback_cta text NOT NULL,
  objection_responses jsonb DEFAULT '{}'::jsonb,
  elite_coaching_tip text,
  goal text CHECK (goal IN ('book_meeting', 'qualify', 'close', 'present')),
  industry text CHECK (industry IN ('mlm', 'insurance', 'real_estate', 'product')),
  tone text CHECK (tone IN ('friendly', 'professional', 'warm')),
  used boolean DEFAULT false,
  successful boolean,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_revival_messages_user_id ON lead_revival_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_revival_messages_prospect_id ON lead_revival_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_referral_messages_user_id ON referral_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_social_replies_user_id ON social_media_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_call_scripts_user_id ON call_scripts(user_id);

-- Enable RLS
ALTER TABLE lead_revival_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_scripts ENABLE ROW LEVEL SECURITY;

-- Policies for lead_revival_messages
CREATE POLICY "Users can view own revival messages"
  ON lead_revival_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own revival messages"
  ON lead_revival_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own revival messages"
  ON lead_revival_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for referral_messages
CREATE POLICY "Users can view own referral messages"
  ON referral_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral messages"
  ON referral_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral messages"
  ON referral_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for social_media_replies
CREATE POLICY "Users can view own social replies"
  ON social_media_replies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own social replies"
  ON social_media_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social replies"
  ON social_media_replies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for call_scripts
CREATE POLICY "Users can view own call scripts"
  ON call_scripts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own call scripts"
  ON call_scripts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own call scripts"
  ON call_scripts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);