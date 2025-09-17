-- SteadyStream TV - COMPLETE DATABASE RESET
-- Clean slate with only essential tables

-- Drop all existing tables and recreate clean
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Minimal profiles table for auth integration
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  supabase_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Main subscriptions table (everything in one place)
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Customer info
  customer_email text NOT NULL,
  customer_name text,

  -- Plan info
  plan_id text NOT NULL, -- 'basic_monthly', 'premium_monthly', 'premium_yearly'
  plan_name text NOT NULL,
  plan_price decimal(10,2) NOT NULL,

  -- Payment tracking
  payment_id text UNIQUE NOT NULL,
  payment_method text NOT NULL, -- 'crypto' or 'card'
  payment_status text DEFAULT 'pending', -- 'pending', 'completed', 'failed'

  -- Payment amounts
  fiat_currency text,
  fiat_amount decimal(10,2),
  crypto_currency text,
  crypto_amount decimal(18,8),

  -- Subscription status
  status text DEFAULT 'pending', -- 'pending', 'active', 'cancelled', 'expired'
  start_date timestamptz,
  end_date timestamptz,

  -- MegaOTT IPTV credentials (all in one place)
  megaott_user_id text,
  iptv_username text,
  iptv_password text,
  m3u_url text,
  xtream_url text,
  epg_url text,

  -- Link to auth user
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Webhook Logs - For debugging payment issues
CREATE TABLE webhook_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Webhook info
  provider text NOT NULL, -- 'nowpayments', 'guardarian'
  payment_id text,

  -- Webhook data
  webhook_data jsonb NOT NULL,

  -- Processing status
  status text DEFAULT 'received', -- 'received', 'processed', 'failed'
  error_message text,

  created_at timestamptz DEFAULT now()
);

-- Essential indexes only
CREATE INDEX idx_subscriptions_payment_id ON subscriptions(payment_id);
CREATE INDEX idx_subscriptions_customer_email ON subscriptions(customer_email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_webhook_logs_payment_id ON webhook_logs(payment_id);
CREATE INDEX idx_profiles_supabase_user_id ON profiles(supabase_user_id);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update triggers
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = supabase_user_id);
CREATE POLICY "Users can create own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = supabase_user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = supabase_user_id);

-- Subscription policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all subscriptions" ON subscriptions FOR ALL USING (true);

-- Webhook logs policies (service role only)
CREATE POLICY "Service role can manage webhook logs" ON webhook_logs FOR ALL USING (true);