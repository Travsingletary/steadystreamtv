
-- Create table for storing MegaOTT credits information
CREATE TABLE public.megaott_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID REFERENCES public.resellers(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing MegaOTT subscribers data
CREATE TABLE public.megaott_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL UNIQUE,
  reseller_id UUID REFERENCES public.resellers(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  plan TEXT NOT NULL,
  max_connections INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_synced TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for MegaOTT API diagnostic logs
CREATE TABLE public.megaott_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type TEXT NOT NULL,
  status TEXT NOT NULL,
  response_data JSONB,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.megaott_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.megaott_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.megaott_diagnostics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for megaott_credits
CREATE POLICY "Resellers can view their own credits" 
  ON public.megaott_credits 
  FOR SELECT 
  USING (reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid()));

CREATE POLICY "Resellers can update their own credits" 
  ON public.megaott_credits 
  FOR UPDATE 
  USING (reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid()));

-- Create RLS policies for megaott_subscribers
CREATE POLICY "Resellers can view their own subscribers" 
  ON public.megaott_subscribers 
  FOR SELECT 
  USING (reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid()));

CREATE POLICY "Resellers can manage their own subscribers" 
  ON public.megaott_subscribers 
  FOR ALL 
  USING (reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid()));

-- Create RLS policies for megaott_diagnostics (admin only)
CREATE POLICY "Admins can view diagnostic logs" 
  ON public.megaott_diagnostics 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Edge functions can manage diagnostic logs" 
  ON public.megaott_diagnostics 
  FOR ALL 
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_megaott_subscribers_external_id ON public.megaott_subscribers(external_id);
CREATE INDEX idx_megaott_subscribers_reseller_id ON public.megaott_subscribers(reseller_id);
CREATE INDEX idx_megaott_credits_reseller_id ON public.megaott_credits(reseller_id);
CREATE INDEX idx_megaott_diagnostics_executed_at ON public.megaott_diagnostics(executed_at DESC);
