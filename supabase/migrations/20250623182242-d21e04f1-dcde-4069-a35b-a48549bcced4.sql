
-- Create playlist_access_logs table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.playlist_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activation_code TEXT,
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  playlist_url TEXT,
  success BOOLEAN DEFAULT true
);

-- Add missing columns to user_profiles if they don't exist
DO $$ 
BEGIN
  -- Add supabase_user_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'supabase_user_id') THEN
    ALTER TABLE public.user_profiles ADD COLUMN supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add iptv_credentials column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'iptv_credentials') THEN
    ALTER TABLE public.user_profiles ADD COLUMN iptv_credentials JSONB;
  END IF;
  
  -- Add playlist_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'playlist_url') THEN
    ALTER TABLE public.user_profiles ADD COLUMN playlist_url TEXT;
  END IF;
  
  -- Add subscription_expires column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_expires') THEN
    ALTER TABLE public.user_profiles ADD COLUMN subscription_expires TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add subscription_active column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_active') THEN
    ALTER TABLE public.user_profiles ADD COLUMN subscription_active BOOLEAN DEFAULT true;
  END IF;
  
  -- Add onboarding_completed column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'onboarding_completed') THEN
    ALTER TABLE public.user_profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

-- Enable Row Level Security on both tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_access_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view their own profile') THEN
    EXECUTE 'CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = supabase_user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert their own profile') THEN
    EXECUTE 'CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = supabase_user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update their own profile') THEN
    EXECUTE 'CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = supabase_user_id)';
  END IF;
END $$;

-- Create RLS policies for playlist_access_logs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_access_logs' AND policyname = 'Users can view their own access logs') THEN
    EXECUTE 'CREATE POLICY "Users can view their own access logs" ON public.playlist_access_logs FOR SELECT USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_access_logs' AND policyname = 'Users can insert their own access logs') THEN
    EXECUTE 'CREATE POLICY "Users can insert their own access logs" ON public.playlist_access_logs FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_profiles_supabase_user_id ON public.user_profiles(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_activation_code ON public.user_profiles(activation_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_playlist_access_logs_user_id ON public.playlist_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_access_logs_accessed_at ON public.playlist_access_logs(accessed_at);

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_profiles_updated_at();
