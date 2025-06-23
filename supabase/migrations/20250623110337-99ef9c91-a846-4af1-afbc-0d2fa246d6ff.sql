
-- Create IPTV accounts table if it doesn't exist or update it
DO $$ 
BEGIN
    -- Check if iptv_accounts table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'iptv_accounts') THEN
        CREATE TABLE public.iptv_accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            stripe_session_id TEXT,
            megaott_subscription_id TEXT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            server_url TEXT,
            playlist_url TEXT,
            activation_code TEXT,
            plan_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            expires_at TIMESTAMP WITH TIME ZONE,
            package_id INTEGER,
            dns_link TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'iptv_accounts' AND column_name = 'activation_code') THEN
        ALTER TABLE public.iptv_accounts ADD COLUMN activation_code TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'iptv_accounts' AND column_name = 'dns_link') THEN
        ALTER TABLE public.iptv_accounts ADD COLUMN dns_link TEXT;
    END IF;
    
    -- Enable RLS
    ALTER TABLE public.iptv_accounts ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for IPTV accounts
    DROP POLICY IF EXISTS "Users can view own IPTV accounts" ON public.iptv_accounts;
    CREATE POLICY "Users can view own IPTV accounts" ON public.iptv_accounts
        FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Enable insert for service role" ON public.iptv_accounts;
    CREATE POLICY "Enable insert for service role" ON public.iptv_accounts
        FOR INSERT WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Enable update for service role" ON public.iptv_accounts;
    CREATE POLICY "Enable update for service role" ON public.iptv_accounts
        FOR UPDATE USING (true);
END $$;

-- Create purchase automations table for tracking
CREATE TABLE IF NOT EXISTS public.purchase_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_session_id TEXT NOT NULL,
    payment_intent_id TEXT,
    automation_status TEXT NOT NULL DEFAULT 'pending',
    megaott_response JSONB,
    email_sent BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for purchase automations
ALTER TABLE public.purchase_automations ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase automations
DROP POLICY IF EXISTS "Users can view own automations" ON public.purchase_automations;
CREATE POLICY "Users can view own automations" ON public.purchase_automations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert for service role" ON public.purchase_automations;
CREATE POLICY "Enable insert for service role" ON public.purchase_automations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for service role" ON public.purchase_automations;
CREATE POLICY "Enable update for service role" ON public.purchase_automations
    FOR UPDATE USING (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_iptv_accounts_updated_at ON public.iptv_accounts;
CREATE TRIGGER update_iptv_accounts_updated_at
    BEFORE UPDATE ON public.iptv_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_automations_updated_at ON public.purchase_automations;
CREATE TRIGGER update_purchase_automations_updated_at
    BEFORE UPDATE ON public.purchase_automations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
