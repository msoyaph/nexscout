/*
  # Fix generate_avatar_seed Function

  Fixes the digest function call to properly reference pgcrypto extension functions.

  ## Changes
  
  1. Update generate_avatar_seed to use pg_crypto schema reference
  2. Simplify the function to avoid search_path issues
  
  ## Security
  - Maintains IMMUTABLE property
  - Keeps security definer if needed
*/

-- Drop and recreate the function with proper schema references
CREATE OR REPLACE FUNCTION public.generate_avatar_seed(p_full_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_normalized text;
  v_hash text;
BEGIN
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RETURN 'anonymous-user';
  END IF;
  
  v_normalized := lower(trim(p_full_name));
  
  -- Use explicit schema reference for digest function
  v_hash := encode(public.digest(v_normalized, 'sha256'), 'hex');
  
  RETURN substring(v_hash, 1, 16);
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback: if digest fails, use simple hash of length
    RETURN substring(md5(v_normalized), 1, 16);
END;
$$;

-- Alternative simpler version that doesn't rely on pgcrypto
CREATE OR REPLACE FUNCTION public.generate_avatar_seed_simple(p_full_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_normalized text;
BEGIN
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RETURN 'anonymous-user';
  END IF;
  
  v_normalized := lower(trim(p_full_name));
  
  -- Use built-in md5 function (doesn't require extensions)
  RETURN substring(md5(v_normalized), 1, 16);
END;
$$;

-- Update the main function to use the simple version
CREATE OR REPLACE FUNCTION public.generate_avatar_seed(p_full_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RETURN 'anonymous-user';
  END IF;
  
  -- Use built-in md5 which doesn't require pgcrypto extension
  RETURN substring(md5(lower(trim(p_full_name))), 1, 16);
END;
$$;