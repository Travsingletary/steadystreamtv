-- Add missing columns to subscriptions table for full MegaOTT API support
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS subscription_type text DEFAULT 'm3u' CHECK (subscription_type IN ('m3u', 'mag', 'enigma')),
ADD COLUMN IF NOT EXISTS mac_address text,
ADD COLUMN IF NOT EXISTS package_id integer,
ADD COLUMN IF NOT EXISTS package_name text,
ADD COLUMN IF NOT EXISTS template_id integer,
ADD COLUMN IF NOT EXISTS template_name text,
ADD COLUMN IF NOT EXISTS max_connections integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS forced_country text DEFAULT 'ALL',
ADD COLUMN IF NOT EXISTS adult_content boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS note text,
ADD COLUMN IF NOT EXISTS whatsapp_telegram text,
ADD COLUMN IF NOT EXISTS enable_vpn boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS megaott_subscription_id integer,
ADD COLUMN IF NOT EXISTS dns_link text,
ADD COLUMN IF NOT EXISTS dns_link_samsung_lg text,
ADD COLUMN IF NOT EXISTS portal_link text,
ADD COLUMN IF NOT EXISTS expiring_at timestamp with time zone;

-- Add credit system to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credit numeric DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS megaott_user_id integer,
ADD COLUMN IF NOT EXISTS megaott_username text,
ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'customer' CHECK (user_type IN ('customer', 'reseller', 'admin')),
ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone;

-- Create packages table for available subscription packages
CREATE TABLE IF NOT EXISTS public.packages (
  id serial PRIMARY KEY,
  megaott_package_id integer UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  duration_days integer NOT NULL,
  price numeric NOT NULL,
  max_connections integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on packages table
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Create policy for packages (readable by all authenticated users)
CREATE POLICY "Packages are viewable by authenticated users" 
ON public.packages 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create templates table for channel templates
CREATE TABLE IF NOT EXISTS public.templates (
  id serial PRIMARY KEY,
  megaott_template_id integer UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on templates table
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create policy for templates (readable by all authenticated users)
CREATE POLICY "Templates are viewable by authenticated users" 
ON public.templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Insert some sample packages and templates
INSERT INTO public.packages (megaott_package_id, name, description, duration_days, price, max_connections) 
VALUES 
  (1, '1 Month Standard', 'Basic 1 month package', 30, 20.00, 2),
  (2, '3 Months Standard', 'Basic 3 months package', 90, 50.00, 2),
  (3, '6 Months Premium', 'Premium 6 months package', 180, 90.00, 4),
  (4, '12 Months Ultimate', 'Ultimate 12 months package', 365, 150.00, 6)
ON CONFLICT (megaott_package_id) DO NOTHING;

INSERT INTO public.templates (megaott_template_id, name, description) 
VALUES 
  (1, 'Standard Template', 'Basic channel lineup'),
  (2, 'Premium Template', 'Extended channel lineup'),
  (3, 'Ultimate Template', 'Complete channel lineup with premium content')
ON CONFLICT (megaott_template_id) DO NOTHING;

-- Add trigger for packages updated_at
CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add trigger for templates updated_at  
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();