
-- SteadyStream TV Complete Database Schema with MegaOTT Integration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (enhanced from existing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles_new') THEN
    CREATE TABLE user_profiles_new (
      id UUID REFERENCES auth.users PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      subscription_plan TEXT NOT NULL DEFAULT 'trial',
      device_type TEXT,
      onboarding_completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END
$$;

-- User preferences table (enhanced)
CREATE TABLE IF NOT EXISTS user_preferences_enhanced (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  favorite_categories TEXT[] DEFAULT '{}',
  blocked_categories TEXT[] DEFAULT '{}',
  preferred_quality TEXT DEFAULT 'auto',
  parental_controls BOOLEAN DEFAULT FALSE,
  language_preference TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MegaOTT tokens inventory (enhanced from existing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'megaott_tokens' AND column_name = 'expires_at') THEN
    ALTER TABLE megaott_tokens ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END
$$;

-- User subscriptions table (new comprehensive table)
CREATE TABLE IF NOT EXISTS user_subscriptions_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
  playlist_url TEXT,
  username TEXT,
  password TEXT,
  server_url TEXT,
  device_limit INTEGER NOT NULL DEFAULT 1,
  devices_connected INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device management table
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  ip_address INET,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Viewing analytics table
CREATE TABLE IF NOT EXISTS viewing_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  channel_id TEXT,
  channel_name TEXT,
  category TEXT,
  duration_seconds INTEGER,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  stripe_payment_id TEXT,
  megaott_token_id UUID REFERENCES megaott_tokens(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_megaott_tokens_status ON megaott_tokens(status);
CREATE INDEX IF NOT EXISTS idx_megaott_tokens_package ON megaott_tokens(package_type);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions_new(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions_new(status);
CREATE INDEX IF NOT EXISTS idx_optimized_playlists_token ON optimized_playlists(token);
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_viewing_analytics_user ON viewing_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_viewing_analytics_watched ON viewing_analytics(watched_at);

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- User profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles_new;
CREATE POLICY "Users can view own profile" ON user_profiles_new
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles_new;
CREATE POLICY "Users can update own profile" ON user_profiles_new
  FOR UPDATE USING (auth.uid() = id);

-- User preferences policies
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences_enhanced;
CREATE POLICY "Users can view own preferences" ON user_preferences_enhanced
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences_enhanced;
CREATE POLICY "Users can update own preferences" ON user_preferences_enhanced
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences_enhanced;
CREATE POLICY "Users can insert own preferences" ON user_preferences_enhanced
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions_new;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions_new
  FOR SELECT USING (auth.uid() = user_id);

-- User devices policies
DROP POLICY IF EXISTS "Users can view own devices" ON user_devices;
CREATE POLICY "Users can view own devices" ON user_devices
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own devices" ON user_devices;
CREATE POLICY "Users can manage own devices" ON user_devices
  FOR ALL USING (auth.uid() = user_id);

-- Viewing analytics policies
DROP POLICY IF EXISTS "Users can view own analytics" ON viewing_analytics;
CREATE POLICY "Users can view own analytics" ON viewing_analytics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analytics" ON viewing_analytics;
CREATE POLICY "Users can insert own analytics" ON viewing_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment history policies
DROP POLICY IF EXISTS "Users can view own payments" ON payment_history;
CREATE POLICY "Users can view own payments" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

-- Support tickets policies
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tickets" ON support_tickets;
CREATE POLICY "Users can update own tickets" ON support_tickets
  FOR UPDATE USING (auth.uid() = user_id);

-- Enhanced update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_enhanced()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to new tables
DROP TRIGGER IF EXISTS update_user_preferences_enhanced_updated_at ON user_preferences_enhanced;
CREATE TRIGGER update_user_preferences_enhanced_updated_at
  BEFORE UPDATE ON user_preferences_enhanced
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_enhanced();

DROP TRIGGER IF EXISTS update_user_subscriptions_new_updated_at ON user_subscriptions_new;
CREATE TRIGGER update_user_subscriptions_new_updated_at
  BEFORE UPDATE ON user_subscriptions_new
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_enhanced();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_enhanced();

-- Function to check device limit
CREATE OR REPLACE FUNCTION check_device_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_device_count INTEGER;
  device_limit INTEGER;
BEGIN
  -- Get current active device count and limit for the user
  SELECT COUNT(*) INTO current_device_count
  FROM user_devices 
  WHERE user_id = NEW.user_id 
    AND is_active = TRUE;

  -- Get device limit from user subscription
  SELECT COALESCE(s.device_limit, 1) INTO device_limit
  FROM user_subscriptions_new s
  WHERE s.user_id = NEW.user_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Default to 1 if no subscription found
  IF device_limit IS NULL THEN
    device_limit := 1;
  END IF;

  -- Check if limit would be exceeded
  IF current_device_count >= device_limit THEN
    RAISE EXCEPTION 'Device limit exceeded. Maximum % devices allowed.', device_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply device limit trigger
DROP TRIGGER IF EXISTS enforce_device_limit ON user_devices;
CREATE TRIGGER enforce_device_limit
  BEFORE INSERT ON user_devices
  FOR EACH ROW
  EXECUTE FUNCTION check_device_limit();

-- Function to auto-expire subscriptions
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions_new
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active'
    AND expires_at < NOW();
    
  -- Also expire related tokens
  UPDATE megaott_tokens
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'assigned'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
