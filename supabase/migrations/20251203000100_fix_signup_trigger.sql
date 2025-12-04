/*
  # Fix User Signup Trigger
  
  Fixes the handle_new_user() function to correctly insert into 'profiles' table
  instead of 'user_profiles'.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Insert user profile into 'profiles' table (not 'user_profiles')
  INSERT INTO public.profiles (id, email, full_name, company)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', '')
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
