
-- Create subscriptions table with proper relationship to user_profiles
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  billing_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled', 'trial'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_profile_id ON public.user_subscriptions(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_billing_status ON public.user_subscriptions(billing_status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON public.user_subscriptions(end_date);

-- Enable RLS on user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = user_subscriptions.user_profile_id 
      AND supabase_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_subscriptions_updated_at();

-- Add current_subscription_id to user_profiles for easy access to active subscription
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'current_subscription_id') THEN
    ALTER TABLE public.user_profiles ADD COLUMN current_subscription_id UUID REFERENCES public.user_subscriptions(id);
  END IF;
END $$;

-- Create view for users with active subscriptions
CREATE OR REPLACE VIEW public.users_with_active_subscriptions AS
SELECT 
  up.*,
  us.plan_type as active_plan,
  us.billing_status,
  us.end_date as subscription_end_date,
  us.auto_renew
FROM public.user_profiles up
LEFT JOIN public.user_subscriptions us ON us.id = up.current_subscription_id
WHERE us.billing_status = 'active' AND us.end_date > now();
