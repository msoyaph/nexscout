/*
  # Add Referral Upgrade Trigger

  1. Trigger
    - Auto-process referral upgrade rewards when user changes from free to paid tier
    
  2. Function
    - Check if subscription tier changed from 'free' to 'pro' or 'elite'
    - Call process_referral_upgrade function
*/

-- Function to handle subscription upgrade referral rewards
CREATE OR REPLACE FUNCTION handle_subscription_upgrade_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.subscription_tier = 'free' AND NEW.subscription_tier IN ('pro', 'elite') THEN
    PERFORM process_referral_upgrade(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on profiles subscription tier changes
DROP TRIGGER IF EXISTS on_subscription_upgrade_referral ON profiles;
CREATE TRIGGER on_subscription_upgrade_referral
  AFTER UPDATE OF subscription_tier ON profiles
  FOR EACH ROW
  WHEN (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier)
  EXECUTE FUNCTION handle_subscription_upgrade_referral();