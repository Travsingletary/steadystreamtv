-- Add Xtream/IPTV related columns to profiles table

-- Add xtream credentials columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xtream_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xtream_password TEXT;

-- Add subscription management columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

-- Add user role column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_xtream_username ON profiles(xtream_username);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add unique constraint on xtream_username if not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_xtream_username_unique
ON profiles(xtream_username) WHERE xtream_username IS NOT NULL;