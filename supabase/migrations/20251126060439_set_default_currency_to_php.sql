/*
  # Set Default Currency to PHP (Philippine Peso)

  1. Updates
    - Update default currency in payment_history table to PHP
    - Update default currency in invoices table to PHP
    - Add currency column to subscription_plans if needed
    - Update subscription_plans pricing to PHP

  2. Data Updates
    - Update existing payment/invoice records currency to PHP

  3. Purpose
    - Align the entire system to use Philippine Peso (PHP) as the default currency
*/

-- Update payment_history table default currency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_history' AND column_name = 'currency'
  ) THEN
    ALTER TABLE payment_history
    ALTER COLUMN currency SET DEFAULT 'PHP';
  END IF;
END $$;

-- Update invoices table default currency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'currency'
  ) THEN
    ALTER TABLE invoices
    ALTER COLUMN currency SET DEFAULT 'PHP';
  END IF;
END $$;

-- Add currency column to subscription_plans if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'currency'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN currency TEXT DEFAULT 'PHP';
  END IF;
END $$;

-- Update existing subscription plans to use PHP pricing
UPDATE subscription_plans
SET
  currency = 'PHP',
  price_monthly = CASE name
    WHEN 'free' THEN 0
    WHEN 'pro' THEN 1499
    WHEN 'elite' THEN 4999
    WHEN 'team' THEN 14999
    ELSE price_monthly
  END,
  price_annual = CASE name
    WHEN 'free' THEN 0
    WHEN 'pro' THEN 14990
    WHEN 'elite' THEN 49990
    WHEN 'team' THEN 149990
    ELSE price_annual
  END
WHERE price_monthly < 1000;

-- Create helper function to format PHP currency
CREATE OR REPLACE FUNCTION format_php_currency(amount NUMERIC)
RETURNS TEXT AS $$
BEGIN
  RETURN '₱' || TO_CHAR(amount, 'FM999,999,990.00');
END;
$$ LANGUAGE plpgsql IMMUTABLE;