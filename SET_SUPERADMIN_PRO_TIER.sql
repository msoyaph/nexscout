-- Migration: Set SuperAdmin (geoffmax22@gmail.com) to Pro Tier with payment bypass
-- Date: 2025-12-03
-- Purpose: Grant Pro tier access to SuperAdmin without requiring payment

DO $$
DECLARE
  superadmin_user_id uuid;
BEGIN
  -- Find the SuperAdmin user by email
  SELECT id INTO superadmin_user_id
  FROM auth.users
  WHERE email = 'geoffmax22@gmail.com';

  IF superadmin_user_id IS NULL THEN
    RAISE EXCEPTION 'SuperAdmin user (geoffmax22@gmail.com) not found in auth.users';
  END IF;

  -- Update profile to Pro tier with far future subscription end date (lifetime access)
  UPDATE profiles
  SET 
    subscription_tier = 'pro',
    subscription_end_date = '2099-12-31 23:59:59+00'::timestamptz, -- Far future date = lifetime access
    updated_at = now()
  WHERE id = superadmin_user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update SuperAdmin profile. User ID: %', superadmin_user_id;
  END IF;

  -- Ensure user has a subscription record (create if doesn't exist)
  -- Note: user_subscriptions doesn't have amount/currency/payment_status (those are in payment_history)
  -- Note: billing_cycle CHECK constraint only allows 'monthly' or 'annual', so we use 'annual' for SuperAdmin
  
  -- First, check if subscription already exists
  IF EXISTS (SELECT 1 FROM user_subscriptions WHERE user_id = superadmin_user_id) THEN
    -- Update existing subscription
    UPDATE user_subscriptions
    SET 
      plan_id = (SELECT id FROM subscription_plans WHERE name = 'pro' LIMIT 1),
      status = 'active',
      billing_cycle = 'annual',
      current_period_start = now(),
      current_period_end = '2099-12-31 23:59:59+00'::timestamptz,
      cancel_at_period_end = false,
      updated_at = now()
    WHERE user_id = superadmin_user_id;
  ELSE
    -- Insert new subscription
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      billing_cycle,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      created_at,
      updated_at
    )
    SELECT 
      superadmin_user_id,
      sp.id,
      'active',
      'annual', -- Use 'annual' since CHECK constraint doesn't allow 'lifetime'
      now(),
      '2099-12-31 23:59:59+00'::timestamptz, -- Far future = lifetime access
      false, -- Never cancel
      now(),
      now()
    FROM subscription_plans sp
    WHERE sp.name = 'pro'
    LIMIT 1;
  END IF;

  RAISE NOTICE '✅ Successfully set SuperAdmin (geoffmax22@gmail.com) to Pro Tier with lifetime access';
  RAISE NOTICE 'User ID: %', superadmin_user_id;
END $$;

-- Verify the update
SELECT 
  p.email,
  p.subscription_tier,
  p.subscription_end_date,
  us.status as subscription_status,
  us.billing_cycle,
  us.current_period_end,
  us.cancel_at_period_end
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
LEFT JOIN user_subscriptions us ON us.user_id = p.id
WHERE u.email = 'geoffmax22@gmail.com';

