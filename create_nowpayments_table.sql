-- Create NOWPayments records table for SteadyStream TV
CREATE TABLE IF NOT EXISTS nowpayments_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  price_amount DECIMAL(10,2) NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'USD',
  pay_amount DECIMAL(20,8) NOT NULL,
  pay_currency TEXT NOT NULL,
  actually_paid DECIMAL(20,8),
  outcome_amount DECIMAL(20,8),
  outcome_currency TEXT,
  payment_status TEXT NOT NULL DEFAULT 'waiting',
  invoice_url TEXT,
  customer_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_nowpayments_payment_id ON nowpayments_records(payment_id);
CREATE INDEX IF NOT EXISTS idx_nowpayments_order_id ON nowpayments_records(order_id);
CREATE INDEX IF NOT EXISTS idx_nowpayments_user_id ON nowpayments_records(user_id);
CREATE INDEX IF NOT EXISTS idx_nowpayments_status ON nowpayments_records(payment_status);

-- Enable Row Level Security
ALTER TABLE nowpayments_records ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own payment records
CREATE POLICY IF NOT EXISTS "Users can view own payment records" ON nowpayments_records
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own payment records
CREATE POLICY IF NOT EXISTS "Users can create own payment records" ON nowpayments_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow system to update payment records (for webhooks)
CREATE POLICY IF NOT EXISTS "System can update payment records" ON nowpayments_records
  FOR UPDATE USING (true);