
-- Create megaott_tokens table for token inventory management
CREATE TABLE IF NOT EXISTS public.megaott_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_code TEXT NOT NULL UNIQUE,
  duration_days INTEGER NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('basic', 'premium', 'vip')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'used', 'expired')),
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID,
  megaott_token_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_preferences table for playlist optimization
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  favorite_categories TEXT[],
  blocked_categories TEXT[],
  preferred_quality TEXT DEFAULT 'auto',
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create optimized_playlists table for storing user-specific playlists
CREATE TABLE IF NOT EXISTS public.optimized_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  original_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_megaott_tokens_status ON public.megaott_tokens(status);
CREATE INDEX IF NOT EXISTS idx_megaott_tokens_package_type ON public.megaott_tokens(package_type);
CREATE INDEX IF NOT EXISTS idx_megaott_tokens_assigned_to ON public.megaott_tokens(assigned_to);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_optimized_playlists_user_id ON public.optimized_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_optimized_playlists_token ON public.optimized_playlists(token);

-- Enable RLS on all tables
ALTER TABLE public.megaott_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimized_playlists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for megaott_tokens (admin access only)
DROP POLICY IF EXISTS "Admin can manage megaott tokens" ON public.megaott_tokens;
CREATE POLICY "Admin can manage megaott tokens" ON public.megaott_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for user_preferences
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for optimized_playlists
DROP POLICY IF EXISTS "Users can manage their own playlists" ON public.optimized_playlists;
CREATE POLICY "Users can manage their own playlists" ON public.optimized_playlists
  FOR ALL USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION public.update_megaott_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_optimized_playlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_megaott_tokens_updated_at ON public.megaott_tokens;
CREATE TRIGGER update_megaott_tokens_updated_at
    BEFORE UPDATE ON public.megaott_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_megaott_tokens_updated_at();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_preferences_updated_at();

DROP TRIGGER IF EXISTS update_optimized_playlists_updated_at ON public.optimized_playlists;
CREATE TRIGGER update_optimized_playlists_updated_at
    BEFORE UPDATE ON public.optimized_playlists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_optimized_playlists_updated_at();
