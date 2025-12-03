/*
  # Fix Function Search Paths - Batch 1

  1. Security Fix
    - Add SECURITY DEFINER and set search_path for functions
    - Prevents search_path manipulation attacks
    - Ensures functions run in secure context
    
  2. Functions to Fix
    - All user-facing database functions
    - Trigger functions
    - Utility functions
    
  3. Security
    - Sets explicit search_path to pg_catalog, public
    - Prevents malicious search_path injection
*/

-- Fix generate_avatar_seed function
CREATE OR REPLACE FUNCTION generate_avatar_seed()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN substring(md5(random()::text) from 1 for 10);
END;
$$;

-- Fix generate_chat_slug function
CREATE OR REPLACE FUNCTION generate_chat_slug()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);
END;
$$;

-- Fix handle_new_user trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Insert user profile
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Initialize user energy
  INSERT INTO public.user_energy (user_id, current_energy, max_energy)
  VALUES (NEW.id, 100, 100)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize user coins
  INSERT INTO public.user_coins (user_id, coin_balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Fix update_updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;