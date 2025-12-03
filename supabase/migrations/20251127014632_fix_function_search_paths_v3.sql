/*
  # Fix Function Search Paths v3

  1. Security Enhancement
    - Drop all functions completely first
    - Recreate with proper search_path
*/

-- Drop ALL functions that need fixing
DROP FUNCTION IF EXISTS public.get_user_from_extension_token CASCADE;
DROP FUNCTION IF EXISTS public.generate_browser_extension_token CASCADE;
DROP FUNCTION IF EXISTS public.increment_ai_usage CASCADE;
DROP FUNCTION IF EXISTS public.generate_avatar_seed CASCADE;
DROP FUNCTION IF EXISTS public.set_avatar_seed CASCADE;
DROP FUNCTION IF EXISTS public.update_social_graph_nodes_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.update_scan_progress_timestamp CASCADE;
DROP FUNCTION IF EXISTS public.format_php_currency CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_stale_pending_transactions CASCADE;
DROP FUNCTION IF EXISTS public.calculate_smartness_score CASCADE;
DROP FUNCTION IF EXISTS public.update_user_smartness CASCADE;
DROP FUNCTION IF EXISTS public.generate_referral_code CASCADE;

-- Recreate all functions with proper search_path
CREATE FUNCTION public.increment_ai_usage(
  p_user_id uuid,
  p_operation_type text,
  p_tokens_used integer DEFAULT 0,
  p_cost_php numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.ai_usage_logs (user_id, operation_type, tokens_used, cost_php)
  VALUES (p_user_id, p_operation_type, p_tokens_used, p_cost_php);
END;
$$;

CREATE FUNCTION public.generate_browser_extension_token(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_token text;
BEGIN
  v_token := encode(gen_random_bytes(32), 'hex');
  
  INSERT INTO public.browser_extension_tokens (user_id, token)
  VALUES (p_user_id, v_token)
  ON CONFLICT (user_id) 
  DO UPDATE SET token = v_token, created_at = now();
  
  RETURN v_token;
END;
$$;

CREATE FUNCTION public.get_user_from_extension_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.browser_extension_tokens
  WHERE token = p_token
  AND created_at > now() - interval '90 days';
  
  RETURN v_user_id;
END;
$$;

CREATE FUNCTION public.update_social_graph_nodes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_scan_progress_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.generate_avatar_seed(p_full_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_normalized text;
  v_hash text;
BEGIN
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RETURN 'anonymous-user';
  END IF;
  
  v_normalized := lower(trim(p_full_name));
  v_hash := encode(digest(v_normalized, 'sha256'), 'hex');
  
  RETURN substring(v_hash, 1, 16);
END;
$$;

CREATE FUNCTION public.set_avatar_seed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.avatar_seed IS NULL AND NEW.full_name IS NOT NULL THEN
    NEW.avatar_seed := public.generate_avatar_seed(NEW.full_name);
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger for prospects table
DROP TRIGGER IF EXISTS set_prospect_avatar_seed ON public.prospects;
CREATE TRIGGER set_prospect_avatar_seed
  BEFORE INSERT OR UPDATE ON public.prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_avatar_seed();

CREATE FUNCTION public.format_php_currency(amount numeric)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN '₱' || to_char(amount, 'FM999,999,999.00');
END;
$$;

CREATE FUNCTION public.cleanup_stale_pending_transactions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM public.pending_coin_transactions
  WHERE status = 'pending'
  AND created_at < now() - interval '24 hours';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

CREATE FUNCTION public.calculate_smartness_score(
  p_user_id uuid,
  p_category text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_score numeric;
BEGIN
  IF p_category IS NULL THEN
    SELECT COALESCE(AVG(score), 0) INTO v_score
    FROM public.ai_smartness
    WHERE user_id = p_user_id;
  ELSE
    SELECT COALESCE(score, 0) INTO v_score
    FROM public.ai_smartness
    WHERE user_id = p_user_id AND category = p_category;
  END IF;
  
  RETURN v_score;
END;
$$;

CREATE FUNCTION public.update_user_smartness(
  p_user_id uuid,
  p_category text,
  p_score_change numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.ai_smartness (user_id, category, score)
  VALUES (p_user_id, p_category, p_score_change)
  ON CONFLICT (user_id, category)
  DO UPDATE SET 
    score = public.ai_smartness.score + p_score_change,
    updated_at = now();
END;
$$;

CREATE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    v_code := upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8));
    
    SELECT EXISTS (
      SELECT 1 FROM public.referral_codes WHERE code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;
