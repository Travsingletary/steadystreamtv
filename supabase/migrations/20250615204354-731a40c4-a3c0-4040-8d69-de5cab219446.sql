
-- Create table to store IPTV account credentials
CREATE TABLE public.iptv_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  megaott_user_id TEXT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  server_url TEXT,
  activation_code TEXT,
  playlist_url TEXT,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track purchase automation status
CREATE TABLE public.purchase_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE NOT NULL,
  payment_intent_id TEXT,
  automation_status TEXT NOT NULL DEFAULT 'pending',
  megaott_response JSONB,
  email_sent BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.iptv_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_automations ENABLE ROW LEVEL SECURITY;

-- Create policies for iptv_accounts
CREATE POLICY "Users can view their own IPTV accounts" 
  ON public.iptv_accounts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Edge functions can manage IPTV accounts" 
  ON public.iptv_accounts 
  FOR ALL 
  USING (true);

-- Create policies for purchase_automations
CREATE POLICY "Users can view their own purchase automations" 
  ON public.purchase_automations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Edge functions can manage purchase automations" 
  ON public.purchase_automations 
  FOR ALL 
  USING (true);

-- Add updated_at trigger for iptv_accounts
CREATE OR REPLACE FUNCTION update_iptv_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_iptv_accounts_updated_at
    BEFORE UPDATE ON public.iptv_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_iptv_accounts_updated_at();

-- Add updated_at trigger for purchase_automations
CREATE OR REPLACE FUNCTION update_purchase_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_purchase_automations_updated_at
    BEFORE UPDATE ON public.purchase_automations
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_automations_updated_at();
