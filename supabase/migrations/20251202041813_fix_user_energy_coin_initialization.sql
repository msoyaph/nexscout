/*
  # Fix User Energy and Coin Initialization

  Ensures new users start with reasonable energy and coin balances.

  ## Changes
  
  1. Update user_energy default to give starting energy
  2. Update profiles to ensure coin balance initialization
  3. Create function to initialize resources for existing users
  
  ## Security
  - Maintains existing RLS policies
*/

-- Update default energy for new users
ALTER TABLE public.user_energy 
ALTER COLUMN current_energy SET DEFAULT 100;

ALTER TABLE public.user_energy 
ALTER COLUMN max_energy SET DEFAULT 100;

-- Ensure profiles have starting coins
UPDATE public.profiles 
SET coin_balance = GREATEST(coin_balance, 100),
    coins_balance = GREATEST(coins_balance, 100)
WHERE coin_balance < 100 OR coins_balance < 100;

-- Update user_energy to give existing users starting energy
UPDATE public.user_energy 
SET current_energy = GREATEST(current_energy, 100),
    max_energy = GREATEST(max_energy, 100)
WHERE current_energy < 100 OR max_energy < 100;

-- Function to ensure user has minimum resources
CREATE OR REPLACE FUNCTION public.ensure_minimum_resources(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Ensure minimum energy
  UPDATE public.user_energy
  SET current_energy = GREATEST(current_energy, 100),
      max_energy = GREATEST(max_energy, 100)
  WHERE user_id = p_user_id;

  -- Ensure minimum coins
  UPDATE public.profiles
  SET coin_balance = GREATEST(coin_balance, 100),
      coins_balance = GREATEST(coins_balance, 100)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize resources on profile creation
CREATE OR REPLACE FUNCTION public.initialize_user_resources()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize energy if not exists
  INSERT INTO public.user_energy (user_id, current_energy, max_energy)
  VALUES (NEW.id, 100, 100)
  ON CONFLICT (user_id) DO UPDATE
  SET current_energy = GREATEST(user_energy.current_energy, 100),
      max_energy = GREATEST(user_energy.max_energy, 100);

  -- Ensure coins are set
  NEW.coin_balance := GREATEST(COALESCE(NEW.coin_balance, 0), 100);
  NEW.coins_balance := GREATEST(COALESCE(NEW.coins_balance, 0), 100);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS initialize_resources_on_profile_create ON public.profiles;

CREATE TRIGGER initialize_resources_on_profile_create
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_resources();