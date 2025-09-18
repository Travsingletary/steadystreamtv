-- Create NOWPayments records table
CREATE TABLE IF NOT EXISTS nowpayments_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,

  -- Payment amounts
  price_amount DECIMAL(10,2) NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'USD',
  pay_amount DECIMAL(20,8) NOT NULL,
  pay_currency TEXT NOT NULL,

  -- Actual payment received (updated by webhook)
  actually_paid DECIMAL(20,8),
  outcome_amount DECIMAL(20,8),
  outcome_currency TEXT,

  -- Payment status
  payment_status TEXT NOT NULL DEFAULT 'waiting',

  -- URLs and metadata
  invoice_url TEXT,
  customer_email TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_nowpayments_payment_id ON nowpayments_records(payment_id);
CREATE INDEX IF NOT EXISTS idx_nowpayments_order_id ON nowpayments_records(order_id);
CREATE INDEX IF NOT EXISTS idx_nowpayments_user_id ON nowpayments_records(user_id);
CREATE INDEX IF NOT EXISTS idx_nowpayments_status ON nowpayments_records(payment_status);
CREATE INDEX IF NOT EXISTS idx_nowpayments_created_at ON nowpayments_records(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_nowpayments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_nowpayments_updated_at
  BEFORE UPDATE ON nowpayments_records
  FOR EACH ROW
  EXECUTE FUNCTION update_nowpayments_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE nowpayments_records ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment records
CREATE POLICY "Users can view own payment records" ON nowpayments_records
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own payment records
CREATE POLICY "Users can create own payment records" ON nowpayments_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System can update payment records (for webhooks)
CREATE POLICY "System can update payment records" ON nowpayments_records
  FOR UPDATE USING (true);

-- Add comment for documentation
COMMENT ON TABLE nowpayments_records IS 'Stores NOWPayments cryptocurrency payment records';
COMMENT ON COLUMN nowpayments_records.payment_id IS 'NOWPayments unique payment identifier';
COMMENT ON COLUMN nowpayments_records.order_id IS 'Our internal order identifier';
COMMENT ON COLUMN nowpayments_records.payment_status IS 'Payment status: waiting, confirming, confirmed, sending, finished, failed, refunded, partially_paid';
COMMENT ON COLUMN nowpayments_records.actually_paid IS 'Actual amount received (updated by webhook)';
COMMENT ON COLUMN nowpayments_records.outcome_amount IS 'Final settlement amount after fees';