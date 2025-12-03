/*
  # Update Referral Tier Earnings

  1. Changes
    - Update process_referral_upgrade function to award pesos based on subscription tier
    - Pro: ₱50 (one-time)
    - Elite: ₱100 (one-time)
    - Team: ₱350 (one-time)
    - Enterprise: ₱10,000 (one-time)

  2. Security
    - Maintains existing RLS policies
    - SECURITY DEFINER ensures proper execution
*/

-- Update the referral upgrade processing function with tier-based rewards
CREATE OR REPLACE FUNCTION process_referral_upgrade(
  p_referred_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_user_id uuid;
  v_referral_id uuid;
  v_subscription_tier text;
  v_peso_reward numeric(10, 2);
BEGIN
  SELECT referrer_user_id, id
  INTO v_referrer_user_id, v_referral_id
  FROM referrals
  WHERE referred_user_id = p_referred_user_id
    AND upgrade_reward_given = false
  LIMIT 1;

  IF v_referrer_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT subscription_tier
  INTO v_subscription_tier
  FROM profiles
  WHERE id = p_referred_user_id;

  v_peso_reward := CASE v_subscription_tier
    WHEN 'pro' THEN 50
    WHEN 'elite' THEN 100
    WHEN 'team' THEN 350
    WHEN 'enterprise' THEN 10000
    ELSE 0
  END;

  IF v_peso_reward > 0 THEN
    UPDATE referrals
    SET
      subscription_upgraded_at = now(),
      upgrade_reward_given = true
    WHERE id = v_referral_id;

    UPDATE referral_codes
    SET
      total_upgrades = total_upgrades + 1,
      total_pesos_earned = total_pesos_earned + v_peso_reward
    WHERE user_id = v_referrer_user_id;
  END IF;
END;
$$;