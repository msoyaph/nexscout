/*
  # Economy Engine 2.0 - Referral & Viral System

  1. New Tables
    - `referral_events` - Track referrals and rewards

  2. Changes
    - Rewards: 100 coins for referrals
    - Event types: free_referral, pro_to_pro, pro_to_team, enterprise_referral
    - Tracks both referrer and referred user

  3. Security
    - Indexed on referrer_user_id for performance
*/

DROP TABLE IF EXISTS referral_events CASCADE;

CREATE TABLE referral_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES auth.users(id),
    reward_coins INTEGER DEFAULT 100,
    event_type TEXT DEFAULT 'pro_referral',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX referral_events_referrer_idx ON referral_events(referrer_user_id);
