
-- Create checkout_sessions table
CREATE TABLE public.checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscriptions table (enhanced version)
CREATE TABLE public.stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create megaott_subscriptions table
CREATE TABLE public.megaott_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  megaott_subscription_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.megaott_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users to view their own data
CREATE POLICY "Users can view own checkout sessions" ON public.checkout_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own subscriptions" ON public.stripe_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.stripe_subscriptions 
    WHERE stripe_subscription_id = payments.stripe_subscription_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can view own megaott subscriptions" ON public.megaott_subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Create policies for edge functions to insert/update (using service role)
CREATE POLICY "Service role can manage checkout sessions" ON public.checkout_sessions
  FOR ALL USING (true);

CREATE POLICY "Service role can manage subscriptions" ON public.stripe_subscriptions
  FOR ALL USING (true);

CREATE POLICY "Service role can manage payments" ON public.payments
  FOR ALL USING (true);

CREATE POLICY "Service role can manage megaott subscriptions" ON public.megaott_subscriptions
  FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_checkout_sessions_user_id ON public.checkout_sessions(user_id);
CREATE INDEX idx_checkout_sessions_session_id ON public.checkout_sessions(session_id);
CREATE INDEX idx_stripe_subscriptions_user_id ON public.stripe_subscriptions(user_id);
CREATE INDEX idx_stripe_subscriptions_stripe_id ON public.stripe_subscriptions(stripe_subscription_id);
CREATE INDEX idx_payments_subscription_id ON public.payments(stripe_subscription_id);
CREATE INDEX idx_megaott_subscriptions_user_id ON public.megaott_subscriptions(user_id);
