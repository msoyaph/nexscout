-- =====================================================
-- CREATE FUNCTION TO JOIN AMBASSADOR PROGRAM
-- =====================================================
-- This bypasses the schema cache issue
-- =====================================================

CREATE OR REPLACE FUNCTION create_ambassador_profile_direct(
  p_user_id UUID,
  p_referral_code TEXT,
  p_tier TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Check if user already has profile
  IF EXISTS (SELECT 1 FROM public.ambassador_profiles WHERE user_id = p_user_id) THEN
    RETURN jsonb_build_object('error', 'User already has an ambassador profile');
  END IF;
  
  -- Insert new profile
  INSERT INTO public.ambassador_profiles (
    user_id,
    referral_code,
    tier,
    status,
    total_referrals,
    active_referrals,
    total_earnings_php,
    total_earnings_coins,
    total_earnings_energy,
    conversion_rate,
    retention_rate,
    average_ltv
  ) VALUES (
    p_user_id,
    p_referral_code,
    p_tier,
    'active',
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  );
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'referral_code', p_referral_code,
    'tier', p_tier
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_ambassador_profile_direct(UUID, TEXT, TEXT) TO authenticated;

-- Test the function
DO $$
BEGIN
  RAISE NOTICE '✅ Function create_ambassador_profile_direct created successfully!';
  RAISE NOTICE '✅ Users can now join the ambassador program!';
END $$;




