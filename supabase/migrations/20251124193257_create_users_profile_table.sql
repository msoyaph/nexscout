/*
  # Create User Profiles Table

  ## Overview
  This migration sets up the core user profile system for NexScout.ai, extending Supabase Auth with additional user metadata for prospecting, gamification, and subscription management.

  ## New Tables
  
  ### `profiles`
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text, not null) - User email for quick access
  - `full_name` (text) - User's full name
  - `company` (text) - User's company name
  - `profession` (text) - MLM, Insurance, Real Estate, Direct Sales, Network Marketing, Personal Sales
  - `avatar_url` (text) - Profile picture URL
  - `subscription_tier` (text, default 'free') - free, pro, elite, team, enterprise
  - `coins_balance` (integer, default 100) - User's coin balance for gamification
  - `streak_days` (integer, default 0) - Consecutive days active
  - `last_active_date` (date) - Track streaks
  - `onboarding_completed` (boolean, default false) - Has user finished onboarding
  - `onboarding_step` (text) - Current onboarding step if incomplete
  - `total_prospects_scanned` (integer, default 0) - Lifetime prospect count
  - `total_ai_generations` (integer, default 0) - Lifetime AI usage count
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ## Security
  - Enable RLS on `profiles` table
  - Users can read their own profile
  - Users can update their own profile
  - System triggers create profile on auth signup

  ## Notes
  - Initial coin balance of 100 coins for new users
  - Profile automatically created when user signs up via trigger
  - Streaks reset if last_active_date is more than 1 day old
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  company text,
  profession text,
  avatar_url text,
  subscription_tier text DEFAULT 'free' NOT NULL CHECK (subscription_tier IN ('free', 'pro', 'elite', 'team', 'enterprise')),
  coins_balance integer DEFAULT 100 NOT NULL CHECK (coins_balance >= 0),
  streak_days integer DEFAULT 0 NOT NULL CHECK (streak_days >= 0),
  last_active_date date,
  onboarding_completed boolean DEFAULT false NOT NULL,
  onboarding_step text,
  total_prospects_scanned integer DEFAULT 0 NOT NULL CHECK (total_prospects_scanned >= 0),
  total_ai_generations integer DEFAULT 0 NOT NULL CHECK (total_ai_generations >= 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: System can insert profiles (for trigger)
CREATE POLICY "System can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'company', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS on_profile_updated ON profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at);
