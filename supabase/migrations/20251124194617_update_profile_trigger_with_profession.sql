/*
  # Update Profile Creation Trigger to Handle Profession

  ## Overview
  This migration updates the profile creation trigger to also copy the profession field from user metadata when available.

  ## Changes
  - Updates `handle_new_user()` function to include profession field from metadata
  - Allows profession to be set during initial signup if provided
  - Maintains backward compatibility with existing signup flow

  ## Notes
  - If profession is provided in metadata during signup, it will be saved to the profile
  - If profession is not provided, the field will remain null until onboarding is completed
*/

-- Update the function to handle profession
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company, profession, onboarding_completed, onboarding_step)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'company', ''),
    COALESCE(new.raw_user_meta_data->>'profession', NULL),
    CASE 
      WHEN new.raw_user_meta_data->>'profession' IS NOT NULL THEN true
      ELSE false
    END,
    CASE 
      WHEN new.raw_user_meta_data->>'profession' IS NOT NULL THEN 'completed'
      ELSE NULL
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
