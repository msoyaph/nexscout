/*
  # Create Payment History and Invoices System

  1. New Tables
    - `payment_history`: Track all payments made by users
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `subscription_id` (uuid, foreign key to user_subscriptions)
      - `amount` (numeric)
      - `currency` (text)
      - `payment_method` (text)
      - `payment_status` (text)
      - `transaction_id` (text)
      - `created_at` (timestamptz)
      
    - `invoices`: Generate invoices for payments
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `payment_id` (uuid, foreign key to payment_history)
      - `invoice_number` (text, unique)
      - `amount` (numeric)
      - `currency` (text)
      - `description` (text)
      - `billing_period_start` (timestamptz)
      - `billing_period_end` (timestamptz)
      - `status` (text)
      - `created_at` (timestamptz)
      - `due_date` (timestamptz)
      - `paid_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only view their own records
*/

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PHP',
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payment_history(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PHP',
  description TEXT NOT NULL,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  due_date TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- Enable RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_history
DROP POLICY IF EXISTS "Users can view own payment history" ON payment_history;
CREATE POLICY "Users can view own payment history"
  ON payment_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment history" ON payment_history;
CREATE POLICY "Users can insert own payment history"
  ON payment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for invoices
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
CREATE POLICY "Users can view own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
CREATE POLICY "Users can insert own invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_sequence INTEGER;
  v_invoice_number TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_month := TO_CHAR(CURRENT_DATE, 'MM');
  
  -- Get next sequence number for this month
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 10 FOR 4) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || v_year || v_month || '%';
  
  v_invoice_number := 'INV-' || v_year || v_month || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create invoice for payment
CREATE OR REPLACE FUNCTION create_invoice_for_payment(
  p_user_id UUID,
  p_payment_id UUID,
  p_amount NUMERIC,
  p_currency TEXT,
  p_description TEXT,
  p_billing_start TIMESTAMPTZ,
  p_billing_end TIMESTAMPTZ
) RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
BEGIN
  v_invoice_number := generate_invoice_number();
  
  INSERT INTO invoices (
    user_id,
    payment_id,
    invoice_number,
    amount,
    currency,
    description,
    billing_period_start,
    billing_period_end,
    status,
    due_date,
    paid_at
  ) VALUES (
    p_user_id,
    p_payment_id,
    v_invoice_number,
    p_amount,
    p_currency,
    p_description,
    p_billing_start,
    p_billing_end,
    'paid',
    CURRENT_DATE,
    now()
  ) RETURNING id INTO v_invoice_id;
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;